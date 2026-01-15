import React, { useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import ContactItem from "./ContactItem";

const DRAG_ACTIVATION_DELAY = 300; // ms for long press
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

/**
 * Wrapper component that makes ContactItem draggable
 */
const DraggableContactItem = ({
  item,
  columnId,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggedContactIdShared,
}) => {
  // Store refs to avoid serializing large objects through runOnJS
  const itemRef = useRef(item);
  const columnIdRef = useRef(columnId);
  const onDragStartRef = useRef(onDragStart);

  // Keep refs updated
  itemRef.current = item;
  columnIdRef.current = columnId;
  onDragStartRef.current = onDragStart;

  // Local animated values for this item
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isActive = useSharedValue(false);

  // Compute isDragged from shared value - avoids re-renders
  const isDragged = useDerivedValue(() => {
    return draggedContactIdShared?.value === item?.ProcesoID;
  }, [item?.ProcesoID]);

  // Stable callback for drag start - called from JS thread
  const handleDragStartJS = useCallback((x, y) => {
    if (onDragStartRef.current) {
      onDragStartRef.current(itemRef.current, columnIdRef.current, { x, y });
    }
  }, []);

  // Create the pan gesture with activation delay (long press)
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(DRAG_ACTIVATION_DELAY)
    .onStart((event) => {
      "worklet";
      isActive.value = true;
      scale.value = withSpring(1.02, SPRING_CONFIG);
      opacity.value = withTiming(0.3, { duration: 150 });

      // Pass only primitives through the bridge
      runOnJS(handleDragStartJS)(event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      "worklet";
      // Direct worklet call - no conditions, no bridge crossing
      onDragMove(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      "worklet";
      isActive.value = false;
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 150 });

      if (onDragEnd) {
        runOnJS(onDragEnd)(event.absoluteX, event.absoluteY);
      }
    })
    .onFinalize(() => {
      "worklet";
      // Ensure we reset if gesture is cancelled
      if (isActive.value) {
        isActive.value = false;
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Tap gesture for regular press
  const tapGesture = Gesture.Tap().onEnd(() => {
    "worklet";
    if (onPress) {
      runOnJS(onPress)();
    }
  });

  // Combine gestures - tap should work when not dragging
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated style for local feedback - use derived value instead of prop
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDragged.value ? 0.3 : opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <ContactItem
          item={item}
          onPress={null} // Handled by gesture
          onLongPress={null} // Handled by gesture
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
});

// Custom comparator - only re-render if item data changes
const arePropsEqual = (prevProps, nextProps) => {
  // Re-render if item data changed
  if (prevProps.item?.ProcesoID !== nextProps.item?.ProcesoID) return false;
  if (prevProps.item?.NombreCompleto !== nextProps.item?.NombreCompleto)
    return false;
  if (prevProps.columnId !== nextProps.columnId) return false;

  // Shared values and stable callbacks don't need comparison
  return true;
};

export default React.memo(DraggableContactItem, arePropsEqual);
