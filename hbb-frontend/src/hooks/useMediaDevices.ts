// src/hooks/useMediaDevices.ts - Media device selection and management
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
  groupId: string;
}

export interface DeviceSelectionState {
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedVideoDevice: string | null;
  selectedAudioInputDevice: string | null;
  selectedAudioOutputDevice: string | null;
  isLoading: boolean;
  error: string | null;
  hasPermissions: boolean;
}

export interface UseMediaDevicesReturn extends DeviceSelectionState {
  // Device management
  refreshDevices: () => Promise<void>;
  selectVideoDevice: (deviceId: string) => Promise<MediaStream | null>;
  selectAudioInputDevice: (deviceId: string) => Promise<MediaStream | null>;
  selectAudioOutputDevice: (deviceId: string) => Promise<void>;
  
  // Stream management
  getCurrentStream: () => MediaStream | null;
  createStreamWithDevices: (videoDeviceId?: string, audioDeviceId?: string) => Promise<MediaStream | null>;
  switchVideoDevice: (deviceId: string) => Promise<boolean>;
  switchAudioDevice: (deviceId: string) => Promise<boolean>;
  
  // Permissions
  requestPermissions: () => Promise<boolean>;
  
  // Device monitoring
  startDeviceMonitoring: () => void;
  stopDeviceMonitoring: () => void;
}

const STORAGE_KEYS = {
  VIDEO_DEVICE: 'selectedVideoDevice',
  AUDIO_INPUT_DEVICE: 'selectedAudioInputDevice',
  AUDIO_OUTPUT_DEVICE: 'selectedAudioOutputDevice',
};

