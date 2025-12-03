/**
 * OpenCV.js Transform Utilities
 * 
 * Computes affine and perspective transforms for warping
 * garment overlays onto detected body pose.
 */

import type { Point2D, OverlayKeypoint, TransformResult, HomographyMatrix, AffineMatrix } from '@/types/virtual-try-on';

// OpenCV.js global type (loaded dynamically via script tag)
declare global {
  interface Window {
    cv: any;
  }
}

let openCVLoaded = false;
let openCVLoading = false;

/**
 * Load OpenCV.js from CDN
 */
export function loadOpenCV(): Promise<boolean> {
  return new Promise((resolve) => {
    if (openCVLoaded && window.cv) {
      resolve(true);
      return;
    }

    if (openCVLoading) {
      // Wait for existing load to complete
      const checkInterval = setInterval(() => {
        if (openCVLoaded) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      return;
    }

    openCVLoading = true;

    // Check if already loaded
    if (window.cv && window.cv.Mat) {
      openCVLoaded = true;
      openCVLoading = false;
      resolve(true);
      return;
    }

    // List of CDN sources to try (in order of reliability)
    const cdnSources = [
      'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.2/dist/opencv.js',
      'https://docs.opencv.org/4.9.0/opencv.js',
      'https://docs.opencv.org/4.x/opencv.js',
    ];

    let sourceIndex = 0;

    const tryLoadScript = () => {
      if (sourceIndex >= cdnSources.length) {
        console.warn('[VTO] All OpenCV CDN sources failed, using simple transform fallback');
        openCVLoading = false;
        resolve(false);
        return;
      }

      const script = document.createElement('script');
      script.src = cdnSources[sourceIndex];
      script.async = true;

      // Timeout for slow CDNs
      const timeout = setTimeout(() => {
        console.warn(`[VTO] OpenCV CDN ${sourceIndex + 1} timed out, trying next...`);
        script.remove();
        sourceIndex++;
        tryLoadScript();
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        // OpenCV.js uses a callback pattern
        let attempts = 0;
        const checkReady = () => {
          if (window.cv && window.cv.Mat) {
            openCVLoaded = true;
            openCVLoading = false;
            console.log('[VTO] OpenCV.js loaded from CDN', sourceIndex + 1);
            resolve(true);
          } else if (attempts < 50) {
            attempts++;
            setTimeout(checkReady, 100);
          } else {
            console.warn('[VTO] OpenCV loaded but cv.Mat not ready, trying next CDN...');
            script.remove();
            sourceIndex++;
            tryLoadScript();
          }
        };
        checkReady();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        console.warn(`[VTO] OpenCV CDN ${sourceIndex + 1} failed, trying next...`);
        script.remove();
        sourceIndex++;
        tryLoadScript();
      };

      document.head.appendChild(script);
    };

    tryLoadScript();
  });
}

/**
 * Check if OpenCV.js is ready
 */
export function isOpenCVReady(): boolean {
  return openCVLoaded && typeof window !== 'undefined' && window.cv && window.cv.Mat;
}

/**
 * Compute perspective (homography) transform from 4 point correspondences
 * Maps source points (garment keypoints) to destination points (body landmarks)
 */
export function computePerspectiveTransform(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): TransformResult {
  if (!isOpenCVReady()) {
    return { success: false, transformType: 'perspective', error: 'OpenCV not loaded' };
  }

  if (srcPoints.length < 4 || dstPoints.length < 4) {
    return { success: false, transformType: 'perspective', error: 'Need 4 points for perspective transform' };
  }

  try {
    const cv = window.cv;

    // Create source and destination point matrices
    const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
      srcPoints[0].x, srcPoints[0].y,
      srcPoints[1].x, srcPoints[1].y,
      srcPoints[2].x, srcPoints[2].y,
      srcPoints[3].x, srcPoints[3].y,
    ]);

    const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
      dstPoints[0].x, dstPoints[0].y,
      dstPoints[1].x, dstPoints[1].y,
      dstPoints[2].x, dstPoints[2].y,
      dstPoints[3].x, dstPoints[3].y,
    ]);

    // Compute homography matrix
    const homography = cv.getPerspectiveTransform(srcMat, dstMat);

    // Extract matrix values
    const matrix: HomographyMatrix = [
      [homography.data64F[0], homography.data64F[1], homography.data64F[2]],
      [homography.data64F[3], homography.data64F[4], homography.data64F[5]],
      [homography.data64F[6], homography.data64F[7], homography.data64F[8]],
    ];

    // Cleanup
    srcMat.delete();
    dstMat.delete();
    homography.delete();

    return {
      success: true,
      matrix,
      transformType: 'perspective',
    };
  } catch (error) {
    console.error('[VTO] Perspective transform error:', error);
    return { success: false, transformType: 'perspective', error: String(error) };
  }
}

