import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Vibration } from "react-native";

const ContactItem = ({ item, onPress, onLongPress, isSelected }) => {
  const d = useMemo(() => {
    const getEstadoNombre = (item) => {
      if (item.EstadoProcesoNombre) return item.EstadoProcesoNombre;
      if (item.EstadoProcesoID === 1) return "Nuevo";
      if (item.EstadoProcesoID === 4) return "En gestión";
      return item.Estado || "N/A";
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
      estado: String(getEstadoNombre(item)),
      celular: String(
        item.Celular ||
          item.celular ||
          item.Telefono ||
          item.telefono ||
          "Sin celular",
      ),
      asesor: String(
        item.AsesorNombreCompleto || item.asesorNombreCompleto || "",
      ),
      fecha: String(
        item.Fecha ||
          item.fecha ||
          item.FechaRegistro ||
          item.fechaRegistro ||
          "",
      ),
      valor: item.ValorNegocio || item.valorNegocio || 0,
      seguimientos: String(
        item.CountSeguimientos || item.countSeguimientos || 0,
      ),
      actividades: String(item.CountActividades || item.countActividades || 0),
      estadoGeneral: String(item.EstadoGeneral || item.estadoGeneral || ""),
      color: item.Color || item.color || null,
      origenID: item.OrigenPreContactoID || null,
    };
  }, [item]);

  const renderOriginSpecificContent = () => {
    if (d.origenID === 4 || d.origenID === 5) {
      const habitaciones = item.Habitaciones || 0;
      const banos = item.Banos || 0;
      const garajes = item.Garajes || 0;
      const tipoInmueble = item.TipoInmuebleNombre || "";
      const tipoOferta = item.TipoOfertaNombre || "";

      return (
        <View style={styles.originContent}>
          {(tipoInmueble || tipoOferta) && (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="home-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText}>
                {tipoInmueble && tipoOferta
                  ? `${tipoInmueble} - ${tipoOferta}`
                  : tipoInmueble || tipoOferta}
              </Text>
            </View>
          )}
          {(habitaciones > 0 || banos > 0 || garajes > 0) && (
            <View style={styles.propertyDetails}>
              {habitaciones > 0 && (
                <View style={styles.propertyBadge}>
                  <Ionicons name="bed-outline" size={14} color="#337ab7" />
                  <Text style={styles.propertyText}>
                    {String(habitaciones)}
                  </Text>
                </View>
              )}
              {banos > 0 && (
                <View style={styles.propertyBadge}>
                  <Ionicons name="water-outline" size={14} color="#337ab7" />
                  <Text style={styles.propertyText}>{String(banos)}</Text>
                </View>
              )}
              {garajes > 0 && (
                <View style={styles.propertyBadge}>
                  <Ionicons name="car-outline" size={14} color="#337ab7" />
                  <Text style={styles.propertyText}>{String(garajes)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      );
    }

    if (d.origenID === 7) {
      const tipoAvaluo = item.TipoAvaluoNombre || "";
      if (tipoAvaluo) {
        return (
          <View style={styles.originContent}>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={12}
                  color="#8E8E93"
                />
              </View>
              <Text style={styles.detailText}>{String(tipoAvaluo)}</Text>
            </View>
          </View>
        );
      }
    }

    if (d.origenID === 2) {
      const tipoOferta = item.TipoOfertaNombre || "";
      if (tipoOferta) {
        return (
          <View style={styles.originContent}>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="pricetag-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText}>{String(tipoOferta)}</Text>
            </View>
          </View>
        );
      }
    }

    if (d.origenID === 3) {
      const campo1 = item.ValorCampo1 || "";
      const campo2 = item.ValorCampo2 || "";
      if (campo1 || campo2) {
        return (
          <View style={styles.originContent}>
            {campo1 && (
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="information-circle-outline"
                    size={12}
                    color="#8E8E93"
                  />
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {String(campo1)}
                </Text>
              </View>
            )}
            {campo2 && (
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="information-circle-outline"
                    size={12}
                    color="#8E8E93"
                  />
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {String(campo2)}
                </Text>
              </View>
            )}
          </View>
        );
      }
    }

    if (d.origenID === 6) {
      const campo1 = item.ValorCampo1 || "";
      const campo3 = item.ValorCampo3 || "";
      if (campo1 || campo3) {
        return (
          <View style={styles.originContent}>
            {campo1 && (
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {String(campo1)}
                </Text>
              </View>
            )}
            {campo3 && (
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                </View>
                <Text style={styles.detailText} numberOfLines={1}>
                  {String(campo3)}
                </Text>
              </View>
            )}
          </View>
        );
      }
    }

    return null;
  };

  const statusColor = useMemo(() => {
    if (d.color) return d.color;
    const est = String(d.estado).toLowerCase();
    if (est.includes("nuevo")) return "#337ab7";
    if (est.includes("gesti")) return "#00ACC4";
    if (est.includes("cerra")) return "#88E782";
    if (est.includes("invia")) return "#0086C8";
    return "#8E8E93";
  }, [d.color, d.estado]);

  const formattedDate = useMemo(() => {
    if (!d.fecha) return "N/A";
    try {
      const date = new Date(d.fecha);
      if (isNaN(date.getTime())) return String(d.fecha);
      return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return String(d.fecha);
    }
  }, [d.fecha]);

  const formattedCurrency = useMemo(() => {
    if (d.valor === null || d.valor === undefined) return "N/A";
    if (d.valor === 0) return "$0";
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(d.valor);
    } catch (e) {
      return "N/A";
    }
  }, [d.valor]);

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
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, { flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {String(d.nombre)}
            </Text>
            {d.estado !== "N/A" && (
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusText}>{String(d.estado)}</Text>
              </View>
            )}
          </View>
          <View style={styles.actions}>
            {d.seguimientos > 0 && (
              <View style={styles.badge}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color="#337ab7"
                />
                <Text style={styles.badgeText}>{String(d.seguimientos)}</Text>
              </View>
            )}
            {d.actividades > 0 && (
              <View style={styles.badge}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={
                    d.estadoGeneral === "V"
                      ? "#88E782"
                      : d.estadoGeneral === "A"
                        ? "#00ACC4"
                        : "#337ab7"
                  }
                />
                <Text style={styles.badgeText}>{String(d.actividades)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
            </View>
            <Text style={styles.detailText}>{String(d.celular)}</Text>
          </View>

          {!!d.asesor && (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={12} color="#8E8E93" />
              </View>
              <Text
                style={[styles.detailText, { flex: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {String(d.asesor)}
              </Text>
            </View>
          )}
          {renderOriginSpecificContent()}
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={12} color="#AEAEB2" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          {d.valor > 0 && (
            <Text style={styles.valueText}>{formattedCurrency}</Text>
          )}
        </View>
      </View>
      <View style={[styles.colorIndicator, { backgroundColor: statusColor }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    minHeight: 110,
    overflow: "hidden",
  },
  content: {
    padding: 16,
    paddingLeft: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#3A3A3C",
    marginLeft: 4,
    fontWeight: "600",
  },
  details: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F8F8FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#3A3A3C",
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#AEAEB2",
    marginLeft: 6,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 15,
    color: "#337ab7",
    fontWeight: "700",
  },
  colorIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  selectedContainer: {
    backgroundColor: "#e0f7fa",
  },
  originContent: {
    marginTop: 6,
    gap: 6,
  },
  propertyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  propertyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  propertyText: {
    fontSize: 12,
    color: "#337ab7",
    fontWeight: "600",
  },
});

export default ContactItem;
