"""
Generate Model Poses for Products Missing Model Images
Uses Nana Banana Pro (Gemini 2.0 Flash Exp Image Generation)

This script:
1. Fetches products without model images from Directus
2. Downloads product images from Cloudinary
3. Generates 3 model poses per product using Gemini
4. Uploads generated images to Cloudinary
5. Updates Directus with new model image paths
"""

import os
import sys
import time
import json
import base64
import requests
import pathlib
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env.local
env_path = pathlib.Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Cloudinary config
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME") or os.getenv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# Directus config
DIRECTUS_URL = os.getenv("DIRECTUS_URL") or os.getenv("NEXT_PUBLIC_DIRECTUS_URL") or "https://zecode-directus.onrender.com"
DIRECTUS_EMAIL = os.getenv("DIRECTUS_ADMIN_EMAIL")
DIRECTUS_PASSWORD = os.getenv("DIRECTUS_ADMIN_PASSWORD")

# Validate required environment variables
required_vars = ["GOOGLE_API_KEY", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "DIRECTUS_ADMIN_EMAIL", "DIRECTUS_ADMIN_PASSWORD"]
missing_vars = [v for v in required_vars if not os.getenv(v)]
if missing_vars:
    print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
    print("\nCreate a .env.local file in zecode-frontend/ with:")
    print("  GOOGLE_API_KEY=your-google-api-key")
    print("  CLOUDINARY_CLOUD_NAME=ds8llatku")
    print("  CLOUDINARY_API_KEY=your-cloudinary-api-key")
    print("  CLOUDINARY_API_SECRET=your-cloudinary-api-secret")
    print("  DIRECTUS_ADMIN_EMAIL=your-email")
    print("  DIRECTUS_ADMIN_PASSWORD=your-password")
    sys.exit(1)

# Gemini models - Nana Banana Pro
IMAGE_GEN_MODEL = "gemini-2.0-flash-exp-image-generation"
ANALYSIS_MODEL = "gemini-2.5-flash"

# Output folder for local backup
OUTPUT_FOLDER = pathlib.Path(__file__).parent / "generated-model-poses"
OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

# Pose variations
POSE_VARIATIONS = [
    {
        "name": "front_standing",
        "description": "Front-facing standing pose, confident posture, hands relaxed at sides, looking directly at camera, neutral professional expression"
    },
    {
        "name": "three_quarter", 
        "description": "Three-quarter angle pose (45 degrees), one hand on hip, slight turn of body, natural confident expression, showing outfit from angled view"
    },
    {
        "name": "casual_lifestyle",
        "description": "Casual lifestyle pose, relaxed natural stance, slight smile, approachable and friendly look, as if walking naturally"
    }
]

# ---------------------------------------------------------------------------
# Initialize Gemini
# ---------------------------------------------------------------------------
import ssl
import certifi
import os

# Fix SSL certificate issues
os.environ['SSL_CERT_FILE'] = ''
os.environ['SSL_CERT_DIR'] = ''

from google import genai
from google.genai import types

client = genai.Client(api_key=GOOGLE_API_KEY)

# ---------------------------------------------------------------------------
# Directus Authentication
# ---------------------------------------------------------------------------

def get_directus_token() -> str:
    """Get fresh Directus access token."""
    response = requests.post(
        f"{DIRECTUS_URL}/auth/login",
        json={"email": DIRECTUS_EMAIL, "password": DIRECTUS_PASSWORD},
        verify=False
    )
    response.raise_for_status()
    return response.json()["data"]["access_token"]

# ---------------------------------------------------------------------------
# Fetch Products
# ---------------------------------------------------------------------------

def fetch_products_without_models() -> List[Dict]:
    """Fetch all products that don't have model images."""
    response = requests.get(
        f"{DIRECTUS_URL}/items/products",
        params={
            "limit": 500,
            "fields": "id,name,slug,image,image_url,gender_category,subcategory,model_image_1"
        },
        verify=False
    )
    response.raise_for_status()
    all_products = response.json()["data"]
    
    # Filter products without model images
    products_without_models = [p for p in all_products if not p.get("model_image_1")]
    return products_without_models

# ---------------------------------------------------------------------------
# Image Helpers
# ---------------------------------------------------------------------------

