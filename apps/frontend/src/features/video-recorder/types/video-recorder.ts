export type ResolutionKey = "480p" | "720p" | "1080p";

export const resolutions: Record<
  ResolutionKey,
  MediaTrackConstraints["height"]
> = {
  "480p": { ideal: 480 },
  "720p": { ideal: 720 },
  "1080p": { ideal: 1080 },
};

export interface VideoRecorderState {
  isRecording: boolean;
  stream: MediaStream | null;
  recordedBlob: Blob | null;
  error: string | null;
  previewUrl: string | null;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  selectedVideoDeviceId: string;
  selectedResolution: ResolutionKey;
  hasPermission: boolean | null;
  isInitializing: boolean; // To track initial setup/permission request
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
}

export interface VideoRecorderActions {
  getDevices: () => Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  } | null>;
  startRecording: () => void;
  stopRecording: () => void;
  saveRecording: () => void;
  recordAgain: () => void;
  cleanup: () => void;
  cancelRecording: () => void;
  resetState: () => void;
  setAudioDevice: (deviceId: string) => void;
  setVideoDevice: (deviceId: string) => void;
  setResolution: (resolution: ResolutionKey) => void;
  retryPermissions: () => void;
  setupStream: () => Promise<void>;
}

export interface UseVideoRecorderParams {
  topicId: string;
  onSaveSuccess?: () => void; // Optional callback after saving
}

export interface UseVideoRecorderReturn
  extends VideoRecorderState,
    VideoRecorderActions {
  videoRef: React.RefObject<HTMLVideoElement>;
}
