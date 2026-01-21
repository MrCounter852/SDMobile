import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const OVERLAY_WIDTH = 280;
const OVERLAY_HEIGHT = 80;

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
  const [displayData, setDisplayData] = useState({
    nombre: "Contacto",
    celular: "",
    estado: "",
    color: "#8E8E93",
  });

  const offsetYShared = useSharedValue(containerOffsetY);

  useEffect(() => {
    offsetYShared.value = containerOffsetY;
  }, [containerOffsetY]);

  useAnimatedReaction(
    () => isDraggingShared.value,
    (isDragging, wasDragging) => {
      if (isDragging && !wasDragging) {
        runOnJS(setDisplayData)({
          nombre: overlayNombre.value || "Contacto",
          celular: overlayCelular.value || "",
          estado: overlayEstado.value || "",
          color: overlayColor.value || "#8E8E93",
        });
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const isDragging = isDraggingShared.value;
    const isAutoScrolling = isAutoScrollingShared?.value ?? false;
    const isHidden = !isDragging || cancelZoneHover.value || isAutoScrolling;

    return {
      opacity: isHidden ? 0 : dragOpacity.value,
      transform: [
        { translateX: dragX.value - 140 },
        { translateY: dragY.value - offsetYShared.value - 80 },
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
        <View
          style={[styles.colorIndicator, { backgroundColor: statusColor }]}
        />

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {displayData.nombre}
          </Text>

          {displayData.celular ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
              <Text style={styles.detailText} numberOfLines={1}>
                {displayData.celular}
              </Text>
            </View>
          ) : null}

          {displayData.estado ? (
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{displayData.estado}</Text>
            </View>
          ) : null}
        </View>

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
    borderRadius: 12,
    padding: 10,
    paddingLeft: 16,
    elevation: 4,
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
