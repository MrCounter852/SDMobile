import React from "react";
import { StyleSheet, Text, Dimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../../core/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CANCEL_ZONE_HEIGHT = 90;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Drop zone at the bottom of the screen to cancel a drag operation
 * Appears when isDragging is true and highlights when drag is over it
 * Uses shared values to avoid re-renders
 */
const CancelDropZone = ({ isDraggingShared, isHovering }) => {
  const isActive = useDerivedValue(() => isHovering?.value ?? false);

  // Animated style for the zone appearance (slide up/down)
  // Uses shared value directly for no re-renders
  const animatedStyle = useAnimatedStyle(() => {
    const shouldShow = isDraggingShared?.value ?? false;

    return {
      transform: [
        {
          translateY: withSpring(shouldShow ? 0 : CANCEL_ZONE_HEIGHT + 40, {
            damping: 20,
            stiffness: 120,
          }),
        },
      ],
      opacity: shouldShow ? 1 : 0,
    };
  });

  // Inner zone scale and shadow style
  const zoneStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isActive.value ? 1.05 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      elevation: isActive.value ? 12 : 6,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[styles.zoneWrapper, zoneStyle]}>
        <AnimatedLinearGradient
          colors={
            isActive.value
              ? ["#FF4B4B", "#DC2626", "#B91C1C"] // Vibrant Red Gradient when hovering
              : ["rgba(30, 41, 59, 0.7)", "rgba(15, 23, 42, 0.8)"] // Glass Dark/Slate when idle
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                isActive.value && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={isActive.value ? "trash-outline" : "close-circle-outline"}
                size={26}
                color="#fff"
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>
                {isActive.value ? "Soltar para cancelar" : "Cancelar Arrastre"}
              </Text>
              {!isActive.value && (
                <Text style={styles.subLabel}>Arrastra aquí para anular</Text>
              )}
            </View>
          </View>
        </AnimatedLinearGradient>
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
    height: CANCEL_ZONE_HEIGHT + 20,
    zIndex: 9999,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: "flex-end",
  },
  zoneWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconContainerActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  textContainer: {
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  subLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
});

export { CANCEL_ZONE_HEIGHT };
export default CancelDropZone;
