import { temporal, TemporalState } from "zundo";
import { create, StateCreator, UseBoundStore, StoreApi } from "zustand";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { arrayMove } from "@dnd-kit/sortable";

// Define the user interface (simple example)
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Define the Tag interface (simple example)
export interface Tag {
  id: string;
  label: string;
  color?: string; // e.g., 'blue', 'red', 'bg-green-100 text-green-800'
}

// Define the Topic interface (replaces Todo)
export interface Topic {
  id: string;
  title: string; // Renamed from text
  notes?: string[]; // Added notes array
  videos?: Blob[]; // Added videos array (store blobs initially)
  status: string; // Workflow column ID
  coverImageUrl?: string; // Keep for potential video thumbnail
  // Removed: completed, description (notes replace this), tags (optional), dueDate, assignedUserIds, commentsCount, attachmentsCount
}

// Example Users (can be fetched or defined elsewhere)
const exampleUsers: User[] = [
  { id: "u1", name: "Alice", avatarUrl: "https://i.pravatar.cc/150?img=1" },
  { id: "u2", name: "Bob", avatarUrl: "https://i.pravatar.cc/150?img=2" },
  { id: "u3", name: "Charlie", avatarUrl: "https://i.pravatar.cc/150?img=3" },
];

// Example Tags (can be fetched or defined elsewhere)
const exampleTags: Tag[] = [
  { id: "t1", label: "Case Study", color: "bg-blue-100 text-blue-800" },
  { id: "t2", label: "Tutorial", color: "bg-green-100 text-green-800" },
];

// Define the Column definition for the session workflow
// This type is now self-contained within the store
export interface WorkflowColumn {
  id: string;
  title: string;
  color: string;
  isPermanent?: boolean; // Mark key columns like 'Topics', 'Completed'
}

// --- Initial Workflow Column Definitions ---
const initialWorkflowColumns: WorkflowColumn[] = [
  { id: "topics", title: "Topics", color: "#A0AEC0", isPermanent: true }, // gray
  { id: "recording", title: "Recording", color: "#63B3ED", isPermanent: true }, // blue
  { id: "completed", title: "Completed", color: "#68D391", isPermanent: true }, // green
];

// Define the session state shape including actions
export interface SessionState {
  sessionName: string;
  topics: Topic[];
  columns: WorkflowColumn[];
  users: User[];
  tags: Tag[]; // Keep or remove later based on Topic needs
  activeRecordingTopicId: string | null; // Track active recording

  // Actions (Renamed)
  addTopic: (
    topicData: Omit<Topic, "videos" | "notes"> &
      Partial<Pick<Topic, "videos" | "notes">>,
  ) => void; // Simplified Add input
  removeTopic: ({ id }: { id: string }) => void;
  updateTopicTitle: ({ id, title }: { id: string; title: string }) => void;
  addVideoToTopic: ({
    topicId,
    videoBlob,
  }: {
    topicId: string;
    videoBlob: Blob;
  }) => void; // Action to add video blob
  // Add actions for notes/videos later if needed (e.g., addNoteToTopic)
  moveTopic: ({
    topicId,
    targetColumnId,
    overId,
  }: {
    topicId: string;
    targetColumnId: string;
    overId: string;
  }) => void;
  addColumn: ({ title, color }: { title: string; color: string }) => void; // Keep generic add/remove column for now
  removeColumn: ({ id }: { id: string }) => void;
  moveColumn: ({
    activeId,
    overId,
  }: {
    activeId: string;
    overId: string;
  }) => void;
  setSessionName: (name: string) => void; // Action to update session name
  startRecordingSession: ({ topicId }: { topicId: string }) => void; // Action to start recording UI
  endRecordingSession: () => void; // Action to end recording UI
}

