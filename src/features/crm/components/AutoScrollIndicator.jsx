import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../core/theme";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AutoScrollIndicator = ({ isDraggingShared, autoScrollDirection }) => {
  const showLeft = useDerivedValue(() => {
    return isDraggingShared.value && autoScrollDirection.value === -1;
  });

  const showRight = useDerivedValue(() => {
    return isDraggingShared.value && autoScrollDirection.value === 1;
  });

  const leftStyle = useAnimatedStyle(() => ({
    opacity: showLeft.value ? 1 : 0,
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: showRight.value ? 1 : 0,
  }));

  return (
    <>
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
