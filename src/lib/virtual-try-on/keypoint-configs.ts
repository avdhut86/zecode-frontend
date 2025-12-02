/**
 * Overlay Keypoint Configurations
 * 
 * Define reference keypoints for product overlay images.
 * These can be used to create custom keypoint configs per product,
 * or you can use the auto-generated defaults.
 */

import type { GarmentOverlayConfig, GarmentType, Point2D } from '@/types/virtual-try-on';
import { POSE_LANDMARKS, generateDefaultKeypoints } from '@/types/virtual-try-on';

/**
 * Create overlay config for a product with custom keypoints
 */
export function createOverlayConfig(
  productId: string | number,
  garmentType: GarmentType,
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
  customKeypoints?: {
    leftShoulder?: Point2D;
    rightShoulder?: Point2D;
    leftHip?: Point2D;
    rightHip?: Point2D;
    leftKnee?: Point2D;
    rightKnee?: Point2D;
    leftAnkle?: Point2D;
    rightAnkle?: Point2D;
  },
  options?: {
    scaleAdjustment?: number;
    xOffset?: number;
    yOffset?: number;
  }
): GarmentOverlayConfig {
  // Start with default keypoints
  const defaultKeypoints = generateDefaultKeypoints(garmentType, imageWidth, imageHeight);
  
  // Override with custom positions if provided
  if (customKeypoints) {
    for (const keypoint of defaultKeypoints) {
      const customPos = customKeypoints[keypoint.id as keyof typeof customKeypoints];
      if (customPos) {
        keypoint.position = customPos;
      }
    }
  }

  return {
    productId,
    garmentType,
    imageUrl,
    imageWidth,
    imageHeight,
    keypoints: defaultKeypoints,
    scaleAdjustment: options?.scaleAdjustment ?? 1.15,
    xOffset: options?.xOffset ?? 0,
    yOffset: options?.yOffset ?? 0,
  };
}

/**
 * Example keypoint configurations for different garment styles
 * These demonstrate how to position keypoints for various garment types
 */

// Standard T-Shirt (centered, shoulders near top)
export const TSHIRT_KEYPOINTS = {
  leftShoulder: { x: 0.12, y: 0.08 },  // Normalized [0-1]
  rightShoulder: { x: 0.88, y: 0.08 },
  leftHip: { x: 0.18, y: 0.95 },
  rightHip: { x: 0.82, y: 0.95 },
};

// Button-up Shirt (slightly wider shoulders)
export const SHIRT_KEYPOINTS = {
  leftShoulder: { x: 0.10, y: 0.06 },
  rightShoulder: { x: 0.90, y: 0.06 },
  leftHip: { x: 0.20, y: 0.95 },
  rightHip: { x: 0.80, y: 0.95 },
};

// Hoodie/Sweater (wider, more relaxed fit)
export const HOODIE_KEYPOINTS = {
  leftShoulder: { x: 0.08, y: 0.12 },
  rightShoulder: { x: 0.92, y: 0.12 },
  leftHip: { x: 0.15, y: 0.92 },
  rightHip: { x: 0.85, y: 0.92 },
};

// Jacket/Coat (structured shoulders)
export const JACKET_KEYPOINTS = {
  leftShoulder: { x: 0.05, y: 0.05 },
  rightShoulder: { x: 0.95, y: 0.05 },
  leftHip: { x: 0.12, y: 0.90 },
  rightHip: { x: 0.88, y: 0.90 },
};

// Dress (full length from shoulders to ankle)
export const DRESS_KEYPOINTS = {
  leftShoulder: { x: 0.20, y: 0.05 },
  rightShoulder: { x: 0.80, y: 0.05 },
  leftHip: { x: 0.25, y: 0.35 },
  rightHip: { x: 0.75, y: 0.35 },
  leftKnee: { x: 0.30, y: 0.65 },
  rightKnee: { x: 0.70, y: 0.65 },
  leftAnkle: { x: 0.32, y: 0.95 },
  rightAnkle: { x: 0.68, y: 0.95 },
};

// Mini/Short Dress (shoulders to knee)
export const SHORT_DRESS_KEYPOINTS = {
  leftShoulder: { x: 0.22, y: 0.05 },
  rightShoulder: { x: 0.78, y: 0.05 },
  leftHip: { x: 0.25, y: 0.40 },
  rightHip: { x: 0.75, y: 0.40 },
  leftKnee: { x: 0.28, y: 0.95 },
  rightKnee: { x: 0.72, y: 0.95 },
};

// Pants/Trousers (hip to ankle)
export const PANTS_KEYPOINTS = {
  leftHip: { x: 0.15, y: 0.05 },
  rightHip: { x: 0.85, y: 0.05 },
  leftKnee: { x: 0.20, y: 0.50 },
  rightKnee: { x: 0.80, y: 0.50 },
  leftAnkle: { x: 0.22, y: 0.95 },
  rightAnkle: { x: 0.78, y: 0.95 },
};

// Jeans (slightly more fitted)
export const JEANS_KEYPOINTS = {
  leftHip: { x: 0.18, y: 0.05 },
  rightHip: { x: 0.82, y: 0.05 },
  leftKnee: { x: 0.22, y: 0.50 },
  rightKnee: { x: 0.78, y: 0.50 },
  leftAnkle: { x: 0.24, y: 0.95 },
  rightAnkle: { x: 0.76, y: 0.95 },
};

// Shorts (hip to knee)
export const SHORTS_KEYPOINTS = {
  leftHip: { x: 0.15, y: 0.05 },
  rightHip: { x: 0.85, y: 0.05 },
  leftKnee: { x: 0.20, y: 0.95 },
  rightKnee: { x: 0.80, y: 0.95 },
};

