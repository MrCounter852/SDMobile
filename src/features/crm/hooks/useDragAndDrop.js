import { useState, useCallback, useRef, useEffect } from 'react';
import { useSharedValue, runOnJS, withTiming } from 'react-native-reanimated';
import { Vibration, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Auto-scroll configuration
const EDGE_THRESHOLD = 90; // Distance from edge to trigger scroll
const MAX_SCROLL_SPEED = 45; // Maximum pixels per frame
const CANCEL_ZONE_HEIGHT = 80; // Height of cancel drop zone

/**
 * Custom hook for managing drag-and-drop state across timeline columns
 * Uses refs instead of state to avoid re-renders during drag
 * @param {Array} columns - Array of timeline column data
 * @param {Function} onMoveContact - Callback when contact is dropped on a new column
 * @param {number} columnWidth - Width of each column including margins (default: 324)
 * @param {Object} scrollViewRef - Ref to the horizontal ScrollView
 */
const useDragAndDrop = (columns, onMoveContact, columnWidth = 324, scrollViewRef = null) => {
  // Use refs for drag data to avoid re-renders in columns
  const draggedContactRef = useRef(null);
  const sourceColumnIdRef = useRef(null);
  const targetColumnIdRef = useRef(null);
  const isOverCancelZoneRef = useRef(false);

  // Shared values for animations AND for triggering overlay visibility
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const cancelZoneHover = useSharedValue(false);
  const isDraggingShared = useSharedValue(false); // Shared value for overlay visibility
  const draggedContactIdShared = useSharedValue(null); // For identifying dragged item
  const sourceColumnIdShared = useSharedValue(null); // Source column ID
  const targetColumnIdShared = useSharedValue(null); // Current target column ID

  // Shared values for overlay display data (NO re-renders!)
  const overlayNombre = useSharedValue('');
  const overlayCelular = useSharedValue('');
  const overlayEstado = useSharedValue('');
  const overlayColor = useSharedValue('#8E8E93');
  const timelineScale = useSharedValue(1); // Scale of the timeline container

  // Refs
  const scrollOffsetRef = useRef(0);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const currentDragXRef = useRef(0);
  const autoScrollIntervalRef = useRef(null);
  const containerHeightRef = useRef(SCREEN_HEIGHT);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  /**
   * Stop auto-scroll
   */
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      cancelAnimationFrame(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  /**
   * Continuous auto-scroll loop
   * Speed is calculated based on currentDragXRef
   */
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) return;

    const scroll = () => {
      if (!scrollViewRef?.current) {
        autoScrollIntervalRef.current = null;
        return;
      }

      const x = currentDragXRef.current;
      let speed = 0;

      if (x > 0 && x < EDGE_THRESHOLD) {
        // Left edge: speed is negative (scrolling left)
        // Increases as we get closer to the edge (x approaches 0)
        const ratio = (EDGE_THRESHOLD - x) / EDGE_THRESHOLD;
        speed = -ratio * MAX_SCROLL_SPEED;
      } else if (x > SCREEN_WIDTH - EDGE_THRESHOLD) {
        // Right edge: speed is positive (scrolling right)
        // Increases as we get closer to the edge (x approaches SCREEN_WIDTH)
        const ratio = (x - (SCREEN_WIDTH - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
        speed = ratio * MAX_SCROLL_SPEED;
      }

      if (speed !== 0) {
        const newOffset = scrollOffsetRef.current + speed;
        const maxOffset = columnsRef.current.length * columnWidth - SCREEN_WIDTH + 32;
        const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));

        if (clampedOffset !== scrollOffsetRef.current) {
          scrollViewRef.current.scrollTo({ x: clampedOffset, animated: false });
          scrollOffsetRef.current = clampedOffset;
          
          // Re-calculate target column while scrolling
          const targetId = getTargetColumnFromPosition(x);
          if (targetId !== targetColumnIdShared.value) {
            targetColumnIdShared.value = targetId;
          }
        }
      }

      autoScrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    autoScrollIntervalRef.current = requestAnimationFrame(scroll);
  }, [columnWidth, scrollViewRef, getTargetColumnFromPosition]);

  /**
   * Calculate which column is under the current drag position
   * Accounts for the timeline scaling effect
   */
  const getTargetColumnFromPosition = useCallback(
    (x) => {
      // Coordinate transformation: 
      // 1. Convert screen position to "scaled content space"
      // 2. Add scroll offset to get absolute content position
      const scaledX = x / timelineScale.value;
      const adjustedX = scaledX + scrollOffsetRef.current;
      const columnIndex = Math.floor(adjustedX / columnWidth);

      if (columnIndex >= 0 && columnIndex < columnsRef.current.length) {
        return columnsRef.current[columnIndex].ProcesoLineaTiempoID;
      }
      return null;
    },
    [columnWidth]
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
      currentDragXRef.current = absoluteX;
      
      const isInEdge = absoluteX < EDGE_THRESHOLD || absoluteX > SCREEN_WIDTH - EDGE_THRESHOLD;
      
      if (isInEdge) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    },
    [startAutoScroll, stopAutoScroll]
  );

  /**
   * Start dragging a contact - NO RE-RENDERS, only ref and shared value updates
   */
  const startDrag = useCallback(
    (contact, columnId, position) => {
      'worklet';
      // Set animated values immediately (no JS bridge needed)
      dragX.value = position.x;
      dragY.value = position.y;
      dragScale.value = 1.05;
      dragOpacity.value = 0.95;
      isDraggingShared.value = true;
      draggedContactIdShared.value = contact?.ProcesoID ?? null;
      sourceColumnIdShared.value = columnId;
      targetColumnIdShared.value = columnId; // Initially it's over its own column
      
      // Zoom out effect
      timelineScale.value = withTiming(0.88, { duration: 400 });

      // Set overlay display data directly in shared values (NO re-renders!)
      overlayNombre.value = contact?.NombreCompleto || contact?.Nombre || 'Contacto';
      overlayCelular.value = contact?.Celular || contact?.Telefono || '';
      overlayEstado.value = contact?.EstadoProcesoNombre || contact?.Estado || '';
      overlayColor.value = contact?.Color || '#8E8E93';

      // Store data in refs (no re-renders) and trigger vibration
      runOnJS((c, cId, pos) => {
        draggedContactRef.current = c;
        sourceColumnIdRef.current = cId;
        startPositionRef.current = { x: pos.x, y: pos.y };
        Vibration.vibrate(50);
      })(contact, columnId, position);
    },
    []
  );

  /**
   * Update drag position (called during gesture) - NO RE-RENDERS
   */
  const updateDrag = useCallback(
    (absoluteX, absoluteY) => {
      'worklet';
      dragX.value = absoluteX;
      dragY.value = absoluteY;

      // Update target column ID (shared value for highlighting)
      // Since this is a worklet, we use runOnJS to calculate the column
      // to avoid complex shared value mirroring of the columns array
      runOnJS((x) => {
        const targetId = getTargetColumnFromPosition(x);
        targetColumnIdShared.value = targetId;
      })(absoluteX);

      // Check if over cancel zone
      const overCancel = absoluteY > containerHeightRef.current - CANCEL_ZONE_HEIGHT;
      if (overCancel !== cancelZoneHover.value) {
        cancelZoneHover.value = overCancel;
        if (overCancel) {
          runOnJS(Vibration.vibrate)(30);
        }
      }

      // Handle auto-scroll directly
      if (absoluteX < EDGE_THRESHOLD || absoluteX > SCREEN_WIDTH - EDGE_THRESHOLD) {
        runOnJS(handleAutoScroll)(absoluteX);
      } else if (autoScrollIntervalRef.current) {
        runOnJS(stopAutoScroll)();
      }
    },
    [handleAutoScroll, stopAutoScroll, getTargetColumnFromPosition]
  );

  /**
   * End the drag operation
   */
  const endDrag = useCallback(
    async (absoluteX, absoluteY) => {
      stopAutoScroll();

      const draggedContact = draggedContactRef.current;
      const sourceColumnId = sourceColumnIdRef.current;

      // Check if dropped on cancel zone
      if (checkCancelZone(absoluteY)) {
        // Cancel the drag - reset shared values
        cancelZoneHover.value = false;
        dragScale.value = 1;
        dragOpacity.value = 1;
        isDraggingShared.value = false;
        draggedContactIdShared.value = null;
        sourceColumnIdShared.value = null;
        targetColumnIdShared.value = null;
        draggedContactRef.current = null;
        sourceColumnIdRef.current = null;
        timelineScale.value = withTiming(1, { duration: 300 });
        return;
      }

      const finalTargetId = getTargetColumnFromPosition(absoluteX);

      // Reset animated values
      dragScale.value = 1;
      dragOpacity.value = 1;
      isDraggingShared.value = false;
      draggedContactIdShared.value = null;
      sourceColumnIdShared.value = null;
      targetColumnIdShared.value = null;
      timelineScale.value = withTiming(1, { duration: 300 });

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

      // Reset refs
      draggedContactRef.current = null;
      sourceColumnIdRef.current = null;
    },
    [getTargetColumnFromPosition, onMoveContact, checkCancelZone, stopAutoScroll]
  );

  /**
   * Cancel the drag operation
   */
  const cancelDrag = useCallback(() => {
    stopAutoScroll();
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
    // Refs (for reading current values without re-renders)
    draggedContactRef,
    sourceColumnIdRef,

    // Animated/Shared values (for UI and animations)
    dragX,
    dragY,
    dragScale,
    dragOpacity,
    cancelZoneHover,
    isDraggingShared, // Use this for overlay visibility
    draggedContactIdShared, // Use this for identifying dragged item
    sourceColumnIdShared,
    targetColumnIdShared,
    timelineScale,

    // Overlay display shared values (NO re-renders!)
    overlayNombre,
    overlayCelular,
    overlayEstado,
    overlayColor,

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