def get_cloudinary_url(image_path: str) -> str:
    """Convert Directus image path to Cloudinary URL."""
    if not image_path:
        return None
    # Remove leading slash
    path = image_path.lstrip("/")
    return f"https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/image/upload/zecode/{path}"

def download_image(url: str) -> bytes:
    """Download image from URL and return bytes."""
    import urllib.request
    import ssl
    
    # Create SSL context that doesn't verify certificates
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60, context=ctx) as response:
        return response.read()

def upload_to_cloudinary(image_bytes: bytes, public_id: str) -> str:
    """Skip Cloudinary upload - will be done separately via Node.js."""
    # Return the expected path format
    return f"/products/model-poses-generated/{public_id}.png"

# ---------------------------------------------------------------------------
# Gemini Analysis & Generation
# ---------------------------------------------------------------------------

def analyze_product_image(image_bytes: bytes, product_name: str, gender_category: str = None) -> Dict:
    """Analyze product based on product name and gender category (skip API call due to key issue)."""
    # Extract info from product name instead of using flagged API key
    name_lower = product_name.lower()
    
    # Determine gender from category or product name
    if gender_category:
        gender = "male" if "men" in gender_category.lower() else "female"
    elif "men's" in name_lower or "male" in name_lower:
        gender = "male"
    else:
        gender = "female"
    
    # Extract garment type from name
    garment_types = {
        "dress": "dress", "tunic": "tunic", "blouse": "blouse", "shirt": "shirt",
        "t-shirt": "t-shirt", "tee": "t-shirt", "hoodie": "hoodie", "sweatshirt": "sweatshirt",
        "pants": "pants", "jeans": "jeans", "shorts": "shorts", "bottoms": "pants",
        "jacket": "jacket", "outerwear": "jacket", "top": "top", "tops": "top",
        "kurta": "kurta", "mules": "mules", "flats": "flats", "heels": "heels",
        "apparel": "clothing"
    }
    
    garment = "clothing"
    for key, val in garment_types.items():
        if key in name_lower:
            garment = val
            break
    
    # Extract color from name
    colors = ["beige", "black", "white", "cream", "brown", "blue", "red", "pink", 
              "green", "olive", "maroon", "burgundy", "dark", "light", "caramel",
              "hot", "pale", "yellow", "sage", "washed", "off white", "dusty", "khaki"]
    
    color = "neutral"
    for c in colors:
        if c in name_lower:
            color = c
            break
    
    # Extract style
    styles = ["casual", "streetwear", "formal", "athleisure", "bohemian", "vintage", "minimalist"]
    style = "casual"
    for s in styles:
        if s in name_lower:
            style = s
            break
    
    return {
        "gender": gender,
        "garment_type": garment,
        "primary_color": color,
        "secondary_colors": [],
        "pattern": "graphic" if "graphic" in name_lower else "solid",
        "style": style,
        "fit": "regular",
        "details": ""
    }

