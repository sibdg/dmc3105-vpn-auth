from starlette.types import ASGIApp, Receive, Scope, Send


class StripProxyPathPrefix:
    """If reverse proxy forwards the full URI (e.g. /vpn-auth/api/...), strip the URL prefix."""

    def __init__(self, app: ASGIApp, prefix: str) -> None:
        self.app = app
        self.prefix = prefix.strip().rstrip("/") if prefix else ""

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if self.prefix and scope["type"] == "http":
            path = scope.get("path", "")
            if path == self.prefix or path.startswith(self.prefix + "/"):
                new_path = path[len(self.prefix) :] or "/"
                if not new_path.startswith("/"):
                    new_path = "/" + new_path
                scope = dict(scope)
                scope["path"] = new_path
                scope["raw_path"] = new_path.encode()
        await self.app(scope, receive, send)
