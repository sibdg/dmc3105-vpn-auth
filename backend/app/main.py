from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.proxy_prefix import StripProxyPathPrefix
from app.database import Base, engine, get_db
from app.models import InviteCode, User
from app.schemas import (
    CreateInviteCodesRequest,
    DeleteProfileRequest,
    HealthResponse,
    InviteCodeOut,
    LoginRequest,
    MessageResponse,
    PaginatedInviteCodesResponse,
    PaginatedUsersResponse,
    RegisterRequest,
    RegisterResponse,
    RequestEmailCodeRequest,
    UserOut,
    VerifyEmailCodeRequest,
)
from app.security import (
    check_login_allowed,
    create_access_token,
    generate_csrf_token,
    get_current_admin,
    register_login_failure,
    register_login_success,
    validate_csrf,
)
from app.services import (
    apply_hysteria_user,
    create_email_verification,
    create_delete_verification,
    ensure_email_verified,
    ensure_user_exists,
    generate_hysteria_password,
    generate_invite_code,
    generate_unique_vpn_username,
    remove_hysteria_user,
    validate_invite_code,
    verify_delete_code,
    verify_email_code,
    write_audit_log,
)

settings = get_settings()
app = FastAPI(title=settings.app_name)


def parse_csv_setting(value: str) -> list[str]:
    value = value.strip()
    if not value:
        return []
    if value == "*":
        return ["*"]
    return [item.strip() for item in value.split(",") if item.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_csv_setting(settings.cors_allow_origins),
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=parse_csv_setting(settings.cors_allow_methods),
    allow_headers=parse_csv_setting(settings.cors_allow_headers),
)

if settings.proxy_path_prefix.strip():
    app.add_middleware(StripProxyPathPrefix, prefix=settings.proxy_path_prefix)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        inspector = inspect(conn)
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "vpn_username" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN vpn_username VARCHAR(64)"))


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post(f"{settings.api_prefix}/auth/request-email-code", response_model=MessageResponse)
def request_email_code(payload: RequestEmailCodeRequest, db: Session = Depends(get_db)) -> MessageResponse:
    create_email_verification(db, payload.email)
    return MessageResponse(message="Verification code sent")


@app.post(f"{settings.api_prefix}/auth/verify-email-code", response_model=MessageResponse)
def verify_code(payload: VerifyEmailCodeRequest, db: Session = Depends(get_db)) -> MessageResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    verify_email_code(db, payload.email, payload.code)
    return MessageResponse(message="Email verified")


@app.post(f"{settings.api_prefix}/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    ensure_email_verified(db, payload.email)
    invite = validate_invite_code(db, payload.invite_code)
    vpn_username = generate_unique_vpn_username(db)
    hysteria_password = generate_hysteria_password()
    apply_hysteria_user(vpn_username, hysteria_password)

    user = User(
        email=payload.email,
        vpn_username=vpn_username,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hysteria_password=hysteria_password,
        invite_code_id=invite.id,
    )
    invite.is_used = True
    invite.used_by_email = payload.email
    from datetime import datetime

    invite.used_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)

    write_audit_log(db, "user_registered", payload.email, f"Registered via invite code {invite.code}")

    return RegisterResponse(
        message="Registration completed",
        server=settings.registration_base_url,
        username=vpn_username,
        password=hysteria_password,
    )


@app.post(f"{settings.api_prefix}/admin/login", response_model=MessageResponse)
def admin_login(payload: LoginRequest, request: Request, response: Response) -> MessageResponse:
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{payload.username}"
    check_login_allowed(key)
    if payload.username != settings.admin_username or payload.password != settings.admin_password:
        register_login_failure(key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    register_login_success(key)
    token = create_access_token(settings.admin_username)
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=csrf_token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return MessageResponse(message="Logged in")


@app.post(f"{settings.api_prefix}/admin/logout", response_model=MessageResponse)
def admin_logout(response: Response, _: None = Depends(validate_csrf)) -> MessageResponse:
    response.delete_cookie(key=settings.auth_cookie_name, path="/")
    response.delete_cookie(key=settings.csrf_cookie_name, path="/")
    return MessageResponse(message="Logged out")


@app.get(f"{settings.api_prefix}/admin/session", response_model=MessageResponse)
def admin_session(_: str = Depends(get_current_admin)) -> MessageResponse:
    return MessageResponse(message="Authenticated")


@app.post(f"{settings.api_prefix}/profile/request-delete-code", response_model=MessageResponse)
def request_delete_code(payload: RequestEmailCodeRequest, db: Session = Depends(get_db)) -> MessageResponse:
    ensure_user_exists(db, payload.email)
    create_delete_verification(db, payload.email)
    return MessageResponse(message="Delete code sent")


@app.post(f"{settings.api_prefix}/profile/delete", response_model=MessageResponse)
def delete_profile(payload: DeleteProfileRequest, db: Session = Depends(get_db)) -> MessageResponse:
    user = ensure_user_exists(db, payload.email)
    verify_delete_code(db, payload.email, payload.code)
    if not user.vpn_username:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="VPN username is missing")
    remove_hysteria_user(user.vpn_username)
    db.delete(user)
    db.commit()
    write_audit_log(db, "user_deleted_profile", payload.email, "Profile deleted by user confirmation code")
    return MessageResponse(message="Profile deleted")


