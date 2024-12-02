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

    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = "your_azure_openai_api_key"
    AZURE_OPENAI_ENDPOINT: str = "your_azure_openai_endpoint"
    AZURE_OPENAI_API_VERSION: str = "2024-05-13"
    AZURE_OPENAI_DEPLOYMENT: str = "your-deployment-name"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Static File Paths
    STATIC_DIR: str = "build/static"
    ASSETS_DIR: str = "build/assets"
    BUILD_DIR: str = "build"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings() 