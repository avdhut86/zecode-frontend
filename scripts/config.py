"""
Shared configuration loader for ZECODE scripts.
Loads API keys from .env.local file (NOT committed to git).
"""

import os
import sys
from pathlib import Path

def load_env():
    """Load environment variables from .env.local file."""
    env_path = Path(__file__).parent.parent / ".env.local"
    
    if not env_path.exists():
        print(f"❌ .env.local file not found at: {env_path}")
        print("\nCreate a .env.local file in zecode-frontend/ with your API keys.")
        print("See .env.local.example for the required format.")
        return False
    
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and not os.getenv(key):
                    os.environ[key] = value
    return True


def get_google_api_key():
    """Get Google API key from environment."""
    load_env()
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        print("❌ GOOGLE_API_KEY not found in .env.local")
        print("Get a key from: https://aistudio.google.com/apikey")
        sys.exit(1)
    return key


def get_cloudinary_config():
    """Get Cloudinary configuration from environment."""
    load_env()
    config = {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME") or os.getenv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "api_secret": os.getenv("CLOUDINARY_API_SECRET")
    }
    missing = [k for k, v in config.items() if not v]
    if missing:
        print(f"❌ Missing Cloudinary config: {', '.join(missing)}")
        sys.exit(1)
    return config


def get_directus_config():
    """Get Directus configuration from environment."""
    load_env()
    config = {
        "url": os.getenv("DIRECTUS_URL") or os.getenv("NEXT_PUBLIC_DIRECTUS_URL") or "https://zecode-directus.onrender.com",
        "email": os.getenv("DIRECTUS_ADMIN_EMAIL"),
        "password": os.getenv("DIRECTUS_ADMIN_PASSWORD")
    }
    if not config["email"] or not config["password"]:
        print("❌ Missing DIRECTUS_ADMIN_EMAIL or DIRECTUS_ADMIN_PASSWORD in .env.local")
        sys.exit(1)
    return config
