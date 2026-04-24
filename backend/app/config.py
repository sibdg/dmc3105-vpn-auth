from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "VPN Auth Service"
    api_prefix: str = "/api"
    # When nginx passes /vpn-auth/api/... instead of /api/... (misconfigured proxy_pass)
    proxy_path_prefix: str = ""

    database_url: str = "sqlite:///./vpn_auth.db"
    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720
    auth_cookie_name: str = "vpn_admin_access"
    csrf_cookie_name: str = "vpn_admin_csrf"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_login_window_seconds: int = 300
    admin_max_attempts: int = 5
    admin_lockout_seconds: int = 600

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    verify_code_expire_minutes: int = 15
    verify_request_cooldown_seconds: int = 60

    hysteria_config_path: str = "/etc/hysteria/config.yaml"
    hysteria_reload_command: str = "systemctl restart hysteria-server.service"
    hysteria_userpass_length: int = 32

    registration_base_url: str = "https://hs2.dmc3105.ru"
    cors_allow_origins: str = "*"
    cors_allow_methods: str = "*"
    cors_allow_headers: str = "*"
    cors_allow_credentials: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
