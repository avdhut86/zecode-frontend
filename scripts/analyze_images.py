# analyze_images.py
"""
Analyze the generated banner images to confirm if they contain groups or single people.
"""

import os
import ssl
import certifi
from pathlib import Path
from google import genai
from google.genai import types
from config import get_google_api_key

# Workaround for SSL certificate issues
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

API_KEY = get_google_api_key()
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-1.5-flash"

PROJECT_ROOT = Path(__file__).parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"

IMAGES_TO_CHECK = [
    "categories/men.jpg",
    "categories/women.jpg",
    "categories/kids.jpg",
    "hero/hero1.png"
]

def analyze_image(rel_path):
    path = PUBLIC_DIR / rel_path
    if not path.exists():
        print(f"❌ {rel_path} not found.")
        return

    print(f"\nAnalyzing {rel_path}...")
    try:
        image_part = types.Part.from_bytes(
            data=path.read_bytes(),
            mime_type="image/jpeg" if path.suffix in ['.jpg', '.jpeg'] else "image/png"
        )
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        image_part,
                        types.Part.from_text("Describe this image in detail. How many people are in it? What are they wearing? Is it a group photo?")
                    ]
                )
            ]
        )
        print(f"Analysis: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    print("Analyzing generated images...")
    for img in IMAGES_TO_CHECK:
        analyze_image(img)

if __name__ == "__main__":
    main()
