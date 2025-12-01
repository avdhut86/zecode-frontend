"""
Batch Outfit Extraction using Gemini 3 Pro Image (Nano Banana Pro)
Uses Google GenAI SDK for high-throughput processing
"""

import os
import json
import time
import urllib3
from pathlib import Path
from typing import Dict, List, Optional
from google import genai
from google.genai import types

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Patch certifi and ssl to prevent FileNotFoundError
import certifi
import ssl

def patched_where():
    return None
certifi.where = patched_where

original_create_default_context = ssl.create_default_context
def patched_create_default_context(*args, **kwargs):
    kwargs['cafile'] = None # Force no cafile
    context = original_create_default_context(*args, **kwargs)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    return context
ssl.create_default_context = patched_create_default_context

# Patch httpx to disable SSL verification (if SDK uses httpx)
import httpx
original_client = httpx.Client
def patched_client(*args, **kwargs):
    kwargs['verify'] = False
    return original_client(*args, **kwargs)
httpx.Client = patched_client

class NanaBananaBatchExtractor:
    """Extract outfits using Gemini Batch API via SDK"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable must be set")
        
        # Initialize SDK Client
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-3-pro-image-preview" 
        
    def upload_file(self, file_path: Path):
        """Upload a file to Gemini File API"""
        print(f"  Uploading {file_path.name}...")
        try:
            file_obj = self.client.files.upload(file=file_path)
            print(f"  ✓ Uploaded: {file_obj.name}")
            return file_obj
        except Exception as e:
            print(f"  ✗ Failed to upload {file_path.name}: {e}")
            raise

    def create_batch_requests(self, images: List[Path], output_path: Path) -> Path:
        """Create JSONL file for batch requests"""
        print(f"\nPreparing batch requests for {len(images)} images...")
        print(f"Writing to: {output_path}")
        
        with open(output_path, 'w') as f:
            for i, img_path in enumerate(images):
                # Upload image first
                try:
                    file_obj = self.upload_file(img_path)
                except Exception:
                    continue
                
                # Create prompt
                prompt = """
                Task 1: Analyze this fashion image and return a JSON object with:
                {
                    "gender": "male/female/unisex",
                    "primary_color": "color",
                    "garment_type": "type",
                    "fit_style": "style",
                    "has_graphics": true/false,
                    "text_on_clothing": "text"
                }
                
                Task 2: Remove the background and isolate the main clothing item on a pure white background. Preserve all details.
                """
                
                # Construct request object for JSONL
                request = {
                    "custom_id": f"req_{i}_{img_path.stem}",
                    "request": {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [
                                    {"text": prompt},
                                    {"file_data": {"file_uri": file_obj.uri, "mime_type": file_obj.mime_type}}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "responseModalities": ["TEXT", "IMAGE"],
                            "temperature": 0.4
                        }
                    }
                }
                
                f.write(json.dumps(request) + '\n')
                
        return output_path

    def submit_batch_job(self, jsonl_path: Path):
        """Submit the batch job"""
        print("\nSubmitting batch job...")
        
        # Upload JSONL file with explicit MIME type
        batch_input_file = self.client.files.upload(file=str(jsonl_path), mime_type='application/json')
        print(f"  Uploaded batch input file: {batch_input_file.name}")
        
        # Create Batch Job
        try:
            job = self.client.batches.create(
                model=self.model,
                src=batch_input_file.name,
                config={'display_name': 'outfit_extraction_batch'}
            )
            print(f"✓ Job created: {job.name}")
            return job.name
        except Exception as e:
            print(f"✗ Failed to create batch job: {e}")
            raise

    def wait_for_job(self, job_name: str):
        """Wait for job completion"""
        print("\nWaiting for job completion...")
        
        while True:
            job = self.client.batches.get(name=job_name)
            state = job.state
            
            print(f"  Status: {state}")
            
            if state == "JOB_STATE_SUCCEEDED":
                return job
            elif str(state) in ["JOB_STATE_FAILED", "JOB_STATE_CANCELLED", "FAILED", "CANCELLED"]:
                print(f"✗ Job failed: {job.error}")
                return None
                
            time.sleep(30)

def main():
    print("NANO BANANA BATCH EXTRACTOR (SDK)")
    
    extractor = NanaBananaBatchExtractor()
    
    input_dir = Path(__file__).parent.resolve()
    print(f"Input directory: {input_dir}")
    
    # Get images
    extensions = {'.jpg', '.jpeg', '.png'}
    images = [f for f in input_dir.iterdir() if f.suffix.lower() in extensions]
    print(f"Found {len(images)} images.")
    
    if not images:
        print("No images found.")
        return

    # Create batch file
    jsonl_path = (input_dir / "batch_requests.jsonl").resolve()
    print(f"JSONL path: {jsonl_path}")
    
    jsonl_path_str = extractor.create_batch_requests(images, jsonl_path)
    print(f"Created JSONL at: {jsonl_path_str}")
    
    # Submit job
    try:
        job_name = extractor.submit_batch_job(jsonl_path)
        
        if job_name:
            extractor.wait_for_job(job_name)
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")

if __name__ == "__main__":
    main()
