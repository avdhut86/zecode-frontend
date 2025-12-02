/**
 * Simple Transform Utilities (Fallback)
 * 
 * When OpenCV.js is not available or device is low-end,
 * use basic canvas transforms (scale, rotate, translate).
 */

import type { Point2D, SimpleTransform, PoseLandmark, GarmentType } from '@/types/virtual-try-on';
import { POSE_LANDMARKS } from '@/types/virtual-try-on';

/**
 * Calculate simple transform from body landmarks for tops
 * Uses shoulder positions to determine scale and rotation
 */
export function calculateSimpleTransform(
  landmarks: PoseLandmark[],
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  garmentType: GarmentType = 'top'
): SimpleTransform | null {
  // Use garment-specific transform calculation
  switch (garmentType) {
    case 'bottom':
      return calculateBottomTransform(landmarks, overlayWidth, overlayHeight, canvasWidth, canvasHeight);
    case 'dress':
      return calculateDressTransform(landmarks, overlayWidth, overlayHeight, canvasWidth, canvasHeight);
    case 'full-body':
      return calculateFullBodyTransform(landmarks, overlayWidth, overlayHeight, canvasWidth, canvasHeight);
    default:
      return calculateTopTransform(landmarks, overlayWidth, overlayHeight, canvasWidth, canvasHeight);
  }
}

/**
 * Calculate transform for tops (t-shirts, shirts, jackets)
 */
function calculateTopTransform(
  landmarks: PoseLandmark[],
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number
): SimpleTransform | null {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Check visibility
  const minVisibility = 0.4;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  // Convert to canvas coordinates
  const lShoulderX = leftShoulder.x * canvasWidth;
  const lShoulderY = leftShoulder.y * canvasHeight;
  const rShoulderX = rightShoulder.x * canvasWidth;
  const rShoulderY = rightShoulder.y * canvasHeight;

  // Calculate shoulder width in canvas
  const shoulderWidth = Math.sqrt(
    Math.pow(rShoulderX - lShoulderX, 2) + Math.pow(rShoulderY - lShoulderY, 2)
  );

  // Calculate rotation angle (shoulder line)
  const rotation = Math.atan2(rShoulderY - lShoulderY, rShoulderX - lShoulderX);

  // Calculate scale based on shoulder width
  const overlayShoulderWidth = overlayWidth * 0.7;
  const scale = shoulderWidth / overlayShoulderWidth;

  // Calculate center position (midpoint between shoulders)
  const centerX = (lShoulderX + rShoulderX) / 2;
  let translateY = (lShoulderY + rShoulderY) / 2 - (overlayHeight * scale * 0.1);

  return {
    scale,
    rotation,
    translateX: centerX,
    translateY,
  };
}

/**
 * Calculate transform for bottoms (pants, jeans, skirts)
 */
