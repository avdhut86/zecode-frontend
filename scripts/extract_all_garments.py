"""
Extract ALL garments from fashion images using Gemini 3 Pro Image Preview.
- Detects all models in each image
- Extracts each garment separately (t-shirt AND jacket, pants, skirts, etc.)
- Preserves exact graphics, prints, colors, and text
"""

import os
import json
import time
import base64
import shutil
from pathlib import Path
from google import genai
from google.genai import types

# Configuration
API_KEY = "AIzaSyAoafrMfqC0ea3ghxGjfa0CpG3UMBNrS70"
IMAGE_MODEL = "gemini-3-pro-image-preview"
ANALYSIS_MODEL = "gemini-2.5-flash"

# Initialize client
client = genai.Client(api_key=API_KEY)

# Folders
WORKSPACE = Path(r"D:\Avadhut\ZCode\Digial Marketing\Zecode-Website\website-raw-images")
OUTPUT_FOLDER = WORKSPACE / "extracted-products"
OUTPUT_FOLDER.mkdir(exist_ok=True)

def get_image_files():
    """Get all image files from workspace."""
    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
    images = []
    for f in WORKSPACE.iterdir():
        if f.is_file() and f.suffix.lower() in extensions:
            images.append(f)
    return sorted(images)

def load_image_as_base64(image_path):
    """Load image and return base64 encoded data."""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def get_mime_type(image_path):
    """Get MIME type based on file extension."""
    ext = image_path.suffix.lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp'
    }
    return mime_types.get(ext, 'image/jpeg')

def analyze_all_garments(image_path):
    """
    Analyze image to detect ALL models and ALL their garments.
    Returns detailed list of every garment worn by every person.
    """
    image_data = load_image_as_base64(image_path)
    mime_type = get_mime_type(image_path)
    
    prompt = """Analyze this fashion image carefully. Identify EVERY person/model and EVERY garment they are wearing.

For EACH garment, provide:
1. model_number: Which person (1, 2, 3, etc. from left to right)
2. garment_type: Specific type (e.g., "t-shirt", "jacket", "blazer", "hoodie", "cardigan", "pants", "jeans", "skirt", "dress", "shorts", "coat", etc.)
3. layer: "outer" (jacket/coat/cardigan worn over), "main" (primary visible garment), "inner" (visible underneath)
4. gender: "male" or "female"
5. primary_color: Main color
6. secondary_colors: Other colors present
7. has_graphics: true/false
8. graphic_description: Detailed description of any prints, logos, graphics, patterns
9. text_on_garment: Any text/words visible on the garment
10. pattern_type: "solid", "striped", "checkered", "floral", "abstract", "graphic_print", etc.
11. material_look: "cotton", "denim", "leather", "knit", "silk", etc.
12. fit_style: "oversized", "fitted", "regular", "cropped", "loose", etc.
13. unique_details: Any special features (buttons, zippers, pockets, embroidery, etc.)

IMPORTANT: 
- List EACH garment separately (if someone wears a t-shirt under a jacket, list BOTH)
- Include ALL visible clothing items (tops, bottoms, outerwear, layered pieces)
- Be very detailed about graphics and prints

Return as JSON array:
{
    "total_models": number,
    "garments": [
        {
            "model_number": 1,
            "garment_type": "t-shirt",
            "layer": "inner",
            "gender": "male",
            "primary_color": "black",
            "secondary_colors": ["white", "red"],
            "has_graphics": true,
            "graphic_description": "Large skull graphic with roses, vintage distressed style",
            "text_on_garment": "ROCK & ROLL",
            "pattern_type": "graphic_print",
            "material_look": "cotton",
            "fit_style": "regular",
            "unique_details": "crew neck, short sleeves"
        },
        ...
    ]
}"""

    try:
        response = client.models.generate_content(
            model=ANALYSIS_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(
                            data=base64.b64decode(image_data),
                            mime_type=mime_type
                        ),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text)
        return result
        
    except Exception as e:
        print(f"    Analysis error: {e}")
        return None

