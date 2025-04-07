import * as React from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSessionStore, WorkflowColumn } from "../store/session-store"; // Adjusted import path
import { useShallow } from "zustand/react/shallow";

// Removed local ColumnDefinition type

// --- WorkflowColumnHeader Component ---
const WorkflowColumnHeader: React.FC<{
  column: WorkflowColumn;
  count: number;
  dragHandleProps?: Record<string, unknown>;
}> = ({ column, count, dragHandleProps }) => {
  const { removeColumn } = useSessionStore(
    useShallow((state) => ({
      removeColumn: state.removeColumn,
    })),
  );

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  const handleDelete = () => {
    if (
      !column.isPermanent &&
      confirm(
        `Are you sure you want to delete the "${column.title}" column and all its topics?`,
      )
    ) {
      removeColumn({ id: column.id });
    }
  };

  return (
    <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-200/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-2 z-10 rounded-t-lg border-b border-gray-300 dark:border-gray-700/50">
      <div className="flex items-center gap-2 flex-grow overflow-hidden">
        {/* Drag Handle for Column - Apply dragHandleProps here */}
        <button
          {...dragHandleProps} // Spread the attributes and listeners
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 -ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          aria-label={`Drag column ${column.title}`}
          // Prevent dropdown menu click from triggering drag
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
          // onClick={stopPropagation} // Might not be necessary, test interaction
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {/* Column Color Indicator */}
        <span
          className={`inline-block w-2 h-2 rounded-full flex-shrink-0`}
          style={{ backgroundColor: column.color }}
          title={`Color: ${column.color}`}
        ></span>
        {/* Column Title */}
        <h3
          className="font-semibold text-sm flex-shrink-0 truncate"
          title={column.title}
        >
          {column.title}
        </h3>
        {/* Task Count */}
        <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
          ({count})
        </span>
      </div>

      {/* Column Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
            aria-label="Column options"
            // Stop propagation to prevent interfering with drag handle
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // Stop propagation inside the menu too
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
        >
          {/* Add Edit option later if needed */}
          {/* <DropdownMenuItem>Edit Column</DropdownMenuItem> */}
          {/* Conditionally render delete option */}
          {!column.isPermanent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                // Disable delete for permanent columns (redundant check, but safe)
                disabled={column.isPermanent}
              >
                Delete Column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default WorkflowColumnHeader;
