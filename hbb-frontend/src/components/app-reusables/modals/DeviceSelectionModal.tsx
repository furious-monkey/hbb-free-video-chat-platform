import React, { useState, useEffect, useRef } from "react";
import {
  useMediaDevices,
  MediaDeviceInfo as CustomMediaDeviceInfo,
} from "@/src/hooks/useMediaDevices";
import {
  Camera,
  Mic,
  Volume2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  RotateCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceChange?: (
    type: "video" | "audio" | "audioOutput",
    deviceId: string
  ) => void;
  currentVideoDeviceId?: string;
  currentAudioDeviceId?: string;
  currentAudioOutputDeviceId?: string;
}

const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onClose,
  onDeviceChange,
  currentVideoDeviceId,
  currentAudioDeviceId,
  currentAudioOutputDeviceId,
}) => {
  const {
    videoDevices,
    audioInputDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioInputDevice,
    selectedAudioOutputDevice,
    isLoading,
    error,
    hasPermissions,
    requestPermissions,
    refreshDevices,
    selectVideoDevice,
    selectAudioInputDevice,
    selectAudioOutputDevice,
  } = useMediaDevices();

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>(0);
  const isTestingAudioRef = useRef<boolean>(false);

  // Add state for audio test stream
  const [audioTestStream, setAudioTestStream] = useState<MediaStream | null>(
    null
  );

  // Add state to track if we've checked permissions
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  // Deduplicate devices based on label similarity
  const deduplicateDevices = (
    devices: CustomMediaDeviceInfo[]
  ): CustomMediaDeviceInfo[] => {
    const seen = new Map<string, CustomMediaDeviceInfo>();

    devices.forEach((device) => {
      // Extract the core device name by removing "Default - " prefix and any suffixes in parentheses
      let coreName = device.label;

      // Remove "Default - " prefix if present
      coreName = coreName.replace(/^Default\s*-\s*/i, "");

      // For comparison, create a normalized key
      const normalizedKey = coreName.toLowerCase().trim();

      // If we haven't seen this device yet, add it
      // If we have seen it, prefer the one with "Default" in the label as it's usually the system default
      if (!seen.has(normalizedKey)) {
        seen.set(normalizedKey, device);
      } else {
        // If the current device has "Default" in its label and the stored one doesn't, replace it
        if (
          device.label.toLowerCase().includes("default") &&
          !seen.get(normalizedKey)!.label.toLowerCase().includes("default")
        ) {
          seen.set(normalizedKey, device);
        }
      }
    });

    return Array.from(seen.values());
  };

  // Get deduplicated device lists
  const uniqueVideoDevices = deduplicateDevices(videoDevices);
  const uniqueAudioInputDevices = deduplicateDevices(audioInputDevices);
  const uniqueAudioOutputDevices = deduplicateDevices(audioOutputDevices);

  // Check permissions on mount if modal is open
  useEffect(() => {
    if (isOpen && !hasCheckedPermissions && !hasPermissions && !isLoading) {
      checkExistingPermissions();
    }
  }, [isOpen, hasCheckedPermissions, hasPermissions, isLoading]);

  // Check if we already have permissions
  const checkExistingPermissions = async () => {
    if (isCheckingPermissions) return;

    setIsCheckingPermissions(true);
    console.log("🔍 [DeviceModal] Checking existing permissions...");

    try {
      // Check if we can enumerate devices with labels (indicates permissions granted)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = devices.some((device) => device.label !== "");

      if (hasLabels) {
        console.log(
          "✅ [DeviceModal] Permissions already granted, refreshing devices..."
        );
        // Permissions already granted, just refresh the device list
        await refreshDevices();
      } else {
        console.log(
          "❌ [DeviceModal] No permissions detected, need to request..."
        );
        // No permissions, we'll need to request them
      }
    } catch (error) {
      console.error("❌ [DeviceModal] Error checking permissions:", error);
    } finally {
      setHasCheckedPermissions(true);
      setIsCheckingPermissions(false);
    }
  };

  // Handle device selection
  const handleDeviceSelect = async (
    type: "video" | "audio" | "audioOutput",
    deviceId: string
  ) => {
    try {
      let stream: MediaStream | null = null;

      switch (type) {
        case "video":
          stream = await selectVideoDevice(deviceId);
          if (stream) updatePreviewStream(stream);
          break;
        case "audio":
          stream = await selectAudioInputDevice(deviceId);
          if (stream && isTestingAudio) setupAudioAnalyser(stream);
          break;
        case "audioOutput":
          await selectAudioOutputDevice(deviceId);
          break;
      }

      onDeviceChange?.(type, deviceId);
    } catch (error) {
      console.error(`Failed to select ${type} device:`, error);
    }
  };

  // Update preview stream
  const updatePreviewStream = (stream: MediaStream) => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }
    setPreviewStream(stream);
  };

  // Setup audio analyser for level monitoring
  const setupAudioAnalyser = async (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        console.error("No audio track found in stream");
        return;
      }

      // Check if track is enabled and not muted
      console.log("Audio track enabled:", audioTrack.enabled);
      console.log("Audio track muted:", audioTrack.muted);
      console.log("Audio track settings:", audioTrack.getSettings());

      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Explicitly resume the context to ensure it's running
      if (context.state === "suspended") {
        await context.resume();
      }
      console.log("AudioContext state after resume:", context.state); // Should be 'running'

      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      // Configure for speech detection with less noise sensitivity
      analyserNode.fftSize = 1024; // Balanced resolution for speech
      analyserNode.minDecibels = -80; // Less sensitive to quiet noise
      analyserNode.maxDecibels = -30; // Standard speech range
      analyserNode.smoothingTimeConstant = 0.85; // Enhanced smoothing for jitter

      source.connect(analyserNode);

      // Use a gain node set to 0 to prevent feedback
      const gainNode = context.createGain();
      gainNode.gain.value = 0; // Mute the output to prevent feedback
      analyserNode.connect(gainNode);
      gainNode.connect(context.destination);

      console.log("Audio analyser setup complete");
      console.log("Analyser node:", analyserNode);
      console.log("FFT Size:", analyserNode.fftSize);
      console.log("Frequency bin count:", analyserNode.frequencyBinCount);

      setAudioContext(context);
      setAnalyser(analyserNode);

      // Start monitoring
      console.log("About to start monitoring...");
      monitorAudioLevel(analyserNode);
    } catch (error) {
      console.error("Error setting up audio analyser:", error);
    }
  };

  // Monitor audio level
  const monitorAudioLevel = (analyserNode: AnalyserNode) => {
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const noiseFloor = 10; // Threshold below which we consider it noise
    const speechThreshold = 20; // Minimum level to consider as speech

    const checkLevel = () => {
      if (!analyserNode) {
        console.log("No analyser node available");
        return;
      }

      if (!isTestingAudioRef.current) {
        console.log("Audio testing stopped");
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      // Use frequency data for better audio detection
      analyserNode.getByteFrequencyData(dataArray);

      // Focus on speech frequencies (300Hz to 3.4kHz)
      // With fftSize=512 and 48kHz sample rate, each bin is ~94Hz
      // So speech range is roughly bins 3-36
      const speechStartBin = 3;
      const speechEndBin = 36;

      // Calculate average only for speech frequencies
      let sum = 0;
      let count = 0;
      for (
        let i = speechStartBin;
        i < speechEndBin && i < dataArray.length;
        i++
      ) {
        sum += dataArray[i];
        count++;
      }
      const average = count > 0 ? sum / count : 0;

      // Apply noise floor - if below threshold, treat as 0
      const adjustedAverage = average > noiseFloor ? average - noiseFloor : 0;

      // Convert to percentage with speech-appropriate scaling
      // Map the adjusted average (0-245 after noise floor) to 0-100%
      let level = 0;
      if (adjustedAverage > 0) {
        // Use a more linear mapping for speech levels
        level = Math.min(100, (adjustedAverage / 100) * 100);

        // Apply additional threshold for very quiet sounds
        if (level < 5) {
          level = 0;
        }
      }

      console.log(
        "Audio level:",
        level.toFixed(1),
        "Average:",
        average.toFixed(1),
        "Adjusted:",
        adjustedAverage.toFixed(1)
      );

      setAudioLevel(level);

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    console.log("Starting audio monitoring...");
    checkLevel();
  };

  // Toggle audio test
  const toggleAudioTest = async () => {
    if (isTestingAudio) {
      // Stop testing
      setIsTestingAudio(false);
      isTestingAudioRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioTestStream) {
        audioTestStream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stopped audio track:", track.label);
        });
        setAudioTestStream(null);
      }
      if (audioContext) {
        await audioContext.close();
        setAudioContext(null);
        setAnalyser(null);
      }
      setAudioLevel(0);
    } else {
      // Start testing
      setIsTestingAudio(true);
      isTestingAudioRef.current = true;
      setAudioLevel(0);

      try {
        // Get the selected device or use default
        const deviceId = selectedAudioInputDevice || currentAudioDeviceId;
        const constraints = {
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true, // Enable echo cancellation
                noiseSuppression: true, // Enable noise suppression
                autoGainControl: true, // Enable auto gain control
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
          video: false,
        };

        console.log("Starting audio test with constraints:", constraints);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const audioTrack = stream.getAudioTracks()[0];

        if (!audioTrack) {
          throw new Error("No audio track available");
        }

        console.log(
          "Audio track obtained:",
          audioTrack.label,
          "Enabled:",
          audioTrack.enabled
        );
        console.log("Audio track settings:", audioTrack.getSettings());

        setAudioTestStream(stream);

        // Setup audio analyser
        await setupAudioAnalyser(stream);

        // Auto stop after 10 seconds
        setTimeout(() => {
          if (isTestingAudioRef.current) {
            toggleAudioTest(); // Call toggle to properly cleanup
          }
        }, 10000);
      } catch (error) {
        console.error("Failed to start audio test:", error);
        setIsTestingAudio(false);
        isTestingAudioRef.current = false;
        setAudioLevel(0);
        if (error instanceof Error) {
          toast.error(`Microphone access error: ${error.message}`);
        }
      }
    }
  };

  // Initialize camera preview
  useEffect(() => {
    if (
      isOpen &&
      hasPermissions &&
      uniqueVideoDevices.length > 0 &&
      !previewStream
    ) {
      (async () => {
        try {
          const deviceId =
            selectedVideoDevice ||
            currentVideoDeviceId ||
            uniqueVideoDevices[0].deviceId;
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          updatePreviewStream(stream);
        } catch (error) {
          console.error("Failed to start preview:", error);
        }
      })();
    }
  }, [
    isOpen,
    hasPermissions,
    uniqueVideoDevices.length,
    selectedVideoDevice,
    currentVideoDeviceId,
  ]);

  // Cleanup
  useEffect(() => {
    if (!isOpen) {
      // Clean up when modal closes
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
        setPreviewStream(null);
      }
      if (audioTestStream) {
        audioTestStream.getTracks().forEach((track) => track.stop());
        setAudioTestStream(null);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
        setAnalyser(null);
      }
      setAudioLevel(0);
      setIsTestingAudio(false);
      // Reset permission check state when modal closes
      setHasCheckedPermissions(false);
    }

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
      if (audioTestStream) {
        audioTestStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Show loading state while checking permissions
  const showLoading = isLoading || isCheckingPermissions;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-custom-shadow max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Device Settings
            </h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] no-scrollbar">
          {/* Permissions Request */}
          {!hasPermissions && hasCheckedPermissions && !showLoading && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-200">
                  Camera and microphone access required
                </p>
                <p className="text-xs text-yellow-200/60 mt-1">
                  We need permission to show your available devices
                </p>
                <Button
                  onClick={requestPermissions}
                  disabled={showLoading}
                  variant="yellow"
                  className="mt-3 h-9"
                >
                  'Grant Permissions'
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {showLoading && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-200">
                  Camera and microphone access required
                </p>
                <p className="text-xs text-yellow-200/60 mt-1">
                  We need permission to show your available devices
                </p>
                <Button disabled variant="yellow" className="mt-3 h-9">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isCheckingPermissions ? "Checking..." : "Requesting..."}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-200">Error</p>
                <p className="text-xs text-red-200/60">{error}</p>
              </div>
            </div>
          )}

          {hasPermissions && !showLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Preview */}
              <div className="space-y-6">
                {/* Camera Preview */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#F1E499]" />
                    Camera Preview
                  </h3>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {previewStream ? (
                      <video
                        ref={(video) => {
                          if (
                            video &&
                            previewStream &&
                            video.srcObject !== previewStream
                          ) {
                            video.srcObject = previewStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-white/20 mx-auto mb-2" />
                          <p className="text-sm text-white/40">
                            No camera selected
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Level Monitor */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-[#6AB5D2]" />
                      Audio Test
                    </h3>
                    <Button
                      onClick={toggleAudioTest}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white"
                    >
                      {isTestingAudio ? (
                        <>
                          <Square className="w-3 h-3 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Audio Level Bar */}
                  <div className="relative h-8 bg-white/10 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6AB5D2] to-[#4A90E2] transition-all duration-100 ease-out"
                      style={{
                        width: `${audioLevel}%`,
                        opacity: isTestingAudio
                          ? audioLevel > 0
                            ? 1
                            : 0.3
                          : 0.3,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white/60">
                        {isTestingAudio
                          ? audioLevel > 0
                            ? `Level: ${Math.round(audioLevel)}%`
                            : "Speak to test microphone..."
                          : "Click test to check audio levels"}
                      </span>
                    </div>
                  </div>

                  {/* Visual audio level indicators */}
                  {isTestingAudio && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[...Array(10)].map((_, i) => {
                        const threshold = i * 10;
                        const isActive = audioLevel > threshold;
                        const barHeight = isActive
                          ? Math.min(
                              32,
                              Math.max(8, (audioLevel - threshold) * 3)
                            )
                          : 8;

                        return (
                          <div
                            key={i}
                            className="transition-all duration-100"
                            style={{
                              backgroundColor: isActive
                                ? audioLevel > 70
                                  ? "#EF4444"
                                  : audioLevel > 40
                                  ? "#F59E0B"
                                  : "#10B981"
                                : "rgba(255, 255, 255, 0.1)",
                              height: `${barHeight}px`,
                              width: "8px",
                              borderRadius: "2px",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Device Selectors */}
              <div className="space-y-6">
                {/* Camera Selection */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-[#F1E499]" />
                    Camera
                  </label>
                  <Select
                    value={selectedVideoDevice || currentVideoDeviceId || ""}
                    onValueChange={(value) =>
                      handleDeviceSelect("video", value)
                    }
                  >
                    <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a camera" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {uniqueVideoDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="text-white hover:bg-white/10"
                        >
                          {device.label ||
                            `Camera ${device.deviceId.slice(-4)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uniqueVideoDevices.length === 0 && (
                    <p className="text-xs text-white/40 mt-2">
                      No cameras detected
                    </p>
                  )}
                </div>

                {/* Microphone Selection */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                    <Mic className="w-4 h-4 text-[#6AB5D2]" />
                    Microphone
                  </label>
                  <Select
                    value={
                      selectedAudioInputDevice || currentAudioDeviceId || ""
                    }
                    onValueChange={(value) =>
                      handleDeviceSelect("audio", value)
                    }
                  >
                    <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a microphone" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {uniqueAudioInputDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="text-white hover:bg-white/10"
                        >
                          {device.label ||
                            `Microphone ${device.deviceId.slice(-4)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uniqueAudioInputDevices.length === 0 && (
                    <p className="text-xs text-white/40 mt-2">
                      No microphones detected
                    </p>
                  )}
                </div>

                {/* Speaker Selection */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                    <Volume2 className="w-4 h-4 text-[#C3E1ED]" />
                    Speakers
                  </label>
                  <Select
                    value={
                      selectedAudioOutputDevice ||
                      currentAudioOutputDeviceId ||
                      ""
                    }
                    onValueChange={(value) =>
                      handleDeviceSelect("audioOutput", value)
                    }
                  >
                    <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select speakers" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {uniqueAudioOutputDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="text-white hover:bg-white/10"
                        >
                          {device.label ||
                            `Speaker ${device.deviceId.slice(-4)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uniqueAudioOutputDevices.length === 0 && (
                    <p className="text-xs text-white/40 mt-2">
                      No speakers detected
                    </p>
                  )}
                </div>

                {/* Device Status */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Device Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Cameras detected:</span>
                      <span className="text-white flex items-center gap-1">
                        {uniqueVideoDevices.length}
                        {uniqueVideoDevices.length > 0 && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">
                        Microphones detected:
                      </span>
                      <span className="text-white flex items-center gap-1">
                        {uniqueAudioInputDevices.length}
                        {uniqueAudioInputDevices.length > 0 && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Speakers detected:</span>
                      <span className="text-white flex items-center gap-1">
                        {uniqueAudioOutputDevices.length}
                        {uniqueAudioOutputDevices.length > 0 && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <Button
              onClick={refreshDevices}
              disabled={showLoading}
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {showLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Refresh Devices
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={onClose}
                variant="yellow"
                className="h-10 shadow-custom-shadow"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelectionModal;
