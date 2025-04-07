import { useRef, useEffect, useCallback } from "react";
import { create } from "zustand";
import {
  ResolutionKey,
  resolutions,
  VideoRecorderState,
  VideoRecorderActions,
  UseVideoRecorderParams,
  UseVideoRecorderReturn,
} from "../types/video-recorder";
import { useSessionStore } from "@/store/session-store";
import { useShallow } from "zustand/react/shallow";

// Define the store interface combining state and actions
interface VideoRecorderStore extends VideoRecorderState, VideoRecorderActions {
  topicId?: string;
  addVideoToTopic?: (payload: { topicId: string; videoBlob: Blob }) => void;
}

// Add initial state constant for reuse
const initialState: Omit<
  VideoRecorderStore,
  keyof VideoRecorderActions | "topicId" | "addVideoToTopic"
> = {
  isRecording: false,
  stream: null,
  recordedBlob: null,
  error: null,
  previewUrl: null,
  audioDevices: [],
  videoDevices: [],
  selectedAudioDeviceId: "",
  selectedVideoDeviceId: "",
  selectedResolution: "720p",
  hasPermission: null,
  isInitializing: true, // Default to true
  mediaRecorder: null,
  recordedChunks: [],
};

// Create the Zustand store
const useVideoRecorderStore = create<VideoRecorderStore>((set, get) => ({
  ...initialState, // Use the constant for initial state
  // Initial state for dependencies (kept separate)
  topicId: undefined,
  addVideoToTopic: undefined,

  // Actions
  getDevices: async () => {
    const { selectedAudioDeviceId, selectedVideoDeviceId } = get();
    console.log("Store Action: getDevices running...");
    try {
      console.log("Attempting to get user media for permission check...");
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Permission likely granted, enumerating devices...");
      set({ hasPermission: true, error: null });

      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Devices enumerated:", devices);
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      const defaultAudioId = audioInputs[0]?.deviceId || "";
      const defaultVideoId = videoInputs[0]?.deviceId || "";

      set({
        audioDevices: audioInputs,
        videoDevices: videoInputs,
        selectedAudioDeviceId:
          selectedAudioDeviceId &&
          audioInputs.some((d) => d.deviceId === selectedAudioDeviceId)
            ? selectedAudioDeviceId
            : defaultAudioId,
        selectedVideoDeviceId:
          selectedVideoDeviceId &&
          videoInputs.some((d) => d.deviceId === selectedVideoDeviceId)
            ? selectedVideoDeviceId
            : defaultVideoId,
        isInitializing: false,
      });

      console.log("Devices set in store.");
      return { audioInputs, videoInputs };
    } catch (err) {
      console.error("Error enumerating devices or getting permissions:", err);
      const errorMsg =
        "Could not access camera/microphone. Please check browser permissions.";
      set({
        error: errorMsg,
        hasPermission: false,
        isInitializing: false,
        audioDevices: [],
        videoDevices: [],
      });
      console.log("Permission error set in store.");
      return null;
    }
  },
  startRecording: () => {
    console.log("Store Action: startRecording called");
    const { stream } = get();
    if (!stream) {
      console.error("startRecording failed: Stream is not available.");
      set({ error: "Cannot start recording: camera stream not ready." });
      return;
    }
    set({ recordedChunks: [], mediaRecorder: null });
    const options = { mimeType: "video/webm;codecs=vp9,opus" };
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      try {
        const fallbackOptions = { mimeType: "video/webm" };
        recorder = new MediaRecorder(stream, fallbackOptions);
      } catch (e2) {
        set({ error: "Recording format not supported by this browser." });
        return;
      }
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        set((state) => ({
          recordedChunks: [...state.recordedChunks, event.data],
        }));
      }
    };
    recorder.onstop = () => {
      const { recordedChunks, mediaRecorder, stream: streamToStop } = get();
      console.log(
        "MediaRecorder onstop: Stopping tracks for stream:",
        streamToStop?.id,
      );
      if (!mediaRecorder) {
        console.warn("MediaRecorder onstop: No mediaRecorder found in state.");
        return;
      }
      const blob = new Blob(recordedChunks, {
        type: mediaRecorder.mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      console.log("MediaRecorder onstop: Blob created, preview URL:", url);
      set({
        recordedBlob: blob,
        isRecording: false,
        previewUrl: url,
        stream: null,
        mediaRecorder: null,
      });
      console.log("MediaRecorder onstop: State updated for preview.");
      if (streamToStop) {
        streamToStop.getTracks().forEach((track) => {
          track.stop();
          console.log(
            `MediaRecorder onstop: Stopped track ${track.kind} (${track.label})`,
          );
        });
      } else {
        console.warn(
          "MediaRecorder onstop: Could not find original stream reference to stop tracks.",
        );
      }
    };
    recorder.onerror = (event) => {
      set({
        error: "An error occurred during recording.",
        isRecording: false,
        mediaRecorder: null,
        recordedChunks: [],
      });
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      set({ stream: null });
    };
    try {
      recorder.start();
      set({
        isRecording: true,
        mediaRecorder: recorder,
        error: null,
        recordedBlob: null,
      });
    } catch (error) {
      set({
        error: "Failed to start recording.",
        isRecording: false,
        mediaRecorder: null,
      });
    }
  },
  stopRecording: () => {
    console.log("Store Action: stopRecording called");
    const { mediaRecorder, isRecording } = get();
    if (mediaRecorder && isRecording && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    } else {
      if (isRecording) {
        set({ isRecording: false });
      }
    }
  },
  saveRecording: () => {
    console.log("Store Action: saveRecording called");
    const { recordedBlob, topicId, addVideoToTopic, cleanup } = get();

    if (recordedBlob && topicId && addVideoToTopic) {
      console.log(`Saving video for topic: ${topicId}`);
      try {
        addVideoToTopic({ topicId, videoBlob: recordedBlob });
        console.log("Video added via session store.");
        cleanup();
      } catch (error) {
        console.error("Error saving video:", error);
        set({ error: "Failed to save the video." });
      }
    } else {
      console.warn(
        "saveRecording called but blob, topicId, or addVideoToTopic is missing.",
        {
          hasBlob: !!recordedBlob,
          hasTopicId: !!topicId,
          hasAddVideo: !!addVideoToTopic,
        },
      );
      set({ error: "Could not save recording. Missing data." });
    }
  },
  recordAgain: () => {
    console.log("Store Action: recordAgain called");
    const { previewUrl } = get();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    set({
      recordedBlob: null,
      previewUrl: null,
      error: null,
      isRecording: false,
      recordedChunks: [],
    });
    get().setupStream();
  },
  cleanup: () => {
    console.log("Cleanup executing from store...");
    const { stream, previewUrl, mediaRecorder } = get();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    // Reset most state, but keep permission status and devices
    // Set isInitializing false as cleanup marks end of an active session
    set((state) => ({
      ...initialState, // Reset to base initial state
      isInitializing: false, // Mark as NOT initializing after cleanup
      // Preserve existing permissions and devices if they were fetched
      hasPermission: state.hasPermission,
      audioDevices: state.audioDevices,
      videoDevices: state.videoDevices,
      selectedAudioDeviceId: state.selectedAudioDeviceId,
      selectedVideoDeviceId: state.selectedVideoDeviceId,
      selectedResolution: state.selectedResolution,
    }));
    console.log("Store state partially reset by cleanup.");
  },
  cancelRecording: () => {
    console.log("Store Action: cancelRecording called");
    get().cleanup(); // Just call cleanup
  },
  resetState: () => {
    console.log("Store Action: resetState called");
    // Explicitly reset to initial state, ensuring isInitializing is true
    set({ ...initialState, isInitializing: true });
    // Dependencies (topicId etc) are not reset here, handled by hook sync effect
  },
  setAudioDevice: (deviceId) => {
    const { isRecording } = get();
    set({ selectedAudioDeviceId: deviceId });
    if (!isRecording) {
      get().setupStream();
    }
  },
  setVideoDevice: (deviceId) => {
    const { isRecording } = get();
    set({ selectedVideoDeviceId: deviceId });
    if (!isRecording) {
      get().setupStream();
    }
  },
  setResolution: (resolution) => {
    const { isRecording } = get();
    set({ selectedResolution: resolution });
    if (!isRecording) {
      get().setupStream();
    }
  },
  retryPermissions: () => {
    console.log("retryPermissions called");
    set({ hasPermission: null, error: null, isInitializing: true });
    get().setupStream();
  },
  setupStream: async () => {
    console.log("Store Action: setupStream running...");
    const {
      previewUrl,
      stream: currentStream,
      hasPermission,
      audioDevices,
      videoDevices,
      selectedAudioDeviceId,
      selectedVideoDeviceId,
      selectedResolution,
    } = get();

    set({ error: null, recordedBlob: null, isInitializing: true });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      set({ previewUrl: null });
    }
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      console.log("Stopped existing stream tracks.");
      set({ stream: null });
    }

    let currentAudioDevices = audioDevices;
    let currentVideoDevices = videoDevices;
    let permissionGranted = hasPermission;

    if (permissionGranted !== true) {
      console.log("Permission not confirmed, calling getDevices...");
      const devicesResult = await get().getDevices();
      if (!devicesResult) {
        console.error(
          "setupStream failed: Could not get devices or permission.",
        );
        set({ isInitializing: false });
        return;
      }
      currentAudioDevices = devicesResult.audioInputs;
      currentVideoDevices = devicesResult.videoInputs;
      permissionGranted = get().hasPermission;
    }

    if (!permissionGranted) {
      console.error("setupStream failed: Permission denied.");
      set({ isInitializing: false });
      return;
    }

    const audioId = currentAudioDevices.find(
      (d) => d.deviceId === selectedAudioDeviceId,
    )
      ? selectedAudioDeviceId
      : currentAudioDevices[0]?.deviceId;
    const videoId = currentVideoDevices.find(
      (d) => d.deviceId === selectedVideoDeviceId,
    )
      ? selectedVideoDeviceId
      : currentVideoDevices[0]?.deviceId;

    console.log("Final selected audio device ID:", audioId);
    console.log("Final selected video device ID:", videoId);

    if (!audioId || !videoId) {
      const errorMsg = "No suitable audio or video devices found.";
      console.error("setupStream Error:", errorMsg);
      set({ error: errorMsg, isInitializing: false });
      return;
    }

    const constraints: MediaStreamConstraints = {
      audio: { deviceId: { exact: audioId } },
      video: {
        deviceId: { exact: videoId },
        height: resolutions[selectedResolution] || resolutions["720p"],
      },
    };

    console.log("Attempting getUserMedia with constraints:", constraints);
    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      console.log("getUserMedia successful, stream received:", mediaStream);
      set({
        stream: mediaStream,
        hasPermission: true,
        error: null,
        isInitializing: false,
        selectedAudioDeviceId: audioId,
        selectedVideoDeviceId: videoId,
      });
    } catch (err) {
      console.error("Error accessing media devices with constraints:", err);
      const errorMsg =
        "Could not start video stream. Check selected devices/resolution or permissions.";
      set({
        error: errorMsg,
        hasPermission: false,
        stream: null,
        isInitializing: false,
      });
    }
  },
}));

