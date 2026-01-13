import React from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Floating overlay that shows a preview of the dragged contact
 * Positioned absolutely following the drag position
 */
const DragOverlay = ({
  draggedContact,
  dragX,
  dragY,
  dragScale,
  dragOpacity,
  visible,
  containerOffsetY = 0, // Offset from top of screen to the container
}) => {
  // Convert containerOffsetY to a derived value for use in worklet
  const offsetY = useDerivedValue(() => containerOffsetY, [containerOffsetY]);

  // Animated style that follows the drag position
  // dragX and dragY are screen-absolute, but the overlay is positioned
  // relative to its container, so we subtract the container offset
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: dragX.value - 140 }, // Center the card (half of width)
        { translateY: dragY.value - offsetY.value - 80 }, // Adjust for container offset + finger offset
        { scale: dragScale.value },
      ],
      opacity: visible ? dragOpacity.value : 0,
    };
  });

  // Extract contact display data - use safe defaults when no contact
  const nombre =
    draggedContact?.NombreCompleto || draggedContact?.Nombre || "Contacto";
  const celular = draggedContact?.Celular || draggedContact?.Telefono || "";
  const estado =
    draggedContact?.EstadoProcesoNombre || draggedContact?.Estado || "";

  const getEstadoColor = (estado) => {
    const est = String(estado).toLowerCase();
    if (est.includes("nuevo")) return "#337ab7";
    if (est.includes("gesti")) return "#00ACC4";
    if (est.includes("cerra")) return "#88E782";
    return "#8E8E93";
  };

  const statusColor = draggedContact?.Color || getEstadoColor(estado);

  // Don't render anything if no contact is being dragged
  if (!draggedContact) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="none">
      {/* Simplified contact card preview */}
      <View style={styles.card}>
        {/* Color indicator */}
        <View
          style={[styles.colorIndicator, { backgroundColor: statusColor }]}
        />

        <View style={styles.content}>
          {/* Name */}
          <Text style={styles.name} numberOfLines={1}>
            {nombre}
          </Text>

          {/* Phone */}
          {celular ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
              <Text style={styles.detailText} numberOfLines={1}>
                {celular}
              </Text>
            </View>
          ) : null}

          {/* Status badge */}
          {estado ? (
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{estado}</Text>
            </View>
          ) : null}
        </View>

        {/* Drag indicator */}
        <View style={styles.dragHandle}>
          <Ionicons name="move-outline" size={20} color="#AEAEB2" />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 280,
    zIndex: 9999,
    elevation: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    paddingLeft: 18,
    elevation: 12,
    shadowColor: "#337ab7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: "#337ab7",
    overflow: "hidden",
  },
  colorIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  dragHandle: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default DragOverlay;
