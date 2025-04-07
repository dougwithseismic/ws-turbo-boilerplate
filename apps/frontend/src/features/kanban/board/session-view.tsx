import { Button } from "@/components/ui/button";
import {
  Active,
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Topic, useSessionStore } from "../store/session-store"; // Adjusted import path
import TopicCard from "../card/topic-card"; // Adjusted import path
import WorkflowColumnComponent from "./workflow-column"; // Adjusted import path

const SessionView: React.FC = () => {
  const { topics, columns, moveTopic, moveColumn, addColumn } = useSessionStore(
    useShallow((state) => ({
      topics: state.topics,
      columns: state.columns,
      moveTopic: state.moveTopic,
      moveColumn: state.moveColumn,
      addColumn: state.addColumn,
    })),
  );

  const [activeItem, setActiveItem] = useState<Active | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddColumn = () => {
    const title = prompt("Enter new column title:");
    if (title && title.trim()) {
      const color = prompt(
        "Enter column color (e.g., 'blue', 'red', '#ff00ff'):",
        "#cccccc",
      );
      addColumn({ title: title.trim(), color: color || "#cccccc" });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveItem(active);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add logic here if you need visual feedback during column/task drag over
    // For instance, highlighting potential drop zones slightly.
    // Keep it simple for now.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (
      activeType === "Column" &&
      overType === "Column" &&
      activeId !== overId
    ) {
      moveColumn({ activeId, overId });
      return;
    }

    if (activeType === "Task") {
      const activeTask = active.data.current?.task as Topic;
      if (!activeTask) return;

      let targetColumnId: string | null = null;
      const targetOverId: string = overId;

      if (overType === "Column") {
        targetColumnId = overId;
      } else if (overType === "Task") {
        // Ensure task data exists before accessing status
        const overTask = over.data.current?.task as Topic | undefined;
        targetColumnId = overTask?.status || null;
      } else {
        return;
      }

      if (!targetColumnId) return;

      if (activeTask.status !== targetColumnId || activeId !== overId) {
        moveTopic({ topicId: activeId, targetColumnId, overId: targetOverId });
      }
      return;
    }
  };

  const topicsByColumn = React.useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.id] = topics.filter((topic) => topic.status === column.id);
        return acc;
      },
      {} as Record<string, Topic[]>,
    );
  }, [topics, columns]);

  const columnIds = React.useMemo(
    () => columns.map((col) => col.id),
    [columns],
  );

  const activeTask =
    activeItem?.data.current?.type === "Task"
      ? (activeItem.data.current.task as Topic)
      : undefined;
  const activeColumn =
    activeItem?.data.current?.type === "Column"
      ? columns.find((col) => col.id === activeItem.id)
      : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 items-start overflow-x-auto pb-4 p-4 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-200px)]">
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((columnDef) => (
            <WorkflowColumnComponent
              key={columnDef.id}
              column={columnDef}
              topics={topicsByColumn[columnDef.id] ?? []}
            />
          ))}
        </SortableContext>
        <Button
          variant="outline"
          className="h-10 w-72 flex-shrink-0 mt-1 border-dashed border-2 hover:border-solid hover:bg-muted/50"
          onClick={handleAddColumn}
        >
          <Plus className="h-4 w-4 mr-2" /> Add workflow column
        </Button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TopicCard topic={activeTask} isOverlay={true} />
        ) : activeColumn ? (
          <div className="w-72 flex-shrink-0 bg-gray-200/90 dark:bg-gray-800/90 p-1 rounded-lg shadow-xl opacity-95 rotate-1 border-2 border-primary/50 flex flex-col h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-300/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-2 z-10 rounded-t-lg border-b border-gray-400 dark:border-gray-700/50">
              <div className="flex items-center gap-2 flex-grow overflow-hidden">
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ backgroundColor: activeColumn.color }}
                ></span>
                <h3
                  className="font-semibold text-sm flex-shrink-0 truncate"
                  title={activeColumn.title}
                >
                  {activeColumn.title}
                </h3>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
                  ({topicsByColumn[activeColumn.id]?.length ?? 0})
                </span>
              </div>
            </div>
            <div className="text-center text-muted-foreground p-4 text-sm italic">
              Moving Column...
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SessionView;
