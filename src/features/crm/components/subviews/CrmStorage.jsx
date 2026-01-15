import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmStorage = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  return (
    <View>
      {/* 1. Cotizaciones */}
      <InfoSection
        title={`Cotizaciones (${
          safeParseArray(contactDetail.Cotizaciones).length
        })`}
        icon="file-tray-full-outline"
      >
        {safeParseArray(contactDetail.Cotizaciones).length > 0 ? (
          safeParseArray(contactDetail.Cotizaciones).map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <div style={styles.txRow}>
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
              </div>
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

      {/* 2. Ordenes de Servicio */}
      {safeParseArray(contactDetail.OrdenesServicios).length > 0 && (
        <InfoSection
          title={`Ordenes de Servicio (${
            safeParseArray(contactDetail.OrdenesServicios).length
          })`}
          icon="construct-outline"
        >
          {safeParseArray(contactDetail.OrdenesServicios).map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.txText}>Orden #{item.Consecutivo}</Text>
                <Text style={localStyles.stateText}>
                  {item.EstadoOrdenServicioNombre}
                </Text>
              </View>
              <View style={styles.dataGrid}>
                <DataItem
                  label="Valor"
                  value={formatCurrency(item.ValorOrdenServicio)}
                />
                <DataItem
                  label="Fecha"
                  value={formatDate(item.FechaElaboracion)}
                />
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 3. Código de Barras / Pre-Facturas */}
      {safeParseArray(contactDetail.PreFacturas).length > 0 && (
        <InfoSection
          title={`Códigos de barras (${
            safeParseArray(contactDetail.PreFacturas).length
          })`}
          icon="barcode-outline"
        >
          {safeParseArray(contactDetail.PreFacturas).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons name="barcode" size={20} color={COLORS.dark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>Código #{item.Consecutivo}</Text>
                <Text style={localStyles.subText}>
                  {formatDate(item.FechaCreacion)}
                </Text>
              </View>
              <Text style={styles.txHighlight}>
                {formatCurrency(item.ValorPreFactura)}
              </Text>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 4. Facturas */}
      {safeParseArray(contactDetail.Facturas).length > 0 && (
        <InfoSection
          title={`Facturas (${safeParseArray(contactDetail.Facturas).length})`}
          icon="card-outline"
        >
          {safeParseArray(contactDetail.Facturas).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name="document-attach"
                size={20}
                color={COLORS.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>
                  {item.Prefijo}
                  {item.Consecutivo}
                </Text>
                <Text style={localStyles.subText}>
                  {formatDate(item.FechaCreacion)}
                </Text>
              </View>
              <Text style={styles.txHighlight}>
                {formatCurrency(item.ValorFactura)}
              </Text>
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
  stateText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "700",
  },
  subText: {
    fontSize: 11,
    color: COLORS.gray,
  },
});

export default CrmStorage;