// The custom hook itself
export const useVideoRecorder = ({
  topicId,
}: UseVideoRecorderParams): UseVideoRecorderReturn => {
  const state = useVideoRecorderStore();
  const { addVideoToTopic, endRecordingSession } = useSessionStore(
    useShallow((state) => ({
      addVideoToTopic: state.addVideoToTopic,
      endRecordingSession: state.endRecordingSession,
    })),
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Effect to synchronize hook props/external state with the Zustand store
  useEffect(() => {
    console.log("Syncing dependencies to store:", { topicId });
    useVideoRecorderStore.setState({
      topicId: topicId,
      addVideoToTopic: addVideoToTopic,
    });
  }, [topicId, addVideoToTopic]);

  // Effect to reset state on mount and handle initial setup
  useEffect(() => {
    console.log("Mount effect: Resetting state and checking initialization.");
    state.resetState();
  }, [state.resetState]);

  // Effect for triggering setupStream based on isInitializing state
  useEffect(() => {
    console.log(
      "Setup/Retry effect running... isInitializing:",
      state.isInitializing,
    );
    if (state.isInitializing) {
      console.log("Calling setupStream because isInitializing is true.");
      state.setupStream();
    }
  }, [state.isInitializing, state.setupStream]);

  // Effect for running cleanup ONLY on component unmount
  useEffect(() => {
    return () => {
      console.log("Running cleanup on component unmount...");
      // Only run internal cleanup, session end is handled by actions
      state.cleanup();
      // Remove endRecordingSession from here
    };
    // Remove endRecordingSession dependency
  }, [state.cleanup]);

  // Effect to manage video element source and handle autoplay
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const { stream, previewUrl } = state;

    if (previewUrl) {
      if (videoElement.src !== previewUrl) {
        console.log("Effect: Setting video source to Preview URL");
        videoElement.srcObject = null;
        videoElement.src = previewUrl;
        videoElement.load();
        videoElement.controls = true;
        videoElement.muted = false;
        videoElement.play().catch((error) => {
          console.warn("Preview autoplay prevented:", error);
        });
      }
    } else if (stream) {
      if (videoElement.srcObject !== stream) {
        console.log("Effect: Setting video source to Live Stream");
        videoElement.src = "";
        videoElement.srcObject = stream;
        videoElement.load();
        videoElement.controls = false;
        videoElement.muted = true;
        videoElement.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.warn("Live stream playback failed:", error);
          }
        });
      }
    } else {
      if (videoElement.srcObject || videoElement.src) {
        console.log("Effect: Clearing video source");
        videoElement.srcObject = null;
        videoElement.src = "";
        videoElement.controls = false;
        videoElement.muted = true;
      }
    }
  }, [state.stream, state.previewUrl]);

  // Wrap cancelRecording to also end the global session
  const cancelRecordingWrapped = useCallback(() => {
    state.cancelRecording(); // Call the store's cleanup
    endRecordingSession(); // End the global session immediately
  }, [state.cancelRecording, endRecordingSession]);

  // Wrap saveRecording to also end the global session (if successful)
  const saveRecordingWrapped = useCallback(() => {
    const originalSave = state.saveRecording; // Get the store's save action
    originalSave(); // Call the original save (which includes internal cleanup)
    // Check if the internal save resulted in an error before ending session
    // Get the latest state directly from the store after save attempt
    const currentState = useVideoRecorderStore.getState();
    if (!currentState.error) {
      console.log("Save successful (no error), ending global session.");
      endRecordingSession(); // End the global session immediately after save attempt IF NO ERROR
    } else {
      console.warn(
        "Save resulted in an error, not ending global session automatically.",
      );
      // Optionally, still end session on error? Depends on desired UX.
      // endRecordingSession();
    }
  }, [state.saveRecording, endRecordingSession]);

  // Return all state and actions, including wrapped ones
  return {
    ...state,
    videoRef,
    cancelRecording: cancelRecordingWrapped,
    saveRecording: saveRecordingWrapped,
  };
};
