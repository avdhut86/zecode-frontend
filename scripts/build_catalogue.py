"""
Build Product Catalogue from Existing Images
Uses already extracted garments and model poses to create a product catalogue CSV
Detects kids vs adults and uses appropriate gender labels (boy/girl vs male/female)
"""

import os
import csv
import json
import re
import base64
from pathlib import Path
from datetime import datetime
from google import genai
from google.genai import types
import certifi
from config import get_google_api_key

# Configure SSL
os.environ['SSL_CERT_FILE'] = certifi.where()

# API Configuration - from environment
API_KEY = get_google_api_key()
ANALYSIS_MODEL = "gemini-2.5-flash"

# Create client
client = genai.Client(api_key=API_KEY)

# Folders
GARMENTS_FOLDER = Path("extracted-products")
POSES_FOLDER = Path("model-poses")
OUTPUT_FOLDER = Path(".")

def analyze_image_for_age(image_path):
    """Analyze an image to determine if the model is a kid or adult."""
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        prompt = """Look at this fashion product image. Is the person wearing this a child/kid (under 12 years old) or an adult/teenager?

Return ONLY a JSON object:
{
    "is_kid": true or false,
    "estimated_age_range": "child (2-12)" or "teen/adult (13+)",
    "gender": "male" or "female"
}"""

        response = client.models.generate_content(
            model=ANALYSIS_MODEL,
            contents=[
                types.Part.from_bytes(data=image_data, mime_type="image/png"),
                prompt
            ]
        )
        
        text = response.text
        json_match = re.search(r'\{[\s\S]*?\}', text)
        if json_match:
            data = json.loads(json_match.group())
            return data
    except Exception as e:
        print(f"Error: {e}")
    
    return {"is_kid": False, "gender": "unknown"}

def parse_garment_filename(filename):
    """Parse garment filename to extract product details."""
    name = Path(filename).stem
    
    if name.startswith('ORIGINAL_'):
        return None
    
    parts = name.split('_')
    
    model_num = 1
    start_idx = 0
    if parts[0].startswith('model'):
        model_num = int(parts[0].replace('model', ''))
        start_idx = 1
    
    gender = parts[start_idx] if start_idx < len(parts) else 'unknown'
    
    source_match = re.search(r'_+(DSC\d+|SONY|file)[^.]*', name)
    source_ref = source_match.group(0).lstrip('_') if source_match else ''
    
    middle_part = name
    if source_match:
        middle_part = name[:source_match.start()]
    
    if model_num > 1:
        middle_part = middle_part.replace(f'model{model_num}_{gender}_', '')
    else:
        middle_part = middle_part.replace(f'{gender}_', '')
    
    remaining_parts = middle_part.split('_')
    
    color = remaining_parts[0] if len(remaining_parts) > 0 else 'unknown'
    
    garment_types = ['t-shirt', 't_shirt', 'tshirt', 'shirt', 'hoodie', 'jacket', 'jeans', 
                     'pants', 'dress', 'skirt', 'blouse', 'top', 'sweater', 'shorts',
                     'jumpsuit', 'coat', 'blazer', 'tank', 'tracksuit', 'sweatpants',
                     'cardigan', 'vest', 'tunic', 'mules', 'flats', 'backpack', 'visor',
                     'romper', 'onesie', 'overalls', 'frock', 'gown']
    
    garment_type = 'apparel'
    for i, part in enumerate(remaining_parts[1:], 1):
        for gt in garment_types:
            if gt.replace('-', '_').replace(' ', '_') in part.lower() or part.lower() in gt:
                garment_type = part.replace('_', ' ')
                break
        if garment_type != 'apparel':
            break
    
    pattern = ''
    for part in remaining_parts:
        if part.lower() in ['graphic', 'print', 'striped', 'speckled', 'floral', 'tie-dye', 
                           'color-block', 'textured', 'embroidered', 'minimalist', 'cartoon',
                           'character', 'animal', 'rainbow']:
            pattern = part.replace('_', ' ')
            break
    
    style = 'casual'
    for part in remaining_parts:
        if part.lower() in ['streetwear', 'casual', 'formal', 'bohemian', 'athleisure', 
                           'vintage', 'minimalist', 'playful', 'cute']:
            style = part
            break
    
    return {
        'filename': filename,
        'product_name': name,
        'gender': gender,
        'color': color,
        'garment_type': garment_type,
        'pattern': pattern,
        'style': style,
        'model_number': model_num,
        'source_ref': source_ref,
        'is_kid': False,
        'age_category': 'adult'
    }

