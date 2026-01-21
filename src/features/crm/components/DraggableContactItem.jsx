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
import TimelineContactItem from "./TimelineContactItem";

const DRAG_ACTIVATION_DELAY = 300;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

const DraggableContactItem = ({
  item,
  columnId,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggedContactIdShared,
}) => {
  const itemRef = useRef(item);
  const columnIdRef = useRef(columnId);
  const onDragStartRef = useRef(onDragStart);
  itemRef.current = item;
  columnIdRef.current = columnId;
  onDragStartRef.current = onDragStart;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isActive = useSharedValue(false);
  const isDragged = useDerivedValue(() => {
    return draggedContactIdShared?.value === item?.ProcesoID;
  }, [item?.ProcesoID]);
  const handleDragStartJS = useCallback((x, y) => {
    if (onDragStartRef.current) {
      onDragStartRef.current(itemRef.current, columnIdRef.current, { x, y });
    }
  }, []);
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(DRAG_ACTIVATION_DELAY)
    .onStart((event) => {
      "worklet";
      isActive.value = true;
      scale.value = withSpring(1.02, SPRING_CONFIG);
      opacity.value = withTiming(0.3, { duration: 150 });
      runOnJS(handleDragStartJS)(event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      "worklet";
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
      if (isActive.value) {
        isActive.value = false;
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
      }
    });
  const tapGesture = Gesture.Tap().onEnd(() => {
    "worklet";
    if (onPress) {
      runOnJS(onPress)(itemRef.current);
    }
  });
  const composedGesture = Gesture.Race(panGesture, tapGesture);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDragged.value ? 0.3 : opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TimelineContactItem item={item} onPress={null} onLongPress={null} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
});

const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.item?.ProcesoID !== nextProps.item?.ProcesoID) return false;
  if (prevProps.item?.NombreCompleto !== nextProps.item?.NombreCompleto)
    return false;
  if (prevProps.columnId !== nextProps.columnId) return false;
  return true;
};

export default React.memo(DraggableContactItem, arePropsEqual);
