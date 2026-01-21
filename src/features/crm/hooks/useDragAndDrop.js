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

const EDGE_THRESHOLD = 90;
const MAX_SCROLL_SPEED = 20;
const CANCEL_ZONE_BOTTOM = 120;
const TIMELINE_DRAG_SCALE = 0.7;
const TARGET_UPDATE_THRESHOLD = 20;
const FRAME_SKIP_COUNT = 1;

const useDragAndDrop = (columnIds, columnWidth = 324, onMoveContact, scrollViewRef = null) => {
  const draggedContactRef = useRef(null);
  const sourceColumnIdRef = useRef(null);
  const onMoveContactRef = useRef(onMoveContact);
  onMoveContactRef.current = onMoveContact;
  
  const columnIdsRef = useRef(columnIds);
  columnIdsRef.current = columnIds;

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
  const autoScrollDirection = useSharedValue(0);

  const timelineScale = useSharedValue(1);

  const overlayNombre = useSharedValue('');
  const overlayCelular = useSharedValue('');
  const overlayEstado = useSharedValue('');
  const overlayColor = useSharedValue('#8E8E93');

  const scrollOffset = useSharedValue(0);

  const columnIdsShared = useSharedValue([]);
  const columnCount = useSharedValue(0);

  useEffect(() => {
    columnIdsShared.value = columnIds || [];
    columnCount.value = columnIds?.length || 0;
  }, [columnIds]);

  const autoScrollFrameCounter = useSharedValue(0);
  const AUTO_SCROLL_FRAME_SKIP = 3;

  useFrameCallback((frameInfo) => {
    "worklet";
    if (!isDraggingShared.value || !scrollViewRef) {
        if (isAutoScrolling.value) isAutoScrolling.value = false;
        if (autoScrollDirection.value !== 0) autoScrollDirection.value = 0;
        autoScrollFrameCounter.value = 0;
        return;
    }

    const x = dragX.value;
    let speed = 0;
    let direction = 0;

    if (x > 0 && x < EDGE_THRESHOLD) {
      const ratio = (EDGE_THRESHOLD - x) / EDGE_THRESHOLD;
      speed = -ratio * MAX_SCROLL_SPEED;
      direction = -1; 
    } else if (x > SCREEN_WIDTH - EDGE_THRESHOLD) {
      const ratio = (x - (SCREEN_WIDTH - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
      speed = ratio * MAX_SCROLL_SPEED;
      direction = 1; 
    }

    const isScrolling = speed !== 0;
    if (isAutoScrolling.value !== isScrolling) {
      isAutoScrolling.value = isScrolling;
    }
    if (autoScrollDirection.value !== direction) {
      autoScrollDirection.value = direction;
    }

    if (speed !== 0) {
      autoScrollFrameCounter.value = (autoScrollFrameCounter.value + 1) % AUTO_SCROLL_FRAME_SKIP;
      if (autoScrollFrameCounter.value !== 0) {
        return;
      }

      const maxOffset = Math.max(0, columnCount.value * columnWidth - SCREEN_WIDTH + 32);
      const newOffset = scrollOffset.value + (speed * AUTO_SCROLL_FRAME_SKIP);
      const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset));

      scrollTo(scrollViewRef, clampedOffset, 0, false);
      scrollOffset.value = clampedOffset;
    }
  });

  const getTargetColumnUI = (x, currentScrollOffset, scale, ids, count, width) => {
    "worklet";
    if (count === 0) return null;
    
    const scaledX = x / scale;
    const adjustedX = scaledX + currentScrollOffset - 16;
    const index = Math.floor(adjustedX / width);
    
    if (index >= 0 && index < count) {
      return ids[index];
    }
    return null;
  };

  const lastTargetCalcX = useSharedValue(0);
  const frameCounter = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      isDragging: isDraggingShared.value,
      x: dragX.value,
      y: dragY.value,
      currentScrollOffset: scrollOffset.value,
      isScrolling: isAutoScrolling.value,
    }),
    (data, prevData) => {
      if (!data.isDragging) {
        lastTargetCalcX.value = 0;
        frameCounter.value = 0;
        return;
      }

      const overCancel = data.y > SCREEN_HEIGHT - CANCEL_ZONE_BOTTOM;
      if (overCancel !== cancelZoneHover.value) {
        cancelZoneHover.value = overCancel;
        if (overCancel) {
          runOnJS(Vibration.vibrate)(30);
        }
      }

      if (overCancel) return;

      if (data.isScrolling) {
        frameCounter.value = (frameCounter.value + 1) % FRAME_SKIP_COUNT;
        if (frameCounter.value !== 0) return;
      }

      const adjustedX = data.x + data.currentScrollOffset;
      const lastAdjustedX = lastTargetCalcX.value;
      
      if (Math.abs(adjustedX - lastAdjustedX) < TARGET_UPDATE_THRESHOLD) {
        return;
      }
      
      lastTargetCalcX.value = adjustedX;

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

  const getTargetColumnFromPosition = useCallback((x) => {
    const cols = columnIdsRef.current;
    if (!cols || cols.length === 0) return null;
    
    const scaledX = x / timelineScale.value;
    const adjustedX = scaledX + scrollOffset.value - 16;
    const index = Math.floor(adjustedX / columnWidth);
    
    if (index >= 0 && index < cols.length) {
      return cols[index];
    }
    return null;
  }, [columnWidth, timelineScale, scrollOffset]);

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

  const updateDrag = useCallback(
    (absoluteX, absoluteY) => {
      "worklet";
      dragX.value = absoluteX;
      dragY.value = absoluteY;
    },
    []
  );
  const endDrag = useCallback(
    async (absoluteX, absoluteY) => {
      const draggedContact = draggedContactRef.current;
      const sourceColumnId = sourceColumnIdRef.current;

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

      const highlightedTargetId = targetColumnIdShared.value;
      const calculatedTargetId = getTargetColumnFromPosition(absoluteX);
      const finalTargetId = highlightedTargetId || calculatedTargetId;

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
    isAutoScrolling,
    autoScrollDirection,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    updateScrollOffset: (offset) => {
      "worklet";
      if (!isDraggingShared.value) {
        scrollOffset.value = offset;
      }
    },
    updateContainerHeight: () => {},
  };
};

export default useDragAndDrop;