def find_model_poses(source_ref, gender):
    """Find model pose images that match the source image."""
    poses = {
        'front_standing': '',
        'three_quarter': '',
        'casual_lifestyle': ''
    }
    
    dsc_match = re.search(r'DSC(\d+)', source_ref)
    if not dsc_match:
        return poses
    
    dsc_num = dsc_match.group(1)
    
    pose_files = list(POSES_FOLDER.glob('*.png'))
    
    for pose_file in pose_files:
        name = pose_file.stem
        if 'ORIGINAL' in name:
            continue
        
        if f'DSC{dsc_num}' in name or f'_DSC{dsc_num}' in name:
            if gender.lower() in name.lower():
                if 'front_standing' in name:
                    poses['front_standing'] = pose_file.name
                elif 'three_quarter' in name:
                    poses['three_quarter'] = pose_file.name
                elif 'casual_lifestyle' in name or 'lifestyle' in name:
                    poses['casual_lifestyle'] = pose_file.name
    
    return poses

def get_category(garment_type, is_kid=False):
    """Map garment type to category."""
    garment_lower = garment_type.lower()
    
    if is_kid:
        return "Kids"
    
    category_map = {
        'tops': ['t-shirt', 'tshirt', 'shirt', 'blouse', 'top', 'tank', 'hoodie', 'sweater', 'sweatshirt', 'cardigan', 'vest', 'tunic'],
        'bottoms': ['jeans', 'pants', 'trousers', 'shorts', 'skirt', 'sweatpants'],
        'outerwear': ['jacket', 'coat', 'blazer', 'varsity'],
        'dresses': ['dress', 'frock', 'gown'],
        'jumpsuits': ['jumpsuit', 'romper', 'overalls', 'onesie'],
        'accessories': ['backpack', 'visor', 'bag', 'hat'],
        'footwear': ['mules', 'flats', 'shoes', 'sneakers', 'boots', 'sandals']
    }
    
    for category, types in category_map.items():
        for t in types:
            if t in garment_lower:
                return category.title()
    
    return 'Apparel'

def get_subcategory(garment_type, is_kid=False):
    """Get subcategory."""
    garment_lower = garment_type.lower()
    
    subcategory_map = {
        'tops': ['t-shirt', 'tshirt', 'shirt', 'blouse', 'top', 'tank', 'hoodie', 'sweater', 'sweatshirt', 'cardigan', 'vest', 'tunic'],
        'bottoms': ['jeans', 'pants', 'trousers', 'shorts', 'skirt', 'sweatpants'],
        'outerwear': ['jacket', 'coat', 'blazer', 'varsity'],
        'dresses': ['dress', 'frock', 'gown'],
        'jumpsuits': ['jumpsuit', 'romper', 'overalls', 'onesie'],
    }
    
    if is_kid:
        for subcat, types in subcategory_map.items():
            for t in types:
                if t in garment_lower:
                    return subcat.title()
        return garment_type.title()
    
    return garment_type.title()

