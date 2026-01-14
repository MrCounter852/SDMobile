import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Floating overlay that shows a preview of the dragged contact
 * Position animations on UI thread, text content via React state
 */
const DragOverlay = ({
  overlayNombre,
  overlayCelular,
  overlayEstado,
  overlayColor,
  dragX,
  dragY,
  dragScale,
  dragOpacity,
  isDraggingShared,
  cancelZoneHover,
  containerOffsetY = 0,
}) => {
  // React state for text content (updated at drag start)
  const [displayData, setDisplayData] = useState({
    nombre: "Contacto",
    celular: "",
    estado: "",
    color: "#8E8E93",
  });

  // Convert containerOffsetY to derived value for use in worklet
  const offsetY = useDerivedValue(() => containerOffsetY, [containerOffsetY]);

  // Update display data when overlay values change (at drag start)
  useAnimatedReaction(
    () => ({
      nombre: overlayNombre.value,
      celular: overlayCelular.value,
      estado: overlayEstado.value,
      color: overlayColor.value,
      isDragging: isDraggingShared.value,
    }),
    (current, previous) => {
      if (current.isDragging && !previous?.isDragging) {
        // Drag just started, update display data
        runOnJS(setDisplayData)({
          nombre: current.nombre || "Contacto",
          celular: current.celular || "",
          estado: current.estado || "",
          color: current.color || "#8E8E93",
        });
      }
    },
    []
  );

  // Animated style that follows the drag position
  const animatedStyle = useAnimatedStyle(() => {
    const shouldShow = isDraggingShared.value && !cancelZoneHover.value;

    return {
      transform: [
        { translateX: dragX.value - 140 },
        { translateY: dragY.value - offsetY.value - 80 },
        { scale: dragScale.value },
      ],
      opacity: shouldShow ? dragOpacity.value : 0,
    };
  });

  const getEstadoColor = (estado) => {
    const est = String(estado).toLowerCase();
    if (est.includes("nuevo")) return "#337ab7";
    if (est.includes("gesti")) return "#00ACC4";
    if (est.includes("cerra")) return "#88E782";
    return "#8E8E93";
  };

  const statusColor = displayData.color || getEstadoColor(displayData.estado);

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="none">
      <View style={styles.card}>
        {/* Color indicator */}
        <View
          style={[styles.colorIndicator, { backgroundColor: statusColor }]}
        />

        <View style={styles.content}>
          {/* Name */}
          <Text style={styles.name} numberOfLines={1}>
            {displayData.nombre}
          </Text>

          {/* Phone */}
          {displayData.celular ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
              <Text style={styles.detailText} numberOfLines={1}>
                {displayData.celular}
              </Text>
            </View>
          ) : null}

          {/* Status badge */}
          {displayData.estado ? (
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{displayData.estado}</Text>
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
