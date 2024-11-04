import os
from typing import List
from fastapi import Request, FastAPI
from fastapi.responses import RedirectResponse
import msal
from starlette.middleware.base import BaseHTTPMiddleware

class AzureAuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: FastAPI,
        client_id: str = None,
        client_secret: str = None,
        tenant_id: str = None,
        redirect_uri: str = None,
        scopes: List[str] = None,
    ):
        super().__init__(app)
        self.client_id = client_id or os.getenv("AZURE_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("AZURE_CLIENT_SECRET")
        self.tenant_id = tenant_id or os.getenv("AZURE_TENANT_ID")
        self.redirect_uri = redirect_uri or os.getenv("REDIRECT_URI")
        self.scopes = scopes or ["User.Read"]
        
        # Initialize MSAL application
        self.msal_app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=f"https://login.microsoftonline.com/{self.tenant_id}",
            client_credential=self.client_secret,
        )

    async def dispatch(self, request: Request, call_next):
        # Exclude auth-related paths and API health check
        public_paths = ["/auth/login", "/auth/callback", "/api/health"]
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)

        # Check for valid session
        session = request.session
        if not session.get("user"):
            # Redirect to login if no valid session
            return RedirectResponse(url="/auth/login")
        
        return await call_next(request)

    def get_auth_url(self):
        """Helper method to generate authorization URL"""
        return self.msal_app.get_authorization_request_url(
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )

    async def handle_auth_callback(self, code: str):
        """Helper method to handle authorization callback"""
        result = self.msal_app.acquire_token_by_authorization_code(
            code=code,
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        return result

def init_auth_middleware(
    app: FastAPI,
    client_id: str = None,
    client_secret: str = None,
    tenant_id: str = None,
    redirect_uri: str = None,
    scopes: List[str] = None,
):
    """Initialize and add the Azure AD auth middleware to the FastAPI app"""
    auth_middleware = AzureAuthMiddleware(
        app,
        client_id=client_id,
        client_secret=client_secret,
        tenant_id=tenant_id,
        redirect_uri=redirect_uri,
        scopes=scopes,
    )
    app.add_middleware(AzureAuthMiddleware)