// Define the state creator function for the base state
const sessionStoreCreator: StateCreator<SessionState> = (set, get) => ({
  sessionName: "Wavespace Session", // Initial Session Name
  users: exampleUsers,
  tags: exampleTags,
  columns: initialWorkflowColumns,
  activeRecordingTopicId: null, // Initialize as null
  topics: [
    // Example initial topics
    {
      id: "topic-1",
      title: "Introduction Video",
      status: "topics",
      notes: ["Cover project goals", "Mention target audience"],
      videos: [],
    },
    {
      id: "topic-2",
      title: "Case Study: Project X",
      status: "topics",
      notes: [
        "Detail the challenge",
        "Showcase the solution",
        "Highlight results",
      ],
      videos: [],
      coverImageUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3", // Example placeholder
    },
    {
      id: "topic-3",
      title: "Feature Demo: New Dashboard",
      status: "recording",
      notes: ["Screen record walkthrough", "Explain key metrics"],
      videos: [],
    },
    {
      id: "topic-4",
      title: "Onboarding Tutorial",
      status: "completed",
      notes: ["Final version uploaded"],
      videos: [], // Ideally, store reference/URL later
    },
  ],

  // --- Actions Implementation (Renamed and Adjusted) ---

  setSessionName: (name) => set({ sessionName: name }),

  addTopic: (topicData) =>
    set((state) => {
      let status = topicData.status;
      if (!state.columns.some((col) => col.id === status)) {
        console.warn(`Invalid status: ${status}. Defaulting to first column.`);
        status = state.columns[0]?.id || "topics";
      }
      const newTopic: Topic = {
        ...topicData,
        id: topicData.id || crypto.randomUUID(), // Ensure ID exists
        status, // Use validated status
        notes: topicData.notes || [],
        videos: topicData.videos || [],
      };
      return { topics: [...state.topics, newTopic] };
    }),

  removeTopic: ({ id }) =>
    set((state) => ({
      topics: state.topics.filter((topic) => topic.id !== id),
    })),

  updateTopicTitle: ({ id, title }) =>
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === id ? { ...topic, title: title.trim() } : topic,
      ),
    })),

  addVideoToTopic: ({ topicId, videoBlob }) =>
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              videos: [...(topic.videos || []), videoBlob], // Append new blob
            }
          : topic,
      ),
    })),

  moveTopic: ({ topicId, targetColumnId, overId }) => {
    set((state) => {
      const activeIndex = state.topics.findIndex((t) => t.id === topicId);
      if (activeIndex === -1) return {};

      const activeTopic = {
        ...state.topics[activeIndex],
        status: targetColumnId,
      };
      const topicsWithoutActive = state.topics.filter((t) => t.id !== topicId);
      let overIndex = topicsWithoutActive.findIndex((t) => t.id === overId);

      if (overId === targetColumnId) {
        const lastIndexOfTargetColumn = topicsWithoutActive
          .map((t) => t.status)
          .lastIndexOf(targetColumnId);
        overIndex =
          lastIndexOfTargetColumn !== -1
            ? lastIndexOfTargetColumn + 1
            : topicsWithoutActive.length;
      } else if (overIndex !== -1) {
        if (topicsWithoutActive[overIndex].status !== targetColumnId) {
          const lastIndexOfTargetColumn = topicsWithoutActive
            .map((t) => t.status)
            .lastIndexOf(targetColumnId);
          overIndex =
            lastIndexOfTargetColumn !== -1
              ? lastIndexOfTargetColumn + 1
              : topicsWithoutActive.length;
        }
      } else {
        const lastIndexOfTargetColumn = topicsWithoutActive
          .map((t) => t.status)
          .lastIndexOf(targetColumnId);
        overIndex =
          lastIndexOfTargetColumn !== -1
            ? lastIndexOfTargetColumn + 1
            : topicsWithoutActive.length;
      }

      const newTopics = [
        ...topicsWithoutActive.slice(0, overIndex),
        activeTopic,
        ...topicsWithoutActive.slice(overIndex),
      ];
      return { topics: newTopics };
    });
  },

  // --- Column Actions (Keep generic for now) ---
  addColumn: ({ title, color }) =>
    set((state) => {
      const newColumn: WorkflowColumn = {
        id: title.toLowerCase().replace(/\s+/g, "-"), // Simple ID generation
        title,
        color,
        isPermanent: false, // New columns are not permanent by default
      };
      // Avoid duplicate IDs
      if (state.columns.some((col) => col.id === newColumn.id)) {
        console.warn(`Column with ID ${newColumn.id} already exists.`);
        return {};
      }
      return { columns: [...state.columns, newColumn] };
    }),

  removeColumn: ({ id }) =>
    set((state) => {
      const columnToRemove = state.columns.find((col) => col.id === id);
      if (!columnToRemove || columnToRemove.isPermanent) {
        console.warn(`Cannot remove permanent or non-existent column: ${id}`);
        return {}; // Prevent deletion
      }
      // Optionally: Decide what happens to topics in the removed column (e.g., move to default or delete)
      // For now, just remove the column definition
      return {
        columns: state.columns.filter((col) => col.id !== id),
        // topics: state.topics.filter((topic) => topic.status !== id) // Example: Delete topics in column
      };
    }),

  moveColumn: ({ activeId, overId }) =>
    set((state) => {
      const activeIndex = state.columns.findIndex((col) => col.id === activeId);
      const overIndex = state.columns.findIndex((col) => col.id === overId);
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return {}; // No move needed or invalid IDs
      }
      return {
        columns: arrayMove(state.columns, activeIndex, overIndex),
      };
    }),

  // --- Recording Session Management ---
  startRecordingSession: ({ topicId }) => {
    // Optional: Add check if another session is already active?
    // For now, directly set the active ID.
    set({ activeRecordingTopicId: topicId });
  },

  endRecordingSession: () => {
    set({ activeRecordingTopicId: null });
  },
});

