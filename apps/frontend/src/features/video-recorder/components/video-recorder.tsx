import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Circle,
  StopCircle,
  Check,
  X,
  RotateCcw,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useVideoRecorder } from "../hooks/use-video-recorder";
import { resolutions, ResolutionKey } from "../types/video-recorder";

interface VideoRecorderProps {
  topicId: string;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ topicId }) => {
  const {
    videoRef,
    isRecording,
    recordedBlob,
    error,
    audioDevices,
    videoDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    selectedResolution,
    hasPermission,
    isInitializing,
    startRecording,
    stopRecording,
    saveRecording,
    recordAgain,
    cancelRecording,
    setAudioDevice,
    setVideoDevice,
    setResolution,
    retryPermissions,
  } = useVideoRecorder({
    topicId,
  });

  const [showSettings, setShowSettings] = useState(false);

  const isActionDisabled = isInitializing || hasPermission === false;

  return (
    <div className="space-y-3 p-3 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50 shadow-inner">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-300 dark:border-red-700">
          {error}
          {hasPermission === false && (
            <Button
              variant="link"
              size="sm"
              onClick={retryPermissions}
              className="ml-2 p-0 h-auto text-red-600 dark:text-red-400 underline"
            >
              Retry Permissions?
            </Button>
          )}
        </p>
      )}

      <div className="relative aspect-video bg-black rounded overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          className="w-full h-full object-cover"
        />
        <Button
          onClick={cancelRecording}
          size="icon"
          variant="ghost"
          className="absolute top-1.5 right-1.5 text-white bg-black/30 hover:bg-black/50 h-6 w-6 rounded-full z-10"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>

        {isRecording && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/80 text-white px-1.5 py-0.5 rounded text-xs font-medium z-10">
            <Circle className="h-2.5 w-2.5 fill-current" />
            REC
          </div>
        )}
        {isInitializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
            Initializing Camera...
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-3 mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          title="Device Settings"
          className="p-1.5 h-auto"
          disabled={isInitializing}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {!isRecording && !recordedBlob && (
          <Button
            onClick={startRecording}
            size="sm"
            disabled={isActionDisabled}
            className="px-4"
          >
            <Camera className="h-4 w-4 mr-1" />
            Record
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            size="sm"
            variant="destructive"
            className="px-4"
          >
            <StopCircle className="h-4 w-4 mr-1" />
            Stop
          </Button>
        )}

        {recordedBlob && (
          <>
            <Button
              onClick={saveRecording}
              size="icon"
              variant="ghost"
              className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
              title="Save Take"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              onClick={recordAgain}
              size="icon"
              variant="ghost"
              title="Record Again"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mb-1 bg-gray-100 dark:bg-gray-900/40 border dark:border-gray-700 rounded-md shadow-sm">
          <div className="space-y-1">
            <Label htmlFor="video-device" className="text-xs font-medium">
              Webcam
            </Label>
            <Select
              value={selectedVideoDeviceId}
              onValueChange={setVideoDevice}
              disabled={
                videoDevices.length === 0 ||
                hasPermission === false ||
                isInitializing
              }
            >
              <SelectTrigger id="video-device" className="h-8 text-xs">
                <SelectValue placeholder="Select webcam..." />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-xs"
                  >
                    {device.label ||
                      `Camera ${device.deviceId.substring(0, 6)}`}
                  </SelectItem>
                ))}
                {videoDevices.length === 0 && !isInitializing && (
                  <SelectItem value="" disabled>
                    No webcams found
                  </SelectItem>
                )}
                {isInitializing && (
                  <SelectItem value="" disabled>
                    Loading devices...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="audio-device" className="text-xs font-medium">
              Microphone
            </Label>
            <Select
              value={selectedAudioDeviceId}
              onValueChange={setAudioDevice}
              disabled={
                audioDevices.length === 0 ||
                hasPermission === false ||
                isInitializing
              }
            >
              <SelectTrigger id="audio-device" className="h-8 text-xs">
                <SelectValue placeholder="Select microphone..." />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className="text-xs"
                  >
                    {device.label || `Mic ${device.deviceId.substring(0, 6)}`}
                  </SelectItem>
                ))}
                {audioDevices.length === 0 && !isInitializing && (
                  <SelectItem value="" disabled>
                    No microphones found
                  </SelectItem>
                )}
                {isInitializing && (
                  <SelectItem value="" disabled>
                    Loading devices...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="resolution" className="text-xs font-medium">
              Resolution
            </Label>
            <Select
              value={selectedResolution}
              onValueChange={(value) => setResolution(value as ResolutionKey)}
              disabled={hasPermission === false || isInitializing}
            >
              <SelectTrigger id="resolution" className="h-8 text-xs">
                <SelectValue placeholder="Select resolution..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(resolutions).map((resKey) => (
                  <SelectItem key={resKey} value={resKey} className="text-xs">
                    {resKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
