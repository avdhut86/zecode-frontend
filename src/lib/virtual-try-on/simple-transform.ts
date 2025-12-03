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

  console.log('[VTO SimpleTransform] calculateTopTransform called:', {
    leftShoulderVis: leftShoulder?.visibility?.toFixed(3),
    rightShoulderVis: rightShoulder?.visibility?.toFixed(3),
    leftHipVis: leftHip?.visibility?.toFixed(3),
    rightHipVis: rightHip?.visibility?.toFixed(3),
    overlaySize: `${overlayWidth}x${overlayHeight}`,
    canvasSize: `${canvasWidth}x${canvasHeight}`
  });

  // Check visibility - lowered threshold for better selfie support
  const minVisibility = 0.15;
  if (
    (leftShoulder.visibility ?? 0) < minVisibility ||
    (rightShoulder.visibility ?? 0) < minVisibility
  ) {
    console.log('[VTO SimpleTransform] Shoulders not visible enough');
    return null;
  }

  // Convert to canvas coordinates
  // Note: In MediaPipe, LEFT_SHOULDER is the person's anatomical left
  // which appears on the RIGHT side of the image when facing camera
  const lShoulderX = leftShoulder.x * canvasWidth;
  const lShoulderY = leftShoulder.y * canvasHeight;
  const rShoulderX = rightShoulder.x * canvasWidth;
  const rShoulderY = rightShoulder.y * canvasHeight;
  
  // Get hip positions for torso height
  const lHipX = leftHip.x * canvasWidth;
  const lHipY = leftHip.y * canvasHeight;
  const rHipX = rightHip.x * canvasWidth;
  const rHipY = rightHip.y * canvasHeight;

  console.log('[VTO SimpleTransform] Body positions (canvas coords):', {
    leftShoulder: `(${lShoulderX.toFixed(0)}, ${lShoulderY.toFixed(0)})`,
    rightShoulder: `(${rShoulderX.toFixed(0)}, ${rShoulderY.toFixed(0)})`,
    leftHip: `(${lHipX.toFixed(0)}, ${lHipY.toFixed(0)})`,
    rightHip: `(${rHipX.toFixed(0)}, ${rHipY.toFixed(0)})`
  });

  // Calculate body measurements
  const bodyShoulderWidth = Math.sqrt(
    Math.pow(lShoulderX - rShoulderX, 2) + Math.pow(lShoulderY - rShoulderY, 2)
  );
  
  // Calculate torso height (from shoulders to hips)
  const shoulderCenterY = (lShoulderY + rShoulderY) / 2;
  const hipCenterY = (lHipY + rHipY) / 2;
  const torsoHeight = hipCenterY - shoulderCenterY;

  // Calculate rotation angle from shoulder line
  // We want the garment to follow the shoulder tilt
  const shoulderTilt = Math.atan2(lShoulderY - rShoulderY, lShoulderX - rShoulderX);
  const rotation = shoulderTilt;

  // === IMPROVED SCALING ===
  // For a product photo garment, the shoulders are typically at ~25% and ~75% of width
  // So the shoulder span is about 50% of the image width
  // We want the garment to match the body shoulder width
  const garmentShoulderWidthRatio = 0.5; // shoulders span ~50% of garment image
  
  // Scale so garment shoulders match body shoulders (no extra coverage factor)
  const scaleByWidth = bodyShoulderWidth / (overlayWidth * garmentShoulderWidthRatio);
  
  // Also check height: torso should fit within garment's torso area
  const garmentTorsoHeightRatio = 0.6; // torso spans ~60% of garment height (from neck to bottom)
  const scaleByHeight = torsoHeight / (overlayHeight * garmentTorsoHeightRatio);
  
  // Use the SMALLER scale to ensure garment fits (not too big)
  const scale = Math.min(scaleByWidth, scaleByHeight);

  // === IMPROVED POSITIONING ===
  // Horizontal: center between shoulders
  const centerX = (lShoulderX + rShoulderX) / 2;
  
  // Vertical: The garment image has its "center" at 50% height
  // But the visual center of a shirt is around the chest area (about 35-40% from top)
  // We want to position this at the body's chest level (slightly below shoulders)
  // Chest is approximately 30% of the way from shoulders to hips
  const chestY = shoulderCenterY + (torsoHeight * 0.3);
  
  // The garment's visual center (chest area) is at about 40% from the top of the image
  // So we need to offset by the distance from image center to visual center
  const garmentVisualCenterRatio = 0.40; // chest at 40% from top
  const garmentImageCenterRatio = 0.50;  // canvas draws from center
  const verticalOffset = (garmentImageCenterRatio - garmentVisualCenterRatio) * overlayHeight * scale;
  
  const translateY = chestY + verticalOffset;

  console.log('[VTO SimpleTransform] Calculated transform:', {
    bodyShoulderWidth: bodyShoulderWidth.toFixed(0),
    torsoHeight: torsoHeight.toFixed(0),
    scaleByWidth: scaleByWidth.toFixed(3),
    scaleByHeight: scaleByHeight.toFixed(3),
    finalScale: scale.toFixed(3),
    scaledGarmentWidth: (overlayWidth * scale).toFixed(0),
    scaledGarmentHeight: (overlayHeight * scale).toFixed(0),
    rotation: (rotation * 180 / Math.PI).toFixed(1) + '°',
    center: `(${centerX.toFixed(0)}, ${translateY.toFixed(0)})`
  });

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

  console.log('[VTO SimpleTransform] drawWithSimpleTransform:', {
    overlaySize: `${overlayWidth}x${overlayHeight}`,
    transform: {
      scale: transform.scale.toFixed(3),
      rotation: (transform.rotation * 180 / Math.PI).toFixed(1) + '°',
      position: `(${transform.translateX.toFixed(0)}, ${transform.translateY.toFixed(0)})`
    }
  });

  // Remove background from garment image
  const processedImage = removeBackground(overlayImage, 35);
  console.log('[VTO SimpleTransform] Background removed from garment');

  applySimpleTransform(ctx, transform, overlayWidth, overlayHeight);

  // Draw the processed overlay (with transparent background)
  ctx.drawImage(processedImage, 0, 0);
  console.log('[VTO SimpleTransform] Overlay image drawn to canvas');

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

