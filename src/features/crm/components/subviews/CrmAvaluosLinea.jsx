import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, styles, COLORS } from "./CrmSubViewComponents";

const showDevAlert = (actionName) => {
  Alert.alert(
    "En desarrollo",
    `La funcionalidad "${actionName}" está en desarrollo.`,
    [{ text: "OK" }],
  );
};

const CrmAvaluosLinea = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const cupones = safeParseArray(contactDetail.PreFacturas);

  return (
    <View>
      <InfoSection
        title={`Cupones de pago (${cupones.length})`}
        icon="receipt-outline"
        headerAction={
          <TouchableOpacity
            style={localStyles.headerButton}
            onPress={() => showDevAlert("Nuevo cupón")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        }
      >
        {cupones.length > 0 ? (
          cupones.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <View
                  style={[
                    localStyles.statusIndicator,
                    {
                      backgroundColor: item.Pagado
                        ? COLORS.success
                        : COLORS.danger,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <View style={localStyles.headerRow}>
                    <Text style={styles.txText}>Cupón #{item.Consecutivo}</Text>
                    <View
                      style={[
                        localStyles.badge,
                        {
                          backgroundColor: item.Pagado
                            ? COLORS.success
                            : COLORS.danger,
                        },
                      ]}
                    >
                      <Text style={localStyles.badgeText}>
                        {item.Pagado ? "Pagado" : "Pendiente"}
                      </Text>
                    </View>
                  </View>
                  <Text style={localStyles.subText}>
                    {formatDate(item.FechaCreacion, false)}
                  </Text>
                  {item.NombreCompleto && (
                    <Text style={localStyles.subText} numberOfLines={1}>
                      {item.NombreCompleto}
                    </Text>
                  )}
                </View>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorPreFactura)}
                </Text>
              </View>

              {item.PreFacturasVistas?.length > 0 && (
                <View style={localStyles.viewsRow}>
                  <Ionicons name="eye-outline" size={14} color={COLORS.gray} />
                  <Text style={localStyles.viewsText}>
                    {item.PreFacturasVistas.length} vistas
                  </Text>
                </View>
              )}

              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver cupón PDF")}
                >
                  <Ionicons
                    name="document-outline"
                    size={18}
                    color={COLORS.danger}
                  />
                  <Text style={localStyles.actionText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Editar cupón")}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={localStyles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Eliminar cupón")}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.danger}
                  />
                  <Text style={localStyles.actionText}>Eliminar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver vistas del cupón")}
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={COLORS.secondary}
                  />
                  <Text style={localStyles.actionText}>Vistas</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={localStyles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={40}
              color={COLORS.lightGray}
            />
            <Text style={localStyles.emptyText}>No hay cupones de pago</Text>
          </View>
        )}
      </InfoSection>

      <View style={localStyles.processActionContainer}>
        <TouchableOpacity
          style={localStyles.closeProcessButton}
          onPress={() => showDevAlert("Cerrar proceso")}
        >
          <Ionicons name="close-circle-outline" size={20} color="#FFF" />
          <Text style={localStyles.closeProcessText}>Cerrar proceso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  headerButton: {
    padding: 4,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
  },
  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  viewsText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 10,
  },
  processActionContainer: {
    padding: 16,
    alignItems: "center",
  },
  closeProcessButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  closeProcessText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CrmAvaluosLinea;
