/**
 * Gemini VTO Service
 * 
 * Client-side service to interact with the Gemini VTO API
 */

export interface GeminiVTORequest {
  userImage: string;    // Base64 or data URL
  garmentImage: string; // Base64 or data URL
  garmentType?: string; // top, bottom, dress, full-body, outerwear, etc.
  garmentDescription?: string;
}

export interface GeminiVTOResponse {
  success: boolean;
  image?: string;       // Generated try-on image as data URL
  text?: string;        // Any text response from Gemini
  error?: string;
  details?: string;
}

/**
 * Call the Gemini VTO API to generate a virtual try-on image
 */
export async function generateGeminiVTO(request: GeminiVTORequest): Promise<GeminiVTOResponse> {
  try {
    console.log('[GeminiVTO] Sending request to API...');
    
    const response = await fetch('/api/vto/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[GeminiVTO] API error:', data);
      return {
        success: false,
        error: data.error || `API error: ${response.status}`,
        details: data.details,
        text: data.text,
      };
    }

    console.log('[GeminiVTO] Success! Got generated image');
    return {
      success: true,
      image: data.image,
      text: data.text,
    };
  } catch (error) {
    console.error('[GeminiVTO] Fetch error:', error);
    return {
      success: false,
      error: 'Network error',
      details: String(error),
    };
  }
}

/**
 * Convert an image URL to base64 data URL
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    // If already a data URL, return as-is
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[GeminiVTO] Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Resize image to reduce payload size while maintaining quality
 */
export async function resizeImageForAPI(
  dataUrl: string, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedDataUrl);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
