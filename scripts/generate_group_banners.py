# generate_group_banners.py
"""
Generate TRUE group photos by:
1. Creating a collage of reference images using PIL.
2. Using Gemini 3 Pro Image Preview to blend/transform the collage into a realistic group photo.
"""

import os
import time
import ssl
import certifi
import random
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types

# Workaround for SSL certificate issues
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

API_KEY = "AIzaSyApyaOrIn22d0KCwrwp08-BqWUhrGIhakY"
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-3-pro-image-preview"

PROJECT_ROOT = Path(__file__).parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"

# Define tasks with explicit reference lists
TASKS = [
    {
        "target": "hero/hero_group.png",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png",
            "products/model-poses/male_streetwear_front_standing__DSC4815_Large.png"
        ],
        "prompt": "Transform this collage into a realistic cinematic group photo of 4 college students standing together on a modern university campus. Harmonize the lighting and shadows to make it look like a single cohesive shot. The students should look happy and connected. University background.",
        "bg_color": (240, 240, 240)
    },
    {
        "target": "categories/men_group.jpg",
        "sources": [
            "products/model-poses/male_casual_front_standing__DSC3800_Large.png",
            "products/model-poses/male_streetwear_front_standing__DSC4815_Large.png",
            "products/model-poses/male_casual_front_standing__DSC4148_1.png"
        ],
        "prompt": "Transform this collage into a realistic fashion banner of 3 male college students hanging out on campus steps. Make it look like a cohesive group photo. Urban university setting. Cool, streetwear vibe.",
        "bg_color": (230, 230, 235)
    },
    {
        "target": "categories/women_group.jpg",
        "sources": [
            "products/model-poses/female_casual_chic_front_standing__DSC6503.png",
            "products/model-poses/female_smart_casual_front_standing__DSC3952_Large.png",
            "products/model-poses/female_casual_chic_front_standing__DSC4127_Large.png"
        ],
        "prompt": "Transform this collage into a realistic fashion banner of 3 female college students walking together on campus. Make it look like a cohesive group photo. Bright, sunny university setting. Chic and elegant.",
        "bg_color": (250, 240, 240)
    },
    {
        "target": "categories/kids_group.jpg",
        "sources": [
            "products/extracted-products/female_cream_dress_graphic_print_casual__DSC5663.png",
            "products/extracted-products/female_dusty_rose_pink_tracksuit_athleisure__DSC6165.png",
            "products/extracted-products/female_green_dress_graphic_file_1616x1080_001003_Large_1.png"
        ],
        "prompt": "Transform this collage into a realistic group photo of 3 happy kids playing together in a school playground. Make it look like a cohesive shot. Colorful and energetic.",
        "bg_color": (255, 250, 240)
    }
]

def create_collage(image_paths, output_path):
    """Creates a simple side-by-side collage of the images."""
    images = []
    for p in image_paths:
        path = PUBLIC_DIR / p
        if path.exists():
            try:
                img = Image.open(path).convert("RGBA")
                images.append(img)
            except Exception as e:
                print(f"Warning: Could not open {p}: {e}")
    
    if not images:
        return None

    # Target size for banner (16:9)
    target_width = 1920
    target_height = 1080
    
    collage = Image.new('RGB', (target_width, target_height), (255, 255, 255))
    
    # Calculate width per image
    img_width = target_width // len(images)
    
    for i, img in enumerate(images):
        # Resize preserving aspect ratio to fit height
        ratio = target_height / img.height
        new_w = int(img.width * ratio)
        new_h = target_height
        
        # If too wide, scale by width
        if new_w > img_width + 100: # Allow some overlap
             ratio = img_width / img.width
             new_w = img_width
             new_h = int(img.height * ratio)

        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center vertically
        y_offset = (target_height - new_h) // 2
        x_offset = i * img_width + (img_width - new_w) // 2
        
        # Paste with mask for transparency
        collage.paste(resized, (x_offset, y_offset), resized if resized.mode == 'RGBA' else None)

    # Save temporary collage
    temp_path = output_path.parent / f"temp_collage_{output_path.stem}.png"
    collage.save(temp_path)
    return temp_path

def generate_group_photo(task):
    target_rel = task["target"]
    target_path = PUBLIC_DIR / target_rel
    print(f"\nProcessing {target_rel}...")

    # 1. Create Collage
    print("  Creating collage...")
    collage_path = create_collage(task["sources"], target_path)
    if not collage_path:
        print("  ❌ Failed to create collage (no sources found).")
        return False

    # 2. Send to Gemini
    print(f"  Sending collage to {MODEL_NAME}...")
    try:
        parts = [
            types.Part.from_bytes(
                data=collage_path.read_bytes(),
                mime_type="image/png"
            ),
            types.Part.from_text(text=task["prompt"])
        ]

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                temperature=0.4
            )
        )

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    target_path.write_bytes(part.inline_data.data)
                    print(f"  ✅ Generated Group Photo: {target_path}")
                    
                    # Cleanup temp collage
                    if collage_path.exists():
                        collage_path.unlink()
                    return True
        
        print("  ❌ No image generated.")
        return False

    except Exception as e:
        print(f"  ❌ API Error: {e}")
        return False

def main():
    print("Starting Group Photo Generation (Collage -> Blend)...")
    
    # Install Pillow if needed (usually available in system python but just in case)
    try:
        import PIL
    except ImportError:
        print("Installing Pillow...")
        os.system("pip install Pillow")

    for task in TASKS:
        generate_group_photo(task)
        time.sleep(5)

if __name__ == "__main__":
    main()