// Skirt (hip to knee or below)
export const SKIRT_KEYPOINTS = {
  leftHip: { x: 0.20, y: 0.05 },
  rightHip: { x: 0.80, y: 0.05 },
  leftKnee: { x: 0.25, y: 0.90 },
  rightKnee: { x: 0.75, y: 0.90 },
};

// Tank Top (narrower straps)
export const TANK_TOP_KEYPOINTS = {
  leftShoulder: { x: 0.25, y: 0.05 },
  rightShoulder: { x: 0.75, y: 0.05 },
  leftHip: { x: 0.20, y: 0.95 },
  rightHip: { x: 0.80, y: 0.95 },
};

/**
 * Get recommended scale adjustment based on garment type
 */
export function getRecommendedScale(garmentType: GarmentType): number {
  const scales: Record<GarmentType, number> = {
    'top': 1.15,
    'outerwear': 1.25, // Larger to cover arms
    'dress': 1.10,
    'bottom': 1.10,
    'full-body': 1.05,
  };
  return scales[garmentType] ?? 1.15;
}

/**
 * Convert normalized keypoints (0-1) to pixel coordinates
 */
export function normalizedToPixel(
  normalized: { leftShoulder: Point2D; rightShoulder: Point2D; leftHip: Point2D; rightHip: Point2D },
  imageWidth: number,
  imageHeight: number
): { leftShoulder: Point2D; rightShoulder: Point2D; leftHip: Point2D; rightHip: Point2D } {
  return {
    leftShoulder: {
      x: normalized.leftShoulder.x * imageWidth,
      y: normalized.leftShoulder.y * imageHeight,
    },
    rightShoulder: {
      x: normalized.rightShoulder.x * imageWidth,
      y: normalized.rightShoulder.y * imageHeight,
    },
    leftHip: {
      x: normalized.leftHip.x * imageWidth,
      y: normalized.leftHip.y * imageHeight,
    },
    rightHip: {
      x: normalized.rightHip.x * imageWidth,
      y: normalized.rightHip.y * imageHeight,
    },
  };
}

/**
 * Convert normalized keypoints (0-1) to pixel coordinates - extended version for all body parts
 */
export function normalizedToPixelExtended(
  normalized: Record<string, Point2D>,
  imageWidth: number,
  imageHeight: number
): Record<string, Point2D> {
  const result: Record<string, Point2D> = {};
  
  for (const [key, value] of Object.entries(normalized)) {
    result[key] = {
      x: value.x * imageWidth,
      y: value.y * imageHeight,
    };
  }
  
  return result;
}

/**
 * Example: Create config for a specific product
 */
export function createProductOverlayConfig(
  product: {
    id: string | number;
    name: string;
    category: string;
    image: string;
    imageWidth?: number;
    imageHeight?: number;
  }
): GarmentOverlayConfig | null {
  // Detect garment type from product name/category
  const name = product.name.toLowerCase();
  const category = product.category.toLowerCase();
  
  let garmentType: GarmentType = 'top';
  let keypointTemplate: Record<string, Point2D> = TSHIRT_KEYPOINTS;
  
  // Check for bottoms first
  if (name.includes('pant') || name.includes('trouser') || name.includes('chino') || name.includes('slack')) {
    garmentType = 'bottom';
    keypointTemplate = PANTS_KEYPOINTS;
  } else if (name.includes('jean') || name.includes('denim')) {
    garmentType = 'bottom';
    keypointTemplate = JEANS_KEYPOINTS;
  } else if (name.includes('short') && !name.includes('shirt')) {
    garmentType = 'bottom';
    keypointTemplate = SHORTS_KEYPOINTS;
  } else if (name.includes('skirt')) {
    garmentType = 'bottom';
    keypointTemplate = SKIRT_KEYPOINTS;
  } else if (category.includes('bottom') || category.includes('pant') || category.includes('jean')) {
    garmentType = 'bottom';
    keypointTemplate = PANTS_KEYPOINTS;
  }
  // Check for dresses
  else if (name.includes('dress') || name.includes('gown') || name.includes('romper') || name.includes('jumpsuit')) {
    garmentType = name.includes('mini') || name.includes('short') ? 'dress' : 'dress';
    keypointTemplate = name.includes('mini') || name.includes('short') ? SHORT_DRESS_KEYPOINTS : DRESS_KEYPOINTS;
  } else if (category.includes('dress')) {
    garmentType = 'dress';
    keypointTemplate = DRESS_KEYPOINTS;
  }
  // Check for tops and outerwear
  else if (name.includes('hoodie') || name.includes('sweater') || name.includes('sweatshirt')) {
    garmentType = 'top';
    keypointTemplate = HOODIE_KEYPOINTS;
  } else if (name.includes('jacket') || name.includes('coat') || name.includes('blazer')) {
    garmentType = 'outerwear';
    keypointTemplate = JACKET_KEYPOINTS;
  } else if (name.includes('tank') || name.includes('sleeveless')) {
    garmentType = 'top';
    keypointTemplate = TANK_TOP_KEYPOINTS;
  } else if (name.includes('shirt') && !name.includes('t-shirt')) {
    garmentType = 'top';
    keypointTemplate = SHIRT_KEYPOINTS;
  }
  
  // Default dimensions if not provided
  const width = product.imageWidth || 500;
  const height = product.imageHeight || 700;
  
  // Convert normalized keypoints to pixels
  const pixelKeypoints = normalizedToPixelExtended(keypointTemplate, width, height);
  
  return createOverlayConfig(
    product.id,
    garmentType,
    product.image,
    width,
    height,
    pixelKeypoints,
    { scaleAdjustment: getRecommendedScale(garmentType) }
  );
}
