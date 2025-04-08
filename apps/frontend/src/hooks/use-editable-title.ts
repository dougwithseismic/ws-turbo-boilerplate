import { useState, useEffect, useRef, useCallback } from "react";

interface UseEditableTitleProps {
  initialTitle: string;
  onSave: (newTitle: string) => void;
}

export function useEditableTitle({
  initialTitle,
  onSave,
}: UseEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state if initialTitle changes externally
  useEffect(() => {
    setEditText(initialTitle);
  }, [initialTitle]);

  const handleSave = useCallback(() => {
    const trimmedText = editText.trim();
    // Only save if the title has actually changed and is not empty
    if (trimmedText && trimmedText !== initialTitle) {
      onSave(trimmedText);
    } else {
      // Reset to initial title if trimmed text is empty or unchanged
      setEditText(initialTitle);
    }
    setIsEditing(false);
  }, [editText, initialTitle, onSave]);

  const handleCancel = useCallback(() => {
    setEditText(initialTitle);
    setIsEditing(false);
  }, [initialTitle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSave();
      } else if (event.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  return {
    isEditing,
    editText,
    inputRef,
    startEditing,
    setEditText,
    handleSave, // Also used for onBlur
    handleKeyDown,
  };
}
