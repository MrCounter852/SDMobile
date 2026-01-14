import { useCallback, useRef, useEffect } from 'react';
import {
  useSharedValue,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Vibration, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Auto-scroll configuration
const EDGE_THRESHOLD = 90;
const MAX_SCROLL_SPEED = 40; // Reduced for smoother scrolling
const CANCEL_ZONE_BOTTOM = 120; // Height from bottom of screen where cancel zone is
const TIMELINE_DRAG_SCALE = 0.7;

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
  const scrollOffsetRef = useRef(0);
  const autoScrollIntervalRef = useRef(null);
  const currentDragXRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
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

  // Container height (not used for cancel zone anymore)
  const containerHeight = useSharedValue(600);

  // Update column data when it changes
  useEffect(() => {
    columnIdsShared.value = columnIds || [];
    columnCount.value = columnIds?.length || 0;
  }, [columnIds]);

  /**
   * Get target column from position (JS version)
   */
  const getTargetColumnFromPosition = useCallback((x) => {
    const cols = columnIdsRef.current;
    if (!cols || cols.length === 0) return null;
    
    const scaledX = x / timelineScale.value;
    const adjustedX = scaledX + scrollOffsetRef.current;
    const index = Math.floor(adjustedX / columnWidth);
    
    if (index >= 0 && index < cols.length) {
      return cols[index];
    }
    return null;
  }, [columnWidth]);

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
   * Optimized auto-scroll loop - throttled updates
   */
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) return;

    const scroll = () => {
      if (!scrollViewRef?.current || !isDraggingShared.value) {
        autoScrollIntervalRef.current = null;
        return;
      }

      const x = currentDragXRef.current;
      let speed = 0;

      if (x > 0 && x < EDGE_THRESHOLD) {
        const ratio = (EDGE_THRESHOLD - x) / EDGE_THRESHOLD;
        speed = -ratio * MAX_SCROLL_SPEED;
      } else if (x > SCREEN_WIDTH - EDGE_THRESHOLD) {
        const ratio = (x - (SCREEN_WIDTH - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
        speed = ratio * MAX_SCROLL_SPEED;
      }

      if (speed !== 0) {
        const maxOffset = Math.max(0, (columnIdsRef.current?.length || 0) * columnWidth - SCREEN_WIDTH + 32);
        const newOffset = scrollOffsetRef.current + speed;
        const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));

        if (Math.abs(clampedOffset - scrollOffsetRef.current) > 0.5) {
          scrollViewRef.current.scrollTo({ x: clampedOffset, animated: false });
          scrollOffsetRef.current = clampedOffset;
          scrollOffset.value = clampedOffset;

          // Throttle target column updates to every ~50ms
          const now = Date.now();
          if (now - lastScrollTimeRef.current > 50) {
            lastScrollTimeRef.current = now;
            const targetId = getTargetColumnFromPosition(x);
            if (targetId !== null && targetId !== targetColumnIdShared.value) {
              targetColumnIdShared.value = targetId;
            }
          }
        }
      }

      autoScrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    autoScrollIntervalRef.current = requestAnimationFrame(scroll);
  }, [columnWidth, scrollViewRef, getTargetColumnFromPosition]);

  /**
   * Handle auto-scroll based on X position
   */
  const handleAutoScroll = useCallback((x) => {
    currentDragXRef.current = x;
    const isInEdge = x < EDGE_THRESHOLD || x > SCREEN_WIDTH - EDGE_THRESHOLD;
    
    if (isInEdge && isDraggingShared.value) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  }, [startAutoScroll, stopAutoScroll]);

  /**
   * Check if Y position is in cancel zone (bottom of screen)
   */
  const isInCancelZone = useCallback((absoluteY) => {
    // Cancel zone is at the bottom of the screen
    return absoluteY > SCREEN_HEIGHT - CANCEL_ZONE_BOTTOM;
  }, []);

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
      // Update position for overlay animation
      dragX.value = absoluteX;
      dragY.value = absoluteY;

      // Calculate target column
      const cols = columnIdsRef.current;
      if (cols && cols.length > 0) {
        const scaledX = absoluteX / timelineScale.value;
        const adjustedX = scaledX + scrollOffsetRef.current;
        const index = Math.floor(adjustedX / columnWidth);
        
        if (index >= 0 && index < cols.length) {
          const newTargetId = cols[index];
          if (newTargetId !== targetColumnIdShared.value) {
            targetColumnIdShared.value = newTargetId;
          }
        }
      }

      // Check cancel zone using absolute screen position
      const overCancel = isInCancelZone(absoluteY);
      if (overCancel !== cancelZoneHover.value) {
        cancelZoneHover.value = overCancel;
        if (overCancel) {
          Vibration.vibrate(30);
        }
      }

      // Handle auto-scroll
      handleAutoScroll(absoluteX);
    },
    [columnWidth, handleAutoScroll, isInCancelZone]
  );

  /**
   * End the drag operation
   */
  const endDrag = useCallback(
    async (absoluteX, absoluteY) => {
      stopAutoScroll();

      const draggedContact = draggedContactRef.current;
      const sourceColumnId = sourceColumnIdRef.current;

      // Check cancel zone using absolute screen position
      if (isInCancelZone(absoluteY)) {
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
          await onMoveContact(draggedContact, finalTargetId);
        } catch (error) {
          console.error('[useDragAndDrop] Move failed:', error);
        }
      }

      draggedContactRef.current = null;
      sourceColumnIdRef.current = null;
    },
    [getTargetColumnFromPosition, onMoveContact, stopAutoScroll, isInCancelZone]
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
   * Update scroll offset
   */
  const updateScrollOffset = useCallback((offset) => {
    scrollOffsetRef.current = offset;
    scrollOffset.value = offset;
  }, []);

  /**
   * Update container height (kept for compatibility)
   */
  const updateContainerHeight = useCallback((height) => {
    containerHeight.value = height;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAutoScroll();
  }, [stopAutoScroll]);

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
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    updateScrollOffset,
    updateContainerHeight,
  };
};

export default useDragAndDrop;
