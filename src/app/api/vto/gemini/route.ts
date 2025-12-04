/**
 * Virtual Try-On API Route using Gemini Image Generation
 * 
 * This endpoint takes a user photo and a garment image, then uses
 * Gemini's image generation capabilities to create a realistic
 * virtual try-on result.
 * 
 * Using: gemini-2.0-flash-exp-image-generation (has free tier quota)
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
// Use gemini-2.0-flash-exp-image-generation which has free tier quota
const GEMINI_MODEL = process.env.GEMINI_VTO_MODEL || 'gemini-2.0-flash-exp-image-generation';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface VTORequest {
  userImage: string;    // Base64 encoded user photo
  garmentImage: string; // Base64 encoded garment image
  garmentType?: 'top' | 'bottom' | 'dress' | 'full-body';
  garmentDescription?: string; // Optional description of the garment
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Set GOOGLE_GEMINI_API_KEY in environment.' },
        { status: 500 }
      );
    }

    const body: VTORequest = await request.json();
    const { userImage, garmentImage, garmentType = 'top', garmentDescription } = body;

    if (!userImage || !garmentImage) {
      return NextResponse.json(
        { error: 'Both userImage and garmentImage are required' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const cleanUserImage = userImage.replace(/^data:image\/\w+;base64,/, '');
    const cleanGarmentImage = garmentImage.replace(/^data:image\/\w+;base64,/, '');

    // Construct the VTO prompt - optimized for identity preservation
    const garmentTypeDescription = {
      'top': 'shirt/top/blouse',
      'bottom': 'pants/jeans/skirt',
      'dress': 'dress',
      'full-body': 'outfit'
    }[garmentType];

    const clothingToReplace = garmentType === 'top' 
      ? 'upper body garment (shirt/top/jacket)' 
      : garmentType === 'bottom' 
        ? 'lower body garment (pants/skirt)' 
        : 'clothing';

    const prompt = `VIRTUAL TRY-ON TASK: Edit the first image to show the person wearing the garment from the second image.

IMAGE 1 (Person Photo): This is the BASE image. You MUST preserve:
- The EXACT same face, facial features, expression, and identity
- The EXACT same body pose, position, and proportions  
- The EXACT same background, environment, and lighting
- ALL accessories (jewelry, watch, glasses, etc.)
- Hair style and color exactly as shown
- Any other clothing items NOT being replaced (e.g., if replacing top, keep pants/skirt)

IMAGE 2 (Garment): A ${garmentTypeDescription}${garmentDescription ? ` - ${garmentDescription}` : ''}

TASK: Replace ONLY the person's ${clothingToReplace} with the garment from Image 2.

CRITICAL RULES:
1. DO NOT change the person's face or facial features AT ALL
2. DO NOT change the background AT ALL  
3. DO NOT change the body pose or proportions
4. DO NOT change any clothing items that are NOT the ${clothingToReplace}
5. The garment should naturally fit the person's body shape
6. Match the lighting/shadows of the original photo
7. Output should look like the original photo with just the ${clothingToReplace} swapped

Generate the edited image now.`;

    console.log(`[VTO Gemini] Using model: ${GEMINI_MODEL}`);
    console.log('[VTO Gemini] Sending request to Gemini API...');

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: cleanUserImage
                }
              },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: cleanGarmentImage
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VTO Gemini] API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[VTO Gemini] Response received');

    // Extract the generated image from the response
    let generatedImage: string | null = null;
    let responseText: string | null = null;

    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          // Found generated image
          generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          responseText = part.text;
        }
      }
    }

    if (!generatedImage) {
      console.error('[VTO Gemini] No image in response:', JSON.stringify(result, null, 2));
      return NextResponse.json(
        { 
          error: 'No image generated', 
          text: responseText,
          details: 'Gemini did not return an image. This may be due to content policy or the model being unable to process the request.'
        },
        { status: 422 }
      );
    }

    console.log('[VTO Gemini] Successfully generated try-on image');

    return NextResponse.json({
      success: true,
      image: generatedImage,
      text: responseText
    });

  } catch (error) {
    console.error('[VTO Gemini] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
