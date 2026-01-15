import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmStorageFull = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const formatoVinculacion = contactDetail.FormatoVinculacion || {};
  const formatoSeguro = contactDetail.FormatoSeguro || {};

  const getStatusColor = (status) => {
    if (!status) return COLORS.gray;
    if (status === "Firmada") return COLORS.success;
    if (status === "Eliminada" || status === "Rechazada") return COLORS.danger;
    return COLORS.primary; // For "En firma" etc.
  };

  return (
    <View>
      {/* 1. Formato de Vinculación & Seguro */}
      {contactDetail.IsFormatoVinculacion && (
        <InfoSection title="Vinculación y Seguros" icon="document-text-outline">
          {/* Vinculación */}
          <View style={localStyles.docRow}>
            <Ionicons
              name="clipboard-outline"
              size={24}
              color={COLORS.primary}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={localStyles.docTitle}>
                {formatoVinculacion.FormatoVinculacionID
                  ? `Formato Vinculación #${formatoVinculacion.Consecutivo}`
                  : "Formato de Vinculación"}
              </Text>
              <View
                style={[
                  localStyles.statusBadge,
                  {
                    backgroundColor: getStatusColor(
                      formatoVinculacion.EstadoFirmasSignio
                    ),
                  },
                ]}
              >
                <Text style={localStyles.statusText}>
                  {formatoVinculacion.EstadoFirmasSignio || "Sin firmar"}
                </Text>
              </View>
            </View>
          </View>

          {/* Seguro */}
          {formatoVinculacion.FormatoVinculacionID && (
            <View
              style={[
                localStyles.docRow,
                {
                  marginTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                  paddingTop: 12,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={COLORS.success}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={localStyles.docTitle}>
                  {formatoSeguro.FormatoSeguroID
                    ? `Formato Seguro #${formatoSeguro.Consecutivo}`
                    : "Formato de Seguro"}
                </Text>
                <View
                  style={[
                    localStyles.statusBadge,
                    {
                      backgroundColor: getStatusColor(
                        formatoSeguro.EstadoFirmaSignio
                      ),
                    },
                  ]}
                >
                  <Text style={localStyles.statusText}>
                    {formatoSeguro.EstadoFirmaSignio || "Sin firmar"}
                  </Text>
                </View>
                {formatoVinculacion.TomaSeguro !== undefined && (
                  <Text style={localStyles.subNote}>
                    {formatoVinculacion.TomaSeguro
                      ? "✓ Toma seguro"
                      : "✗ No toma seguro"}
                  </Text>
                )}
              </View>
            </View>
          )}
        </InfoSection>
      )}

      {/* 2. Cotizaciones */}
      <InfoSection
        title={`Cotizaciones (${
          safeParseArray(contactDetail.Cotizaciones).length
        })`}
        icon="file-tray-full-outline"
      >
        {safeParseArray(contactDetail.Cotizaciones).length > 0 ? (
          safeParseArray(contactDetail.Cotizaciones).map((item, idx) => (
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

      {/* 3. Ordenes de Servicio */}
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

      {/* 4. Código de Barras / Pre-Facturas */}
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

      {/* 5. Facturas */}
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
  docRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
  },
  subNote: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: "italic",
  },
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

export default CrmStorageFull;
