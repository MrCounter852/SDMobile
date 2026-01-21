import React from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const CANCEL_ZONE_HEIGHT = 80;

const CancelDropZone = ({ isDraggingShared, isHovering }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isVisible = isDraggingShared?.value ?? false;
    return {
      opacity: isVisible ? 1 : 0,
      display: isVisible ? "flex" : "none",
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.dashedZone}>
        <View style={[styles.circleButton]}>
          <Ionicons name="close-outline" size={32} color="#7c7c7cff" />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: CANCEL_ZONE_HEIGHT,
    zIndex: 9999,
  },
  dashedZone: {
    flex: 1,
    borderWidth: 2,
    borderColor: "rgba(154, 154, 154, 0.5)",
    borderStyle: "dashed",
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});

export { CANCEL_ZONE_HEIGHT };
export default CancelDropZone;