/**
 * Compute affine transform from 3 point correspondences
 * Simpler than perspective, preserves parallel lines
 */
export function computeAffineTransform(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): TransformResult {
  if (!isOpenCVReady()) {
    return { success: false, transformType: 'affine', error: 'OpenCV not loaded' };
  }

  if (srcPoints.length < 3 || dstPoints.length < 3) {
    return { success: false, transformType: 'affine', error: 'Need 3 points for affine transform' };
  }

  try {
    const cv = window.cv;

    // Create source and destination point matrices (use first 3 points)
    const srcMat = cv.matFromArray(3, 1, cv.CV_32FC2, [
      srcPoints[0].x, srcPoints[0].y,
      srcPoints[1].x, srcPoints[1].y,
      srcPoints[2].x, srcPoints[2].y,
    ]);

    const dstMat = cv.matFromArray(3, 1, cv.CV_32FC2, [
      dstPoints[0].x, dstPoints[0].y,
      dstPoints[1].x, dstPoints[1].y,
      dstPoints[2].x, dstPoints[2].y,
    ]);

    // Compute affine transform matrix
    const affine = cv.getAffineTransform(srcMat, dstMat);

    // Extract matrix values (2x3 matrix)
    const matrix: AffineMatrix = [
      [affine.data64F[0], affine.data64F[1], affine.data64F[2]],
      [affine.data64F[3], affine.data64F[4], affine.data64F[5]],
    ];

    // Cleanup
    srcMat.delete();
    dstMat.delete();
    affine.delete();

    return {
      success: true,
      matrix,
      transformType: 'affine',
    };
  } catch (error) {
    console.error('[VTO] Affine transform error:', error);
    return { success: false, transformType: 'affine', error: String(error) };
  }
}

/**
 * Warp an image using perspective transform
 * @param srcImage - Source image (garment overlay)
 * @param dstWidth - Output width
 * @param dstHeight - Output height
 * @param transformMatrix - 3x3 homography matrix
 * @returns Warped image as ImageData or null
 */
