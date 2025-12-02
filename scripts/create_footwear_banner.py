"""
Create a footwear collection banner collage from product images
"""
import os
from PIL import Image, ImageDraw

# Local product images directory
PRODUCTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'products', 'extracted-products')

# Footwear product images (local files)
FOOTWEAR_IMAGES = [
    "female_black_mules_SONY_ILCE-7RM5_9600x6376_000156_2.png",
    "female_black_mules__DSC4039_Large_3.png",
    "model2_female_beige_flats_SONY_ILCE-7RM5_9600x6376_000156_5.png",
    "model2_female_light_brown_flats__DSC4148_1_6.png",
    "model4_female_black_flats__DSC4148_1_12.png",
    "female_light_beige_ballet_flats__DSC5817_2.png",
]

def load_local_image(filename):
    """Load image from local products directory"""
    path = os.path.join(PRODUCTS_DIR, filename)
    print(f"Loading: {path}")
    try:
        if os.path.exists(path):
            return Image.open(path).convert('RGBA')
        else:
            print(f"  File not found")
            return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def create_collage(images, output_path, width=1920, height=800):
    """Create a stylish collage banner"""
    # Create base image with gradient background
    banner = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(banner)
    
    # Create gradient background (dark to darker)
    for y in range(height):
        # Gradient from dark gray to black
        r = int(30 - (y / height) * 20)
        g = int(30 - (y / height) * 20)
        b = int(35 - (y / height) * 25)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    
    # Calculate positions for images
    num_images = len(images)
    if num_images == 0:
        print("No images to create collage")
        return
    
    # Layout: spread images across the banner with overlap
    img_width = width // 3  # Each image takes 1/3 of width
    img_height = int(height * 0.85)  # 85% of banner height
    
    # Position images with overlap for visual appeal
    positions = []
    spacing = (width - img_width) // (num_images - 1) if num_images > 1 else width // 2
    
    for i in range(num_images):
        x = i * spacing
        y = (height - img_height) // 2 + (i % 2) * 20  # Slight stagger
        positions.append((x, y))
    
    # Place images (from back to front for overlap effect)
    for i, (img, pos) in enumerate(zip(images, positions)):
        if img is None:
            continue
        
        # Resize image maintaining aspect ratio
        img_ratio = img.width / img.height
        target_ratio = img_width / img_height
        
        if img_ratio > target_ratio:
            new_width = img_width
            new_height = int(img_width / img_ratio)
        else:
            new_height = img_height
            new_width = int(img_height * img_ratio)
        
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Center the image in its slot
        x = pos[0] + (img_width - new_width) // 2
        y = pos[1] + (img_height - new_height) // 2
        
        # Add subtle shadow
        shadow = Image.new('RGBA', resized.size, (0, 0, 0, 100))
        banner.paste(shadow, (x + 5, y + 5), shadow)
        
        # Paste image
        banner.paste(resized, (x, y), resized)
    
    # Add subtle vignette overlay
    vignette = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)
    for i in range(100):
        alpha = int(i * 1.5)
        vignette_draw.rectangle([i, i, width - i, height - i], outline=(0, 0, 0, alpha))
    banner = Image.alpha_composite(banner, vignette)
    
    # Convert to RGB for saving as JPG
    banner_rgb = Image.new('RGB', banner.size, (0, 0, 0))
    banner_rgb.paste(banner, mask=banner.split()[3] if banner.mode == 'RGBA' else None)
    
    # Save
    banner_rgb.save(output_path, 'JPEG', quality=90)
    print(f"Banner saved to: {output_path}")

def main():
    print("Creating footwear collection banner...")
    
    # Load all footwear images from local files
    images = []
    for filename in FOOTWEAR_IMAGES:
        img = load_local_image(filename)
        if img:
            images.append(img)
    
    print(f"\nLoaded {len(images)} images")
    
    if len(images) == 0:
        print("No images downloaded, cannot create banner")
        return
    
    # Create output directory if needed
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'categories')
    os.makedirs(output_dir, exist_ok=True)
    
    # Create banner
    output_path = os.path.join(output_dir, 'footwear_collage.jpg')
    create_collage(images, output_path)
    
    print("\nDone! Now upload to Cloudinary:")
    print(f"  Image: {output_path}")

if __name__ == "__main__":
    main()
