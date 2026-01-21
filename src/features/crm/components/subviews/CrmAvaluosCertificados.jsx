import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

// Helper function for "En desarrollo" alerts
const showDevAlert = (actionName) => {
  Alert.alert(
    "En desarrollo",
    `La funcionalidad "${actionName}" está en desarrollo.`,
    [{ text: "OK" }],
  );
};

const CrmAvaluosCertificados = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const cotizaciones = safeParseArray(contactDetail.Cotizaciones);
  const preFacturas = safeParseArray(contactDetail.PreFacturasCotizaciones);

  // Check if any prefactura is paid to show "Cerrar proceso" button
  const hasAllPaid =
    preFacturas.length > 0 && preFacturas.every((pf) => pf.PagadaPSE);
  // Check if we can show "Reversar cupones" (some exist and none paid)
  const canReversarCupones =
    preFacturas.length > 0 && preFacturas.some((pf) => !pf.PagadaPSE);

  return (
    <View>
      {/* 1. Cotizaciones */}
      <InfoSection
        title={`Cotizaciones (${cotizaciones.length})`}
        icon="file-tray-full-outline"
        headerAction={
          <TouchableOpacity
            style={localStyles.headerButton}
            onPress={() => showDevAlert("Nueva cotización")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        }
      >
        {cotizaciones.length > 0 ? (
          cotizaciones.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              {/* Card Header */}
              <TouchableOpacity
                style={styles.txRow}
                onPress={() => showDevAlert("Ver PDF de cotización")}
              >
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
              </TouchableOpacity>

              {/* Data Grid */}
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

              {/* Views indicator */}
              {safeParseArray(item.CotizacionesVistas).length > 0 && (
                <TouchableOpacity
                  style={localStyles.viewsIndicator}
                  onPress={() => showDevAlert("Ver historial de vistas")}
                >
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color={COLORS.danger}
                  />
                  <Text style={localStyles.viewsText}>
                    {safeParseArray(item.CotizacionesVistas).length} vistas
                  </Text>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Editar cotización")}
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
                  onPress={() => showDevAlert("Eliminar cotización")}
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
                  onPress={() => showDevAlert("Enviar cotización por email")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.actionText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver PDF")}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={COLORS.secondary}
                  />
                  <Text style={localStyles.actionText}>PDF</Text>
                </TouchableOpacity>
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
          {/* Action buttons for section */}
          <View style={localStyles.sectionActions}>
            {canReversarCupones && (
              <TouchableOpacity
                style={[localStyles.sectionButton, localStyles.dangerButton]}
                onPress={() => showDevAlert("Reversar cupones de pago")}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={16}
                  color={COLORS.danger}
                />
                <Text
                  style={[
                    localStyles.sectionButtonText,
                    { color: COLORS.danger },
                  ]}
                >
                  Reversar cupones
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {preFacturas.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={localStyles.card}
              onPress={() => showDevAlert("Ver PDF del cupón")}
            >
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
              {/* PDF indicator */}
              <View style={localStyles.pdfHint}>
                <Ionicons
                  name="document-outline"
                  size={14}
                  color={COLORS.gray}
                />
                <Text style={localStyles.pdfHintText}>Toca para ver PDF</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Close process button */}
          {hasAllPaid && (
            <TouchableOpacity
              style={localStyles.closeProcessButton}
              onPress={() => showDevAlert("Cerrar proceso")}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#FFF" />
              <Text style={localStyles.closeProcessText}>Cerrar proceso</Text>
            </TouchableOpacity>
          )}
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
  viewsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewsText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: "500",
  },
  sectionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dangerButton: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "10",
  },
  sectionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pdfHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pdfHintText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  closeProcessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
  },
  closeProcessText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default CrmAvaluosCertificados;
