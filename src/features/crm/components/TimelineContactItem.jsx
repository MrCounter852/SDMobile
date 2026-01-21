import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Vibration } from "react-native";
import { useGlobal } from "../../../core/global";
import { COLORS } from "../../../core/theme";

const TimelineContactItem = ({ item, onPress, onLongPress, isSelected }) => {
  const { user } = useGlobal();
  const d = useMemo(() => {
    const estado = (
      item.EstadoProcesoNombre ||
      item.Estado ||
      "Nuevo"
    ).toLowerCase();

    const getStatusColor = () => {
      if (item.Color) return item.Color;
      if (estado.includes("nuevo")) return COLORS.primary;
      if (estado.includes("gesti")) return COLORS.accent;
      if (estado.includes("cerra")) return COLORS.highlight;
      if (estado.includes("invia")) return COLORS.secondary;
      return COLORS.lightGray;
    };

    return {
      nombre: String(
        item.NombreCompleto ||
          item.nombreCompleto ||
          item.Nombre ||
          item.nombre ||
          (item.Nombres || item.nombres
            ? `${item.Nombres || item.nombres} ${
                item.Apellidos || item.apellidos || ""
              }`.trim()
            : "Contacto sin nombre"),
      ),
      celular: item.Celular || item.celular || null,
      email: item.Email || item.email || null,
      asesor: item.AsesorNombreCompleto || item.asesorNombreCompleto || null,
      fecha:
        item.Fecha ||
        item.fecha ||
        item.FechaRegistro ||
        item.fechaRegistro ||
        null,
      fechaCierre: item.FechaCierre || item.fechaCierre || null,
      fechaCambio:
        item.FechaCambioLineaTiempo || item.fechaCambioLineaTiempo || null,
      valor: item.ValorNegocio || item.valorNegocio || 0,
      seguimientos: parseInt(
        item.CountSeguimientos || item.countSeguimientos || 0,
      ),
      actividades: parseInt(
        item.CountActividades || item.countActividades || 0,
      ),
      estadoGeneral: String(item.EstadoGeneral || item.estadoGeneral || ""),
      color: getStatusColor(),
      lineaTiempoAutomatica: item.LineaTiempoAutomatica ?? true,
      origenID: item.OrigenPreContactoID || null,
    };
  }, [item]);

  const canEditTimeline = useMemo(() => {
    return user?.EdicionLineaTiempo === true;
  }, [user]);

  const formattedDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const strTime = date.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return `${day}/${month} ${strTime}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const formattedCurrency = useMemo(() => {
    if (d.valor === null || d.valor === undefined || d.valor === 0) return null;
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(d.valor);
    } catch (e) {
      return String(d.valor);
    }
  }, [d.valor]);

  const getActividadColor = () => {
    if (d.estadoGeneral === "V") return COLORS.highlight;
    if (d.estadoGeneral === "A") return "#FFB020";
    return "#FF4842";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPress && onPress(item)}
      onLongPress={() => {
        Vibration.vibrate(50);
        onLongPress && onLongPress(item);
      }}
    >
      <View style={[styles.statusStrip, { backgroundColor: d.color }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {d.nombre}
          </Text>
          <View style={styles.actions}>
            {d.seguimientos > 0 && (
              <View style={styles.miniBadge}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={12}
                  color={COLORS.secondary}
                />
                <Text style={styles.miniBadgeText}>
                  {d.seguimientos < 10 ? d.seguimientos : "+"}
                </Text>
              </View>
            )}

            {d.actividades > 0 && (
              <View
                style={[
                  styles.miniBadge,
                  { backgroundColor: `${getActividadColor()}15` },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={12}
                  color={getActividadColor()}
                />
                <Text
                  style={[styles.miniBadgeText, { color: getActividadColor() }]}
                >
                  {d.actividades < 10 ? d.actividades : "+"}
                </Text>
              </View>
            )}

            {canEditTimeline && (
              <Ionicons
                name={
                  d.lineaTiempoAutomatica === false
                    ? "lock-closed"
                    : "lock-open-outline"
                }
                size={14}
                color={
                  d.lineaTiempoAutomatica === false
                    ? "#FF4842"
                    : COLORS.lightGray
                }
              />
            )}
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.fieldRow}>
            {!!formattedCurrency && (
              <View style={styles.field}>
                <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="cash-outline" size={10} color="#2E7D32" />
                </View>
                <Text style={styles.valueTextBold}>{formattedCurrency}</Text>
              </View>
            )}
            {!!d.asesor && (
              <View style={[styles.field, { flex: 1 }]}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="person-outline"
                    size={10}
                    color={COLORS.secondary}
                  />
                </View>
                <Text style={styles.labelText} numberOfLines={1}>
                  {d.asesor}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.datesGrid}>
            <View style={styles.dateItem}>
              <Ionicons
                name="add-circle-outline"
                size={10}
                color={COLORS.lightGray}
              />
              <Text style={styles.dateText}>{formattedDate(d.fecha)}</Text>
            </View>
            {!!d.fechaCierre && (
              <View style={styles.dateItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={10}
                  color="#2E7D32"
                />
                <Text style={styles.dateText}>
                  {formattedDate(d.fechaCierre)}
                </Text>
              </View>
            )}
            {!!d.fechaCambio && (
              <View style={styles.dateItem}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={10}
                  color="#FF4842"
                />
                <Text style={styles.dateText}>
                  {formattedDate(d.fechaCambio)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.fieldRow}>
            {!!d.celular && (
              <View style={styles.field}>
                <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                  <Ionicons
                    name="call-outline"
                    size={10}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.labelText}>{d.celular}</Text>
              </View>
            )}
            {!!d.email && (
              <View style={[styles.field, { flex: 1 }]}>
                <View style={[styles.iconBox, { backgroundColor: "#F3E5F5" }]}>
                  <Ionicons name="mail-outline" size={10} color="#7B1FA2" />
                </View>
                <Text style={styles.labelText} numberOfLines={1}>
                  {d.email}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: 6,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    minHeight: 110,
  },
  statusStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    padding: 12,
    paddingLeft: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  detailGrid: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
  valueTextBold: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700",
  },
  datesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F8FAFC",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.lightGray,
    fontWeight: "600",
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F7FF",
  },
});

export default memo(TimelineContactItem);
