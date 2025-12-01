"""
Extract models from fashion images and generate 3 different poses for product pages.
Uses Gemini 3 Pro Image Preview for high-quality model extraction and pose generation.
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
IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation"  # Working model for image gen
ANALYSIS_MODEL = "gemini-2.5-flash"

# Initialize client
client = genai.Client(api_key=API_KEY)

# Folders
WORKSPACE = Path(r"D:\Avadhut\ZCode\Digial Marketing\Zecode-Website\website-raw-images")
OUTPUT_FOLDER = WORKSPACE / "model-poses"
OUTPUT_FOLDER.mkdir(exist_ok=True)

# Pose variations to generate
POSE_VARIATIONS = [
    {
        "name": "front_standing",
        "description": "Front-facing standing pose, confident posture, hands relaxed at sides, looking directly at camera, neutral expression, professional model stance"
    },
    {
        "name": "three_quarter",
        "description": "Three-quarter angle pose (45 degrees), one hand on hip, slight turn of body, natural confident expression, showing outfit from angled view"
    },
    {
        "name": "casual_lifestyle",
        "description": "Casual lifestyle pose, relaxed natural stance, slight smile, one foot slightly forward, hands in relaxed position, approachable and friendly look"
    }
]

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

def analyze_models_in_image(image_path):
    """
    Analyze image to detect all models and their outfits.
    Returns details about each model for pose generation.
    """
    image_data = load_image_as_base64(image_path)
    mime_type = get_mime_type(image_path)
    
    prompt = """Analyze this fashion image and identify each model/person.

For EACH model, provide:
1. model_number: Position (1, 2, 3 from left to right)
2. gender: "male" or "female"
3. approximate_age: "young adult", "adult", "mature"
4. body_type: "slim", "athletic", "average", "plus-size"
5. skin_tone: Description of skin tone
6. hair_description: Hair color, length, style
7. outfit_summary: Brief description of complete outfit
8. top_garment: Main top garment with color and details
9. bottom_garment: Main bottom garment with color and details
10. accessories: Any visible accessories
11. overall_style: "casual", "formal", "streetwear", "athletic", "bohemian", etc.

