import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Camera, Mic, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface MediaPermissionsHandlerProps {
  onPermissionsGranted: () => void;
  onPermissionsDenied: (error: string) => void;
  children?: React.ReactNode;
}

interface PermissionState {
  camera: 'prompt' | 'granted' | 'denied' | 'checking';
  microphone: 'prompt' | 'granted' | 'denied' | 'checking';
}

const MediaPermissionsHandler: React.FC<MediaPermissionsHandlerProps> = ({
  onPermissionsGranted,
  onPermissionsDenied,
  children
}) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'checking',
    microphone: 'checking'
  });
  const [error, setError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    try {
      // Check if permissions API is available
      if (!navigator.permissions) {
        // Fallback: try to access devices to determine permission state
        await requestPermissions();
        return;
      }

      // Check camera permission
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      // Check microphone permission
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      setPermissions({
        camera: cameraStatus.state as 'prompt' | 'granted' | 'denied',
        microphone: micStatus.state as 'prompt' | 'granted' | 'denied'
      });

      // Listen for permission changes
      cameraStatus.onchange = () => {
        setPermissions(prev => ({ ...prev, camera: cameraStatus.state as 'prompt' | 'granted' | 'denied' }));
      };
      micStatus.onchange = () => {
        setPermissions(prev => ({ ...prev, microphone: micStatus.state as 'prompt' | 'granted' | 'denied' }));
      };

    } catch (err) {
      // Permissions API not supported or error - try direct access
      await requestPermissions();
    }
  }, []);

  // Request permissions by trying to access devices
  const requestPermissions = useCallback(async () => {
    setIsRequestingPermissions(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Successfully got stream - permissions granted
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions({
        camera: 'granted',
        microphone: 'granted'
      });
      
      onPermissionsGranted();
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera and microphone access denied. Please allow access in your browser settings.');
        setPermissions({
          camera: 'denied',
          microphone: 'denied'
        });
        onPermissionsDenied('Permissions denied by user');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera or microphone found. Please connect a device.');
        onPermissionsDenied('No devices found');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera or microphone is already in use by another application.');
        onPermissionsDenied('Devices already in use');
      } else {
        setError(`Failed to access camera/microphone: ${errorMessage}`);
        onPermissionsDenied(errorMessage);
      }
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [onPermissionsGranted, onPermissionsDenied]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Auto-request if both are in prompt state
  useEffect(() => {
    if (permissions.camera === 'prompt' || permissions.microphone === 'prompt') {
      // Don't auto-request, let user click the button
    } else if (permissions.camera === 'granted' && permissions.microphone === 'granted') {
      onPermissionsGranted();
    }
  }, [permissions, onPermissionsGranted]);

  // If permissions are granted and no error, render children
  if (permissions.camera === 'granted' && permissions.microphone === 'granted' && !error) {
    return <>{children}</>;
  }

  // Render permission request UI with GetPaidModal styling
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4 shadow-custom-shadow border border-white/10">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Camera className="w-8 h-8 text-[#F1E499]" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Camera & Microphone Access
            </h2>
            <p className="text-white/60 text-sm">
              To start your stream, we need access to your camera and microphone.
            </p>
          </div>

          {/* Permission Status */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-white/60" />
                <span className="text-sm font-medium text-white">Camera</span>
              </div>
              <PermissionIndicator status={permissions.camera} />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-white/60" />
                <span className="text-sm font-medium text-white">Microphone</span>
              </div>
              <PermissionIndicator status={permissions.microphone} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-200">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={requestPermissions}
            disabled={isRequestingPermissions}
            className="w-full h-11 bg-[#F1E499] hover:bg-[#E8D872] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-custom-shadow flex items-center justify-center"
          >
            {isRequestingPermissions ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting Permissions...
              </>
            ) : (
              'Grant Permissions'
            )}
          </button>

          {/* Help Text */}
          <p className="mt-4 text-xs text-white/40">
            Your browser may show a popup asking for permission. Please click "Allow" to continue.
          </p>
        </div>
      </div>
    </div>
  );
};

// Permission status indicator component
const PermissionIndicator: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'granted':
      return (
        <span className="flex items-center text-green-400 text-xs">
          <CheckCircle className="w-4 h-4 mr-1" />
          Granted
        </span>
      );
    case 'denied':
      return (
        <span className="flex items-center text-red-400 text-xs">
          <XCircle className="w-4 h-4 mr-1" />
          Denied
        </span>
      );
    case 'checking':
      return (
        <span className="text-white/40 text-xs">
          Checking...
        </span>
      );
    default:
      return (
        <span className="text-yellow-400 text-xs">
          Not requested
        </span>
      );
  }
};

export default MediaPermissionsHandler;