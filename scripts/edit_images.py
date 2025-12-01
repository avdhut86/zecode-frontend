# edit_images.py
"""
Generates home page slider and category banners using Google Gemini API.
Uses the 'nana banana pro' theme (Gemini 3 Pro Image Preview).
"""

import os
import time
import base64
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Configure API Key
API_KEY = os.getenv("IMAGE_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("Error: IMAGE_API_KEY or GOOGLE_API_KEY not found in .env or environment.")
    exit(1)

# Initialize Gemini Client
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-3-pro-image-preview"

# Configuration
PROJECT_ROOT = Path(__file__).parents[1] # zecode-frontend
PUBLIC_DIR = PROJECT_ROOT / "public"

# Mapping of Target File -> Source Reference Image(s)
# For the slider/banners, we want to generate new compositions based on these references.
IMAGE_TASKS = [
    {
        "target": "hero/hero1.png",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png"
        ],
        "prompt": (
            "Create a wide cinematic home page slider image featuring a group of three people: "
            "a man, a woman, and a child, standing together in a stylish, modern setting. "
            "They should be wearing the outfits shown in the reference images. "
            "The style should be 'Nano Banana Pro' - vibrant, high-fashion, premium, with a clean and dynamic look. "
            "The background should be abstract and modern, suitable for a fashion brand homepage. "
            "High resolution, photorealistic, 16:9 aspect ratio."
        )
    },
    {
        "target": "categories/men.jpg",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/male_streetwear_front_standing__DSC4815_Large.png"
        ],
        "prompt": (
            "Create a wide category banner image for Men's Fashion. "
            "Show a group of stylish men wearing the outfits from the reference images. "
            "The setting should be urban and cool. "
            "Style: 'Nano Banana Pro', premium, sharp focus, dramatic lighting. "
            "Wide aspect ratio for a web banner."
        )
    },
    {
        "target": "categories/women.jpg",
        "sources": [
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/model-poses/female_smart_casual_front_standing__DSC3952_Large.png"
        ],
        "prompt": (
            "Create a wide category banner image for Women's Fashion. "
            "Show a group of stylish women wearing the outfits from the reference images. "
            "The setting should be chic and elegant. "
            "Style: 'Nano Banana Pro', vibrant colors, soft yet high-contrast lighting. "
            "Wide aspect ratio for a web banner."
        )
    },
    {
        "target": "categories/kids.jpg",
        "sources": [
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png",
            "products/extracted-products/female_dusty_rose_pink_tracksuit_athleisure__DSC6165.png"
        ],
        "prompt": (
            "Create a wide category banner image for Kids' Fashion. "
            "Show happy kids wearing the outfits from the reference images. "
            "The setting should be playful and bright. "
            "Style: 'Nano Banana Pro', colorful, energetic, high quality. "
            "Wide aspect ratio for a web banner."
        )
    },
    {
        "target": "categories/footwear.jpg",
        "sources": [], # No specific reference for footwear yet, relying on prompt
        "prompt": (
            "Create a wide category banner image for Footwear. "
            "A creative composition of stylish sneakers and shoes in a dynamic arrangement. "
            "Style: 'Nano Banana Pro', modern, hypebeast aesthetic, clean background. "
            "Wide aspect ratio for a web banner."
        )
    }
]

def get_mime_type(path):
    suffix = path.suffix.lower()
    if suffix == '.png': return 'image/png'
    if suffix in ['.jpg', '.jpeg']: return 'image/jpeg'
    if suffix == '.webp': return 'image/webp'
    return 'image/jpeg'

def generate_image(task):
    target_rel = task["target"]
    target_path = PUBLIC_DIR / target_rel
    
    print(f"\nProcessing: {target_rel}")
    print(f"  Prompt: {task['prompt'][:60]}...")

    # Prepare content parts
    parts = []
    
    # Add reference images if they exist
    for src_rel in task["sources"]:
        src_path = PUBLIC_DIR / src_rel
        if src_path.exists():
            print(f"  + Reference: {src_rel}")
            try:
                img_data = src_path.read_bytes()
                mime_type = get_mime_type(src_path)
                parts.append(types.Part.from_bytes(data=img_data, mime_type=mime_type))
            except Exception as e:
                print(f"    Warning: Could not read {src_rel}: {e}")
        else:
            print(f"    Warning: Reference not found: {src_rel}")

    # Add text prompt
    parts.append(types.Part.from_text(text=task["prompt"]))

    # Call API
    try:
        print("  > Sending request to Gemini...")
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                temperature=0.2
            )
        )

        # Extract and save image
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    # Ensure directory exists
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    target_path.write_bytes(part.inline_data.data)
                    print(f"  ✅ Saved to {target_path}")
                    return True
        
        print("  ❌ No image generated.")
        return False

    except Exception as e:
        print(f"  ❌ API Error: {e}")
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            print("    Rate limit hit. Waiting 30 seconds...")
            time.sleep(30)
        return False

def main():
    print("Starting Image Generation Workflow...")
    print(f"Target Directory: {PUBLIC_DIR}")
    
    success_count = 0
    for task in IMAGE_TASKS:
        if generate_image(task):
            success_count += 1
        time.sleep(5) # Pause between requests to avoid rate limits

    print(f"\nWorkflow Complete. Generated {success_count}/{len(IMAGE_TASKS)} images.")

if __name__ == "__main__":
    main()
