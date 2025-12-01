# extract_with_nano_banana.py
"""Nano Banana Pro Outfit Extractor

Extract outfits from model images using Gemini 3 Pro Image Preview (Nano Banana Pro).

Features:
- Gender, colors, garment type, fit style, graphics, text, fashion style detection.
- AI background removal to produce clean white‑background product images.
- Smart descriptive filenames.
- Automatic rate‑limit handling (2 s delay, exponential back‑off).

Prerequisites:
- Set the Google API key in the environment variable ``GOOGLE_API_KEY``.
- Install the Gemini SDK: ``pip install google-generativeai``.

Usage:
    python extract_with_nano_banana.py
"""

import os
import time
import base64
import json
import pathlib
from typing import List, Dict

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Input folder – raw model images (adjust if needed)
INPUT_FOLDER = pathlib.Path(
    r"D:\Avadhut\ZCode\Digial Marketing\Zecode-Website\website-raw-images"
)
# Output folder – extracted outfit images
OUTPUT_FOLDER = pathlib.Path(__file__).parent / "extracted-outfits"
OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

# Gemini models
ANALYSIS_MODEL = "gemini-3-pro-image-preview"
GENERATION_MODEL = "gemini-3-pro-image-preview"  # same model used for generation

# Load API key from environment (Google recommends GOOGLE_API_KEY)
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise EnvironmentError(
        "Google API key not found. Set the GOOGLE_API_KEY environment variable."
    )

# ---------------------------------------------------------------------------
# Initialise Gemini client
# ---------------------------------------------------------------------------
from google import genai
from google.genai import types

genai.configure(api_key=API_KEY)
client = genai.Client()

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def list_image_files(folder: pathlib.Path) -> List[pathlib.Path]:
    """Return a list of image files (common extensions) in *folder*."""
    exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
    return [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in exts]

def read_image_base64(path: pathlib.Path) -> str:
    """Read *path* and return a base64‑encoded string."""
    return base64.b64encode(path.read_bytes()).decode("utf-8")

def mime_type_from_path(path: pathlib.Path) -> str:
    mapping = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
    }
    return mapping.get(path.suffix.lower(), "image/jpeg")

def safe_api_call(fn, *args, **kwargs):
    """Wrap a Gemini API call with simple rate‑limit handling.
    Retries up to 5 times with exponential back‑off.
    """
    max_attempts = 5
    delay = 2  # start with 2 s
    for attempt in range(1, max_attempts + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            # Detect quota‑exhausted errors via string matching (simplified)
            msg = str(e)
            if "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                wait = delay * (2 ** (attempt - 1))
                print(f"[Rate limit] Attempt {attempt}/{max_attempts}: waiting {wait}s…")
                time.sleep(wait)
                continue
            # Other errors – raise after a short pause
            print(f"[Error] {msg} (attempt {attempt}/{max_attempts})")
            time.sleep(3)
    raise RuntimeError("Maximum retry attempts exceeded for Gemini API call")

# ---------------------------------------------------------------------------
# Core processing functions
# ---------------------------------------------------------------------------

def analyze_outfit(image_path: pathlib.Path) -> Dict:
    """Send *image_path* to Gemini for detailed outfit analysis.
    Returns a dictionary with keys:
        gender, primary_color, secondary_colors, garment_type,
        fit_style, graphics (list), text_on_clothing, fashion_style.
    """
    image_b64 = read_image_base64(image_path)
    mime = mime_type_from_path(image_path)
    prompt = (
        "Analyze this fashion photograph and return a JSON object with the following fields:\n"
        "- gender (male/female/unknown)\n"
        "- primary_color (main visible color)\n"
        "- secondary_colors (list of any additional colors)\n"
        "- garment_type (t‑shirt, hoodie, jacket, dress, etc.)\n"
        "- fit_style (oversized, fitted, regular, cropped, etc.)\n"
        "- graphics (list of graphic/print descriptions)\n"
        "- text_on_clothing (any visible text)\n"
        "- fashion_style (streetwear, casual, formal, athleisure, etc.)\n"
        "Return ONLY a JSON object, no extra text."
    )
    response = safe_api_call(
        client.models.generate_content,
        model=ANALYSIS_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=base64.b64decode(image_b64), mime_type=mime),
                    types.Part.from_text(text=prompt),
                ],
            )
        ],
        config=types.GenerateContentConfig(temperature=0.1, response_mime_type="application/json"),
    )
    # Gemini returns a TextPart with JSON text
    try:
        json_text = response.text.strip()
        return json.loads(json_text)
    except Exception as e:
        print(f"[Parse error] Could not parse analysis JSON: {e}")
        return {}


