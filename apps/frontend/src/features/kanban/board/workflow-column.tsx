import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  useSessionStore,
  Topic,
  WorkflowColumn as WorkflowColumnType,
  SessionState,
} from "../store/session-store"; // Adjusted import path
import { useShallow } from "zustand/react/shallow";
import ColumnHeader from "./workflow-column-header";
import SortableTopicCard from "../card/sortable-topic-card"; // Adjusted import path

// WorkflowColumn Component
interface WorkflowColumnProps {
  column: WorkflowColumnType;
  topics: Topic[];
}

const WorkflowColumn: React.FC<WorkflowColumnProps> = ({ column, topics }) => {
  const { addTopic } = useSessionStore(
    useShallow((state: SessionState) => ({ addTopic: state.addTopic })),
  );
  const topicIds = React.useMemo(() => topics.map((t) => t.id), [topics]);

  // Make the column itself sortable
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "Column", column: column }, // Pass column data
    // Disable dragging column via its body, only allow via handle in header
    // This might not be strictly needed depending on interaction design
    // but can prevent accidental drags when interacting with tasks.
    disabled: false, // Keep enabled, drag handle controls initiation
  });

  // Droppable setup for tasks INTO this column
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      accepts: ["Task"], // This column accepts Tasks
    },
  });

  const handleAddTask = () => {
    const title = prompt("Enter new topic title:");
    if (title && title.trim()) {
      addTopic({
        id: crypto.randomUUID(),
        title: title.trim(),
        status: column.id,
      });
    }
  };

  // Style for the sortable column
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    opacity: isDragging ? 0.8 : 1,
    // Add a border or shadow when dragging for visual feedback
    boxShadow: isDragging ? "0 0 15px rgba(0,0,0,0.2)" : undefined,
    zIndex: isDragging ? 10 : 1, // Ensure dragging column is above others
    height: "fit-content", // Ensure column shrinks/grows with content
    maxHeight: "calc(100vh - 150px)", // Example max height, adjust as needed
  };

  // Determine if this column is the active drop target for a TASK
  const isTaskDropTarget = isOver; // Simplified: isOver from useDroppable relates to tasks

  return (
    <div
      ref={setNodeRef} // Ref for the sortable container
      style={style}
      className={`w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg flex flex-col border-2 ${
        isTaskDropTarget
          ? "border-dashed border-primary border-2 bg-primary/5 dark:bg-primary/10"
          : "border-transparent dark:border-transparent"
      } ${isDragging ? "border-solid border-primary" : ""}
      transition-all duration-150 ease-in-out relative`}
    >
      {/* Pass sortable attributes and listeners to the header for the drag handle */}
      <ColumnHeader
        column={column}
        count={topics.length}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      <div
        ref={setDroppableNodeRef}
        className="flex-grow flex flex-col min-h-[50px]"
      >
        {" "}
        {/* Ref for the droppable area for tasks */}
        <SortableContext
          items={topicIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-y-auto overflow-x-hidden px-2 space-y-0 mb-2 rounded flex-grow">
            {topics.map((topic) => (
              <SortableTopicCard key={topic.id} todo={topic} />
            ))}
            {topics.length === 0 && !isTaskDropTarget && (
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 italic">
                Drop topics here
              </div>
            )}
            {isTaskDropTarget && (
              <div className="h-10 rounded border-2 border-dashed border-primary/50 bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary/80 text-sm my-1 mx-1">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm text-gray-600 dark:text-gray-300 mt-auto mx-1 mb-1 px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700/60 flex-shrink-0"
          onClick={handleAddTask}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add topic
        </Button>
      </div>
    </div>
  );
};

export default WorkflowColumn;