/**
 * Remove background from garment image by making light colors transparent
 * Uses corner sampling to detect background color
 */
export function removeBackground(
  image: HTMLImageElement | HTMLCanvasElement,
  tolerance: number = 30
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('[VTO] Could not create canvas for background removal');
    // Return original as canvas
    const fallback = document.createElement('canvas');
    fallback.width = image.width;
    fallback.height = image.height;
    fallback.getContext('2d')?.drawImage(image, 0, 0);
    return fallback;
  }
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Sample corners to detect background color (average of corners)
  const sampleSize = 10;
  const corners = [
    { x: 0, y: 0 }, // top-left
    { x: canvas.width - sampleSize, y: 0 }, // top-right
    { x: 0, y: canvas.height - sampleSize }, // bottom-left
    { x: canvas.width - sampleSize, y: canvas.height - sampleSize }, // bottom-right
  ];
  
  let bgR = 0, bgG = 0, bgB = 0, samples = 0;
  
  for (const corner of corners) {
    for (let y = corner.y; y < corner.y + sampleSize && y < canvas.height; y++) {
      for (let x = corner.x; x < corner.x + sampleSize && x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        samples++;
      }
    }
  }
  
  bgR = Math.round(bgR / samples);
  bgG = Math.round(bgG / samples);
  bgB = Math.round(bgB / samples);
  
  console.log('[VTO BackgroundRemoval] Detected background color:', { r: bgR, g: bgG, b: bgB });
  
  // Make pixels similar to background transparent
  let removedPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate color distance from background
    const distance = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    );
    
    // If close to background color, make transparent
    if (distance < tolerance) {
      data[i + 3] = 0; // Set alpha to 0
      removedPixels++;
    } else if (distance < tolerance * 2) {
      // Partial transparency for edge pixels (anti-aliasing)
      const alpha = Math.round(((distance - tolerance) / tolerance) * 255);
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
  }
  
  console.log('[VTO BackgroundRemoval] Removed', removedPixels, 'background pixels');
  
  // Put modified data back
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}
