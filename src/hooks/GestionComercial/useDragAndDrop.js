import { useState, useCallback, useRef } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { Vibration } from 'react-native';

/**
 * Custom hook for managing drag-and-drop state across timeline columns
 * @param {Array} columns - Array of timeline column data
 * @param {Function} onMoveContact - Callback when contact is dropped on a new column
 * @param {number} columnWidth - Width of each column including margins (default: 324)
 */
const useDragAndDrop = (columns, onMoveContact, columnWidth = 324) => {
  // Drag state
  const [draggedContact, setDraggedContact] = useState(null);
  const [sourceColumnId, setSourceColumnId] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Animated values for smooth drag
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);

  // Refs
  const scrollOffsetRef = useRef(0);
  const startPositionRef = useRef({ x: 0, y: 0 });

  /**
   * Calculate which column is under the current drag position
   */
  const getTargetColumnFromPosition = useCallback(
    (x) => {
      const adjustedX = x + scrollOffsetRef.current;
      const columnIndex = Math.floor(adjustedX / columnWidth);

      if (columnIndex >= 0 && columnIndex < columns.length) {
        return columns[columnIndex].ProcesoLineaTiempoID;
      }
      return null;
    },
    [columns, columnWidth]
  );

  /**
   * Start dragging a contact
   */
  const startDrag = useCallback(
    (contact, columnId, position) => {
      'worklet';
      runOnJS(setDraggedContact)(contact);
      runOnJS(setSourceColumnId)(columnId);
      runOnJS(setIsDragging)(true);
      runOnJS(Vibration.vibrate)(50);

      startPositionRef.current = { x: position.x, y: position.y };
      dragX.value = position.x;
      dragY.value = position.y;
      dragScale.value = 1.05;
      dragOpacity.value = 0.95;
    },
    []
  );

  /**
   * Update drag position (called during gesture)
   */
  const updateDrag = useCallback(
    (absoluteX, absoluteY) => {
      'worklet';
      dragX.value = absoluteX;
      dragY.value = absoluteY;

      // Calculate target column on JS thread
      runOnJS((x) => {
        const newTarget = getTargetColumnFromPosition(x);
        if (newTarget !== targetColumnId) {
          setTargetColumnId(newTarget);
        }
      })(absoluteX);
    },
    [getTargetColumnFromPosition, targetColumnId]
  );

  /**
   * End the drag operation
   */
  const endDrag = useCallback(
    async (absoluteX) => {
      const finalTargetId = getTargetColumnFromPosition(absoluteX);

      // Reset animated values
      dragScale.value = 1;
      dragOpacity.value = 1;

      // Check if we should move the contact
      if (
        draggedContact &&
        finalTargetId &&
        finalTargetId !== sourceColumnId
      ) {
        try {
          await onMoveContact(draggedContact, finalTargetId);
        } catch (error) {
          console.error('[useDragAndDrop] Move failed:', error);
        }
      }

      // Reset state
      setDraggedContact(null);
      setSourceColumnId(null);
      setTargetColumnId(null);
      setIsDragging(false);
    },
    [draggedContact, sourceColumnId, getTargetColumnFromPosition, onMoveContact]
  );

  /**
   * Cancel the drag operation
   */
  const cancelDrag = useCallback(() => {
    dragScale.value = 1;
    dragOpacity.value = 1;
    setDraggedContact(null);
    setSourceColumnId(null);
    setTargetColumnId(null);
    setIsDragging(false);
  }, []);

  /**
   * Update scroll offset (called from ScrollView onScroll)
   */
  const updateScrollOffset = useCallback((offset) => {
    scrollOffsetRef.current = offset;
  }, []);

  return {
    // State
    draggedContact,
    sourceColumnId,
    targetColumnId,
    isDragging,

    // Animated values
    dragX,
    dragY,
    dragScale,
    dragOpacity,

    // Methods
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    updateScrollOffset,
  };
};

export default useDragAndDrop;