def generate_model_pose(image_bytes: bytes, analysis: Dict, pose: Dict, product_name: str) -> Optional[bytes]:
    """Generate a model wearing the outfit in a specific pose."""
    
    gender = analysis.get("gender", "female")
    garment = analysis.get("garment_type", "clothing")
    color = analysis.get("primary_color", "")
    style = analysis.get("style", "casual")
    pattern = analysis.get("pattern", "")
    details = analysis.get("details", "")
    
    prompt = f"""Look at this product image showing a {color} {garment}.

Generate a HIGH QUALITY fashion e-commerce photo of an attractive {gender} model wearing this EXACT outfit.

OUTFIT TO RECREATE EXACTLY:
- Garment: {color} {garment}
- Style: {style}
- Pattern: {pattern}
- Details: {details}
- Product: {product_name}

MODEL POSE:
{pose['description']}

REQUIREMENTS:
1. Professional fashion model, attractive and well-groomed
2. Model wearing the EXACT same {garment} from the product image
3. Preserve ALL colors, patterns, graphics, and details exactly
4. Clean white/light gray studio background
5. Professional studio lighting
6. Full body shot from head to toe
7. High resolution, sharp, e-commerce quality
8. Natural, confident expression

Generate a professional product photo suitable for a fashion e-commerce website."""

    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = client.models.generate_content(
                model=IMAGE_GEN_MODEL,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
                            types.Part.from_text(text=prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    temperature=0.4
                )
            )
            
            # Extract generated image
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        return part.inline_data.data
            
            print(f"      Attempt {attempt+1}: No image in response, retrying...")
            time.sleep(3)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 30 * (attempt + 1)
                print(f"      Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            elif "SAFETY" in error_str.upper() or "BLOCKED" in error_str.upper():
                print(f"      Content blocked, skipping this pose")
                return None
            else:
                print(f"      Error: {error_str[:100]}")
                time.sleep(5)
    
    return None

# ---------------------------------------------------------------------------
# Main Processing
# ---------------------------------------------------------------------------

def create_safe_filename(product_name: str, pose_name: str) -> str:
    """Create a safe filename from product name and pose."""
    safe_name = "".join(c if c.isalnum() or c in ' -_' else '' for c in product_name)
    safe_name = safe_name.replace(' ', '_')[:50]
    return f"{safe_name}_{pose_name}"

def process_products():
    """Main function to process all products without model images."""
    print("=" * 70)
    print("MODEL POSE GENERATION - Nana Banana Pro")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Disable SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Get Directus token
    print("\nAuthenticating with Directus...")
    try:
        token = get_directus_token()
        print("✓ Authenticated")
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return
    
    # Fetch products
    print("\nFetching products without model images...")
    products = fetch_products_without_models()
    print(f"Found {len(products)} products to process")
    
    if not products:
        print("No products need processing!")
        return
    
    # Process each product
    total_generated = 0
    failed_products = []
    
    for idx, product in enumerate(products, 1):
        product_id = product["id"]
        product_name = product["name"]
        image_path = product.get("image") or product.get("image_url")
        
        print(f"\n[{idx}/{len(products)}] {product_name}")
        
        if not image_path:
            print("  ⚠ No image path, skipping")
            failed_products.append((product_name, "No image"))
            continue
        
        # Download product image
        cloudinary_url = get_cloudinary_url(image_path)
        print(f"  Downloading from: {cloudinary_url[:60]}...")
        
        try:
            image_bytes = download_image(cloudinary_url)
            print(f"  ✓ Downloaded ({len(image_bytes)} bytes)")
        except Exception as e:
            print(f"  ✗ Download failed: {e}")
            failed_products.append((product_name, "Download failed"))
            continue
        
        # Analyze the product
        print("  Analyzing outfit...")
        gender_category = product.get("gender_category")
        analysis = analyze_product_image(image_bytes, product_name, gender_category)
        print(f"  ✓ {analysis.get('gender', '?')} {analysis.get('garment_type', '?')} - {analysis.get('style', '?')}")
        
        # Generate poses
        model_images = []
        
        for pose_idx, pose in enumerate(POSE_VARIATIONS, 1):
            print(f"  [{pose_idx}/3] Generating {pose['name']}...")
            
            generated_bytes = generate_model_pose(image_bytes, analysis, pose, product_name)
            
            if generated_bytes:
                # Save locally
                filename = create_safe_filename(product_name, pose['name'])
                local_path = OUTPUT_FOLDER / f"{filename}.png"
                local_path.write_bytes(generated_bytes)
                print(f"      ✓ Saved locally: {filename}.png")
                
                # Upload to Cloudinary
                try:
                    cloudinary_path = upload_to_cloudinary(generated_bytes, filename)
                    model_images.append(cloudinary_path)
                    print(f"      ✓ Ready for upload")
                    total_generated += 1
                except Exception as e:
                    print(f"      ✗ Error: {e}")
            else:
                print(f"      ✗ Generation failed")
            
            # Delay between poses
            time.sleep(3)
        
        # Skip Directus update - will be done after Cloudinary upload
        if not model_images:
            failed_products.append((product_name, "No poses generated"))
        
        # Delay between products
        time.sleep(5)
    
    # Summary
    print("\n" + "=" * 70)
    print("GENERATION COMPLETE")
    print("=" * 70)
    print(f"Total poses generated: {total_generated}")
    print(f"Failed products: {len(failed_products)}")
    
    if failed_products:
        print("\nFailed products:")
        for name, reason in failed_products[:20]:
            print(f"  - {name}: {reason}")
    
    print(f"\nLocal backups saved to: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    process_products()