export function warpPerspective(
  srcImage: HTMLImageElement | HTMLCanvasElement | ImageData,
  dstWidth: number,
  dstHeight: number,
  transformMatrix: HomographyMatrix
): ImageData | null {
  if (!isOpenCVReady()) {
    console.warn('[VTO] OpenCV not ready for warp');
    return null;
  }

  try {
    const cv = window.cv;

    // Create source Mat from image - ensure we have RGBA with alpha channel
    let srcMat: any;
    if (srcImage instanceof ImageData) {
      srcMat = cv.matFromImageData(srcImage);
    } else {
      // Read image via canvas to preserve alpha channel
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = srcImage.width;
      srcCanvas.height = srcImage.height;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) {
        console.warn('[VTO] Failed to create source canvas context');
        return null;
      }
      srcCtx.drawImage(srcImage, 0, 0);
      const srcImageData = srcCtx.getImageData(0, 0, srcImage.width, srcImage.height);
      srcMat = cv.matFromImageData(srcImageData);
    }

    console.log('[VTO OpenCV] Source image:', srcMat.cols, 'x', srcMat.rows, 'channels:', srcMat.channels());

    // Create output Mat with 4 channels (RGBA) initialized to transparent
    const dstMat = new cv.Mat(dstHeight, dstWidth, cv.CV_8UC4, new cv.Scalar(0, 0, 0, 0));

    // Create transform matrix
    const M = cv.matFromArray(3, 3, cv.CV_64FC1, [
      transformMatrix[0][0], transformMatrix[0][1], transformMatrix[0][2],
      transformMatrix[1][0], transformMatrix[1][1], transformMatrix[1][2],
      transformMatrix[2][0], transformMatrix[2][1], transformMatrix[2][2],
    ]);

    // Apply perspective warp with transparent border
    const dstSize = new cv.Size(dstWidth, dstHeight);
    cv.warpPerspective(srcMat, dstMat, M, dstSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));

    console.log('[VTO OpenCV] Warped image:', dstMat.cols, 'x', dstMat.rows, 'channels:', dstMat.channels());

    // Convert to ImageData - create canvas and draw manually to preserve alpha
    const canvas = document.createElement('canvas');
    canvas.width = dstWidth;
    canvas.height = dstHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      srcMat.delete();
      dstMat.delete();
      M.delete();
      return null;
    }

    // Create ImageData from Mat data
    const imgData = new ImageData(
      new Uint8ClampedArray(dstMat.data),
      dstWidth,
      dstHeight
    );

    // Cleanup OpenCV objects
    srcMat.delete();
    dstMat.delete();
    M.delete();

    return imgData;
  } catch (error) {
    console.error('[VTO] Warp perspective error:', error);
    return null;
  }
}

/**
 * Warp an image using affine transform
 */
export function warpAffine(
  srcImage: HTMLImageElement | HTMLCanvasElement | ImageData,
  dstWidth: number,
  dstHeight: number,
  transformMatrix: AffineMatrix
): ImageData | null {
  if (!isOpenCVReady()) {
    console.warn('[VTO] OpenCV not ready for warp');
    return null;
  }

  try {
    const cv = window.cv;

    // Create source Mat from image
    let srcMat: any;
    if (srcImage instanceof ImageData) {
      srcMat = cv.matFromImageData(srcImage);
    } else {
      srcMat = cv.imread(srcImage);
    }

    // Create output Mat
    const dstMat = new cv.Mat();

    // Create transform matrix (2x3)
    const M = cv.matFromArray(2, 3, cv.CV_64FC1, [
      transformMatrix[0][0], transformMatrix[0][1], transformMatrix[0][2],
      transformMatrix[1][0], transformMatrix[1][1], transformMatrix[1][2],
    ]);

    // Apply affine warp
    const dstSize = new cv.Size(dstWidth, dstHeight);
    cv.warpAffine(srcMat, dstMat, M, dstSize, cv.INTER_LINEAR, cv.BORDER_TRANSPARENT);

    // Convert to ImageData
    const canvas = document.createElement('canvas');
    canvas.width = dstWidth;
    canvas.height = dstHeight;
    cv.imshow(canvas, dstMat);
    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(0, 0, dstWidth, dstHeight) || null;

    // Cleanup
    srcMat.delete();
    dstMat.delete();
    M.delete();

    return imageData;
  } catch (error) {
    console.error('[VTO] Warp affine error:', error);
    return null;
  }
}

/**
 * Prepare keypoints for transform computation
 * Maps overlay keypoints to destination body landmarks
 */
export function prepareTransformPoints(
  overlayKeypoints: OverlayKeypoint[],
  bodyLandmarks: Point2D[]
): { srcPoints: Point2D[]; dstPoints: Point2D[] } {
  const srcPoints: Point2D[] = [];
  const dstPoints: Point2D[] = [];

  for (const keypoint of overlayKeypoints) {
    if (bodyLandmarks[keypoint.linkedLandmark]) {
      srcPoints.push(keypoint.position);
      dstPoints.push(bodyLandmarks[keypoint.linkedLandmark]);
    }
  }

  return { srcPoints, dstPoints };
}
