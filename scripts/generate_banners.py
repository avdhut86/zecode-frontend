# generate_banners.py
"""
Generate home page slider and category banners using Google Imagen 3.
Creates group photo compositions with the 'nana banana pro' style.
"""

import os
import time
import ssl
import certifi
from pathlib import Path
from config import get_google_api_key

# Workaround for SSL certificate issues
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

# Initialize Gemini Client
from google import genai
from google.genai import types

API_KEY = get_google_api_key()
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "imagen-3.0-fast-generate-001"  # Imagen 3 Fast for image generation

# Configuration
PROJECT_ROOT = Path(__file__).parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"

# Image generation tasks with detailed prompts
IMAGE_TASKS = [
    {
        "target": "hero/hero1.png",
        "prompt": (
            "A wide cinematic fashion photography banner showing three people standing together: "
            "a stylish man in casual streetwear on the left, an elegant woman in chic casual outfit in the center, "
            "and a happy child in colorful casual clothes on the right. "
            "Modern urban background with soft bokeh effect. "
            "Professional fashion photography, vibrant colors, high-end commercial style, "
            "soft natural lighting, 16:9 aspect ratio, ultra high quality. "
            "Nano Banana Pro aesthetic - premium, clean, contemporary fashion brand."
        )
    },
    {
        "target": "categories/men.jpg",
        "prompt": (
            "Wide fashion banner featuring two stylish men in urban streetwear. "
            "One wearing casual t-shirt and jeans, the other in trendy hoodie and pants. "
            "Cool urban setting with concrete walls and modern architecture. "
            "Professional fashion photography, dramatic lighting, sharp focus, "
            "contemporary menswear aesthetic, 16:9 banner format. "
            "Nano Banana Pro style - bold, premium, street-inspired."
        )
    },
    {
        "target": "categories/women.jpg",
        "prompt": (
            "Wide fashion banner showing two elegant women in chic casual outfits. "
            "One in smart casual blazer and pants, another in stylish dress. "
            "Sophisticated modern setting with clean aesthetic. "
            "Professional fashion photography, soft yet high-contrast lighting, "
            "contemporary women's fashion, 16:9 banner format. "
            "Nano Banana Pro style - elegant, vibrant, premium quality."
        )
    },
    {
        "target": "categories/kids.jpg",
        "prompt": (
            "Wide fashion banner featuring happy kids in colorful casual outfits. "
            "Two or three children wearing trendy kids' fashion - dresses, tracksuits, casual wear. "
            "Playful, bright, energetic setting with fun background. "
            "Professional fashion photography, vibrant colors, joyful mood, "
            "contemporary kids' fashion, 16:9 banner format. "
            "Nano Banana Pro style - colorful, energetic, high quality."
        )
    },
    {
        "target": "categories/footwear.jpg",
        "prompt": (
            "Creative product photography of stylish sneakers and shoes arranged dynamically. "
            "Mix of casual sneakers, athletic shoes, and trendy footwear floating or arranged artistically. "
            "Clean modern background, dramatic product lighting, "
            "hypebeast aesthetic, contemporary footwear display, 16:9 banner format. "
            "Nano Banana Pro style - modern, bold, premium sneaker culture."
        )
    }
]

def generate_image(task):
    target_rel = task["target"]
    target_path = PUBLIC_DIR / target_rel
    
    print(f"\nGenerating: {target_rel}")
    print(f"  Prompt: {task['prompt'][:80]}...")

    try:
        print("  > Sending request to Imagen 3...")
        response = client.models.generate_images(
            model=MODEL_NAME,
            prompt=task["prompt"],
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                safety_filter_level="block_some",
                person_generation="allow_adult"
            )
        )

        # Extract and save the generated image
        if response.generated_images and len(response.generated_images) > 0:
            image_data = response.generated_images[0].image.image_bytes
            
            # Ensure directory exists
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save the image
            target_path.write_bytes(image_data)
            print(f"  ✅ Saved to {target_path}")
            return True
        else:
            print("  ❌ No image generated.")
            return False

    except Exception as e:
        print(f"  ❌ API Error: {e}")
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            print("    Rate limit hit. Waiting 30 seconds...")
            time.sleep(30)
        return False

def main():
    print("=" * 70)
    print("HOME PAGE SLIDER & CATEGORY BANNER GENERATOR")
    print("Using Google Imagen 3")
    print("=" * 70)
    print(f"Target Directory: {PUBLIC_DIR}")
    
    success_count = 0
    for task in IMAGE_TASKS:
        if generate_image(task):
            success_count += 1
        time.sleep(5)  # Pause between requests

    print("\n" + "=" * 70)
    print(f"Workflow Complete. Generated {success_count}/{len(IMAGE_TASKS)} images.")
    print("=" * 70)

if __name__ == "__main__":
    main()
