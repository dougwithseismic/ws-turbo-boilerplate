import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import VideoRecorder from "@/features/video-recorder/components/video-recorder"; // Adjusted import path
import {
  CalendarDays,
  MessageSquare,
  MoreHorizontal,
  PlusCircle,
  Video,
  X,
} from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Topic, useSessionStore } from "../store/session-store"; // Adjusted import path

// --- Helper Functions ---

// Create a type for the video take state including the URL
interface VideoTake {
  blob: Blob;
  url: string; // Object URL for the blob
}

// --- TopicCard Component ---
interface TopicCardProps {
  topic: Topic;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  dragHandleProps,
  isOverlay = false,
}) => {
  const {
    removeTopic,
    updateTopicTitle,
    activeRecordingTopicId,
    startRecordingSession,
    // addVideoToTopic, // Get the action from the store
    // removeVideoTake, // Get the action from the store
  } = useSessionStore(
    useShallow((state) => ({
      removeTopic: state.removeTopic,
      updateTopicTitle: state.updateTopicTitle,
      activeRecordingTopicId: state.activeRecordingTopicId,
      startRecordingSession: state.startRecordingSession,
      // addVideoToTopic: state.addVideoToTopic,
      // removeVideoTake: state.removeVideoTake, // Map the action
    })),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(topic.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const [videoTakes, setVideoTakes] = useState<VideoTake[]>([]);

  // Determine if the recorder for THIS card should be active
  const isRecorderActiveForThisCard = activeRecordingTopicId === topic.id;

  // Effect to create and revoke Object URLs for video blobs
  useEffect(() => {
    if (topic.videos && topic.videos.length > 0) {
      const newTakes = topic.videos.map((blob) => ({
        blob: blob,
        url: URL.createObjectURL(blob),
      }));
      setVideoTakes(newTakes);
    } else {
      setVideoTakes([]); // Clear takes if videos array is empty
    }

    // Cleanup function to revoke URLs when component unmounts or videos change
    return () => {
      videoTakes.forEach((take) => URL.revokeObjectURL(take.url));
    };
    // Rerun when topic.videos array reference changes
  }, [topic.videos]);

  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== topic.title) {
      updateTopicTitle({ id: topic.id, title: trimmedText });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditText(topic.title);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  const handleInitiateRecording = (e: React.MouseEvent) => {
    stopPropagation(e);
    startRecordingSession({ topicId: topic.id });
  };

  const handleRemoveTake = (index: number) => {
    console.warn("Remove take functionality: Connect to store action.", {
      topicId: topic.id,
      index,
    });
    // Use the action from the store
    // removeVideoTake({ topicId: topic.id, videoIndex: index });
  };

  return (
    <div
      {...(!isEditing ? dragHandleProps : {})}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 mb-3 group relative overflow-visible ${
        !isEditing ? "cursor-grab active:cursor-grabbing" : ""
      } transition-shadow duration-150 hover:shadow-md ${
        isOverlay
          ? "opacity-95 shadow-xl scale-[1.02] rotate-1 ring-2 ring-primary/50"
          : ""
      } ${isEditing ? "ring-2 ring-primary border-primary" : ""}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {topic.coverImageUrl && (
        <img
          src={topic.coverImageUrl}
          alt={`Cover image for ${topic.title}`}
          className="w-full h-32 object-cover rounded-t-lg mb-1"
        />
      )}

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={stopPropagation}
              onMouseDown={stopPropagation}
              onTouchStart={stopPropagation}
              className="h-auto text-sm font-semibold flex-grow -ml-1 -my-0.5 p-1 rounded border-primary bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
            />
          ) : (
            <span
              className="text-sm font-semibold flex-grow cursor-text -ml-1 -my-0.5 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 line-clamp-1"
              onClick={(e) => {
                stopPropagation(e);
                setIsEditing(true);
              }}
              title={topic.title}
            >
              {topic.title || "Untitled Topic"}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0 -mr-1 -mt-0.5 transition-opacity"
                aria-label="Topic options"
                onClick={stopPropagation}
                onMouseDown={stopPropagation}
                onTouchStart={stopPropagation}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={stopPropagation}
              onMouseDown={stopPropagation}
              onTouchStart={stopPropagation}
            >
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => removeTopic({ id: topic.id })}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Delete Topic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Display Existing Video Takes */}
        {videoTakes.length > 0 && (
          <div className="mt-2 space-y-2 border-t pt-2 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Video Takes:
            </p>
            <div className="space-y-2">
              {videoTakes.map((take, index) => (
                <div
                  key={index}
                  className="relative group w-full aspect-video bg-black rounded overflow-hidden shadow"
                >
                  <video
                    src={take.url}
                    controls
                    preload="metadata" // Load metadata for duration/thumbnail
                    className="w-full h-full object-cover"
                    onClick={stopPropagation} // Prevent card drag when clicking video
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    title={`Take ${index + 1}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {/* Overlay Delete Button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      stopPropagation(e);
                      handleRemoveTake(index);
                    }}
                    title={`Delete Take ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isRecorderActiveForThisCard && (
          <div className="mt-2 border-t pt-2 dark:border-gray-700">
            <VideoRecorder topicId={topic.id} />
          </div>
        )}

        {topic.notes &&
          topic.notes.length > 0 &&
          !isRecorderActiveForThisCard && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t dark:border-gray-600 space-y-1">
              {topic.notes.map((note, index) => (
                <p key={index} className="line-clamp-2">
                  - {note}
                </p>
              ))}
            </div>
          )}

        {!isRecorderActiveForThisCard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 border-dashed hover:border-solid hover:bg-muted/30 text-muted-foreground"
            onClick={handleInitiateRecording}
            disabled={activeRecordingTopicId !== null}
            title={
              activeRecordingTopicId !== null
                ? "Another recording is in progress"
                : "Record new video take"
            }
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Record new take
          </Button>
        )}

        {/* Bottom section with avatars/icons */}
        <div className="flex justify-between items-center pt-2 mt-2 border-t dark:border-gray-700/50">
          {/* Placeholder for Assigned Users - requires data */}
          <div className="flex items-center -space-x-1">
            {/* Example - map over assigned users when data is available */}
            {/* <Avatar className="h-5 w-5 border border-white dark:border-gray-800"><AvatarImage src="..." /><AvatarFallback>U1</AvatarFallback></Avatar> */}
            {/* <Avatar className="h-5 w-5 border border-white dark:border-gray-800"><AvatarFallback>+2</AvatarFallback></Avatar> */}
          </div>

          {/* Right-side Icons */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Placeholder for Comments Count - requires data */}
            <span
              className="flex items-center gap-0.5 cursor-default"
              title="Comments (coming soon)"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {/* {topic.commentsCount || 0} */}0
            </span>
            {/* Video Count */}
            {(topic.videos?.length ?? 0) > 0 && (
              <span
                className="flex items-center gap-0.5 cursor-default"
                title={`${topic.videos?.length} video take(s)`}
              >
                <Video className="h-3.5 w-3.5" />
                {topic.videos?.length}
              </span>
            )}
            {/* Placeholder for Due Date - requires data */}
            <span
              className="flex items-center gap-0.5 cursor-default"
              title="Due Date (coming soon)"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {/* {formatDueDate(topic.dueDate)} */}-
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