function calculateBottomTransform(
  landmarks: PoseLandmark[],
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number
): SimpleTransform | null {
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  const minVisibility = 0.4;
  if (
    (leftHip.visibility ?? 0) < minVisibility ||
    (rightHip.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  // Convert to canvas coordinates
  const lHipX = leftHip.x * canvasWidth;
  const lHipY = leftHip.y * canvasHeight;
  const rHipX = rightHip.x * canvasWidth;
  const rHipY = rightHip.y * canvasHeight;

  // Calculate hip width
  const hipWidth = Math.sqrt(
    Math.pow(rHipX - lHipX, 2) + Math.pow(rHipY - lHipY, 2)
  );

  // Calculate rotation based on hip line
  const rotation = Math.atan2(rHipY - lHipY, rHipX - lHipX);

  // Calculate scale based on hip width (hips are ~70% of overlay width for bottoms)
  const overlayHipWidth = overlayWidth * 0.7;
  let scale = hipWidth / overlayHipWidth;

  // If ankles are visible, use leg length for better scaling
  if (
    (leftAnkle.visibility ?? 0) >= minVisibility &&
    (rightAnkle.visibility ?? 0) >= minVisibility
  ) {
    const hipY = (lHipY + rHipY) / 2;
    const ankleY = ((leftAnkle.y + rightAnkle.y) / 2) * canvasHeight;
    const legLength = ankleY - hipY;
    const overlayLegLength = overlayHeight * 0.95; // Most of overlay is leg
    scale = legLength / overlayLegLength;
  }

  // Position at hip center
  const centerX = (lHipX + rHipX) / 2;
  const translateY = (lHipY + rHipY) / 2 - (overlayHeight * scale * 0.05);

  return {
    scale,
    rotation,
    translateX: centerX,
    translateY,
  };
}

/**
 * Calculate transform for dresses
 */
function calculateDressTransform(
  landmarks: PoseLandmark[],
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number
): SimpleTransform | null {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  const minVisibility = 0.4;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  // Convert to canvas coordinates
  const lShoulderX = leftShoulder.x * canvasWidth;
  const lShoulderY = leftShoulder.y * canvasHeight;
  const rShoulderX = rightShoulder.x * canvasWidth;
  const rShoulderY = rightShoulder.y * canvasHeight;

  // Calculate shoulder width
  const shoulderWidth = Math.sqrt(
    Math.pow(rShoulderX - lShoulderX, 2) + Math.pow(rShoulderY - lShoulderY, 2)
  );

  // Calculate rotation based on shoulder line
  const rotation = Math.atan2(rShoulderY - lShoulderY, rShoulderX - lShoulderX);

  // For dresses, use a combination of shoulder width and body length
  let scale = shoulderWidth / (overlayWidth * 0.6);

  // If knees visible, adjust scale based on dress length
  if (
    (leftKnee.visibility ?? 0) >= minVisibility &&
    (rightKnee.visibility ?? 0) >= minVisibility
  ) {
    const shoulderY = (lShoulderY + rShoulderY) / 2;
    const kneeY = ((leftKnee.y + rightKnee.y) / 2) * canvasHeight;
    const dressLength = kneeY - shoulderY;
    const overlayDressLength = overlayHeight * 0.85;
    scale = Math.max(scale, dressLength / overlayDressLength);
  }

  // Position at shoulder center
  const centerX = (lShoulderX + rShoulderX) / 2;
  const translateY = (lShoulderY + rShoulderY) / 2 - (overlayHeight * scale * 0.05);

  return {
    scale,
    rotation,
    translateX: centerX,
    translateY,
  };
}

/**
 * Calculate transform for full-body garments (jumpsuits, gowns)
 */
function calculateFullBodyTransform(
  landmarks: PoseLandmark[],
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number
): SimpleTransform | null {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  const minVisibility = 0.4;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  // Convert to canvas coordinates
  const lShoulderX = leftShoulder.x * canvasWidth;
  const lShoulderY = leftShoulder.y * canvasHeight;
  const rShoulderX = rightShoulder.x * canvasWidth;
  const rShoulderY = rightShoulder.y * canvasHeight;

  // Calculate shoulder width
  const shoulderWidth = Math.sqrt(
    Math.pow(rShoulderX - lShoulderX, 2) + Math.pow(rShoulderY - lShoulderY, 2)
  );

  // Calculate rotation based on shoulder line
  const rotation = Math.atan2(rShoulderY - lShoulderY, rShoulderX - lShoulderX);

  // For full-body, use full body length for scaling
  let scale = shoulderWidth / (overlayWidth * 0.6);

  if (
    (leftAnkle.visibility ?? 0) >= minVisibility &&
    (rightAnkle.visibility ?? 0) >= minVisibility
  ) {
    const shoulderY = (lShoulderY + rShoulderY) / 2;
    const ankleY = ((leftAnkle.y + rightAnkle.y) / 2) * canvasHeight;
    const bodyLength = ankleY - shoulderY;
    const overlayBodyLength = overlayHeight * 0.92;
    scale = bodyLength / overlayBodyLength;
  }

  // Position at shoulder center
  const centerX = (lShoulderX + rShoulderX) / 2;
  const translateY = (lShoulderY + rShoulderY) / 2 - (overlayHeight * scale * 0.05);

  return {
    scale,
    rotation,
    translateX: centerX,
    translateY,
  };
}

/**
 * Apply simple transform to canvas context
 * Call this before drawing the overlay image
 */
export function applySimpleTransform(
  ctx: CanvasRenderingContext2D,
  transform: SimpleTransform,
  overlayWidth: number,
  overlayHeight: number
): void {
  const { scale, rotation, translateX, translateY } = transform;

  // Save current state
  ctx.save();

  // Move to center position
  ctx.translate(translateX, translateY);

  // Apply rotation
  ctx.rotate(rotation);

  // Apply scale
  ctx.scale(scale, scale);

  // Offset to center the image
  ctx.translate(-overlayWidth / 2, 0);
}

/**
 * Draw overlay image with simple transform
 */
export function drawWithSimpleTransform(
  ctx: CanvasRenderingContext2D,
  overlayImage: HTMLImageElement | HTMLCanvasElement,
  transform: SimpleTransform
): void {
  const overlayWidth = overlayImage.width;
  const overlayHeight = overlayImage.height;

  applySimpleTransform(ctx, transform, overlayWidth, overlayHeight);

  // Draw the overlay
  ctx.drawImage(overlayImage, 0, 0);

  // Restore context
  ctx.restore();
}

/**
 * Calculate torso bounding box from landmarks
 */
export function getTorsoBoundingBox(
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 0.1
): { x: number; y: number; width: number; height: number } | null {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Check visibility
  const minVisibility = 0.3;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility ||
    (leftHip.visibility ?? 0) < minVisibility ||
    (rightHip.visibility ?? 0) < minVisibility
  ) {
    return null;
  }

  // Convert to canvas coordinates
  const points = [
    { x: leftShoulder.x * canvasWidth, y: leftShoulder.y * canvasHeight },
    { x: rightShoulder.x * canvasWidth, y: rightShoulder.y * canvasHeight },
    { x: leftHip.x * canvasWidth, y: leftHip.y * canvasHeight },
    { x: rightHip.x * canvasWidth, y: rightHip.y * canvasHeight },
  ];

  // Find bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  const width = maxX - minX;
  const height = maxY - minY;

  // Add padding
  const paddingX = width * padding;
  const paddingY = height * padding;

  return {
    x: minX - paddingX,
    y: minY - paddingY,
    width: width + paddingX * 2,
    height: height + paddingY * 2,
  };
}

/**
 * Draw debug visualization of landmarks
 */
export function drawLandmarkDebug(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  canvasWidth: number,
  canvasHeight: number
): void {
  // Key landmarks for VTO
  const keyLandmarks = [
    { index: POSE_LANDMARKS.LEFT_SHOULDER, color: '#00ff00', label: 'LS' },
    { index: POSE_LANDMARKS.RIGHT_SHOULDER, color: '#00ff00', label: 'RS' },
    { index: POSE_LANDMARKS.LEFT_HIP, color: '#0000ff', label: 'LH' },
    { index: POSE_LANDMARKS.RIGHT_HIP, color: '#0000ff', label: 'RH' },
    { index: POSE_LANDMARKS.NOSE, color: '#ff0000', label: 'N' },
  ];

  ctx.save();
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  for (const { index, color, label } of keyLandmarks) {
    const landmark = landmarks[index];
    if (!landmark || (landmark.visibility ?? 0) < 0.3) continue;

    const x = landmark.x * canvasWidth;
    const y = landmark.y * canvasHeight;

    // Draw point
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y - 10);
  }

  // Draw connections
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // Shoulders
  const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  if (ls && rs) {
    ctx.beginPath();
    ctx.moveTo(ls.x * canvasWidth, ls.y * canvasHeight);
    ctx.lineTo(rs.x * canvasWidth, rs.y * canvasHeight);
    ctx.stroke();
  }

  // Torso sides
  const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  if (ls && lh) {
    ctx.beginPath();
    ctx.moveTo(ls.x * canvasWidth, ls.y * canvasHeight);
    ctx.lineTo(lh.x * canvasWidth, lh.y * canvasHeight);
    ctx.stroke();
  }
  if (rs && rh) {
    ctx.beginPath();
    ctx.moveTo(rs.x * canvasWidth, rs.y * canvasHeight);
    ctx.lineTo(rh.x * canvasWidth, rh.y * canvasHeight);
    ctx.stroke();
  }
  if (lh && rh) {
    ctx.beginPath();
    ctx.moveTo(lh.x * canvasWidth, lh.y * canvasHeight);
    ctx.lineTo(rh.x * canvasWidth, rh.y * canvasHeight);
    ctx.stroke();
  }

  ctx.restore();
}