Return as JSON:
{
    "total_models": number,
    "models": [
        {
            "model_number": 1,
            "gender": "female",
            "approximate_age": "young adult",
            "body_type": "slim",
            "skin_tone": "medium brown",
            "hair_description": "long black wavy hair",
            "outfit_summary": "Casual streetwear with graphic tee and jeans",
            "top_garment": "white oversized t-shirt with colorful abstract print",
            "bottom_garment": "high-waisted blue denim jeans",
            "accessories": "silver hoop earrings, white sneakers",
            "overall_style": "streetwear"
        }
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

def generate_model_pose(image_path, model_info, pose_info, original_name):
    """
    Generate a specific pose variation of the model.
    Preserves the exact outfit, colors, and model appearance.
    """
    image_data = load_image_as_base64(image_path)
    mime_type = get_mime_type(image_path)
    
    # Build detailed prompt for pose generation
    model_desc = f"{model_info.get('gender', 'person')}"
    if model_info.get('body_type'):
        model_desc += f" with {model_info['body_type']} build"
    if model_info.get('skin_tone'):
        model_desc += f", {model_info['skin_tone']} skin"
    if model_info.get('hair_description'):
        model_desc += f", {model_info['hair_description']}"
    
    outfit_desc = model_info.get('outfit_summary', 'fashionable outfit')
    top = model_info.get('top_garment', '')
    bottom = model_info.get('bottom_garment', '')
    accessories = model_info.get('accessories', '')
    
    prompt = f"""Look at the model in this image. Create a new photo of this SAME model in a different pose for an e-commerce product page.

MODEL DETAILS (preserve exactly):
- {model_desc}
- Overall style: {model_info.get('overall_style', 'fashionable')}

OUTFIT TO PRESERVE EXACTLY:
- Top: {top}
- Bottom: {bottom}
- Accessories: {accessories}
- Full outfit: {outfit_desc}

NEW POSE REQUIRED:
{pose_info['description']}

CRITICAL REQUIREMENTS:
1. SAME MODEL - preserve exact appearance, face features, skin tone, hair
2. SAME OUTFIT - preserve exact colors, patterns, graphics, text on clothing
3. NEW POSE - {pose_info['name'].replace('_', ' ')} pose as described
4. BACKGROUND - clean white or light gray studio background
5. LIGHTING - professional studio lighting, even and flattering
6. QUALITY - high-resolution, sharp, suitable for e-commerce product page
7. FRAMING - full body shot showing complete outfit from head to toe

Generate a professional product photography image of this model in the new pose."""

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
                    temperature=0.3
                )
            )
            
            # Extract generated image
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        return part.inline_data.data
            
            print(f"      Attempt {attempt+1}: No image generated, retrying...")
            time.sleep(2)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 60 if attempt < max_attempts - 1 else 120
                print(f"      Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"      Error: {error_str[:80]}")
                time.sleep(3)
    
    return None

def create_filename(model_info, pose_name, original_name, model_num):
    """Create descriptive filename for the model pose."""
    parts = []
    
    # Model identifier
    if model_num > 1:
        parts.append(f"model{model_num}")
    
    # Gender
    parts.append(model_info.get('gender', 'model'))
    
    # Style
    style = model_info.get('overall_style', 'fashion').lower().replace(' ', '_')
    parts.append(style)
    
    # Pose name
    parts.append(pose_name)
    
    # Original filename reference
    orig_clean = original_name.replace(' ', '_')
    parts.append(orig_clean)
    
    filename = "_".join(parts)
    # Clean filename
    filename = "".join(c for c in filename if c.isalnum() or c in '_-')
    return filename[:120] + ".png"

def get_already_processed():
    """Get list of source images that already have poses generated."""
    processed = set()
    for f in OUTPUT_FOLDER.glob('*.png'):
        name = f.stem
        if 'ORIGINAL' in name:
            continue
        # Extract source reference from pose filename
        # Format: gender_style_pose_source or modelN_gender_style_pose_source
        parts = name.split('_')
        # Find DSC or similar source markers
        for i, part in enumerate(parts):
            if part.startswith('DSC') or part.startswith('SONY') or part.startswith('file'):
                # Reconstruct source name
                source = '_'.join(parts[i:])
                processed.add(source.lower())
                break
    return processed

def process_images():
    """Main processing function."""
    print("=" * 70)
    print("MODEL POSE EXTRACTION - 3 Poses per Model")
    print("Using Gemini 2.0 Flash Exp Image Generation")
    print("=" * 70)
    
    images = get_image_files()
    already_processed = get_already_processed()
    
    print(f"\nFound {len(images)} total images")
    print(f"Already processed: {len(already_processed)} images")
    print(f"Will generate {len(POSE_VARIATIONS)} poses per model\n")
    
    total_generated = 0
    failed_generations = []
    skipped = 0
    
    for img_idx, image_path in enumerate(images, 1):
        # Check if already processed
        stem_lower = image_path.stem.lower().replace(' ', '_')
        if any(stem_lower in proc or proc in stem_lower for proc in already_processed):
            print(f"[{img_idx}/{len(images)}] Skipping (already done): {image_path.stem}")
            skipped += 1
            continue
            
        print(f"\n[{img_idx}/{len(images)}] Processing: {image_path.stem}")
        
        # Copy original image for reference
        original_copy_name = f"ORIGINAL_{image_path.stem}{image_path.suffix}"
        original_copy_path = OUTPUT_FOLDER / original_copy_name
        if not original_copy_path.exists():
            shutil.copy2(image_path, original_copy_path)
            print(f"  Saved original: {original_copy_name}")
        
        # Step 1: Analyze models in image
        print("  Analyzing models...")
        analysis = analyze_models_in_image(image_path)
        
        if not analysis or not analysis.get('models'):
            print("  ⚠ Could not analyze models")
            failed_generations.append((image_path.name, "Analysis failed"))
            continue
        
        models = analysis['models']
        print(f"  Found {len(models)} model(s)")
        
        # Step 2: Generate poses for each model
        for model in models:
            model_num = model.get('model_number', 1)
            gender = model.get('gender', 'model')
            style = model.get('overall_style', 'fashion')
            
            print(f"\n  Model {model_num}: {gender}, {style} style")
            
            # Generate each pose variation
            for pose_idx, pose in enumerate(POSE_VARIATIONS, 1):
                print(f"    [{pose_idx}/3] Generating {pose['name']} pose...")
                
                image_data = generate_model_pose(image_path, model, pose, image_path.stem)
                
                if image_data:
                    # Save the generated pose
                    filename = create_filename(model, pose['name'], image_path.stem, model_num)
                    output_path = OUTPUT_FOLDER / filename
                    
                    with open(output_path, 'wb') as f:
                        f.write(image_data)
                    
                    print(f"      ✓ Saved: {filename}")
                    total_generated += 1
                else:
                    print(f"      ✗ Failed to generate")
                    failed_generations.append((image_path.name, f"Model {model_num} - {pose['name']}"))
                
                # Delay between poses
                time.sleep(2)
            
            # Delay between models
            time.sleep(2)
        
        # Delay between images
        time.sleep(3)
    
    # Summary
    print("\n" + "=" * 70)
    print("POSE GENERATION COMPLETE")
    print("=" * 70)
    print(f"Skipped (already processed): {skipped}")
    print(f"Total poses generated: {total_generated}")
    print(f"Failed generations: {len(failed_generations)}")
    
    if failed_generations:
        print("\nFailed items:")
        for img, desc in failed_generations[:10]:
            print(f"  - {img}: {desc}")
        if len(failed_generations) > 10:
            print(f"  ... and {len(failed_generations) - 10} more")
    
    print(f"\nOutput folder: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    process_images()