export const useMediaDevices = (): UseMediaDevicesReturn => {
  const [state, setState] = useState<DeviceSelectionState>({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],
    selectedVideoDevice: null,
    selectedAudioInputDevice: null,
    selectedAudioOutputDevice: null,
    isLoading: true,
    error: null,
    hasPermissions: false,
  });

  const currentStreamRef = useRef<MediaStream | null>(null);
  const deviceMonitoringRef = useRef<boolean>(false);
  const mountedRef = useRef(true);

  // Load saved device preferences
  const loadSavedPreferences = useCallback(() => {
    try {
      const savedVideoDevice = localStorage.getItem(STORAGE_KEYS.VIDEO_DEVICE);
      const savedAudioInputDevice = localStorage.getItem(STORAGE_KEYS.AUDIO_INPUT_DEVICE);
      const savedAudioOutputDevice = localStorage.getItem(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE);

      setState(prev => ({
        ...prev,
        selectedVideoDevice: savedVideoDevice,
        selectedAudioInputDevice: savedAudioInputDevice,
        selectedAudioOutputDevice: savedAudioOutputDevice,
      }));
    } catch (error) {
      console.warn('Failed to load device preferences:', error);
    }
  }, []);

  // Save device preference
  const saveDevicePreference = useCallback((key: string, deviceId: string) => {
    try {
      localStorage.setItem(key, deviceId);
    } catch (error) {
      console.warn('Failed to save device preference:', error);
    }
  }, []);

  // Check if we have media permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const audioResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      const hasPermissions = result.state === 'granted' && audioResult.state === 'granted';
      
      if (mountedRef.current) {
        setState(prev => ({ ...prev, hasPermissions }));
      }
      
      return hasPermissions;
    } catch (error) {
      console.warn('Permission check failed:', error);
      return false;
    }
  }, []);

  // Request media permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request access to get device list with labels
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Stop the temporary stream immediately
      tempStream.getTracks().forEach(track => track.stop());

      if (mountedRef.current) {
        setState(prev => ({ ...prev, hasPermissions: true, isLoading: false }));
        await refreshDevices();
      }

      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          hasPermissions: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Permission denied'
        }));
      }
      
      return false;
    }
  }, []);

  // Refresh available devices
  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices: MediaDeviceInfo[] = [];
      const audioInputDevices: MediaDeviceInfo[] = [];
      const audioOutputDevices: MediaDeviceInfo[] = [];

      devices.forEach(device => {
        const deviceInfo: MediaDeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${videoDevices.length + audioInputDevices.length + 1}`,
          kind: device.kind as MediaDeviceInfo['kind'],
          groupId: device.groupId
        };

        switch (device.kind) {
          case 'videoinput':
            videoDevices.push(deviceInfo);
            break;
          case 'audioinput':
            audioInputDevices.push(deviceInfo);
            break;
          case 'audiooutput':
            audioOutputDevices.push(deviceInfo);
            break;
        }
      });

      if (mountedRef.current) {
        setState(prev => {
          const newState = {
            ...prev,
            videoDevices,
            audioInputDevices,
            audioOutputDevices,
            isLoading: false,
          };

          // Auto-select first devices if none selected and devices are available
          if (!prev.selectedVideoDevice && videoDevices.length > 0) {
            newState.selectedVideoDevice = videoDevices[0].deviceId;
          }
          if (!prev.selectedAudioInputDevice && audioInputDevices.length > 0) {
            newState.selectedAudioInputDevice = audioInputDevices[0].deviceId;
          }
          if (!prev.selectedAudioOutputDevice && audioOutputDevices.length > 0) {
            newState.selectedAudioOutputDevice = audioOutputDevices[0].deviceId;
          }

          return newState;
        });
      }

      console.log('📱 Devices refreshed:', {
        video: videoDevices.length,
        audioInput: audioInputDevices.length,
        audioOutput: audioOutputDevices.length
      });
    } catch (error) {
      console.error('Failed to refresh devices:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to get devices'
        }));
      }
    }
  }, []);

  // Create stream with specific devices
  const createStreamWithDevices = useCallback(async (
    videoDeviceId?: string,
    audioDeviceId?: string
  ): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? {
          deviceId: { exact: videoDeviceId },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        } : false,
        audio: audioDeviceId ? {
          deviceId: { exact: audioDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop previous stream
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      currentStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Failed to create stream with devices:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create stream'
      }));
      return null;
    }
  }, []);

  // Select video device
  const selectVideoDevice = useCallback(async (deviceId: string): Promise<MediaStream | null> => {
    try {
      setState(prev => ({ ...prev, selectedVideoDevice: deviceId, error: null }));
      saveDevicePreference(STORAGE_KEYS.VIDEO_DEVICE, deviceId);
      
      return await createStreamWithDevices(deviceId, state.selectedAudioInputDevice || undefined);
    } catch (error) {
      console.error('Failed to select video device:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to select video device'
      }));
      return null;
    }
  }, [state.selectedAudioInputDevice, createStreamWithDevices, saveDevicePreference]);

  // Select audio input device
  const selectAudioInputDevice = useCallback(async (deviceId: string): Promise<MediaStream | null> => {
    try {
      setState(prev => ({ ...prev, selectedAudioInputDevice: deviceId, error: null }));
      saveDevicePreference(STORAGE_KEYS.AUDIO_INPUT_DEVICE, deviceId);
      
      return await createStreamWithDevices(state.selectedVideoDevice || undefined, deviceId);
    } catch (error) {
      console.error('Failed to select audio input device:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to select audio device'
      }));
      return null;
    }
  }, [state.selectedVideoDevice, createStreamWithDevices, saveDevicePreference]);

  // Select audio output device (for speakers/headphones)
  const selectAudioOutputDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, selectedAudioOutputDevice: deviceId, error: null }));
      saveDevicePreference(STORAGE_KEYS.AUDIO_OUTPUT_DEVICE, deviceId);
      
      // Apply to existing audio elements if possible
      const audioElements = document.querySelectorAll('audio, video');
      
      for (let i = 0; i < audioElements.length; i++) {
        const audioElement = audioElements[i] as HTMLAudioElement | HTMLVideoElement;
        if ('setSinkId' in audioElement && typeof audioElement.setSinkId === 'function') {
          (audioElement.setSinkId(deviceId).catch((error: any) => {
            console.warn('Failed to set sink for element:', error);
          }));
        }
      }
    } catch (error) {
      console.error('Failed to select audio output device:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to select output device'
      }));
    }
  }, [saveDevicePreference]);

  // Switch video device (more advanced with producer replacement)
  const switchVideoDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const newStream = await selectVideoDevice(deviceId);
      return !!newStream;
    } catch (error) {
      console.error('Failed to switch video device:', error);
      return false;
    }
  }, [selectVideoDevice]);

  // Switch audio device
  const switchAudioDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const newStream = await selectAudioInputDevice(deviceId);
      return !!newStream;
    } catch (error) {
      console.error('Failed to switch audio device:', error);
      return false;
    }
  }, [selectAudioInputDevice]);

  // Get current stream
  const getCurrentStream = useCallback((): MediaStream | null => {
    return currentStreamRef.current;
  }, []);

  // Start device monitoring
  const startDeviceMonitoring = useCallback(() => {
    if (deviceMonitoringRef.current) return;

    deviceMonitoringRef.current = true;
    
    const handleDeviceChange = () => {
      console.log('📱 Media devices changed, refreshing...');
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      deviceMonitoringRef.current = false;
    };
  }, [refreshDevices]);

  // Stop device monitoring
  const stopDeviceMonitoring = useCallback(() => {
    deviceMonitoringRef.current = false;
  }, []);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;
    
    const initialize = async () => {
      loadSavedPreferences();
      
      const hasPermissions = await checkPermissions();
      if (hasPermissions) {
        await refreshDevices();
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadSavedPreferences, checkPermissions, refreshDevices]);

  return {
    // State
    ...state,
    
    // Device management
    refreshDevices,
    selectVideoDevice,
    selectAudioInputDevice,
    selectAudioOutputDevice,
    
    // Stream management
    getCurrentStream,
    createStreamWithDevices,
    switchVideoDevice,
    switchAudioDevice,
    
    // Permissions
    requestPermissions,
    
    // Device monitoring
    startDeviceMonitoring,
    stopDeviceMonitoring,
  };
};