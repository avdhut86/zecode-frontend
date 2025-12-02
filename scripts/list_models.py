# list_models.py
import os
import ssl
import certifi
from google import genai
from config import get_google_api_key

# Workaround for SSL certificate issues
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

API_KEY = get_google_api_key()
client = genai.Client(api_key=API_KEY)

print("Listing available models...")
try:
    for m in client.models.list():
        if "generate" in m.name or "imagen" in m.name:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