def generate_clean_outfit(image_path: pathlib.Path, analysis: Dict) -> bytes:
    """Ask Gemini to produce a clean product‑style image with white background.
    Returns raw PNG bytes.
    """
    image_b64 = read_image_base64(image_path)
    mime = mime_type_from_path(image_path)
    # Build a concise description for the generation prompt
    desc_parts = []
    gender = analysis.get("gender", "model")
    garment = analysis.get("garment_type", "garment")
    color = analysis.get("primary_color", "colorful")
    style = analysis.get("fit_style", "regular")
    graphics = ", ".join(analysis.get("graphics", []))
    text = analysis.get("text_on_clothing", "")
    desc = f"{gender} wearing a {color} {garment} ({style})"
    if graphics:
        desc += f" with graphics: {graphics}"
    if text:
        desc += f" and text: '{text}'"
    prompt = (
        f"Create a high‑resolution product image of the outfit described: {desc}.\n"
        "The model should be removed; only the clothing remains on a pure white background.\n"
        "Preserve all graphics, prints, colors, and text exactly as in the source image."
    )
    response = safe_api_call(
        client.models.generate_content,
        model=GENERATION_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=base64.b64decode(image_b64), mime_type=mime),
                    types.Part.from_text(text=prompt),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"], temperature=0.2
        ),
    )
    # Extract the generated image bytes
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                return part.inline_data.data
    raise RuntimeError("No image generated by Gemini for " + str(image_path))


def build_filename(analysis: Dict, idx: int) -> str:
    """Construct a descriptive filename based on *analysis*.
    Pattern: {gender}_{primarycolor}_{graphic?}_{fit}_{garment}_{textsample}.png
    """
    gender = analysis.get("gender", "unknown")
    color = analysis.get("primary_color", "color").replace(" ", "_")
    garment = analysis.get("garment_type", "garment").replace(" ", "_")
    fit = analysis.get("fit_style", "regular").replace(" ", "_")
    graphics = analysis.get("graphics", [])
    graphic_part = graphics[0].replace(" ", "_") if graphics else "plain"
    text = analysis.get("text_on_clothing", "")
    text_part = text.replace(" ", "_") if text else "no-text"
    filename = f"{gender}_{color}_{graphic_part}_{fit}_{garment}_{text_part}_{idx}.png"
    # Sanitize
    return "".join(c for c in filename if c.isalnum() or c in "_-.")

# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------

def main():
    images = list_image_files(INPUT_FOLDER)
    if not images:
        print("[Info] No images found in", INPUT_FOLDER)
        return
    print(f"[Info] Found {len(images)} image(s) to process.")
    for i, img_path in enumerate(images, start=1):
        print(f"\n[{i}/{len(images)}] Processing {img_path.name}")
        analysis = analyze_outfit(img_path)
        if not analysis:
            print("  [Warning] Skipping due to analysis failure.")
            continue
        try:
            cleaned_bytes = generate_clean_outfit(img_path, analysis)
        except Exception as e:
            print(f"  [Error] Generation failed: {e}")
            continue
        out_name = build_filename(analysis, i)
        out_path = OUTPUT_FOLDER / out_name
        out_path.write_bytes(cleaned_bytes)
        print(f"  ✅ Saved: {out_path.name}")
        # Respect rate limits – small pause between images
        time.sleep(2)
    print("\nAll done. Extracted outfits are in:", OUTPUT_FOLDER)

if __name__ == "__main__":
    main()