// Create the Zustand store, applying temporal middleware to the creator
// The create call uses the base state type. Temporal middleware handles the wrapping.
export const useSessionStore = create<SessionState>()(
  temporal(sessionStoreCreator, {
    // --- Temporal Configuration (Optional Adjustments) ---
    // Limit history size
    limit: 50,

    // Define which parts of the state to track history for
    partialize: (state) => {
      // Exclude fields that shouldn't trigger undo/redo, like transient UI state
      // also exclude activeRecordingTopicId as it's transient UI state
      const { users, tags, activeRecordingTopicId, ...rest } = state;
      return rest; // Track topics, columns, sessionName
    },

    // Optional: Equality function for smarter change detection
    equality: shallow,

    // Optional: Logging for debugging history events
    // onSave: (pastState, currentState) => {
    //   console.log("Temporal Save:", { pastState, currentState });
    // },
  }),
);

// Define the type for the temporal part of the store
type SessionTemporalState = TemporalState<SessionState>;
// Type for the hook/store accessor that Zundo attaches
type SessionTemporalStoreHook = UseBoundStore<StoreApi<SessionTemporalState>>;

export const useSessionHistory = () => {
  // Access the temporal store accessor correctly
  const temporalStoreHook =
    useSessionStore.temporal as SessionTemporalStoreHook;
  // Use useStore to subscribe to the temporal state slice
  const state = useStore(temporalStoreHook);

  // Return default functions if state is not yet available (optional guard)
  if (!state) {
    return {
      undo: () => console.warn("Temporal store not ready."),
      redo: () => console.warn("Temporal store not ready."),
      clear: () => console.warn("Temporal store not ready."),
      canUndo: false,
      canRedo: false,
    };
  }

  // Access state properties and temporal methods correctly
  return {
    undo: (steps?: number) => temporalStoreHook.getState().undo(steps),
    redo: (steps?: number) => temporalStoreHook.getState().redo(steps),
    clear: () => temporalStoreHook.getState().clear(),
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
    // pastStates: state.pastStates, // Optionally expose states
    // futureStates: state.futureStates,
  };
};
