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

const CrmStandard = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const cotizaciones = safeParseArray(contactDetail.Cotizaciones);
  const facturas = safeParseArray(contactDetail.Facturas);
  const documentos = safeParseArray(contactDetail.Documentos);

  return (
    <View>
      <InfoSection
        title={`Cotizaciones (${cotizaciones.length})`}
        icon="calculator-outline"
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
              <View style={styles.txRow}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={item.Aprobado ? COLORS.success : COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <View style={localStyles.headerRow}>
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
                        {item.Aprobado ? "Aprobada" : "Sin aprobar"}
                      </Text>
                    </View>
                  </View>
                  <Text style={localStyles.subText}>
                    {formatDate(item.FechaElaboracion, false)}
                  </Text>
                </View>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorCotizacion)}
                </Text>
              </View>

              {item.CotizacionesVistas?.length > 0 && (
                <View style={localStyles.viewsRow}>
                  <Ionicons name="eye-outline" size={14} color={COLORS.gray} />
                  <Text style={localStyles.viewsText}>
                    {item.CotizacionesVistas.length} vistas
                  </Text>
                </View>
              )}

              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver cotización PDF")}
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
              </View>
            </View>
          ))
        ) : (
          <View style={localStyles.emptyState}>
            <Ionicons
              name="calculator-outline"
              size={40}
              color={COLORS.lightGray}
            />
            <Text style={localStyles.emptyText}>No hay cotizaciones</Text>
          </View>
        )}
      </InfoSection>

      {facturas.length > 0 && (
        <InfoSection
          title={`Facturas (${facturas.length})`}
          icon="cash-outline"
        >
          {facturas.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={COLORS.success}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>
                    Factura {item.Prefijo}#{item.Consecutivo}
                  </Text>
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
                  {formatCurrency(item.ValorFactura)}
                </Text>
              </View>
              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver factura PDF")}
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
                  onPress={() => showDevAlert("Enviar factura por email")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.actionText}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {documentos.length > 0 && (
        <InfoSection
          title={`Documentos (${documentos.length})`}
          icon="folder-outline"
        >
          {documentos.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={localStyles.card}
              onPress={() => showDevAlert("Ver documento")}
            >
              <View style={styles.txRow}>
                <Ionicons
                  name="document-attach-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>
                    {item.Nombre || `Documento #${idx + 1}`}
                  </Text>
                  <Text style={localStyles.subText}>
                    {formatDate(item.FechaCreacion, false)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.gray}
                />
              </View>
            </TouchableOpacity>
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
  subText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
});

export default CrmStandard;
