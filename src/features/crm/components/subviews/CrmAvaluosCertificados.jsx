import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmAvaluosCertificados = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const cotizaciones = safeParseArray(contactDetail.Cotizaciones);
  const preFacturas = safeParseArray(contactDetail.PreFacturasCotizaciones);

  return (
    <View>
      {/* 1. Cotizaciones */}
      <InfoSection
        title={`Cotizaciones (${cotizaciones.length})`}
        icon="file-tray-full-outline"
      >
        {cotizaciones.length > 0 ? (
          cotizaciones.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={item.Aprobado ? COLORS.success : COLORS.primary}
                />
                <Text style={styles.txText}>
                  Cotización #{item.Consecutivo}
                </Text>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.Aprobado
                        ? COLORS.success
                        : COLORS.primary,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.Aprobado ? "Aprobado" : "Pendiente"}
                  </Text>
                </View>
              </View>
              <View style={styles.dataGrid}>
                <DataItem
                  label="Valor"
                  value={formatCurrency(item.ValorCotizacion)}
                />
                <DataItem
                  label="Fecha"
                  value={formatDate(item.FechaElaboracion)}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay cotizaciones registradas</Text>
        )}
      </InfoSection>

      {/* 2. Cupones de Pago */}
      {preFacturas.length > 0 && (
        <InfoSection
          title={`Cupones de pago (${preFacturas.length})`}
          icon="receipt-outline"
        >
          {preFacturas.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={item.PagadaPSE ? COLORS.success : COLORS.secondary}
                />
                <Text style={styles.txText}>Cupón #{item.Consecutivo}</Text>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.PagadaPSE
                        ? COLORS.success
                        : COLORS.secondary,
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
                  <DataItem
                    label="Valor"
                    value={formatCurrency(item.ValorPreFactura)}
                  />
                  <DataItem
                    label="Fecha"
                    value={formatDate(item.FechaCreacion)}
                  />
                </View>
              </View>
            </View>
          ))}
        </InfoSection>
      )}
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

export default CrmAvaluosCertificados;
