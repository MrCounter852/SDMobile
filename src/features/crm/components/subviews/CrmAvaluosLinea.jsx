import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, styles, COLORS } from "./CrmSubViewComponents";

const CrmAvaluosLinea = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const preFacturas = safeParseArray(contactDetail.PreFacturas);

  return (
    <View>
      <InfoSection
        title={`Cupones de pago (${preFacturas.length})`}
        icon="receipt-outline"
      >
        {preFacturas.length > 0 ? (
          preFacturas.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={item.PagadaPSE ? COLORS.success : COLORS.primary}
                />
                <Text style={styles.txText}>Cupón #{item.Consecutivo}</Text>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.PagadaPSE
                        ? COLORS.success
                        : COLORS.primary,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.PagadaPSE ? "Pagado" : "Pendiente"}
                  </Text>
                </View>
              </View>
              <View style={localStyles.content}>
                <Text style={localStyles.clientName}>
                  {item.PreFacturaNombre} {item.PreFacturaApellido}
                </Text>
                <View style={styles.dataGrid}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Valor</Text>
                    <Text style={styles.dataValue}>
                      {formatCurrency(item.ValorPreFactura)}
                    </Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Fecha</Text>
                    <Text style={styles.dataValue}>
                      {formatDate(item.FechaCreacion)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay cupones registrados</Text>
        )}
      </InfoSection>
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
  content: {
    marginTop: 8,
  },
  clientName: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "600",
    marginBottom: 4,
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
});

export default CrmAvaluosLinea;