def extract_garment_image(image_path, garment_info, original_name):
    """
    Use Gemini 3 Pro Image Preview to extract a specific garment
    with exact graphics, colors, and details preserved.
    """
    image_data = load_image_as_base64(image_path)
    mime_type = get_mime_type(image_path)
    
    # Build detailed extraction prompt
    garment_desc = f"{garment_info['primary_color']} {garment_info['garment_type']}"
    
    if garment_info.get('has_graphics') and garment_info.get('graphic_description'):
        garment_desc += f" with {garment_info['graphic_description']}"
    
    if garment_info.get('text_on_garment'):
        garment_desc += f", text reading '{garment_info['text_on_garment']}'"
    
    if garment_info.get('pattern_type') and garment_info['pattern_type'] != 'solid':
        garment_desc += f", {garment_info['pattern_type']} pattern"
    
    if garment_info.get('secondary_colors'):
        colors = ", ".join(garment_info['secondary_colors'])
        garment_desc += f", with {colors} accents"

    model_num = garment_info.get('model_number', 1)
    layer = garment_info.get('layer', 'main')
    
    prompt = f"""Look at model #{model_num} in this image. They are wearing a {garment_desc}.

Extract ONLY this specific {garment_info['garment_type']} ({layer} layer) and create a clean product image showing:
- The EXACT same garment with IDENTICAL graphics, prints, logos, and text
- The EXACT same colors - do not change any colors
- All details: {garment_info.get('unique_details', 'standard design')}
- Material appearance: {garment_info.get('material_look', 'fabric')}
- Fit style: {garment_info.get('fit_style', 'regular')}

Create the garment as a flat-lay product photo on a pure white background.
The garment should be shown from the front, laid flat as if for an e-commerce listing.
PRESERVE ALL GRAPHICS, TEXT, AND PRINTS EXACTLY AS THEY APPEAR - this is critical.
Do NOT simplify or modify any designs on the garment."""

    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = client.models.generate_content(
                model=IMAGE_MODEL,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(
                                data=base64.b64decode(image_data),
                                mime_type=mime_type
                            ),
                            types.Part.from_text(text=prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    temperature=0.2
                )
            )
            
            # Extract generated image
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        return part.inline_data.data
            
            print(f"    Attempt {attempt+1}: No image generated, retrying...")
            time.sleep(2)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 60 if attempt < max_attempts - 1 else 120
                print(f"    Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"    Error: {error_str[:100]}")
                time.sleep(3)
    
    return None

def create_filename(garment_info, original_name, index):
    """Create descriptive filename for the extracted garment."""
    parts = []
    
    # Model number if multiple
    model_num = garment_info.get('model_number', 1)
    if model_num > 1:
        parts.append(f"model{model_num}")
    
    # Gender
    parts.append(garment_info.get('gender', 'unisex'))
    
    # Color
    color = garment_info.get('primary_color', 'unknown').lower().replace(' ', '_')
    parts.append(color)
    
    # Garment type
    garment_type = garment_info.get('garment_type', 'garment').lower().replace(' ', '_').replace('-', '_')
    parts.append(garment_type)
    
    # Layer indicator
    layer = garment_info.get('layer', 'main')
    if layer == 'outer':
        parts.append('outer')
    elif layer == 'inner':
        parts.append('under')
    
    # Pattern/graphic indicator
    if garment_info.get('has_graphics'):
        parts.append('graphic')
    elif garment_info.get('pattern_type') and garment_info['pattern_type'] != 'solid':
        parts.append(garment_info['pattern_type'].replace(' ', '_'))
    
    # Original filename reference
    orig_clean = original_name.replace(' ', '_')
    parts.append(orig_clean)
    
    # Index to ensure uniqueness
    parts.append(str(index))
    
    filename = "_".join(parts)
    # Clean filename
    filename = "".join(c for c in filename if c.isalnum() or c in '_-')
    return filename[:120] + ".png"

def process_images():
    """Main processing function."""
    print("=" * 70)
    print("GARMENT EXTRACTION - All Models, All Layers")
    print("Using Gemini 3 Pro Image Preview")
    print("=" * 70)
    
    images = get_image_files()
    print(f"\nFound {len(images)} images to process\n")
    
    total_extracted = 0
    failed_extractions = []
    
    for img_idx, image_path in enumerate(images, 1):
        print(f"\n[{img_idx}/{len(images)}] Processing: {image_path.stem}")
        
        # Copy original image for reference
        original_copy_name = f"ORIGINAL_{image_path.stem}{image_path.suffix}"
        original_copy_path = OUTPUT_FOLDER / original_copy_name
        shutil.copy2(image_path, original_copy_path)
        print(f"  Saved original: {original_copy_name}")
        
        # Step 1: Analyze all garments in image
        print("  Analyzing all models and garments...")
        analysis = analyze_all_garments(image_path)
        
        if not analysis or not analysis.get('garments'):
            print("  ⚠ Could not analyze garments")
            failed_extractions.append((image_path.name, "Analysis failed"))
            continue
        
        garments = analysis['garments']
        total_models = analysis.get('total_models', 1)
        print(f"  Found {total_models} model(s) with {len(garments)} garment(s)")
        
        # Step 2: Extract each garment
        for g_idx, garment in enumerate(garments, 1):
            garment_type = garment.get('garment_type', 'unknown')
            layer = garment.get('layer', 'main')
            model_num = garment.get('model_number', 1)
            color = garment.get('primary_color', '')
            
            print(f"  [{g_idx}/{len(garments)}] Model {model_num}: {color} {garment_type} ({layer})")
            
            # Skip accessories like shoes, bags, etc. (optional - remove if you want these too)
            skip_types = ['shoes', 'sandals', 'sneakers', 'boots', 'bag', 'purse', 'hat', 'cap', 'sunglasses', 'watch', 'jewelry', 'belt', 'socks']
            if garment_type.lower() in skip_types:
                print(f"    Skipping accessory: {garment_type}")
                continue
            
            # Extract the garment
            image_data = extract_garment_image(image_path, garment, image_path.stem)
            
            if image_data:
                # Save the extracted image
                filename = create_filename(garment, image_path.stem, g_idx)
                output_path = OUTPUT_FOLDER / filename
                
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                
                print(f"    ✓ Saved: {filename}")
                total_extracted += 1
            else:
                print(f"    ✗ Failed to extract")
                failed_extractions.append((image_path.name, f"{garment_type} ({layer})"))
            
            # Small delay between garments
            time.sleep(2)
        
        # Delay between images
        time.sleep(3)
    
    # Summary
    print("\n" + "=" * 70)
    print("EXTRACTION COMPLETE")
    print("=" * 70)
    print(f"Total garments extracted: {total_extracted}")
    print(f"Failed extractions: {len(failed_extractions)}")
    
    if failed_extractions:
        print("\nFailed items:")
        for img, garment in failed_extractions[:10]:
            print(f"  - {img}: {garment}")
        if len(failed_extractions) > 10:
            print(f"  ... and {len(failed_extractions) - 10} more")
    
    print(f"\nOutput folder: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    process_images()
