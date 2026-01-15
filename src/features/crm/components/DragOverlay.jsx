import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

// Overlay dimensions for offset calculation
const OVERLAY_WIDTH = 280;
const OVERLAY_HEIGHT = 80;

/**
 * Floating overlay that shows a preview of the dragged contact
 * Position animations on UI thread, text content via React state
 * OPTIMIZED: Minimal animated calculations, no derived values
 * Hides during auto-scroll to prevent lag on low-end devices
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
  isAutoScrollingShared,
  containerOffsetY = 0,
}) => {
  // React state for text content (updated at drag start)
  const [displayData, setDisplayData] = useState({
    nombre: "Contacto",
    celular: "",
    estado: "",
    color: "#8E8E93",
  });

  // Store offsetY as shared value - update synchronously from effect
  const offsetYShared = useSharedValue(containerOffsetY);

  // Update shared value when prop changes (very rare - usually once on mount)
  useEffect(() => {
    offsetYShared.value = containerOffsetY;
  }, [containerOffsetY]);

  // Update display data when drag starts (only once per drag)
  useAnimatedReaction(
    () => isDraggingShared.value,
    (isDragging, wasDragging) => {
      if (isDragging && !wasDragging) {
        // Drag just started, update display data
        runOnJS(setDisplayData)({
          nombre: overlayNombre.value || "Contacto",
          celular: overlayCelular.value || "",
          estado: overlayEstado.value || "",
          color: overlayColor.value || "#8E8E93",
        });
      }
    }
  );

  // OPTIMIZED: Minimal animated style - hides during auto-scroll
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const isDragging = isDraggingShared.value;
    const isAutoScrolling = isAutoScrollingShared?.value ?? false;
    // Hide if not dragging, in cancel zone, OR during auto-scroll
    const isHidden = !isDragging || cancelZoneHover.value || isAutoScrolling;

    return {
      opacity: isHidden ? 0 : dragOpacity.value,
      transform: [
        { translateX: dragX.value - 140 }, // OVERLAY_WIDTH / 2 = 140
        { translateY: dragY.value - offsetYShared.value - 80 }, // OVERLAY_HEIGHT = 80
        { scale: isDragging ? dragScale.value : 1 },
      ],
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
