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
import { calculateSimpleTransform, drawWithSimpleTransform, removeBackground } from './simple-transform';

// Cached warped overlay for performance
let cachedWarpedOverlay: ImageData | null = null;
let cachedProcessedImage: HTMLCanvasElement | null = null;
let lastTransformHash: string = '';
let lastImageUrl: string = '';

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
  console.log('[VTO Overlay] renderOverlay called:', {
    overlayImageSize: `${overlayImage.width}x${overlayImage.height}`,
    canvasSize: `${canvasWidth}x${canvasHeight}`,
    garmentType: overlayConfig.garmentType,
    useOpenCV,
    isOpenCVReady: isOpenCVReady(),
    landmarkCount: landmarks.length
  });

  // Convert landmarks to canvas coordinates for keypoint matching
  const bodyLandmarks = landmarks.map(lm => ({
    x: lm.x * canvasWidth,
    y: lm.y * canvasHeight,
  }));

  // Log key body landmarks
  const leftShoulder = bodyLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = bodyLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  console.log('[VTO Overlay] Key landmarks (canvas coords):', {
    leftShoulder: leftShoulder ? `(${leftShoulder.x.toFixed(0)}, ${leftShoulder.y.toFixed(0)})` : 'none',
    rightShoulder: rightShoulder ? `(${rightShoulder.x.toFixed(0)}, ${rightShoulder.y.toFixed(0)})` : 'none'
  });

  let success = false;

  // Try OpenCV first if requested and available
  if (useOpenCV && isOpenCVReady()) {
    console.log('[VTO Overlay] Attempting OpenCV warp...');
    success = renderWithOpenCV(
      ctx,
      overlayImage,
      overlayConfig,
      bodyLandmarks,
      canvasWidth,
      canvasHeight
    );
    console.log('[VTO Overlay] OpenCV result:', success);
  }

  // Fallback to simple transform if OpenCV failed or not available
  if (!success) {
    console.log('[VTO Overlay] Using simple transform...');
    success = renderWithSimpleTransform(
      ctx,
      overlayImage,
      landmarks,
      canvasWidth,
      canvasHeight,
      overlayConfig.scaleAdjustment,
      overlayConfig.garmentType
    );
    console.log('[VTO Overlay] Simple transform result:', success);
  }

  return success;
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

  console.log('[VTO OpenCV] Config keypoints:', config.keypoints.map(kp => ({
    id: kp.id,
    position: `(${kp.position.x.toFixed(0)}, ${kp.position.y.toFixed(0)})`,
    linkedLandmark: kp.linkedLandmark
  })));

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

  console.log('[VTO OpenCV] Mapping points:', {
    srcPoints: srcPoints.map(p => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`),
    dstPoints: dstPoints.map(p => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`)
  });

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

  // Process image (remove background) if not already cached
  const imageUrl = overlayImage.src || 'canvas';
  if (!cachedProcessedImage || lastImageUrl !== imageUrl) {
    console.log('[VTO OpenCV] Removing background from garment image...');
    cachedProcessedImage = removeBackground(overlayImage, 35);
    lastImageUrl = imageUrl;
  }

  // Only recompute warp if transform changed significantly
  if (transformHash !== lastTransformHash || !cachedWarpedOverlay) {
    // Warp the processed overlay image (with background removed)
    const warpedOverlay = warpPerspective(
      cachedProcessedImage,
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

  // Create a temporary canvas to hold the warped overlay
  // This is needed because putImageData doesn't support alpha blending
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    console.warn('[VTO] Failed to create temp canvas context');
    return false;
  }

  // Put the warped image data on the temp canvas
  tempCtx.putImageData(cachedWarpedOverlay, 0, 0);

  // Now draw the temp canvas onto the main canvas with proper alpha compositing
  // This preserves the original photo and only overlays non-transparent pixels
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.globalCompositeOperation = 'source-over'; // Normal blending
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  console.log('[VTO OpenCV] Overlay composited onto canvas');

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
  cachedProcessedImage = null;
  lastTransformHash = '';
  lastImageUrl = '';
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
  // Lowered threshold - MediaPipe often reports lower visibility even for visible landmarks
  const minVisibility = 0.15;
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Log visibility scores for debugging
  console.log('[VTO Visibility] Torso check:', {
    leftShoulder: leftShoulder?.visibility?.toFixed(3),
    rightShoulder: rightShoulder?.visibility?.toFixed(3),
    leftHip: leftHip?.visibility?.toFixed(3),
    rightHip: rightHip?.visibility?.toFixed(3),
    threshold: minVisibility,
    garmentType
  });

  // For bottoms, we primarily need hips visible (shoulders optional)
  if (garmentType === 'bottom') {
    const hipsVisible = (
      (leftHip?.visibility ?? 0) >= minVisibility &&
      (rightHip?.visibility ?? 0) >= minVisibility
    );
    console.log('[VTO Visibility] Bottoms hips visible:', hipsVisible);
    return hipsVisible;
  }

  // For tops, only need shoulders visible (hips optional for closer selfies)
  const shouldersVisible = (
    (leftShoulder?.visibility ?? 0) >= minVisibility &&
    (rightShoulder?.visibility ?? 0) >= minVisibility
  );
  
  // If shoulders are visible, that's enough for tops
  if (shouldersVisible) {
    console.log('[VTO Visibility] Shoulders visible, allowing torso');
    return true;
  }

  // Fallback: need at least one shoulder and one hip visible
  const partialVisible = (
    ((leftShoulder?.visibility ?? 0) >= minVisibility || (rightShoulder?.visibility ?? 0) >= minVisibility) &&
    ((leftHip?.visibility ?? 0) >= minVisibility || (rightHip?.visibility ?? 0) >= minVisibility)
  );
  console.log('[VTO Visibility] Partial torso visible:', partialVisible);
  return partialVisible;
}

