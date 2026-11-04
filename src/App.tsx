/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraHUD } from './components/CameraHUD';
import { CameraControls } from './components/CameraControls';
import { SettingsModal } from './components/SettingsModal';
import { QuickNoteModal } from './components/QuickNoteModal';
import { StorageFolderModal } from './components/StorageFolderModal';
import { GoogleMapsModal } from './components/GoogleMapsModal';
import {
  StampConfig,
  GeoData,
  CaptureMode,
  CameraFacingMode,
} from './types/camera';
import {
  DEFAULT_STAMP_CONFIG,
  getSavedStampConfig,
  saveStampConfig,
} from './utils/storage';
import {
  formatCoordinates,
  formatHeading,
  formatFieldDateTime,
  reverseGeocode,
  getMapTileImage,
} from './utils/geo';
import { drawWatermarkFrame } from './utils/watermark';
import { SimulatedCameraStream } from './utils/simulatedStream';
import {
  saveStraightToPhone,
  getStoredDirectoryHandle,
  isFolderAccessSupported,
} from './utils/deviceStorage';

export default function App() {
  // Config & State
  const [stampConfig, setStampConfig] = useState<StampConfig>(getSavedStampConfig);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('environment');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Phone Device Storage State
  const [phoneFolderName, setPhoneFolderName] = useState<string | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState<boolean>(false);
  const [isGoogleMapsOpen, setIsGoogleMapsOpen] = useState<boolean>(false);

  // Camera & Stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const simulatedStreamObjRef = useRef<SimulatedCameraStream | null>(null);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState<boolean>(false);

  // Video recording recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recTimerIntervalRef = useRef<number | null>(null);
  const videoRenderLoopIdRef = useRef<number | null>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Geolocation & Orientation state
  const [geoData, setGeoData] = useState<GeoData>({
    latitude: 37.7793,
    longitude: -122.4192,
    altitude: 22,
    accuracy: 6,
    heading: 42,
    headingCardinal: 'NE',
    pitch: 0,
    roll: 0,
    address: 'Civic Center Plaza, San Francisco, CA',
    isLoadingAddress: false,
    isLocked: true,
    isSimulated: true, // initial state until live GPS provides lock
    lastUpdated: Date.now(),
  });

  // Cached map tile canvas
  const [mapTileCanvas, setMapTileCanvas] = useState<HTMLCanvasElement | null>(null);

  // Custom logo image object
  const customLogoImgRef = useRef<HTMLImageElement | null>(null);

  // Load custom logo if stored in config
  useEffect(() => {
    if (stampConfig.customLogoDataUrl) {
      const img = new Image();
      img.src = stampConfig.customLogoDataUrl;
      customLogoImgRef.current = img;
    } else {
      customLogoImgRef.current = null;
    }
  }, [stampConfig.customLogoDataUrl]);

  // Check stored phone storage directory handle on startup
  useEffect(() => {
    getStoredDirectoryHandle().then((handle) => {
      if (handle) {
        setPhoneFolderName(handle.name);
      }
    });
  }, []);

  // Update Mini-Map tile whenever lat/lon changes
  useEffect(() => {
    if (geoData.latitude !== null && geoData.longitude !== null) {
      getMapTileImage(geoData.latitude, geoData.longitude, 15).then((canvas) => {
        setMapTileCanvas(canvas);
      });
    }
  }, [geoData.latitude, geoData.longitude]);

  // Reverse Geocoding trigger
  const lastFetchedCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (geoData.latitude === null || geoData.longitude === null) return;
    if (geoData.isSimulated && geoData.address) return; // Keep preset address if simulated

    const last = lastFetchedCoordsRef.current;
    if (
      !last ||
      Math.abs(geoData.latitude - last.lat) > 0.0003 ||
      Math.abs(geoData.longitude - last.lon) > 0.0003
    ) {
      lastFetchedCoordsRef.current = { lat: geoData.latitude, lon: geoData.longitude };
      setGeoData((prev) => ({ ...prev, isLoadingAddress: true }));
      reverseGeocode(geoData.latitude, geoData.longitude).then((addr) => {
        setGeoData((prev) => ({
          ...prev,
          address: addr,
          isLoadingAddress: false,
        }));
      });
    }
  }, [geoData.latitude, geoData.longitude, geoData.isSimulated]);

  // Live Hardware Geolocation Watcher
  const geoWatchIdRef = useRef<number | null>(null);
  const startLiveGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) return;

    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
    }

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, altitude, accuracy } = pos.coords;
        setGeoData((prev) => ({
          ...prev,
          latitude,
          longitude,
          altitude: altitude ?? prev.altitude ?? 0,
          accuracy: accuracy ?? 5,
          isLocked: true,
          isSimulated: false,
          lastUpdated: Date.now(),
        }));
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err);
        // Fallback to simulated location so UI stays functional
        setGeoData((prev) => ({
          ...prev,
          isLocked: false,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 12000,
      }
    );
  }, []);

  useEffect(() => {
    startLiveGeolocation();
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [startLiveGeolocation]);

  // Compass / Device Orientation Listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading for iOS Safari, e.alpha for Android/Chrome
      let heading: number | null = null;
      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        const hInfo = formatHeading(heading);
        setGeoData((prev) => ({
          ...prev,
          heading,
          headingCardinal: hInfo.cardinal,
          pitch: e.beta !== null ? Math.round(e.beta) : prev.pitch,
          roll: e.gamma !== null ? Math.round(e.gamma) : prev.roll,
        }));
      }
    };

    window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Web Audio shutter click sound generator
  const playShutterSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // Ignore audio failure
    }
  }, []);

  // Splash screen dismissal helper
  const dismissSplash = useCallback(() => {
    const splash = document.getElementById('splash-screen');
    if (splash && !splash.classList.contains('fade-out')) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        try {
          splash.remove();
        } catch (e) {
          // ignore if already removed
        }
      }, 400); // Clean up DOM
    }
  }, []);

  // Camera initialization
  const startCamera = useCallback(async () => {
    // Stop prior streams
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (simulatedStreamObjRef.current) {
      simulatedStreamObjRef.current.stop();
      simulatedStreamObjRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = stream;
      setIsSimulatedCamera(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          dismissSplash();
        };
        videoRef.current.play().catch(() => {});
      }

      // Check for torch / flash capability on the video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
        setHasTorch('torch' in capabilities);
      }

      // Try acquiring microphone stream for video recordings
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = micStream;
      } catch (err) {
        console.warn('Microphone permission not granted; video will be muted.');
      }
    } catch (err) {
      console.warn('Physical camera unavailable or denied. Starting simulated optic feed:', err);
      // Fallback to simulated feed
      const sim = new SimulatedCameraStream(1280, 720);
      simulatedStreamObjRef.current = sim;
      const simStream = sim.getStream();
      activeStreamRef.current = simStream;
      setIsSimulatedCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = simStream;
        videoRef.current.onloadedmetadata = () => {
          dismissSplash();
        };
        videoRef.current.play().catch(() => {});
      }
    }
  }, [facingMode, dismissSplash]);

  useEffect(() => {
    startCamera();

    // Safety fallback timer in case video metadata event already fired or delayed
    const timer = setTimeout(() => {
      dismissSplash();
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (simulatedStreamObjRef.current) {
        simulatedStreamObjRef.current.stop();
      }
    };
  }, [startCamera, dismissSplash]);

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!activeStreamRef.current) return;
    const videoTrack = activeStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const nextState = !torchActive;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchActive(nextState);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  };

  // Switch Camera Front / Back
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Save capture directly into phone storage (or device folder if granted)
  const handleSaveCapture = useCallback(async (blob: Blob, filename: string) => {
    await saveStraightToPhone(blob, filename);
  }, []);

  // PHOTO CAPTURE HANDLER
  const handleCapturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger flash animation & tactile audio
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 260);

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentFormattedTime = formatFieldDateTime();

    // Draw frame with full watermark
    drawWatermarkFrame({
      ctx,
      width,
      height,
      videoElement: video,
      geoData,
      stampConfig,
      mapCanvas: mapTileCanvas,
      customLogoImg: customLogoImgRef.current,
      showGridReticle: false, // Don't burn the grid guide into final photo
      dateTimeStr: currentFormattedTime,
    });

    // Generate JPEG blob and save straight to phone
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const cleanSite = (stampConfig.siteId || 'SITE').replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `Photo_${cleanSite}_${dateStr}_${Date.now()}.jpg`;

        await handleSaveCapture(blob, filename);
      },
      'image/jpeg',
      0.92
    );
  };

  // VIDEO RECORDING START / STOP
  const handleStartRecording = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const recCanvas = document.createElement('canvas');
    recCanvas.width = width;
    recCanvas.height = height;
    recordingCanvasRef.current = recCanvas;
    const recCtx = recCanvas.getContext('2d');
    if (!recCtx) return;

    // Draw loop that bakes watermark into every video frame
    const renderVideoFrame = () => {
      drawWatermarkFrame({
        ctx: recCtx,
        width,
        height,
        videoElement: video,
        geoData,
        stampConfig,
        mapCanvas: mapTileCanvas,
        customLogoImg: customLogoImgRef.current,
        showGridReticle: false,
        dateTimeStr: formatFieldDateTime(),
      });
      videoRenderLoopIdRef.current = requestAnimationFrame(renderVideoFrame);
    };

    videoRenderLoopIdRef.current = requestAnimationFrame(renderVideoFrame);

    // Capture stream from canvas at 30fps
    const canvasStream = recCanvas.captureStream(30);

    // Merge audio if available
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioStreamRef.current && audioStreamRef.current.getAudioTracks().length > 0) {
      combinedTracks.push(audioStreamRef.current.getAudioTracks()[0]);
    }
    const combinedStream = new MediaStream(combinedTracks);

    // Select supported mimeType
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMime = type;
        break;
      }
    }

    try {
      const recorder = new MediaRecorder(combinedStream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      const startTimestamp = Date.now();
      const currentFormattedTime = formatFieldDateTime();

      recorder.onstop = async () => {
        if (videoRenderLoopIdRef.current !== null) {
          cancelAnimationFrame(videoRenderLoopIdRef.current);
          videoRenderLoopIdRef.current = null;
        }

        const videoBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || 'video/webm',
        });

        const cleanSite = (stampConfig.siteId || 'SITE').replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateStr = new Date().toISOString().slice(0, 10);
        const ext = (selectedMime && selectedMime.includes('mp4')) ? 'mp4' : 'webm';
        const filename = `Video_${cleanSite}_${dateStr}_${Date.now()}.${ext}`;

        await handleSaveCapture(videoBlob, filename);

        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start(500); // chunk every 500ms
      setIsRecording(true);
      setRecordingSeconds(0);

      recTimerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      if (videoRenderLoopIdRef.current !== null) {
        cancelAnimationFrame(videoRenderLoopIdRef.current);
      }
    }
  };

  const handleStopRecording = () => {
    if (recTimerIntervalRef.current !== null) {
      clearInterval(recTimerIntervalRef.current);
      recTimerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleShutterPress = () => {
    if (captureMode === 'photo') {
      handleCapturePhoto();
    } else {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  // Delete media item
  // Save updated config
  const handleSaveConfig = (newConfig: StampConfig) => {
    setStampConfig(newConfig);
    saveStampConfig(newConfig);
  };

  // Simulated Location selection
  const handleSelectSimulatedLocation = (lat: number, lon: number, alt: number, addr: string) => {
    setGeoData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      altitude: alt,
      accuracy: 3,
      address: addr,
      isLocked: true,
      isSimulated: true,
      lastUpdated: Date.now(),
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white select-none overflow-hidden relative">
      {/* Hidden processing canvas */}
      <canvas ref={renderCanvasRef} className="hidden" />

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Shutter Flash Animation Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white pointer-events-none animate-shutter-flash z-30" />
        )}

        {/* Camera HUD (Top Status, Reticle, and Live Watermark Overlay) */}
        <CameraHUD
          geoData={geoData}
          stampConfig={stampConfig}
          mapTileCanvas={mapTileCanvas}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          hasTorch={hasTorch}
          torchActive={torchActive}
          showGrid={showGrid}
          onToggleTorch={handleToggleTorch}
          onToggleGrid={() => setShowGrid((prev) => !prev)}
          onSwitchCamera={handleSwitchCamera}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenQuickNote={() => setIsQuickNoteOpen(true)}
          onOpenGoogleMaps={() => setIsGoogleMapsOpen(true)}
          isSimulatedCamera={isSimulatedCamera}
          onRetryPhysicalCamera={startCamera}
        />
      </div>

      {/* Bottom Tactical Controls Bar */}
      <CameraControls
        captureMode={captureMode}
        onSetCaptureMode={setCaptureMode}
        isRecording={isRecording}
        onShutterPress={handleShutterPress}
        phoneFolderName={phoneFolderName}
        onConfigureStorage={() => setIsStorageModalOpen(true)}
        onOpenQuickNote={() => setIsQuickNoteOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        stampConfig={stampConfig}
        onSaveConfig={handleSaveConfig}
        onSelectSimulatedLocation={handleSelectSimulatedLocation}
        onResetToLiveGPS={startLiveGeolocation}
        isSimulatedGPS={geoData.isSimulated}
      />

      {/* Quick Field Observation Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        currentNotes={stampConfig.customNotes}
        onSaveNotes={(notes) => handleSaveConfig({ ...stampConfig, customNotes: notes })}
      />

      {/* Phone Storage Access Modal */}
      <StorageFolderModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        currentFolderName={phoneFolderName}
        onFolderConnected={(name) => setPhoneFolderName(name)}
      />

      {/* Google Maps Grounding Modal */}
      <GoogleMapsModal
        isOpen={isGoogleMapsOpen}
        onClose={() => setIsGoogleMapsOpen(false)}
        geoData={geoData}
        onApplyAddressToStamp={(newAddress) => {
          setGeoData((prev) => ({ ...prev, address: newAddress }));
        }}
      />
    </div>
  );
}
