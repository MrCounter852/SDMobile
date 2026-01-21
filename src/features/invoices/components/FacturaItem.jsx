import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FacturaItem = React.memo(({ item, onPress }) => {
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return "$" + value;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return String(dateString);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={() => onPress && onPress(item)}
    >
      <View style={styles.colorIndicator} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.invoiceNumber} numberOfLines={1}>
              {item.NumeroDocumento || "Sin número"}
            </Text>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
              <Text style={styles.dateText}>
                {formatDate(item.FechaRegistro)}
              </Text>
            </View>
          </View>
          <Text style={styles.valueText}>
            {formatCurrency(item.ValorTotal)}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="business-outline" size={12} color="#8E8E93" />
            </View>
            <Text style={styles.issuerText} numberOfLines={1}>
              {item.NombreCompleto || "Emisor desconocido"}
            </Text>
          </View>

          <View style={styles.secondaryDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="pricetag-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText}>
                {item.TipoPagoNombre || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="grid-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText} numberOfLines={2}>
                {item.CentroCostoCodigoNombre || "Sin C.C."}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  colorIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#337ab7",
  },
  content: {
    padding: 12,
    paddingLeft: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    textTransform: "uppercase",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: "#8E8E93",
    marginLeft: 4,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#337ab7",
  },
  details: {
    gap: 6,
  },
  secondaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  issuerText: {
    fontSize: 13,
    color: "#3A3A3C",
    fontWeight: "600",
  },
  detailText: {
    fontSize: 12,
    color: "#8E8E93",
  },
});

export default FacturaItem;
