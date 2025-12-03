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
import { generateGeminiVTO, imageUrlToBase64, resizeImageForAPI } from '@/lib/virtual-try-on/gemini-vto';

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
  // Version logging - check console to verify which version is deployed
  console.log('[VTO] Component loaded - v6.0 (Dec 3, 2025) - Gemini AI Try-On integration');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Try-On mode state
  const [useAITryOn, setUseAITryOn] = useState<boolean>(true); // Default to AI mode
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiResultImage, setAiResultImage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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
  
  // Selfie capture state: 'preview' = showing camera, 'captured' = selfie taken
  const [selfieState, setSelfieState] = useState<'none' | 'preview' | 'captured'>('none');
  
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

  // Start webcam for selfie preview (no pose detection yet)
  const startWebcam = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('[VTO] No video element');
      return;
    }

    setState(s => ({ ...s, mode: 'webcam', status: 'loading', errorMessage: null }));
    setSelfieState('none');
    console.log('[VTO] Starting webcam for selfie capture...');

    try {
      // Request camera permission - this triggers the browser prompt
      console.log('[VTO] Calling getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false 
      });

      console.log('[VTO] Got camera stream, tracks:', stream.getVideoTracks().length);
      streamRef.current = stream;
      video.srcObject = stream;
      
      // Simple play with error handling - just show preview, don't process yet
      video.onloadedmetadata = () => {
        console.log('[VTO] Video ready:', video.videoWidth, 'x', video.videoHeight);
        video.play()
          .then(() => {
            console.log('[VTO] Video playing - ready for selfie capture');
            setSelfieState('preview');
            setState(s => ({ ...s, status: 'ready' }));
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
      } else if (err.name === 'AbortError') {
        message = 'Camera timed out';
        hint = 'Close other apps or browser tabs using the camera, then try again';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera settings not supported';
        hint = 'Try using a different camera or the photo upload option';
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
    setSelfieState('none');
  }, []);

  // Store captured selfie image for processing
  const capturedSelfieRef = useRef<HTMLImageElement | null>(null);

  // Process image with Gemini AI
  const processWithGeminiAI = useCallback(async (userImageDataUrl: string) => {
    console.log('[VTO Gemini] Starting AI try-on processing...');
    setAiProcessing(true);
    setAiError(null);
    setAiResultImage(null);

    try {
      // Resize user image to reduce API payload
      const resizedUserImage = await resizeImageForAPI(userImageDataUrl, 1024, 1024, 0.85);
      console.log('[VTO Gemini] User image resized');

      // Get garment image as base64
      let garmentImageBase64: string;
      if (productImage.startsWith('data:')) {
        garmentImageBase64 = productImage;
      } else {
        garmentImageBase64 = await imageUrlToBase64(productImage);
      }
      
      // Resize garment image too
      const resizedGarmentImage = await resizeImageForAPI(garmentImageBase64, 1024, 1024, 0.9);
      console.log('[VTO Gemini] Garment image ready');

      // Call the Gemini API
      const result = await generateGeminiVTO({
        userImage: resizedUserImage,
        garmentImage: resizedGarmentImage,
        garmentType: garmentType,
        garmentDescription: productName,
      });

      if (result.success && result.image) {
        console.log('[VTO Gemini] Success! Generated image received');
        setAiResultImage(result.image);
        setState(s => ({ ...s, status: 'ready' }));
      } else {
        console.error('[VTO Gemini] API returned error:', result.error);
        setAiError(result.error || 'Failed to generate try-on image');
        setState(s => ({ ...s, status: 'error', errorMessage: result.error || 'AI processing failed' }));
      }
    } catch (error) {
      console.error('[VTO Gemini] Error:', error);
      setAiError(String(error));
      setState(s => ({ ...s, status: 'error', errorMessage: 'AI processing failed. Please try again.' }));
    } finally {
      setAiProcessing(false);
    }
  }, [productImage, productName, garmentType]);

  // Capture selfie from video stream
  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    console.log('[VTO] Capturing selfie...');
    setSelfieState('captured');
    setState(s => ({ ...s, status: 'detecting' }));

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw mirrored video frame to canvas (selfie view)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Stop the video stream since we have the image
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Create an image from the canvas for processing
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // If AI mode is enabled, process with Gemini
    if (useAITryOn) {
      console.log('[VTO] Using AI Try-On mode (Gemini)');
      processWithGeminiAI(imageDataUrl);
      return;
    }
    
    // Otherwise use local pose detection
    const img = new Image();
    img.onload = () => {
      console.log('[VTO] Selfie captured:', img.width, 'x', img.height);
      uploadedImageRef.current = img;
      capturedSelfieRef.current = img;
      // Processing will be triggered by useEffect watching capturedSelfieRef
    };
    img.src = imageDataUrl;
  }, [useAITryOn, processWithGeminiAI]);

  // Retake selfie - restart camera
  const retakeSelfie = useCallback(() => {
    setSelfieState('none');
    uploadedImageRef.current = null;
    setAiResultImage(null);
    setAiError(null);
    startWebcam();
  }, [startWebcam]);

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
    setAiResultImage(null);
    setAiError(null);
    setState(s => ({ ...s, mode: 'upload', status: 'loading', errorMessage: null }));

    // Simple FileReader approach
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('[VTO] File read complete');
      const imageDataUrl = e.target?.result as string;
      
      // If AI mode is enabled, process with Gemini
      if (useAITryOn) {
        console.log('[VTO] Using AI Try-On mode (Gemini) for uploaded image');
        setSelfieState('captured'); // Show as captured state
        setState(s => ({ ...s, status: 'detecting' }));
        processWithGeminiAI(imageDataUrl);
        return;
      }
      
      // Otherwise use local pose detection
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
      
      img.src = imageDataUrl;
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
  }, [stopWebcam, useAITryOn, processWithGeminiAI]);

  // Process uploaded image
  const processUploadedImage = useCallback(async (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    
    console.log('[VTO] processUploadedImage called, checking conditions...');
    console.log('[VTO] - canvas:', !!canvas);
    console.log('[VTO] - overlayImageRef:', !!overlayImageRef.current);
    console.log('[VTO] - overlayConfig:', !!overlayConfig);
    
    if (!canvas) {
      console.error('[VTO] No canvas element');
      setState(s => ({ ...s, status: 'error', errorMessage: 'Canvas not ready. Please try again.' }));
      return;
    }
    
    // If overlay image isn't loaded yet, try to load it now
    if (!overlayImageRef.current) {
      console.log('[VTO] Loading overlay image on demand...');
      try {
        const overlayImg = await loadOverlayImage(productImage);
        overlayImageRef.current = overlayImg;
        console.log('[VTO] Overlay image loaded:', overlayImg.width, 'x', overlayImg.height);
      } catch (error) {
        console.error('[VTO] Failed to load overlay image:', error);
        setState(s => ({ ...s, status: 'error', errorMessage: 'Product image not loaded. Please try again.' }));
        return;
      }
    }
    
    // If overlay config isn't ready, create it now
    let config = overlayConfig;
    if (!config && overlayImageRef.current) {
      console.log('[VTO] Creating overlay config on demand...');
      config = {
        productId: productName,
        garmentType,
        imageUrl: productImage,
        imageWidth: overlayImageRef.current.width,
        imageHeight: overlayImageRef.current.height,
        keypoints: generateDefaultKeypoints(garmentType, overlayImageRef.current.width, overlayImageRef.current.height),
        scaleAdjustment: 1.15,
      };
      setOverlayConfig(config);
    }
    
    if (!config) {
      console.error('[VTO] Could not create overlay config');
      setState(s => ({ ...s, status: 'error', errorMessage: 'Configuration not ready. Please try again.' }));
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[VTO] Could not get canvas context');
      return;
    }

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw uploaded image first (user sees their photo)
    ctx.drawImage(img, 0, 0);

    // Detect pose using the centralized function with timeout
    try {
      console.log('[VTO] Processing uploaded image...');
      
      // Wait for MediaPipe to be ready (may still be loading)
      const { isMediaPipeReady, initializeMediaPipe } = await import('@/lib/virtual-try-on/pose-detection');
      
      if (!isMediaPipeReady()) {
        console.log('[VTO] MediaPipe not ready, waiting...');
        setState(s => ({ ...s, status: 'loading' }));
        
        // Wait for initialization with timeout
        const initTimeout = setTimeout(() => {}, 10000);
        const ready = await initializeMediaPipe();
        clearTimeout(initTimeout);
        
        if (!ready) {
          throw new Error('MediaPipe failed to initialize');
        }
        
        setState(s => ({ ...s, status: 'detecting' }));
      }
      
      // Import the pose detection function
      const { detectPoseFromImage } = await import('@/lib/virtual-try-on/pose-detection');
      
      console.log('[VTO] Running pose detection on image...');
      
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
        console.log('[VTO] Pose detection successful! Found', landmarks.length, 'landmarks');

        // Re-draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        console.log('[VTO] Re-drew image on canvas');

        // Check if body is visible for this garment type
        const bodyVisible = isBodyVisible(landmarks);
        console.log('[VTO] Body visible for garment type:', bodyVisible);

        // Render overlay
        if (bodyVisible) {
          console.log('[VTO] Rendering overlay...');
          try {
            renderOverlay(
              ctx,
              overlayImageRef.current,
              config,
              landmarks,
              canvas.width,
              canvas.height,
              state.isOpenCVReady && !state.useSimpleFallback
            );
            console.log('[VTO] Overlay rendered successfully');
          } catch (overlayError) {
            console.error('[VTO] Overlay render error:', overlayError);
          }
        } else {
          console.log('[VTO] Body not fully visible, skipping overlay');
        }

        // Draw debug if enabled
        if (showDebug) {
          drawLandmarkDebug(ctx, landmarks, canvas.width, canvas.height);
          console.log('[VTO] Debug landmarks drawn');
        }

        console.log('[VTO] Setting status to ready');
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
  }, [overlayConfig, showDebug, state.isOpenCVReady, state.useSimpleFallback, productImage, productName, garmentType]);

  // Effect to process captured selfie
  useEffect(() => {
    if (selfieState === 'captured' && capturedSelfieRef.current && state.status === 'detecting') {
      const img = capturedSelfieRef.current;
      capturedSelfieRef.current = null; // Clear to prevent re-processing
      console.log('[VTO] Processing captured selfie...');
      processUploadedImage(img);
    }
  }, [selfieState, state.status, processUploadedImage]);

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

      // Clear canvas (transparent) - video element shows through underneath
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
            {/* Video element - visible only during selfie preview */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-contain ${
                state.mode === 'webcam' && selfieState === 'preview' ? 'block' : 'hidden'
              }`}
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
            />

            {/* Canvas for rendering captured selfie or uploaded image with overlay */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-contain ${
                (selfieState === 'captured') || state.mode === 'upload'
                  ? 'block' 
                  : 'hidden'
              }`}
              style={{ pointerEvents: 'none', backgroundColor: selfieState === 'captured' ? '#111' : 'transparent' }}
            />

            {/* Loading overlay - show during upload processing OR selfie processing */}
            {(state.status === 'loading' || state.status === 'detecting') && (state.mode === 'upload' || selfieState === 'captured') && (
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
            
            {/* Selfie capture UI - shows when camera is in preview mode */}
            {state.mode === 'webcam' && selfieState === 'preview' && (
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30">
                <div className="text-center mb-4">
                  <p className="text-white text-sm mb-1">Position yourself so your shoulders are visible</p>
                  <p className="text-gray-300 text-xs">Stand back about 4-6 feet for best results</p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={captureSelfie}
                    className="flex items-center gap-2 px-8 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-full font-semibold shadow-lg transition-all hover:scale-105"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    </svg>
                    Take Photo
                  </button>
                </div>
              </div>
            )}

            {/* Camera loading indicator */}
            {state.mode === 'webcam' && state.status === 'loading' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full backdrop-blur-sm z-30">
                <p className="text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  Starting camera...
                </p>
              </div>
            )}

            {/* Processing selfie indicator */}
            {state.mode === 'webcam' && selfieState === 'captured' && state.status === 'detecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
                <div className="px-8 py-6 rounded-xl backdrop-blur-sm bg-black/70">
                  <div className="flex justify-center">
                    <SpinnerIcon />
                  </div>
                  <p className="mt-4 text-white text-center font-medium">Processing your photo...</p>
                  <p className="mt-1 text-sm text-gray-300 text-center">Detecting pose and fitting garment</p>
                </div>
              </div>
            )}

            {/* Ready state - waiting for user action (no image yet) */}
            {state.status === 'ready' && selfieState !== 'preview' && !uploadedImageRef.current && !aiResultImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-30">
                <p className="text-white text-xl font-semibold mb-2">Virtual Try-On</p>
                <p className="text-gray-300 text-sm mb-6">See how this garment looks on you</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={startWebcam}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-colors font-medium shadow-lg"
                  >
                    <CameraIcon />
                    Take a Selfie
                  </button>
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors font-medium">
                    <UploadIcon />
                    Upload Your Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-gray-400 text-xs mt-6 max-w-sm text-center">📸 Take a photo showing your shoulders and upper body for best results</p>
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

            {/* AI Try-On Result Display */}
            {aiResultImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
                <img 
                  src={aiResultImage} 
                  alt="AI Virtual Try-On Result" 
                  className="max-w-full max-h-full object-contain"
                />
                {/* Reset button */}
                <button
                  onClick={() => {
                    setAiResultImage(null);
                    uploadedImageRef.current = null;
                    setState(s => ({ ...s, status: 'ready', mode: null }));
                  }}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium shadow-lg transition-all"
                >
                  Try Another Photo
                </button>
              </div>
            )}

            {/* AI Processing Indicator */}
            {aiProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40">
                <div className="px-8 py-6 rounded-xl backdrop-blur-sm bg-black/70 text-center">
                  <div className="flex justify-center mb-4">
                    <SpinnerIcon />
                  </div>
                  <p className="text-white font-medium text-lg">✨ AI Try-On in Progress</p>
                  <p className="mt-2 text-gray-300 text-sm">Gemini is generating your try-on image...</p>
                  <p className="mt-1 text-gray-400 text-xs">This may take 10-30 seconds</p>
                </div>
              </div>
            )}

            {/* AI Error Display */}
            {aiError && !aiProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-6 z-40">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-white text-lg mb-2">AI Try-On Failed</p>
                <p className="text-gray-300 text-sm text-center max-w-md mb-4">{aiError}</p>
                <button
                  onClick={retakeSelfie}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Status indicators */}
            <div className="absolute top-4 right-4 flex gap-2">
              {useAITryOn && (
                <span className="px-2 py-1 bg-purple-500/80 rounded text-xs text-white">
                  AI ✨
                </span>
              )}
              {!useAITryOn && state.isMediaPipeReady && (
                <span className="px-2 py-1 bg-green-500/80 rounded text-xs text-white">
                  Pose ✓
                </span>
              )}
              {!useAITryOn && state.isOpenCVReady && !state.useSimpleFallback && (
                <span className="px-2 py-1 bg-blue-500/80 rounded text-xs text-white">
                  OpenCV ✓
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {state.status !== 'loading' && state.status !== 'detecting' && (
                <>
                  {/* Show Retake button if selfie was captured, otherwise show Take Selfie / Upload options */}
                  {(selfieState === 'captured' || uploadedImageRef.current) ? (
                    <button
                      onClick={retakeSelfie}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    >
                      <CameraIcon />
                      Take New Photo
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={startWebcam}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                          state.mode === 'webcam' && selfieState === 'preview'
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        <CameraIcon />
                        Take Selfie
                      </button>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium ${
                        state.mode === 'upload' 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                      }`}>
                        <UploadIcon />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* AI Try-On Toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAITryOn}
                  onChange={(e) => setUseAITryOn(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className={useAITryOn ? 'text-purple-700 font-medium' : 'text-gray-600'}>
                  ✨ AI Try-On {useAITryOn && '(Gemini)'}
                </span>
              </label>

              {/* Debug toggle - only show in non-AI mode */}
              {!useAITryOn && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDebug}
                    onChange={(e) => setShowDebug(e.target.checked)}
                    className="rounded"
                  />
                  Show landmarks
                </label>
              )}

              {/* Fallback toggle - only show in non-AI mode */}
              {!useAITryOn && state.isOpenCVReady && (
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
            {useAITryOn ? (
              <>
                <h3 className="font-medium text-gray-900 mb-2">✨ AI Try-On Tips:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload a <strong>clear, well-lit photo</strong> of yourself</li>
                  <li>• <strong>Full upper body</strong> visible works best for tops</li>
                  <li>• Use a <strong>front-facing</strong> photo for most accurate results</li>
                  <li>• AI processing takes <strong>10-30 seconds</strong></li>
                  <li>• Results are generated using <strong>Google Gemini</strong> AI</li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="font-medium text-gray-900 mb-2">📸 Tips for best results:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Stand back</strong> about 4-6 feet from the camera</li>
                  <li>• Make sure your <strong>shoulders and chest</strong> are clearly visible</li>
                  <li>• Face the camera <strong>directly</strong> with good lighting</li>
                  <li>• Wear <strong>fitted clothing</strong> (avoid loose or baggy clothes)</li>
                  <li>• Use a <strong>plain background</strong> if possible</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
