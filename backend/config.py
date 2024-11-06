from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    
    # Azure AD Auth Settings
    AZURE_CLIENT_ID: str = "your_client_id"
    AZURE_CLIENT_SECRET: str = "your_client_secret"
    AZURE_TENANT_ID: str = "your_tenant_id"
    REDIRECT_URI: str = "https://yourapp.azurewebsites.net/auth/callback"
    SESSION_SECRET_KEY: str = "your_random_secret_key"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Static File Paths
    STATIC_DIR: str = "../frontend/build/static"
    ASSETS_DIR: str = "../frontend/build/assets"
    BUILD_DIR: str = "../frontend/build"
    
    class Config:
        case_sensitive = True

# Create settings instance
settings = Settings() 