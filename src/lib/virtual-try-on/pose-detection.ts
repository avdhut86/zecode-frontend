/**
 * MediaPipe Pose Detection Utilities
 * 
 * Handles initialization and pose detection using MediaPipe Pose Landmarker.
 * Works in browser with webcam or uploaded images.
 */

import type { PoseLandmark, PoseDetectionResult, Point2D } from '@/types/virtual-try-on';
import { POSE_LANDMARKS } from '@/types/virtual-try-on';

// MediaPipe types (loaded dynamically)
type PoseLandmarker = any;
type FilesetResolver = any;

let poseLandmarker: PoseLandmarker | null = null;
let mediaPipeLoaded = false;

/**
 * Initialize MediaPipe Pose Landmarker
 * Loads the WASM files and model from local public folder or CDN
 */
export async function initializeMediaPipe(): Promise<boolean> {
  if (mediaPipeLoaded && poseLandmarker) {
    return true;
  }

  try {
    console.log('[VTO] Loading MediaPipe tasks-vision...');
    
    // Dynamically import MediaPipe tasks-vision
    const vision = await import('@mediapipe/tasks-vision');
    const { PoseLandmarker, FilesetResolver } = vision;

    console.log('[VTO] Loading WASM files...');
    
    // Try local WASM files first (copied to public/mediapipe/wasm), then CDN fallbacks
    const wasmSources = [
      '/mediapipe/wasm',  // Local - fastest and most reliable
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
      'https://unpkg.com/@mediapipe/tasks-vision@0.10.14/wasm',
    ];
    
    let filesetResolver = null;
    let lastError: any = null;
    
    for (const wasmPath of wasmSources) {
      try {
        console.log(`[VTO] Trying WASM from: ${wasmPath}`);
        filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);
        console.log(`[VTO] WASM loaded successfully from: ${wasmPath}`);
        break;
      } catch (err) {
        console.warn(`[VTO] Failed to load WASM from ${wasmPath}:`, err instanceof Error ? err.message : 'Unknown error');
        lastError = err;
      }
    }
    
    if (!filesetResolver) {
      throw lastError || new Error('All WASM sources failed');
    }

    console.log('[VTO] Creating PoseLandmarker...');
    
    // Use local model first, then CDN fallback
    const modelPath = '/mediapipe/models/pose_landmarker_lite.task';
    const modelPathFallback = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
    
    // Try GPU first, fallback to CPU
    const createPoseLandmarker = async (modelUrl: string, delegate: 'GPU' | 'CPU') => {
      return await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: modelUrl,
          delegate,
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
    };
    
    // Try local model with GPU
    try {
      console.log('[VTO] Trying local model with GPU...');
      poseLandmarker = await createPoseLandmarker(modelPath, 'GPU');
      console.log('[VTO] MediaPipe initialized with local model + GPU');
    } catch (localGpuError) {
      console.warn('[VTO] Local GPU failed:', localGpuError instanceof Error ? localGpuError.message : 'Unknown');
      
      // Try local model with CPU
      try {
        console.log('[VTO] Trying local model with CPU...');
        poseLandmarker = await createPoseLandmarker(modelPath, 'CPU');
        console.log('[VTO] MediaPipe initialized with local model + CPU');
      } catch (localCpuError) {
        console.warn('[VTO] Local CPU failed:', localCpuError instanceof Error ? localCpuError.message : 'Unknown');
        
        // Try CDN model with GPU
        try {
          console.log('[VTO] Trying CDN model with GPU...');
          poseLandmarker = await createPoseLandmarker(modelPathFallback, 'GPU');
          console.log('[VTO] MediaPipe initialized with CDN model + GPU');
        } catch (cdnGpuError) {
          console.warn('[VTO] CDN GPU failed:', cdnGpuError instanceof Error ? cdnGpuError.message : 'Unknown');
          
          // Final fallback: CDN model with CPU
          console.log('[VTO] Trying CDN model with CPU...');
          poseLandmarker = await createPoseLandmarker(modelPathFallback, 'CPU');
          console.log('[VTO] MediaPipe initialized with CDN model + CPU');
        }
      }
    }

    mediaPipeLoaded = true;
    console.log('[VTO] MediaPipe Pose Landmarker ready');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error instanceof Event ? 'Network/WASM loading failed' : String(error));
    console.error('[VTO] Failed to initialize MediaPipe:', errorMessage);
    return false;
  }
}

/**
 * Check if MediaPipe is ready
 */
export function isMediaPipeReady(): boolean {
  return mediaPipeLoaded && poseLandmarker !== null;
}

/**
 * Detect pose from video frame
 * @param videoElement - Video element with webcam feed
 * @param timestamp - Current timestamp in milliseconds
 */
export function detectPoseFromVideo(
  videoElement: HTMLVideoElement,
  timestamp: number
): PoseDetectionResult | null {
  if (!poseLandmarker || !mediaPipeLoaded) {
    console.warn('[VTO] MediaPipe not initialized');
    return null;
  }

  try {
    const results = poseLandmarker.detectForVideo(videoElement, timestamp);
    
    if (!results.landmarks || results.landmarks.length === 0) {
      return null;
    }

    // Convert MediaPipe format to our format
    const landmarks: PoseLandmark[] = results.landmarks[0].map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1,
    }));

    const worldLandmarks: PoseLandmark[] | undefined = results.worldLandmarks?.[0]?.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1,
    }));

    return {
      landmarks,
      worldLandmarks,
    };
  } catch (error) {
    console.error('[VTO] Pose detection error:', error);
    return null;
  }
}

