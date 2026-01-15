import { useCallback, useRef, useEffect } from 'react';
import {
  useSharedValue,
  runOnJS,
  withTiming,
  useAnimatedReaction,
  scrollTo,
  useFrameCallback,
} from 'react-native-reanimated';
import { Vibration, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Auto-scroll configuration
const EDGE_THRESHOLD = 90;
const MAX_SCROLL_SPEED = 10; // Reduced for smoother scrolling
const CANCEL_ZONE_BOTTOM = 120; // Height from bottom of screen where cancel zone is
const TIMELINE_DRAG_SCALE = 0.7;
const TARGET_UPDATE_THRESHOLD = 50; // Min px movement to recalculate target column

/**
 * Custom hook for managing drag-and-drop state across timeline columns
 * Optimized for performance with minimal bridge crossing
 * 
 * @param {Array} columnIds - Array of column ProcesoLineaTiempoID values
 * @param {number} columnWidth - Width of each column including margins (default: 324)
 * @param {Function} onMoveContact - Callback when contact is dropped on a new column
 * @param {Object} scrollViewRef - Ref to the horizontal ScrollView
 */
const useDragAndDrop = (columnIds, columnWidth = 324, onMoveContact, scrollViewRef = null) => {
  // Refs for non-serializable data
  const draggedContactRef = useRef(null);
  const sourceColumnIdRef = useRef(null);
  const onMoveContactRef = useRef(onMoveContact);
  onMoveContactRef.current = onMoveContact;
  
  const columnIdsRef = useRef(columnIds);
  columnIdsRef.current = columnIds;

  // Shared values for UI thread animations
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const cancelZoneHover = useSharedValue(false);
  const isDraggingShared = useSharedValue(false);
  const draggedContactIdShared = useSharedValue(null);
  const sourceColumnIdShared = useSharedValue(null);
  const targetColumnIdShared = useSharedValue(null);
  const isAutoScrolling = useSharedValue(false);

  const timelineScale = useSharedValue(1);

  // Overlay display data
  const overlayNombre = useSharedValue('');
  const overlayCelular = useSharedValue('');
  const overlayEstado = useSharedValue('');
  const overlayColor = useSharedValue('#8E8E93');

  // Scroll offset as shared value
  const scrollOffset = useSharedValue(0);

  // Column data as shared values
  const columnIdsShared = useSharedValue([]);
  const columnCount = useSharedValue(0);

  // Update column data when it changes
  useEffect(() => {
    columnIdsShared.value = columnIds || [];
    columnCount.value = columnIds?.length || 0;
  }, [columnIds]);

  /**
   * Frame callback for smooth auto-scrolling on UI thread
   */
  useFrameCallback((frameInfo) => {
    "worklet";
    if (!isDraggingShared.value || !scrollViewRef) {
        if (isAutoScrolling.value) isAutoScrolling.value = false;
        return;
    }

    const x = dragX.value;
    let speed = 0;

    if (x > 0 && x < EDGE_THRESHOLD) {
      const ratio = (EDGE_THRESHOLD - x) / EDGE_THRESHOLD;
      speed = -ratio * MAX_SCROLL_SPEED;
    } else if (x > SCREEN_WIDTH - EDGE_THRESHOLD) {
      const ratio = (x - (SCREEN_WIDTH - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
      speed = ratio * MAX_SCROLL_SPEED;
    }

    // Update auto-scrolling state
    const isScrolling = speed !== 0;
    if (isAutoScrolling.value !== isScrolling) {
      isAutoScrolling.value = isScrolling;
    }

    if (speed !== 0) {
      const maxOffset = Math.max(0, columnCount.value * columnWidth - SCREEN_WIDTH + 32);
      const newOffset = scrollOffset.value + speed;
      const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));

      if (true) {
        scrollTo(scrollViewRef, clampedOffset, 0, false);
        scrollOffset.value = clampedOffset;
      }
    }
  });

  /**
   * Target column calculation worklet
   */
  const getTargetColumnUI = (x, currentScrollOffset, scale, ids, count, width) => {
    "worklet";
    if (count === 0) return null;
    
    const scaledX = x / scale;
    const adjustedX = scaledX + currentScrollOffset;
    const index = Math.floor(adjustedX / width);
    
    if (index >= 0 && index < count) {
      return ids[index];
    }
    return null;
  };

  // Track last calculated position to avoid recalculating on every pixel
  const lastTargetCalcX = useSharedValue(0);

  /**
   * React to drag changes to update target column and cancel zone
   * OPTIMIZED: Only recalculates target column when position changes significantly
   */
  useAnimatedReaction(
    () => ({
      isDragging: isDraggingShared.value,
      y: dragY.value,
    }),
    (data, prevData) => {
      if (!data.isDragging) {
        // Reset when not dragging
        lastTargetCalcX.value = 0;
        return;
      }

      // Check cancel zone - simple Y comparison
      const overCancel = data.y > SCREEN_HEIGHT - CANCEL_ZONE_BOTTOM;
      if (overCancel !== cancelZoneHover.value) {
        cancelZoneHover.value = overCancel;
        if (overCancel) {
          runOnJS(Vibration.vibrate)(30);
        }
      }
    }
  );

  /**
   * Separate reaction for target column - runs less frequently
   */
  useAnimatedReaction(
    () => ({
      x: dragX.value,
      isDragging: isDraggingShared.value,
      currentScrollOffset: scrollOffset.value,
    }),
    (data) => {
      if (!data.isDragging) return;

      // Only recalculate if X position changed significantly OR scroll changed
      const adjustedX = data.x + data.currentScrollOffset;
      const lastAdjustedX = lastTargetCalcX.value;
      
      if (Math.abs(adjustedX - lastAdjustedX) < TARGET_UPDATE_THRESHOLD) {
        return; // Skip calculation if position change is too small
      }
      
      lastTargetCalcX.value = adjustedX;

      // Update target column
      const targetId = getTargetColumnUI(
        data.x, 
        data.currentScrollOffset, 
        timelineScale.value, 
        columnIdsShared.value, 
        columnCount.value, 
        columnWidth
      );
      
      if (targetId !== null && targetId !== targetColumnIdShared.value) {
        targetColumnIdShared.value = targetId;
      }
    }
  );

  /**
   * Get target column from position (JS version for final drop)
   */
  const getTargetColumnFromPosition = useCallback((x) => {
    const cols = columnIdsRef.current;
    if (!cols || cols.length === 0) return null;
    
    const scaledX = x / timelineScale.value;
    const adjustedX = scaledX + scrollOffset.value;
    const index = Math.floor(adjustedX / columnWidth);
    
    if (index >= 0 && index < cols.length) {
      return cols[index];
    }
    return null;
  }, [columnWidth, timelineScale, scrollOffset]);

  // Functions below are simplified since most logic moved to Reanimated hooks above
  
  /**
   * Start dragging a contact
   */
  const startDrag = useCallback(
    (contact, columnId, position) => {
      dragX.value = position.x;
      dragY.value = position.y;
      dragScale.value = 1.05;
      dragOpacity.value = 0.95;
      isDraggingShared.value = true;
      draggedContactIdShared.value = contact?.ProcesoID ?? null;
      sourceColumnIdShared.value = columnId;
      targetColumnIdShared.value = columnId;

      timelineScale.value = withTiming(TIMELINE_DRAG_SCALE, { duration: 400 });

      overlayNombre.value = contact?.NombreCompleto || contact?.Nombre || 'Contacto';
      overlayCelular.value = contact?.Celular || contact?.Telefono || '';
      overlayEstado.value = contact?.EstadoProcesoNombre || contact?.Estado || '';
      overlayColor.value = contact?.Color || '#8E8E93';

      draggedContactRef.current = contact;
      sourceColumnIdRef.current = columnId;
      
      Vibration.vibrate(50);
    },
    []
  );

  /**
   * Update drag position
   */
  const updateDrag = useCallback(
    (absoluteX, absoluteY) => {
      "worklet";
      // Update position for overlay animation
      dragX.value = absoluteX;
      dragY.value = absoluteY;
    },
    []
  );

  /**
   * End the drag operation
   */
  const endDrag = useCallback(
    async (absoluteX, absoluteY) => {
      const draggedContact = draggedContactRef.current;
      const sourceColumnId = sourceColumnIdRef.current;

      // Check cancel zone using absolute screen position
      if (absoluteY > SCREEN_HEIGHT - CANCEL_ZONE_BOTTOM) {
        cancelZoneHover.value = false;
        dragScale.value = 1;
        dragOpacity.value = 1;
        isDraggingShared.value = false;
        draggedContactIdShared.value = null;
        sourceColumnIdShared.value = null;
        targetColumnIdShared.value = null;
        timelineScale.value = withTiming(1, { duration: 300 });
        draggedContactRef.current = null;
        sourceColumnIdRef.current = null;
        return;
      }

      const finalTargetId = getTargetColumnFromPosition(absoluteX);

      dragScale.value = 1;
      dragOpacity.value = 1;
      isDraggingShared.value = false;
      draggedContactIdShared.value = null;
      sourceColumnIdShared.value = null;
      targetColumnIdShared.value = null;
      timelineScale.value = withTiming(1, { duration: 300 });

      if (draggedContact && finalTargetId && finalTargetId !== sourceColumnId) {
        try {
          await onMoveContactRef.current(draggedContact, finalTargetId);
        } catch (error) {
          console.error('[useDragAndDrop] Move failed:', error);
        }
      }

      draggedContactRef.current = null;
      sourceColumnIdRef.current = null;
    },
    [getTargetColumnFromPosition]
  );

  /**
   * Cancel the drag operation
   */
  const cancelDrag = useCallback(() => {
    cancelZoneHover.value = false;
    dragScale.value = 1;
    dragOpacity.value = 1;
    isDraggingShared.value = false;
    draggedContactIdShared.value = null;
    sourceColumnIdShared.value = null;
    targetColumnIdShared.value = null;
    timelineScale.value = withTiming(1, { duration: 300 });
    draggedContactRef.current = null;
    sourceColumnIdRef.current = null;
  }, []);

  // Cleanup on unmount - redundant with useFrameCallback but kept for safety
  useEffect(() => {
    return () => {
      isDraggingShared.value = false;
    };
  }, []);

  return {
    draggedContactRef,
    sourceColumnIdRef,
    dragX,
    dragY,
    dragScale,
    dragOpacity,
    cancelZoneHover,
    isDraggingShared,
    draggedContactIdShared,
    sourceColumnIdShared,
    targetColumnIdShared,
    timelineScale,
    scrollOffset,
    overlayNombre,
    overlayCelular,
    overlayEstado,
    overlayColor,
    isAutoScrolling, // Export the new shared value
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    updateScrollOffset: (offset) => {
      "worklet";
      // Only update from native scroll events when NOT dragging
      // When dragging, the frame callback drives the scrollOffset
      if (!isDraggingShared.value) {
        scrollOffset.value = offset;
      }
    },
    updateContainerHeight: () => {},
  };
};

export default useDragAndDrop;
