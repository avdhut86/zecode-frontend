# generate_banners_gemini_v2.py
"""
Generate banners using gemini-3-pro-image-preview with improved prompts.
Target: Group of 4-5 college students in a university setting.
"""

import os
import time
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
MODEL_NAME = "gemini-3-pro-image-preview"

PROJECT_ROOT = Path(__file__).parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"

TASKS = [
    {
        "target": "hero/hero1.png",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png",
            "products/model-poses/male_streetwear_front_standing__DSC4815_Large.png"
        ],
        "prompt": (
            "Generate a wide 16:9 cinematic group photo featuring a diverse group of 5 college students (men and women) standing together on a modern university campus. "
            "They should be wearing the stylish outfits shown in the reference images. "
            "The setting should be a vibrant college campus with greenery and modern buildings in the background. "
            "The students should look happy, confident, and like a close group of friends. "
            "Style: 'Nano Banana Pro' - premium, high-fashion, vibrant colors, sharp focus. "
            "Ensure the image looks like a high-end fashion campaign targeting college students. "
            "Return ONLY the generated image."
        )
    },
    {
        "target": "categories/men.jpg",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/male_streetwear_front_standing__DSC4815_Large.png",
            "products/model-poses/male_casual_front_standing__DSC4148_1.png"
        ],
        "prompt": (
            "Generate a wide 16:9 fashion banner showing a group of 4-5 stylish male college students hanging out on a university campus steps or quad. "
            "They should be wearing the urban streetwear outfits from the reference images. "
            "The vibe should be cool, confident, and youthful. "
            "Background: University architecture, blurred slightly to focus on the group. "
            "Style: 'Nano Banana Pro' - bold, premium, streetwear aesthetic. "
            "Return ONLY the generated image."
        )
    },
    {
        "target": "categories/women.jpg",
        "sources": [
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/model-poses/female_smart_casual_front_standing__DSC3952_Large.png",
            "products/model-poses/female_casual_chic_front_standing__DSC4127_Large.png"
        ],
        "prompt": (
            "Generate a wide 16:9 fashion banner showing a group of 4-5 stylish female college students walking together on a university campus. "
            "They should be wearing the chic and trendy outfits from the reference images. "
            "The setting should be bright, sunny, and academic. "
            "The women should look empowered, stylish, and happy. "
            "Style: 'Nano Banana Pro' - elegant, vibrant, premium quality. "
            "Return ONLY the generated image."
        )
    },
    {
        "target": "categories/kids.jpg",
        "sources": [
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png",
            "products/extracted-products/female_dusty_rose_pink_tracksuit_athleisure__DSC6165.png",
            "products/extracted-products/female_green_dress_graphic_file_1616x1080_001003_Large_1.png"
        ],
        "prompt": (
            "Generate a wide 16:9 fashion banner showing a group of 4-5 happy kids playing together in a modern school or creative campus playground. "
            "They should be wearing the colorful and trendy kids' outfits from the reference images. "
            "The atmosphere should be joyful, energetic, and bright. "
            "Style: 'Nano Banana Pro' - colorful, fun, high quality. "
            "Return ONLY the generated image."
        )
    }
]

def get_mime_type(path):
    suffix = path.suffix.lower()
    if suffix == '.png': return 'image/png'
    if suffix in ['.jpg', '.jpeg']: return 'image/jpeg'
    return 'image/jpeg'

def generate_image(task):
    target_rel = task["target"]
    target_path = PUBLIC_DIR / target_rel
    print(f"\nProcessing {target_rel}...")

    parts = []
    # Add reference images
    for src_rel in task["sources"]:
        src_path = PUBLIC_DIR / src_rel
        if src_path.exists():
            print(f"  + Ref: {src_rel}")
            parts.append(types.Part.from_bytes(
                data=src_path.read_bytes(),
                mime_type=get_mime_type(src_path)
            ))
    
    parts.append(types.Part.from_text(text=task["prompt"]))

    try:
        print(f"  > Sending to {MODEL_NAME}...")
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                temperature=0.5
            )
        )

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    target_path.write_bytes(part.inline_data.data)
                    print(f"  ✅ Generated and saved to {target_path}")
                    return True
        
        print("  ❌ No image generated in response.")
        return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("Starting Generation with Gemini 3 Pro Image Preview (College Theme)...")
    for task in TASKS:
        generate_image(task)
        time.sleep(5)

if __name__ == "__main__":
    main()