def build_catalogue():
    """Build the product catalogue from existing images."""
    
    print("=" * 70)
    print("BUILDING PRODUCT CATALOGUE")
    print("Detecting kids vs adults for proper categorization")
    print("=" * 70)
    
    garment_files = [f for f in GARMENTS_FOLDER.glob('*.png') if not f.name.startswith('ORIGINAL')]
    print(f"\nFound {len(garment_files)} garment images")
    
    pose_files = [f for f in POSES_FOLDER.glob('*.png') if not f.name.startswith('ORIGINAL')]
    print(f"Found {len(pose_files)} model pose images")
    
    products = []
    kids_count = 0
    
    print("\nAnalyzing products for age detection...")
    
    for i, garment_file in enumerate(garment_files, 1):
        info = parse_garment_filename(garment_file.name)
        if not info:
            continue
        
        image_path = GARMENTS_FOLDER / garment_file.name
        print(f"  [{i}/{len(garment_files)}] {garment_file.name[:40]}...", end=" ")
        
        age_info = analyze_image_for_age(image_path)
        
        if age_info.get('is_kid', False):
            info['is_kid'] = True
            info['age_category'] = 'kid'
            if info['gender'].lower() == 'male':
                info['gender'] = 'boy'
            elif info['gender'].lower() == 'female':
                info['gender'] = 'girl'
            kids_count += 1
            print("👶 Kid")
        else:
            print("👤 Adult")
        
        poses = find_model_poses(info['source_ref'], info['gender'])
        info['poses'] = poses
        products.append(info)
    
    print(f"\nTotal products: {len(products)}")
    print(f"Kids products: {kids_count}")
    print(f"Adult products: {len(products) - kids_count}")
    
    # Generate CSV
    csv_file = OUTPUT_FOLDER / "product_catalogue.csv"
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        writer.writerow([
            'sku', 'name', 'description', 'category', 'subcategory',
            'gender', 'gender_category', 'age_group', 'color', 'pattern', 'style',
            'product_image', 'model_image_1', 'model_image_2', 'model_image_3',
            'status', 'featured', 'created_at'
        ])
        
        for i, product in enumerate(products, 1):
            is_kid = product.get('is_kid', False)
            
            if is_kid:
                gender_code = 'B' if product['gender'] == 'boy' else 'G'
                sku = f"ZC-K{gender_code}{i:04d}"
            else:
                gender_code = product['gender'][0].upper() if product['gender'] else 'U'
                sku = f"ZC-{gender_code}{i:04d}"
            
            color = product['color'].replace('-', ' ').replace('_', ' ').title()
            garment = product['garment_type'].replace('-', ' ').replace('_', ' ').title()
            
            if is_kid:
                gender_label = "Boy's" if product['gender'] == 'boy' else "Girl's"
                name = f"{gender_label} {color} {garment}"
            else:
                name = f"{color} {garment}"
            
            if product['pattern']:
                name += f" - {product['pattern'].title()}"
            
            if is_kid:
                gender_desc = "boy's" if product['gender'] == 'boy' else "girl's"
                description = f"Adorable {gender_desc} {color.lower()} {garment.lower()}"
            else:
                description = f"{product['gender'].title()}'s {color.lower()} {garment.lower()}"
            
            if product['pattern']:
                description += f" with {product['pattern'].lower()} design"
            description += f". {product['style'].title()} style."
            
            category = get_category(product['garment_type'], is_kid)
            subcategory = get_subcategory(product['garment_type'], is_kid)
            age_group = "Kids" if is_kid else "Adults"
            
            # Gender category: Men, Women, or Kids
            if is_kid:
                gender_category = "Kids"
            elif product['gender'].lower() in ['male', 'boy']:
                gender_category = "Men"
            elif product['gender'].lower() in ['female', 'girl']:
                gender_category = "Women"
            else:
                gender_category = "Unisex"
            
            product_image = f"extracted-products/{product['filename']}"
            model_1 = f"model-poses/{product['poses']['front_standing']}" if product['poses']['front_standing'] else ''
            model_2 = f"model-poses/{product['poses']['three_quarter']}" if product['poses']['three_quarter'] else ''
            model_3 = f"model-poses/{product['poses']['casual_lifestyle']}" if product['poses']['casual_lifestyle'] else ''
            
            writer.writerow([
                sku, name, description, category, subcategory,
                product['gender'].title(), gender_category, age_group, color, product['pattern'], product['style'],
                product_image, model_1, model_2, model_3,
                'published', 'false', datetime.now().isoformat()
            ])
    
    print(f"\n✓ CSV saved: {csv_file}")
    
    # Also save as JSON
    json_file = OUTPUT_FOLDER / "product_catalogue.json"
    
    json_products = []
    for i, product in enumerate(products, 1):
        is_kid = product.get('is_kid', False)
        
        if is_kid:
            gender_code = 'B' if product['gender'] == 'boy' else 'G'
            sku = f"ZC-K{gender_code}{i:04d}"
        else:
            gender_code = product['gender'][0].upper() if product['gender'] else 'U'
            sku = f"ZC-{gender_code}{i:04d}"
        
        color = product['color'].replace('-', ' ').replace('_', ' ').title()
        garment = product['garment_type'].replace('-', ' ').replace('_', ' ').title()
        
        if is_kid:
            gender_label = "Boy's" if product['gender'] == 'boy' else "Girl's"
            name = f"{gender_label} {color} {garment}"
        else:
            name = f"{color} {garment}"
        
        if product['pattern']:
            name += f" - {product['pattern'].title()}"
        
        if is_kid:
            gender_desc = "boy's" if product['gender'] == 'boy' else "girl's"
            description = f"Adorable {gender_desc} {color.lower()} {garment.lower()}"
        else:
            description = f"{product['gender'].title()}'s {color.lower()} {garment.lower()}"
        
        if product['pattern']:
            description += f" with {product['pattern'].lower()} design"
        description += f". {product['style'].title()} style."
        
        # Gender category: Men, Women, or Kids
        if is_kid:
            gender_category = "Kids"
        elif product['gender'].lower() in ['male', 'boy']:
            gender_category = "Men"
        elif product['gender'].lower() in ['female', 'girl']:
            gender_category = "Women"
        else:
            gender_category = "Unisex"
        
        json_products.append({
            "sku": sku,
            "name": name,
            "description": description,
            "category": get_category(product['garment_type'], is_kid),
            "subcategory": get_subcategory(product['garment_type'], is_kid),
            "gender": product['gender'].title(),
            "gender_category": gender_category,
            "age_group": "Kids" if is_kid else "Adults",
            "color": color,
            "pattern": product['pattern'],
            "style": product['style'],
            "is_kid": is_kid,
            "images": {
                "product": f"extracted-products/{product['filename']}",
                "model_1": f"model-poses/{product['poses']['front_standing']}" if product['poses']['front_standing'] else None,
                "model_2": f"model-poses/{product['poses']['three_quarter']}" if product['poses']['three_quarter'] else None,
                "model_3": f"model-poses/{product['poses']['casual_lifestyle']}" if product['poses']['casual_lifestyle'] else None
            },
            "status": "published",
            "featured": False,
            "created_at": datetime.now().isoformat()
        })
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_products, f, indent=2)
    
    print(f"✓ JSON saved: {json_file}")
    
    # Print summary
    print("\n" + "=" * 70)
    print("CATALOGUE SUMMARY")
    print("=" * 70)
    
    categories = {}
    genders = {}
    products_with_poses = 0
    
    for product in products:
        cat = get_category(product['garment_type'], product.get('is_kid', False))
        categories[cat] = categories.get(cat, 0) + 1
        
        gender = product['gender'].title()
        genders[gender] = genders.get(gender, 0) + 1
        
        if any(product['poses'].values()):
            products_with_poses += 1
    
    print(f"\nTotal Products: {len(products)}")
    print(f"Products with Model Poses: {products_with_poses}")
    
    print(f"\nBy Age Group:")
    print(f"  Kids: {kids_count}")
    print(f"  Adults: {len(products) - kids_count}")
    
    print(f"\nBy Gender:")
    for gender, count in sorted(genders.items()):
        print(f"  {gender}: {count}")
    
    print(f"\nBy Category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    build_catalogue()