@app.post(f"{settings.api_prefix}/admin/invite-codes", response_model=list[InviteCodeOut])
def create_invite_codes(
    payload: CreateInviteCodesRequest,
    admin: str = Depends(get_current_admin),
    _: None = Depends(validate_csrf),
    db: Session = Depends(get_db),
) -> list[InviteCodeOut]:
    codes: list[InviteCode] = []
    for _ in range(payload.amount):
        code = InviteCode(code=generate_invite_code(), created_by=admin)
        db.add(code)
        codes.append(code)
    db.commit()
    for item in codes:
        db.refresh(item)
    write_audit_log(db, "invite_codes_created", admin, f"Created {payload.amount} invite codes")
    return codes


@app.get(f"{settings.api_prefix}/admin/invite-codes", response_model=PaginatedInviteCodesResponse)
def list_invite_codes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Literal["all", "used", "unused"] = Query(default="all"),
    sort_by: Literal["code", "created_at", "used_at", "used_by_email", "is_used"] = Query(default="created_at"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PaginatedInviteCodesResponse:
    _ = admin
    sort_column = getattr(InviteCode, sort_by)
    order = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
    query = db.query(InviteCode)
    if status_filter == "used":
        query = query.filter(InviteCode.is_used.is_(True))
    elif status_filter == "unused":
        query = query.filter(InviteCode.is_used.is_(False))
    total = query.count()
    items = query.order_by(order).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedInviteCodesResponse(items=items, total=total, page=page, page_size=page_size)


@app.delete(f"{settings.api_prefix}/admin/invite-codes/{{code}}", response_model=MessageResponse)
def delete_invite_code(
    code: str,
    admin: str = Depends(get_current_admin),
    _: None = Depends(validate_csrf),
    db: Session = Depends(get_db),
) -> MessageResponse:
    invite = db.query(InviteCode).filter(InviteCode.code == code).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")
    if invite.is_used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete used invite code")
    db.delete(invite)
    db.commit()
    write_audit_log(db, "invite_code_deleted", admin, f"Deleted invite code {code}")
    return MessageResponse(message="Invite code deleted")


@app.get(f"{settings.api_prefix}/admin/users", response_model=PaginatedUsersResponse)
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: Literal["email", "first_name", "last_name", "created_at"] = Query(default="created_at"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PaginatedUsersResponse:
    _ = admin
    sort_column = getattr(User, sort_by)
    order = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
    query = db.query(User)
    total = query.count()
    users = query.order_by(order).offset((page - 1) * page_size).limit(page_size).all()
    items = [
        UserOut(
            id=item.id,
            email=item.email,
            first_name=item.first_name,
            last_name=item.last_name,
            created_at=item.created_at,
            invite_code=item.invite_code.code,
        )
        for item in users
    ]
    return PaginatedUsersResponse(items=items, total=total, page=page, page_size=page_size)


@app.delete(f"{settings.api_prefix}/admin/users/{{user_id}}", response_model=MessageResponse)
def delete_user_by_admin(
    user_id: int,
    admin: str = Depends(get_current_admin),
    _: None = Depends(validate_csrf),
    db: Session = Depends(get_db),
) -> MessageResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.vpn_username:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="VPN username is missing")
    remove_hysteria_user(user.vpn_username)
    db.delete(user)
    db.commit()
    write_audit_log(db, "user_deleted_by_admin", admin, f"Deleted user {user.email}")
    return MessageResponse(message="User deleted")
