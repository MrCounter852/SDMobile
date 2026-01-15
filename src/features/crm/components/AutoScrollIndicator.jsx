import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../core/theme";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Static indicator that shows auto-scroll direction
 * Uses NO animations to avoid lag on low-end devices
 * Shows arrow on left or right edge during auto-scroll
 */
const AutoScrollIndicator = ({ isDraggingShared, autoScrollDirection }) => {
  // Derive visibility and direction from shared values
  const showLeft = useDerivedValue(() => {
    return isDraggingShared.value && autoScrollDirection.value === -1;
  });

  const showRight = useDerivedValue(() => {
    return isDraggingShared.value && autoScrollDirection.value === 1;
  });

  // Left indicator style
  const leftStyle = useAnimatedStyle(() => ({
    opacity: showLeft.value ? 1 : 0,
  }));

  // Right indicator style
  const rightStyle = useAnimatedStyle(() => ({
    opacity: showRight.value ? 1 : 0,
  }));

  return (
    <>
      {/* Left indicator */}
      <Animated.View
        style={[styles.indicator, styles.leftIndicator, leftStyle]}
        pointerEvents="none"
      >
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-back" size={32} color={COLORS.white} />
          <Ionicons
            name="chevron-back"
            size={32}
            color={COLORS.white}
            style={styles.secondArrow}
          />
        </View>
      </Animated.View>

      {/* Right indicator */}
      <Animated.View
        style={[styles.indicator, styles.rightIndicator, rightStyle]}
        pointerEvents="none"
      >
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={32} color={COLORS.white} />
          <Ionicons
            name="chevron-forward"
            size={32}
            color={COLORS.white}
            style={styles.secondArrow}
          />
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(51, 122, 183, 0.5)",
    zIndex: 9998,
    height: "80%",
  },
  leftIndicator: {
    left: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  rightIndicator: {
    right: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondArrow: {
    marginLeft: -20,
    opacity: 0.6,
  },
});

export default AutoScrollIndicator;
