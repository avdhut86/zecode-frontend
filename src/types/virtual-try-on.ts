// Virtual Try-On Types for MediaPipe + OpenCV.js Implementation

// ============================================
// MediaPipe Pose Landmark Types
// ============================================

// MediaPipe pose landmark indices (33 total landmarks)
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Single pose landmark from MediaPipe
export interface PoseLandmark {
  x: number; // Normalized [0, 1] - horizontal position
  y: number; // Normalized [0, 1] - vertical position
  z: number; // Depth (relative to hip midpoint)
  visibility?: number; // Confidence score [0, 1]
}

// Full pose detection result
export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  worldLandmarks?: PoseLandmark[]; // 3D world coordinates
  segmentationMask?: ImageData; // Optional body segmentation
}

// ============================================
// Overlay Keypoint Types (Product Image Reference Points)
// ============================================

// 2D point in image coordinates
export interface Point2D {
  x: number;
  y: number;
}

// Keypoint definition for garment overlay
export interface OverlayKeypoint {
  id: string;
  label: string;
  position: Point2D; // Position in overlay image (pixels)
  linkedLandmark: number; // Corresponding MediaPipe landmark index
}

// Complete overlay configuration for a garment
export interface GarmentOverlayConfig {
  productId: string | number;
  garmentType: GarmentType;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  keypoints: OverlayKeypoint[];
  // Optional adjustments
  scaleAdjustment?: number; // Fine-tune scale (1.0 = default)
  yOffset?: number; // Vertical offset in pixels
  xOffset?: number; // Horizontal offset in pixels
}

// ============================================
// Transform Types
// ============================================

// Affine transform matrix (2x3)
export type AffineMatrix = [
  [number, number, number],
  [number, number, number]
];

// Perspective/Homography transform matrix (3x3)
export type HomographyMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

// Transform result
export interface TransformResult {
  success: boolean;
  matrix?: AffineMatrix | HomographyMatrix;
  transformType: 'affine' | 'perspective' | 'simple';
  error?: string;
}

// Simple transform for fallback (scale, rotate, translate)
export interface SimpleTransform {
  scale: number;
  rotation: number; // radians
  translateX: number;
  translateY: number;
}

// ============================================
// Component State Types
// ============================================

export type VTOMode = 'webcam' | 'upload';
export type VTOStatus = 'idle' | 'loading' | 'detecting' | 'processing' | 'ready' | 'error';

export interface VTOState {
  mode: VTOMode;
  status: VTOStatus;
  errorMessage: string | null;
  isMediaPipeReady: boolean;
  isOpenCVReady: boolean;
  currentPose: PoseDetectionResult | null;
  fps: number;
  useSimpleFallback: boolean;
}

// ============================================
// Garment Types
// ============================================

export type GarmentType = 'top' | 'bottom' | 'dress' | 'outerwear' | 'full-body';

export const SUPPORTED_GARMENT_TYPES = [
  't-shirt',
  'shirt',
  'blouse',
  'top',
  'dress',
  'jacket',
  'coat',
  'hoodie',
  'sweater',
  'blazer',
] as const;

export type SupportedGarmentType = typeof SUPPORTED_GARMENT_TYPES[number];

// ============================================
// Default Keypoint Templates per Garment Type
// ============================================

// Default keypoint positions for a standard garment overlay image
// These assume the garment image is centered with shoulders near top
export const DEFAULT_KEYPOINT_TEMPLATES: Record<GarmentType, Omit<OverlayKeypoint, 'position'>[]> = {
  top: [
    { id: 'left_shoulder', label: 'Left Shoulder', linkedLandmark: POSE_LANDMARKS.LEFT_SHOULDER },
    { id: 'right_shoulder', label: 'Right Shoulder', linkedLandmark: POSE_LANDMARKS.RIGHT_SHOULDER },
    { id: 'left_hip', label: 'Left Hip', linkedLandmark: POSE_LANDMARKS.LEFT_HIP },
    { id: 'right_hip', label: 'Right Hip', linkedLandmark: POSE_LANDMARKS.RIGHT_HIP },
  ],
  bottom: [
    { id: 'left_hip', label: 'Left Hip', linkedLandmark: POSE_LANDMARKS.LEFT_HIP },
    { id: 'right_hip', label: 'Right Hip', linkedLandmark: POSE_LANDMARKS.RIGHT_HIP },
    { id: 'left_knee', label: 'Left Knee', linkedLandmark: POSE_LANDMARKS.LEFT_KNEE },
    { id: 'right_knee', label: 'Right Knee', linkedLandmark: POSE_LANDMARKS.RIGHT_KNEE },
  ],
  dress: [
    { id: 'left_shoulder', label: 'Left Shoulder', linkedLandmark: POSE_LANDMARKS.LEFT_SHOULDER },
    { id: 'right_shoulder', label: 'Right Shoulder', linkedLandmark: POSE_LANDMARKS.RIGHT_SHOULDER },
    { id: 'left_hip', label: 'Left Hip', linkedLandmark: POSE_LANDMARKS.LEFT_HIP },
    { id: 'right_hip', label: 'Right Hip', linkedLandmark: POSE_LANDMARKS.RIGHT_HIP },
  ],
  outerwear: [
    { id: 'left_shoulder', label: 'Left Shoulder', linkedLandmark: POSE_LANDMARKS.LEFT_SHOULDER },
    { id: 'right_shoulder', label: 'Right Shoulder', linkedLandmark: POSE_LANDMARKS.RIGHT_SHOULDER },
    { id: 'left_hip', label: 'Left Hip', linkedLandmark: POSE_LANDMARKS.LEFT_HIP },
    { id: 'right_hip', label: 'Right Hip', linkedLandmark: POSE_LANDMARKS.RIGHT_HIP },
  ],
  'full-body': [
    { id: 'left_shoulder', label: 'Left Shoulder', linkedLandmark: POSE_LANDMARKS.LEFT_SHOULDER },
    { id: 'right_shoulder', label: 'Right Shoulder', linkedLandmark: POSE_LANDMARKS.RIGHT_SHOULDER },
    { id: 'left_ankle', label: 'Left Ankle', linkedLandmark: POSE_LANDMARKS.LEFT_ANKLE },
    { id: 'right_ankle', label: 'Right Ankle', linkedLandmark: POSE_LANDMARKS.RIGHT_ANKLE },
  ],
};

