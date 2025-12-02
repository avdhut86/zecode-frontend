/**
 * Overlay Renderer
 * 
 * Composites warped garment overlay onto video/image canvas.
 * Handles both OpenCV-based and simple transform rendering.
 */

import type { 
  PoseLandmark, 
  Point2D, 
  GarmentOverlayConfig,
  GarmentType,
  HomographyMatrix 
} from '@/types/virtual-try-on';
import { POSE_LANDMARKS } from '@/types/virtual-try-on';
import { isOpenCVReady, computePerspectiveTransform, warpPerspective } from './opencv-transform';
import { calculateSimpleTransform, drawWithSimpleTransform } from './simple-transform';

// Cached warped overlay for performance
let cachedWarpedOverlay: ImageData | null = null;
let lastTransformHash: string = '';

/**
 * Main render function for overlay
 * Automatically chooses between OpenCV warp and simple transform
 */
export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  overlayImage: HTMLImageElement,
  overlayConfig: GarmentOverlayConfig,
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  useOpenCV: boolean = true
): boolean {
  // Convert landmarks to canvas coordinates for keypoint matching
  const bodyLandmarks = landmarks.map(lm => ({
    x: lm.x * canvasWidth,
    y: lm.y * canvasHeight,
  }));

  if (useOpenCV && isOpenCVReady()) {
    return renderWithOpenCV(
      ctx,
      overlayImage,
      overlayConfig,
      bodyLandmarks,
      canvasWidth,
      canvasHeight
    );
  } else {
    return renderWithSimpleTransform(
      ctx,
      overlayImage,
      landmarks,
      canvasWidth,
      canvasHeight,
      overlayConfig.scaleAdjustment,
      overlayConfig.garmentType
    );
  }
}

/**
 * Render overlay using OpenCV perspective warp
 */
function renderWithOpenCV(
  ctx: CanvasRenderingContext2D,
  overlayImage: HTMLImageElement,
  config: GarmentOverlayConfig,
  bodyLandmarks: Point2D[],
  canvasWidth: number,
  canvasHeight: number
): boolean {
  // Get source points from overlay keypoints
  const srcPoints: Point2D[] = [];
  const dstPoints: Point2D[] = [];

  for (const keypoint of config.keypoints) {
    const bodyPoint = bodyLandmarks[keypoint.linkedLandmark];
    if (bodyPoint) {
      srcPoints.push(keypoint.position);
      // Apply any offsets from config
      dstPoints.push({
        x: bodyPoint.x + (config.xOffset || 0),
        y: bodyPoint.y + (config.yOffset || 0),
      });
    }
  }

  if (srcPoints.length < 4 || dstPoints.length < 4) {
    console.warn('[VTO] Not enough keypoints for perspective transform');
    return false;
  }

  // Compute transform hash to check if we need to recompute
  const transformHash = JSON.stringify({ srcPoints, dstPoints });
  
  // Compute perspective transform
  const transformResult = computePerspectiveTransform(srcPoints, dstPoints);
  
  if (!transformResult.success || !transformResult.matrix) {
    console.warn('[VTO] Failed to compute transform');
    return false;
  }

  // Only recompute warp if transform changed significantly
  if (transformHash !== lastTransformHash || !cachedWarpedOverlay) {
    // Warp the overlay image
    const warpedOverlay = warpPerspective(
      overlayImage,
      canvasWidth,
      canvasHeight,
      transformResult.matrix as HomographyMatrix
    );

    if (warpedOverlay) {
      cachedWarpedOverlay = warpedOverlay;
      lastTransformHash = transformHash;
    }
  }

  if (!cachedWarpedOverlay) {
    return false;
  }

  // Draw the warped overlay with alpha blending
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.putImageData(cachedWarpedOverlay, 0, 0);
  ctx.restore();

  return true;
}

/**
 * Render overlay using simple canvas transforms (fallback)
 */
function renderWithSimpleTransform(
  ctx: CanvasRenderingContext2D,
  overlayImage: HTMLImageElement,
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  scaleAdjustment?: number,
  garmentType?: GarmentType
): boolean {
  const transform = calculateSimpleTransform(
    landmarks,
    overlayImage.width,
    overlayImage.height,
    canvasWidth,
    canvasHeight,
    garmentType || 'top'
  );

  if (!transform) {
    return false;
  }

  // Apply scale adjustment
  if (scaleAdjustment) {
    transform.scale *= scaleAdjustment;
  }

  ctx.save();
  ctx.globalAlpha = 0.95;
  drawWithSimpleTransform(ctx, overlayImage, transform);
  ctx.restore();

  return true;
}

