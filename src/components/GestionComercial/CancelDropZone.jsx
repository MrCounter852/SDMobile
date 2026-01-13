import React from "react";
import { StyleSheet, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CANCEL_ZONE_HEIGHT = 80;

/**
 * Drop zone at the bottom of the screen to cancel a drag operation
 * Appears when isDragging is true and highlights when drag is over it
 */
const CancelDropZone = ({ visible, isHovering }) => {
  // Animated style for the zone appearance
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(visible ? 0 : CANCEL_ZONE_HEIGHT + 20, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      opacity: visible ? 1 : 0,
    };
  });

  // Background color changes when hovering
  const bgStyle = useAnimatedStyle(() => {
    const isActive = isHovering?.value ?? false;
    return {
      backgroundColor: isActive ? "#FF3B30" : "rgba(255, 59, 48, 0.9)",
      transform: [
        {
          scale: withSpring(isActive ? 1.02 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[styles.zone, bgStyle]}>
        <Ionicons
          name="close-circle-outline"
          size={28}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.text}>Soltar para cancelar</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CANCEL_ZONE_HEIGHT,
    zIndex: 9998,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  zone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

export { CANCEL_ZONE_HEIGHT };
export default CancelDropZone;