// ============================================
// Helper Functions
// ============================================

// Detect garment type from product name/category
export function detectGarmentType(name: string, category: string): GarmentType {
  const combined = `${name} ${category}`.toLowerCase();
  
  if (combined.includes('dress') || combined.includes('gown') || combined.includes('jumpsuit') || combined.includes('romper')) {
    return 'full-body';
  }
  
  if (combined.includes('jacket') || combined.includes('coat') || combined.includes('blazer') || combined.includes('cardigan')) {
    return 'outerwear';
  }
  
  if (combined.includes('pants') || combined.includes('jeans') || combined.includes('shorts') || combined.includes('skirt') || combined.includes('trouser')) {
    return 'bottom';
  }
  
  // Default to top for shirts, t-shirts, tops, etc.
  return 'top';
}

// Check if garment type supports VTO
export function isGarmentTypeSupported(garmentType: GarmentType): boolean {
  // All garment types are now supported
  return ['top', 'outerwear', 'dress', 'bottom', 'full-body'].includes(garmentType);
}

// Generate default keypoints for an overlay image based on garment type
export function generateDefaultKeypoints(
  garmentType: GarmentType,
  imageWidth: number,
  imageHeight: number
): OverlayKeypoint[] {
  const template = DEFAULT_KEYPOINT_TEMPLATES[garmentType];
  
  // Default positions based on garment type and image dimensions
  const positions: Record<string, Point2D> = getDefaultPositions(garmentType, imageWidth, imageHeight);
  
  return template.map(kp => ({
    ...kp,
    position: positions[kp.id] || { x: imageWidth / 2, y: imageHeight / 2 },
  }));
}

// Get default keypoint positions based on garment type
function getDefaultPositions(
  garmentType: GarmentType,
  imageWidth: number,
  imageHeight: number
): Record<string, Point2D> {
  switch (garmentType) {
    case 'top':
    case 'outerwear':
      return {
        left_shoulder: { x: imageWidth * 0.15, y: imageHeight * 0.08 },
        right_shoulder: { x: imageWidth * 0.85, y: imageHeight * 0.08 },
        left_hip: { x: imageWidth * 0.20, y: imageHeight * 0.95 },
        right_hip: { x: imageWidth * 0.80, y: imageHeight * 0.95 },
      };
    
    case 'bottom':
      // Bottoms: hips at top, ankles at bottom
      return {
        left_hip: { x: imageWidth * 0.15, y: imageHeight * 0.05 },
        right_hip: { x: imageWidth * 0.85, y: imageHeight * 0.05 },
        left_knee: { x: imageWidth * 0.20, y: imageHeight * 0.50 },
        right_knee: { x: imageWidth * 0.80, y: imageHeight * 0.50 },
        left_ankle: { x: imageWidth * 0.22, y: imageHeight * 0.95 },
        right_ankle: { x: imageWidth * 0.78, y: imageHeight * 0.95 },
      };
    
    case 'dress':
      // Dresses: shoulders at top, can extend to knees or ankles
      return {
        left_shoulder: { x: imageWidth * 0.20, y: imageHeight * 0.05 },
        right_shoulder: { x: imageWidth * 0.80, y: imageHeight * 0.05 },
        left_hip: { x: imageWidth * 0.18, y: imageHeight * 0.40 },
        right_hip: { x: imageWidth * 0.82, y: imageHeight * 0.40 },
        left_knee: { x: imageWidth * 0.15, y: imageHeight * 0.75 },
        right_knee: { x: imageWidth * 0.85, y: imageHeight * 0.75 },
      };
    
    case 'full-body':
      // Full body: shoulders to ankles (jumpsuits, gowns)
      return {
        left_shoulder: { x: imageWidth * 0.18, y: imageHeight * 0.05 },
        right_shoulder: { x: imageWidth * 0.82, y: imageHeight * 0.05 },
        left_hip: { x: imageWidth * 0.20, y: imageHeight * 0.38 },
        right_hip: { x: imageWidth * 0.80, y: imageHeight * 0.38 },
        left_ankle: { x: imageWidth * 0.22, y: imageHeight * 0.95 },
        right_ankle: { x: imageWidth * 0.78, y: imageHeight * 0.95 },
      };
    
    default:
      return {
        left_shoulder: { x: imageWidth * 0.15, y: imageHeight * 0.08 },
        right_shoulder: { x: imageWidth * 0.85, y: imageHeight * 0.08 },
        left_hip: { x: imageWidth * 0.20, y: imageHeight * 0.95 },
        right_hip: { x: imageWidth * 0.80, y: imageHeight * 0.95 },
      };
  }
}