/**
 * Clear overlay cache (call when switching garments)
 */
export function clearOverlayCache(): void {
  cachedWarpedOverlay = null;
  lastTransformHash = '';
}

/**
 * Create a composite canvas with video frame and overlay
 */
export function createComposite(
  videoFrame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
  overlayImage: HTMLImageElement,
  overlayConfig: GarmentOverlayConfig,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  useOpenCV: boolean = true
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Draw video/image frame
  ctx.drawImage(videoFrame, 0, 0, width, height);

  // Render overlay
  renderOverlay(ctx, overlayImage, overlayConfig, landmarks, width, height, useOpenCV);

  return canvas;
}

/**
 * Preload and prepare overlay image
 */
export function loadOverlayImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load overlay image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Check if landmarks have sufficient visibility for rendering
 */
export function hasVisibleTorso(landmarks: PoseLandmark[], garmentType?: GarmentType): boolean {
  const minVisibility = 0.5;
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // For bottoms, we primarily need hips visible (shoulders optional)
  if (garmentType === 'bottom') {
    return (
      (leftHip?.visibility ?? 0) >= minVisibility &&
      (rightHip?.visibility ?? 0) >= minVisibility
    );
  }

  // For tops and default, need both shoulders and hips
  return (
    (leftShoulder?.visibility ?? 0) >= minVisibility &&
    (rightShoulder?.visibility ?? 0) >= minVisibility &&
    (leftHip?.visibility ?? 0) >= minVisibility &&
    (rightHip?.visibility ?? 0) >= minVisibility
  );
}

/**
 * Check if full body is visible (for dresses and full-body garments)
 */
export function hasVisibleFullBody(landmarks: PoseLandmark[]): boolean {
  const minVisibility = 0.4;
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  // Need shoulders, hips, and at least one knee for full body
  return (
    (leftShoulder?.visibility ?? 0) >= minVisibility &&
    (rightShoulder?.visibility ?? 0) >= minVisibility &&
    (leftHip?.visibility ?? 0) >= minVisibility &&
    (rightHip?.visibility ?? 0) >= minVisibility &&
    ((leftKnee?.visibility ?? 0) >= minVisibility || (rightKnee?.visibility ?? 0) >= minVisibility)
  );
}

/**
 * Check if lower body is visible (for bottoms)
 */
export function hasVisibleLowerBody(landmarks: PoseLandmark[]): boolean {
  const minVisibility = 0.4;
  
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  // Need hips and at least one knee
  return (
    (leftHip?.visibility ?? 0) >= minVisibility &&
    (rightHip?.visibility ?? 0) >= minVisibility &&
    ((leftKnee?.visibility ?? 0) >= minVisibility || (rightKnee?.visibility ?? 0) >= minVisibility)
  );
}

/**
 * Smoothing buffer for landmark positions to reduce jitter
 */
class LandmarkSmoother {
  private buffer: PoseLandmark[][] = [];
  private bufferSize: number;

  constructor(bufferSize: number = 5) {
    this.bufferSize = bufferSize;
  }

  addFrame(landmarks: PoseLandmark[]): PoseLandmark[] {
    this.buffer.push([...landmarks]);
    
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    // Average all frames in buffer
    const smoothed: PoseLandmark[] = [];
    
    for (let i = 0; i < landmarks.length; i++) {
      let sumX = 0, sumY = 0, sumZ = 0, sumVis = 0;
      let count = 0;

      for (const frame of this.buffer) {
        if (frame[i]) {
          sumX += frame[i].x;
          sumY += frame[i].y;
          sumZ += frame[i].z;
          sumVis += frame[i].visibility ?? 1;
          count++;
        }
      }

      if (count > 0) {
        smoothed.push({
          x: sumX / count,
          y: sumY / count,
          z: sumZ / count,
          visibility: sumVis / count,
        });
      } else {
        smoothed.push(landmarks[i]);
      }
    }

    return smoothed;
  }

  reset(): void {
    this.buffer = [];
  }
}

// Export singleton smoother
export const landmarkSmoother = new LandmarkSmoother(5);
