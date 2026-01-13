import { useState, useCallback, useRef, useEffect } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { Vibration, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Auto-scroll configuration
const EDGE_THRESHOLD = 30; // Distance from edge to trigger scroll
const SCROLL_SPEED = 20; // Pixels per frame
const CANCEL_ZONE_HEIGHT = 80; // Height of cancel drop zone

/**
 * Custom hook for managing drag-and-drop state across timeline columns
 * @param {Array} columns - Array of timeline column data
 * @param {Function} onMoveContact - Callback when contact is dropped on a new column
 * @param {number} columnWidth - Width of each column including margins (default: 324)
 * @param {Object} scrollViewRef - Ref to the horizontal ScrollView
 */
const useDragAndDrop = (columns, onMoveContact, columnWidth = 324, scrollViewRef = null) => {
  // Drag state
  const [draggedContact, setDraggedContact] = useState(null);
  const [sourceColumnId, setSourceColumnId] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverCancelZone, setIsOverCancelZone] = useState(false);

  // Animated values for smooth drag
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const cancelZoneHover = useSharedValue(false);

  // Refs
  const scrollOffsetRef = useRef(0);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const autoScrollIntervalRef = useRef(null);
  const containerHeightRef = useRef(SCREEN_HEIGHT);

  /**
   * Stop auto-scroll
   */
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  /**
   * Start auto-scrolling in a direction
   */
  const startAutoScroll = useCallback(
    (direction) => {
      stopAutoScroll();

      if (!scrollViewRef?.current) return;

      autoScrollIntervalRef.current = setInterval(() => {
        const newOffset =
          scrollOffsetRef.current + (direction === 'right' ? SCROLL_SPEED : -SCROLL_SPEED);
        const maxOffset = columns.length * columnWidth - SCREEN_WIDTH + 32; // padding

        const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));

        scrollViewRef.current.scrollTo({ x: clampedOffset, animated: false });
        scrollOffsetRef.current = clampedOffset;
      }, 16); // ~60fps
    },
    [columns.length, columnWidth, scrollViewRef, stopAutoScroll]
  );

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
   * Check if position is over cancel zone
   */
  const checkCancelZone = useCallback(
    (absoluteY) => {
      const threshold = containerHeightRef.current - CANCEL_ZONE_HEIGHT;
      return absoluteY > threshold;
    },
    []
  );

  /**
   * Handle auto-scroll based on X position
   */
  const handleAutoScroll = useCallback(
    (absoluteX) => {
      if (absoluteX < EDGE_THRESHOLD) {
        startAutoScroll('left');
      } else if (absoluteX > SCREEN_WIDTH - EDGE_THRESHOLD) {
        startAutoScroll('right');
      } else {
        stopAutoScroll();
      }
    },
    [startAutoScroll, stopAutoScroll]
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

      // Check cancel zone and update target column on JS thread
      runOnJS((x, y) => {
        // Check if over cancel zone
        const overCancel = checkCancelZone(y);
        if (overCancel !== isOverCancelZone) {
          setIsOverCancelZone(overCancel);
          cancelZoneHover.value = overCancel;
          if (overCancel) {
            Vibration.vibrate(30);
          }
        }

        // Update target column if not over cancel zone
        if (!overCancel) {
          const newTarget = getTargetColumnFromPosition(x);
          if (newTarget !== targetColumnId) {
            setTargetColumnId(newTarget);
          }
        }

        // Handle auto-scroll
        handleAutoScroll(x);
      })(absoluteX, absoluteY);
    },
    [getTargetColumnFromPosition, targetColumnId, checkCancelZone, isOverCancelZone, handleAutoScroll]
  );

  /**
   * End the drag operation
   */
  const endDrag = useCallback(
    async (absoluteX, absoluteY) => {
      stopAutoScroll();

      // Check if dropped on cancel zone
      if (checkCancelZone(absoluteY)) {
        // Cancel the drag
        cancelZoneHover.value = false;
        dragScale.value = 1;
        dragOpacity.value = 1;
        setDraggedContact(null);
        setSourceColumnId(null);
        setTargetColumnId(null);
        setIsDragging(false);
        setIsOverCancelZone(false);
        return;
      }

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
      setIsOverCancelZone(false);
    },
    [draggedContact, sourceColumnId, getTargetColumnFromPosition, onMoveContact, checkCancelZone, stopAutoScroll]
  );

  /**
   * Cancel the drag operation
   */
  const cancelDrag = useCallback(() => {
    stopAutoScroll();
    cancelZoneHover.value = false;
    dragScale.value = 1;
    dragOpacity.value = 1;
    setDraggedContact(null);
    setSourceColumnId(null);
    setTargetColumnId(null);
    setIsDragging(false);
    setIsOverCancelZone(false);
  }, [stopAutoScroll]);

  /**
   * Update scroll offset (called from ScrollView onScroll)
   */
  const updateScrollOffset = useCallback((offset) => {
    scrollOffsetRef.current = offset;
  }, []);

  /**
   * Update container height for cancel zone calculation
   */
  const updateContainerHeight = useCallback((height) => {
    containerHeightRef.current = height;
  }, []);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return {
    // State
    draggedContact,
    sourceColumnId,
    targetColumnId,
    isDragging,
    isOverCancelZone,

    // Animated values
    dragX,
    dragY,
    dragScale,
    dragOpacity,
    cancelZoneHover,

    // Methods
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    updateScrollOffset,
    updateContainerHeight,
  };
};

export default useDragAndDrop;
