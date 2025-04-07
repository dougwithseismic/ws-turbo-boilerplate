import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { Topic } from "../store/session-store"; // Adjusted import path
import TopicCard from "./topic-card"; // Corrected import path

// Renamed Component
const SortableTopicCard: React.FC<{ todo: Topic }> = ({ todo }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, data: { type: "Task", task: todo } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-opacity duration-150 ease-in-out`}
    >
      <TopicCard
        topic={todo}
        dragHandleProps={{ ...attributes, ...listeners }}
        isOverlay={isDragging}
      />
    </div>
  );
};

export default SortableTopicCard;
