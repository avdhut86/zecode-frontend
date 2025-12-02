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
 * Loads the WASM files and model from CDN
 */
export async function initializeMediaPipe(): Promise<boolean> {
  if (mediaPipeLoaded && poseLandmarker) {
    return true;
  }

  try {
    // Dynamically import MediaPipe tasks-vision
    const vision = await import('@mediapipe/tasks-vision');
    const { PoseLandmarker, FilesetResolver } = vision;

    // Load WASM files
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    // Create pose landmarker with optimized settings for VTO
    poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU', // Use GPU for better performance
      },
      runningMode: 'VIDEO',
      numPoses: 1, // Single person for VTO
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false, // Disable for performance
    });

    mediaPipeLoaded = true;
    console.log('[VTO] MediaPipe Pose Landmarker initialized');
    return true;
  } catch (error) {
    console.error('[VTO] Failed to initialize MediaPipe:', error);
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

/**
 * Detect pose from a single image
 * @param imageElement - Image element to analyze
 */
export async function detectPoseFromImage(
  imageElement: HTMLImageElement
): Promise<PoseDetectionResult | null> {
  if (!poseLandmarker) {
    // Need to reinitialize for IMAGE mode
    const vision = await import('@mediapipe/tasks-vision');
    const { PoseLandmarker, FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const imagePoseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
    });

    const results = imagePoseLandmarker.detect(imageElement);
    imagePoseLandmarker.close();

    if (!results.landmarks || results.landmarks.length === 0) {
      return null;
    }

    const landmarks: PoseLandmark[] = results.landmarks[0].map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1,
    }));

    return { landmarks };
  }

  return null;
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
