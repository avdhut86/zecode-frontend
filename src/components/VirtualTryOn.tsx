'use client';

/**
 * VirtualTryOn Component
 * 
 * Real-time virtual try-on using MediaPipe pose detection
 * and OpenCV.js for garment overlay warping.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  VTOState, 
  VTOMode, 
  GarmentOverlayConfig,
  PoseLandmark,
  GarmentType
} from '@/types/virtual-try-on';
import { 
  detectGarmentType, 
  generateDefaultKeypoints,
  isGarmentTypeSupported 
} from '@/types/virtual-try-on';
import {
  initializeMediaPipe,
  isMediaPipeReady,
  detectPoseFromVideo,
  cleanupMediaPipe,
} from '@/lib/virtual-try-on/pose-detection';
import {
  loadOpenCV,
  isOpenCVReady,
} from '@/lib/virtual-try-on/opencv-transform';
import {
  renderOverlay,
  loadOverlayImage,
  hasVisibleTorso,
  hasVisibleFullBody,
  hasVisibleLowerBody,
  landmarkSmoother,
  clearOverlayCache,
} from '@/lib/virtual-try-on/overlay-renderer';
import { drawLandmarkDebug } from '@/lib/virtual-try-on/simple-transform';

// Icons
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface VirtualTryOnProps {
  productImage: string;
  productName: string;
  productCategory: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VirtualTryOn({
  productImage,
  productName,
  productCategory,
  isOpen,
  onClose,
}: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<VTOState>({
    mode: 'webcam',
    status: 'idle',
    errorMessage: null,
    isMediaPipeReady: false,
    isOpenCVReady: false,
    currentPose: null,
    fps: 0,
    useSimpleFallback: false,
  });
  
  // Track webcam pose detection success
  const webcamPoseDetectedRef = useRef<boolean>(false);
  const webcamStartTimeRef = useRef<number>(0);

  const [showDebug, setShowDebug] = useState(false);
  const [overlayConfig, setOverlayConfig] = useState<GarmentOverlayConfig | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number[]>([]);

  // Detect garment type
  const garmentType = detectGarmentType(productName, productCategory);
  const isSupported = isGarmentTypeSupported(garmentType);

  // Helper to check if body is visible based on garment type
  const isBodyVisible = useCallback((landmarks: PoseLandmark[]) => {
    switch (garmentType) {
      case 'bottom':
        return hasVisibleLowerBody(landmarks);
      case 'dress':
      case 'full-body':
        return hasVisibleFullBody(landmarks);
      default:
        return hasVisibleTorso(landmarks, garmentType);
    }
  }, [garmentType]);

  // Initialize libraries
  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      setState(s => ({ ...s, status: 'loading' }));

      // Load MediaPipe
      const mpReady = await initializeMediaPipe();
      setState(s => ({ ...s, isMediaPipeReady: mpReady }));

      // Load OpenCV (non-blocking, will use fallback if fails)
      loadOpenCV().then(cvReady => {
        setState(s => ({ 
          ...s, 
          isOpenCVReady: cvReady,
          useSimpleFallback: !cvReady 
        }));
      });

      // Load overlay image
      try {
        const img = await loadOverlayImage(productImage);
        overlayImageRef.current = img;
        
        // Generate default keypoints for this garment
        const config: GarmentOverlayConfig = {
          productId: productName,
          garmentType,
          imageUrl: productImage,
          imageWidth: img.width,
          imageHeight: img.height,
          keypoints: generateDefaultKeypoints(garmentType, img.width, img.height),
          scaleAdjustment: 1.15, // Slightly larger for better coverage
        };
        setOverlayConfig(config);
      } catch (error) {
        console.error('[VTO] Failed to load overlay image:', error);
        setState(s => ({ 
          ...s, 
          status: 'error', 
          errorMessage: 'Failed to load product image' 
        }));
        return;
      }

      if (mpReady) {
        setState(s => ({ ...s, status: 'ready' }));
      } else {
        setState(s => ({ 
          ...s, 
          status: 'error', 
          errorMessage: 'Failed to initialize pose detection' 
        }));
      }
    };

    init();

    return () => {
      cleanupMediaPipe();
      clearOverlayCache();
    };
  }, [isOpen, productImage, productName, garmentType]);

  // Check camera availability and permissions
  const checkCameraSupport = useCallback(async (): Promise<{ supported: boolean; error?: string; hint?: string }> => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return { supported: false, error: 'Camera not available', hint: 'Please open this page in a web browser.' };
    }

    // Check for HTTPS (required for camera access on most browsers)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      return { 
        supported: false, 
        error: 'Secure connection required', 
        hint: 'Camera access requires HTTPS. Please access this site via https:// or use localhost for testing.'
      };
    }

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        supported: false, 
        error: 'Camera not supported', 
        hint: 'Your browser doesn\'t support camera access. Try using Chrome, Firefox, Safari, or Edge.'
      };
    }

    // Check for camera devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        return { 
          supported: false, 
          error: 'No camera detected', 
          hint: 'Please connect a camera or use the photo upload option instead.'
        };
      }
      
      console.log('[VTO] Found', videoDevices.length, 'camera(s)');
    } catch (err) {
      console.warn('[VTO] Could not enumerate devices:', err);
      // Continue anyway - some browsers don't allow enumeration without permission
    }

    // Check permission status if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('[VTO] Camera permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          return { 
            supported: false, 
            error: 'Camera permission denied', 
            hint: 'You\'ve blocked camera access. To enable: click the lock icon in your browser\'s address bar → Site settings → Camera → Allow'
          };
        }
      } catch (err) {
        // Permission API not fully supported, continue
        console.log('[VTO] Permission query not supported');
      }
    }

    return { supported: true };
  }, []);

  // Simple, reliable webcam start
  const startWebcam = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('[VTO] No video element');
      return;
    }

    setState(s => ({ ...s, mode: 'webcam', status: 'loading', errorMessage: null }));
    console.log('[VTO] Starting webcam...');

    try {
      // Simple camera request - works on all modern browsers
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });

      console.log('[VTO] Got camera stream');
      streamRef.current = stream;
      video.srcObject = stream;
      
      // Simple play with error handling
      video.onloadedmetadata = () => {
        console.log('[VTO] Video ready:', video.videoWidth, 'x', video.videoHeight);
        video.play()
          .then(() => {
            console.log('[VTO] Video playing');
            webcamPoseDetectedRef.current = false;
            webcamStartTimeRef.current = Date.now();
            setState(s => ({ ...s, status: 'detecting' }));
            startProcessingLoop();
          })
          .catch(err => {
            console.error('[VTO] Play failed:', err);
            setState(s => ({ 
              ...s, 
              status: 'error', 
              errorMessage: 'Could not start video playback. Please try again.'
            }));
          });
      };

    } catch (err: any) {
      console.error('[VTO] Camera error:', err.name, err.message);
      
      let message = 'Could not access camera';
      let hint = '';
      
      if (err.name === 'NotAllowedError') {
        message = 'Camera access denied';
        hint = 'Please allow camera access in your browser settings';
      } else if (err.name === 'NotFoundError') {
        message = 'No camera found';
        hint = 'Please connect a camera or use photo upload';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is busy';
        hint = 'Close other apps using the camera and try again';
      }
      
      setState(s => ({ 
        ...s, 
        status: 'error', 
        errorMessage: message + (hint ? `\n\n💡 ${hint}` : '')
      }));
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Simple image upload handler
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[VTO] File selected:', file.name, file.type, file.size);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setState(s => ({ 
        ...s, 
        status: 'error', 
        errorMessage: 'Please select an image file (JPG, PNG, etc.)'
      }));
      return;
    }

    stopWebcam();
    setState(s => ({ ...s, mode: 'upload', status: 'loading', errorMessage: null }));

    // Simple FileReader approach
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('[VTO] File read complete');
      const img = new Image();
      
      img.onload = () => {
        console.log('[VTO] Image loaded:', img.width, 'x', img.height);
        uploadedImageRef.current = img;
        
        // Draw image to canvas immediately
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            console.log('[VTO] Image drawn to canvas');
          }
        }
        
        // Now process for pose detection
        setState(s => ({ ...s, status: 'detecting' }));
        processUploadedImage(img);
      };
      
      img.onerror = (err) => {
        console.error('[VTO] Image load error:', err);
        setState(s => ({ 
          ...s, 
          status: 'error', 
          errorMessage: 'Could not load image. Please try a different file.'
        }));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = (err) => {
      console.error('[VTO] File read error:', err);
      setState(s => ({ 
        ...s, 
        status: 'error', 
        errorMessage: 'Could not read file. Please try again.'
      }));
    };
    
    reader.readAsDataURL(file);
  }, [stopWebcam]);

  // Process uploaded image
  const processUploadedImage = useCallback(async (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !overlayImageRef.current || !overlayConfig) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw uploaded image first (user sees their photo)
    ctx.drawImage(img, 0, 0);

    // Detect pose using the centralized function with timeout
    try {
      console.log('[VTO] Processing uploaded image...');
      
      // Import the pose detection function
      const { detectPoseFromImage } = await import('@/lib/virtual-try-on/pose-detection');
      
      // Add timeout for pose detection (15 seconds max)
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Pose detection timed out')), 15000)
      );
      
      const result = await Promise.race([
        detectPoseFromImage(img),
        timeoutPromise
      ]);

      if (result && result.landmarks.length > 0) {
        const landmarks = result.landmarks;

        // Re-draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Render overlay
        if (isBodyVisible(landmarks)) {
          renderOverlay(
            ctx,
            overlayImageRef.current,
            overlayConfig,
            landmarks,
            canvas.width,
            canvas.height,
            state.isOpenCVReady && !state.useSimpleFallback
          );
        }

        // Draw debug if enabled
        if (showDebug) {
          drawLandmarkDebug(ctx, landmarks, canvas.width, canvas.height);
        }

        setState(s => ({ ...s, status: 'ready', currentPose: { landmarks } }));
      } else {
        setState(s => ({ 
          ...s, 
          status: 'error',
          errorMessage: 'No person detected in image. Please try another photo.'
        }));
      }
    } catch (error) {
      console.error('[VTO] Image processing error:', error);
      const errorMsg = error instanceof Error && error.message.includes('timeout')
        ? 'Pose detection took too long. Please try a clearer photo.'
        : 'Failed to process image. Please try again.';
      setState(s => ({ 
        ...s, 
        status: 'error',
        errorMessage: errorMsg
      }));
    }
  }, [overlayConfig, showDebug, state.isOpenCVReady, state.useSimpleFallback]);

  // Main processing loop for webcam
  const startProcessingLoop = useCallback(() => {
    const processFrame = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !overlayImageRef.current || !overlayConfig) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Calculate FPS
      if (lastFrameTimeRef.current) {
        const fps = 1000 / (timestamp - lastFrameTimeRef.current);
        fpsCounterRef.current.push(fps);
        if (fpsCounterRef.current.length > 30) {
          fpsCounterRef.current.shift();
        }
        const avgFps = fpsCounterRef.current.reduce((a, b) => a + b, 0) / fpsCounterRef.current.length;
        setState(s => ({ ...s, fps: Math.round(avgFps) }));
      }
      lastFrameTimeRef.current = timestamp;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Set canvas size to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      // Draw video frame (mirrored for selfie view)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Detect pose
      if (isMediaPipeReady()) {
        const poseResult = detectPoseFromVideo(video, timestamp);
        
        if (poseResult && poseResult.landmarks.length > 0) {
          // Mirror landmarks for selfie view
          const mirroredLandmarks = poseResult.landmarks.map(lm => ({
            ...lm,
            x: 1 - lm.x, // Mirror X coordinate
          }));

          // Smooth landmarks
          const smoothedLandmarks = landmarkSmoother.addFrame(mirroredLandmarks);

          // Render overlay if body is visible for this garment type
          if (isBodyVisible(smoothedLandmarks)) {
            renderOverlay(
              ctx,
              overlayImageRef.current,
              overlayConfig,
              smoothedLandmarks,
              canvas.width,
              canvas.height,
              state.isOpenCVReady && !state.useSimpleFallback
            );
          }

          // Draw debug visualization
          if (showDebug) {
            drawLandmarkDebug(ctx, smoothedLandmarks, canvas.width, canvas.height);
          }

          setState(s => ({ ...s, currentPose: { landmarks: smoothedLandmarks }, status: 'ready' }));
          
          // Mark that we've successfully detected a pose
          if (!webcamPoseDetectedRef.current) {
            webcamPoseDetectedRef.current = true;
            console.log('[VTO] First pose detected!');
          }
        }
      } else {
        // MediaPipe not ready yet - check for timeout
        const elapsed = Date.now() - webcamStartTimeRef.current;
        if (elapsed > 10000 && !webcamPoseDetectedRef.current) {
          console.warn('[VTO] MediaPipe not ready after 10 seconds');
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [overlayConfig, showDebug, state.isOpenCVReady, state.useSimpleFallback, isBodyVisible]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopWebcam();
      landmarkSmoother.reset();
    };
  }, [stopWebcam]);

  // Handle close
  const handleClose = () => {
    stopWebcam();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Floating close button - always visible */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-[60] p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        aria-label="Close virtual try-on"
      >
        <CloseIcon />
      </button>
      
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Virtual Try-On</h2>
            <p className="text-sm text-gray-600 mt-0.5">{productName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Unsupported garment warning */}
          {!isSupported && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Virtual try-on works best with tops, jackets, and dresses. 
                Results for {garmentType} may be limited.
              </p>
            </div>
          )}

          {/* Main canvas area */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {/* Video element - ALWAYS visible when in webcam mode */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-contain border-4 border-red-500 ${
                state.mode === 'webcam' ? 'block' : 'hidden'
              }`}
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)', background: 'blue' }} // Mirror + blue bg to see if element exists
            />

            {/* Canvas for rendering overlay - on top of video when pose detected */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-contain border-4 border-green-500 ${
                (state.mode === 'webcam' && state.status === 'ready') || state.mode === 'upload'
                  ? 'block' 
                  : 'hidden'
              }`}
              style={{ pointerEvents: 'none', background: 'transparent' }} // Transparent so video shows through
            />

            {/* Loading overlay - ONLY show when NOT in webcam mode */}
            {(state.status === 'loading' || state.status === 'detecting') && state.mode !== 'webcam' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                state.mode === 'upload' && state.status === 'detecting' 
                  ? 'bg-black/60' // Semi-transparent when showing uploaded image
                  : 'bg-gray-900/90' // More opaque for initial loading
              }`}>
                <div className="px-8 py-6 rounded-xl backdrop-blur-sm bg-black/70">
                  <div className="flex justify-center">
                    <SpinnerIcon />
                  </div>
                  <p className="mt-4 text-white text-center font-medium">
                    {state.status === 'loading' 
                      ? 'Loading AI models...' 
                      : 'Detecting pose...'}
                  </p>
                  <p className="mt-1 text-sm text-gray-300 text-center">
                    {state.status === 'loading' 
                      ? 'This may take a moment on first load' 
                      : 'Analyzing your photo'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Webcam status indicator - shows at bottom without blocking view */}
            {state.mode === 'webcam' && (state.status === 'detecting' || state.status === 'loading') && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full backdrop-blur-sm z-30">
                <p className="text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {state.status === 'loading' ? 'Starting camera...' : 'Camera active - Position yourself in frame'}
                </p>
              </div>
            )}
            
            {/* Debug: Show current state */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 rounded text-xs text-white z-40">
              Mode: {state.mode} | Status: {state.status}
            </div>

            {/* Ready state - waiting for user action */}
            {state.status === 'ready' && state.mode !== 'webcam' && !uploadedImageRef.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-30">
                <p className="text-white text-lg mb-4">Choose an option to try on this garment</p>
                <p className="text-gray-500 text-xs mb-2">v3.3-debug</p>
                <div className="flex gap-4">
                  <button
                    onClick={startWebcam}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <CameraIcon />
                    Use Camera
                  </button>
                  <label className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors">
                    <UploadIcon />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Error state */}
            {state.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-6">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-white text-lg mb-2">Something went wrong</p>
                <div className="text-center max-w-md mb-4">
                  {state.errorMessage?.split('\n\n').map((part, i) => (
                    <p key={i} className={`${i === 0 ? 'text-gray-300 text-sm' : 'text-blue-300 text-xs mt-3 bg-blue-900/30 p-3 rounded-lg'}`}>
                      {part}
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => setState(s => ({ ...s, status: 'ready', errorMessage: null }))}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* FPS counter (debug) */}
            {showDebug && state.mode === 'webcam' && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 rounded text-white text-sm font-mono">
                {state.fps} FPS | {state.useSimpleFallback ? 'Simple' : 'OpenCV'}
              </div>
            )}

            {/* Status indicators */}
            <div className="absolute top-4 right-4 flex gap-2">
              {state.isMediaPipeReady && (
                <span className="px-2 py-1 bg-green-500/80 rounded text-xs text-white">
                  Pose ✓
                </span>
              )}
              {state.isOpenCVReady && !state.useSimpleFallback && (
                <span className="px-2 py-1 bg-blue-500/80 rounded text-xs text-white">
                  OpenCV ✓
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {state.status !== 'loading' && (
                <>
                  <button
                    onClick={startWebcam}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      state.mode === 'webcam' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <CameraIcon />
                    Camera
                  </button>
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    state.mode === 'upload' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}>
                    <UploadIcon />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Debug toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="rounded"
                />
                Show landmarks
              </label>

              {/* Fallback toggle */}
              {state.isOpenCVReady && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.useSimpleFallback}
                    onChange={(e) => setState(s => ({ ...s, useSimpleFallback: e.target.checked }))}
                    className="rounded"
                  />
                  Simple mode
                </label>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Tips for best results:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Stand about 4-6 feet from the camera</li>
              <li>• Make sure your shoulders and hips are visible</li>
              <li>• Face the camera directly with good lighting</li>
              <li>• Wear fitted clothing for more accurate overlay</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