// Store image mode landmarker separately
let imagePoseLandmarker: PoseLandmarker | null = null;
let imageModelLoading = false;

/**
 * Detect pose from a single image
 * First tries to use VIDEO-mode landmarker with a canvas trick,
 * falls back to creating a dedicated IMAGE-mode landmarker
 * @param imageElement - Image element to analyze
 */
export async function detectPoseFromImage(
  imageElement: HTMLImageElement
): Promise<PoseDetectionResult | null> {
  console.log('[VTO] detectPoseFromImage called, image size:', imageElement.width, 'x', imageElement.height);
  
  // Method 1: Try using already-initialized VIDEO landmarker with canvas trick
  if (poseLandmarker && mediaPipeLoaded) {
    try {
      console.log('[VTO] Trying VIDEO-mode landmarker with canvas...');
      
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0);
        
        // Use detectForVideo with current timestamp
        const results = poseLandmarker.detectForVideo(canvas, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
          console.log('[VTO] Pose detected using VIDEO-mode landmarker!');
          const landmarks: PoseLandmark[] = results.landmarks[0].map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 1,
          }));
          return { landmarks };
        }
        console.log('[VTO] No pose found with VIDEO-mode, trying IMAGE-mode...');
      }
    } catch (err) {
      console.warn('[VTO] VIDEO-mode detection failed:', err);
    }
  }

  // Method 2: Create/use dedicated IMAGE-mode landmarker
  try {
    // Avoid concurrent initialization
    if (imageModelLoading) {
      console.log('[VTO] Image model already loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return detectPoseFromImage(imageElement);
    }

    if (!imagePoseLandmarker) {
      imageModelLoading = true;
      console.log('[VTO] Creating IMAGE-mode landmarker...');
      
      const vision = await import('@mediapipe/tasks-vision');
      const { PoseLandmarker, FilesetResolver } = vision;

      // Use local WASM files
      const wasmSources = [
        '/mediapipe/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
      ];
      
      let filesetResolver = null;
      for (const wasmPath of wasmSources) {
        try {
          console.log('[VTO] Trying WASM from:', wasmPath);
          filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);
          console.log('[VTO] Image WASM loaded from:', wasmPath);
          break;
        } catch (err) {
          console.warn('[VTO] Image WASM failed:', wasmPath, err);
        }
      }
      
      if (!filesetResolver) {
        imageModelLoading = false;
        throw new Error('Failed to load WASM for image detection');
      }

      // Use local model
      const modelSources = [
        '/mediapipe/models/pose_landmarker_lite.task',
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      ];

      for (const modelPath of modelSources) {
        try {
          console.log('[VTO] Trying model from:', modelPath);
          imagePoseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU',
            },
            runningMode: 'IMAGE',
            numPoses: 1,
            minPoseDetectionConfidence: 0.3,
          });
          console.log('[VTO] Image model loaded from:', modelPath);
          break;
        } catch (err) {
          console.warn('[VTO] Image model failed:', modelPath, err);
        }
      }

      imageModelLoading = false;

      if (!imagePoseLandmarker) {
        throw new Error('Failed to load pose model for image detection');
      }
    }

    // Detect pose
    console.log('[VTO] Running IMAGE-mode detection...');
    const results = imagePoseLandmarker.detect(imageElement);

    if (!results.landmarks || results.landmarks.length === 0) {
      console.log('[VTO] No pose detected in image');
      return null;
    }

    console.log('[VTO] Pose detected in image!');
    const landmarks: PoseLandmark[] = results.landmarks[0].map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1,
    }));

    return { landmarks };
  } catch (error) {
    imageModelLoading = false;
    console.error('[VTO] Image pose detection error:', error);
    return null;
  }
}

/**
 * Convert normalized landmark coordinates to canvas pixel coordinates
 */
export function landmarkToCanvas(
  landmark: PoseLandmark,
  canvasWidth: number,
  canvasHeight: number
): Point2D {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  };
}

/**
 * Get specific body landmarks for garment overlay
 * Returns the 4 corner points (shoulders and hips) in canvas coordinates
 */
export function getBodyCorners(
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number
): { leftShoulder: Point2D; rightShoulder: Point2D; leftHip: Point2D; rightHip: Point2D } | null {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Check if all landmarks are visible enough
  const minVisibility = 0.5;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility ||
    (leftHip.visibility ?? 0) < minVisibility ||
    (rightHip.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  return {
    leftShoulder: landmarkToCanvas(leftShoulder, canvasWidth, canvasHeight),
    rightShoulder: landmarkToCanvas(rightShoulder, canvasWidth, canvasHeight),
    leftHip: landmarkToCanvas(leftHip, canvasWidth, canvasHeight),
    rightHip: landmarkToCanvas(rightHip, canvasWidth, canvasHeight),
  };
}

/**
 * Calculate torso dimensions from landmarks
 */
export function getTorsoDimensions(
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number
): { width: number; height: number; centerX: number; centerY: number } | null {
  const corners = getBodyCorners(landmarks, canvasWidth, canvasHeight);
  if (!corners) return null;

  const { leftShoulder, rightShoulder, leftHip, rightHip } = corners;

  // Calculate torso width (shoulder to shoulder)
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);
  const width = Math.max(shoulderWidth, hipWidth);

  // Calculate torso height (shoulders to hips)
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const height = Math.abs(hipY - shoulderY);

  // Center point
  const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
  const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;

  return { width, height, centerX, centerY };
}

/**
 * Cleanup MediaPipe resources
 */
export function cleanupMediaPipe(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  mediaPipeLoaded = false;
}