/**
 * Check if full body is visible (for dresses and full-body garments)
 */
export function hasVisibleFullBody(landmarks: PoseLandmark[]): boolean {
  // Lowered threshold for better detection
  const minVisibility = 0.15;
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  console.log('[VTO Visibility] Full body check:', {
    leftShoulder: leftShoulder?.visibility?.toFixed(3),
    rightShoulder: rightShoulder?.visibility?.toFixed(3),
    leftHip: leftHip?.visibility?.toFixed(3),
    rightHip: rightHip?.visibility?.toFixed(3),
    leftKnee: leftKnee?.visibility?.toFixed(3),
    rightKnee: rightKnee?.visibility?.toFixed(3),
    threshold: minVisibility
  });

  // Need at least one shoulder and one hip visible
  const hasShoulder = (leftShoulder?.visibility ?? 0) >= minVisibility || (rightShoulder?.visibility ?? 0) >= minVisibility;
  const hasHip = (leftHip?.visibility ?? 0) >= minVisibility || (rightHip?.visibility ?? 0) >= minVisibility;
  
  // Knees are optional for selfie mode (person might be cropped)
  const visible = hasShoulder && hasHip;
  console.log('[VTO Visibility] Full body visible:', visible, { hasShoulder, hasHip });
  return visible;
}

/**
 * Check if lower body is visible (for bottoms)
 */
export function hasVisibleLowerBody(landmarks: PoseLandmark[]): boolean {
  // Lowered threshold for better detection
  const minVisibility = 0.15;
  
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  console.log('[VTO Visibility] Lower body check:', {
    leftHip: leftHip?.visibility?.toFixed(3),
    rightHip: rightHip?.visibility?.toFixed(3),
    leftKnee: leftKnee?.visibility?.toFixed(3),
    rightKnee: rightKnee?.visibility?.toFixed(3),
    threshold: minVisibility
  });

  // Need at least one hip visible (knees optional for closer selfies)
  const hasHip = (leftHip?.visibility ?? 0) >= minVisibility || (rightHip?.visibility ?? 0) >= minVisibility;
  console.log('[VTO Visibility] Lower body visible:', hasHip);
  return hasHip;
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
