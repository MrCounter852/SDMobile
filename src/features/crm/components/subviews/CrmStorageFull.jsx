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

const CrmStorageFull = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const cotizaciones = safeParseArray(contactDetail.Cotizaciones);
  const ordenesServicio = safeParseArray(contactDetail.OrdenServicios);
  const codigosBarras = safeParseArray(contactDetail.PreFacturas);
  const facturas = safeParseArray(contactDetail.Facturas);

  const getFormStatus = (form) => {
    if (form.Eliminado) return { label: "Eliminada", color: COLORS.danger };
    if (form.Firmado) return { label: "Firmada", color: COLORS.success };
    if (form.Rechazado) return { label: "Rechazada", color: COLORS.danger };
    return { label: "En firma", color: COLORS.primary };
  };

  return (
    <View>
      <InfoSection
        title="Formato de Vinculación & Seguro"
        icon="document-attach-outline"
      >
        <View style={localStyles.formCard}>
          <View style={localStyles.formHeader}>
            <View>
              <Text style={localStyles.formTitle}>Formato de Vinculación</Text>
              {contactDetail.FormatoVinculacion && (
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: getFormStatus(
                        contactDetail.FormatoVinculacion,
                      ).color,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {getFormStatus(contactDetail.FormatoVinculacion).label}
                  </Text>
                </View>
              )}
            </View>
            {contactDetail.FormatoVinculacion && (
              <View style={localStyles.formActions}>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Ver documento vinculación")}
                >
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Histórico de firmas")}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Copiar enlace vinculación")}
                >
                  <Ionicons name="link-outline" size={20} color={COLORS.gray} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Enviar por WhatsApp")}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={20}
                    color={COLORS.success}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!contactDetail.FormatoVinculacion && (
            <TouchableOpacity
              style={localStyles.openFormBtn}
              onPress={() => showDevAlert("Abrir formulario vinculación")}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={localStyles.openFormText}>Abrir formulario</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={localStyles.formCard}>
          <View style={localStyles.formHeader}>
            <View>
              <Text style={localStyles.formTitle}>Formato de Seguro</Text>
              {contactDetail.FormatoSeguro && (
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: getFormStatus(
                        contactDetail.FormatoSeguro,
                      ).color,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {getFormStatus(contactDetail.FormatoSeguro).label}
                  </Text>
                </View>
              )}
              {contactDetail.TomaSeguro && (
                <View style={localStyles.insuranceNote}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.insuranceText}>Toma seguro</Text>
                </View>
              )}
            </View>
            {contactDetail.FormatoSeguro && (
              <View style={localStyles.formActions}>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Ver documento seguro")}
                >
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Histórico de firmas seguro")}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Copiar enlace seguro")}
                >
                  <Ionicons name="link-outline" size={20} color={COLORS.gray} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.formActionBtn}
                  onPress={() => showDevAlert("Enviar por WhatsApp")}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={20}
                    color={COLORS.success}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!contactDetail.FormatoSeguro && (
            <TouchableOpacity
              style={localStyles.openFormBtn}
              onPress={() => showDevAlert("Abrir formulario seguro")}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={localStyles.openFormText}>Abrir formulario</Text>
            </TouchableOpacity>
          )}
        </View>
      </InfoSection>

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
                {item.Aprobado && (
                  <TouchableOpacity
                    style={localStyles.actionButton}
                    onPress={() => showDevAlert("Generar orden de servicio")}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color={COLORS.success}
                    />
                    <Text style={localStyles.actionText}>Gen. Orden</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver vistas de cotización")}
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
              name="calculator-outline"
              size={40}
              color={COLORS.lightGray}
            />
            <Text style={localStyles.emptyText}>No hay cotizaciones</Text>
          </View>
        )}
      </InfoSection>

      {ordenesServicio.length > 0 && (
        <InfoSection
          title={`Ordenes de Servicio (${ordenesServicio.length})`}
          icon="cube-outline"
        >
          {ordenesServicio.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <View style={{ flex: 1 }}>
                  <View style={localStyles.headerRow}>
                    <Text style={styles.txText}>Orden #{item.Consecutivo}</Text>
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
                        {item.Aprobado ? "Aprobada" : "Pendiente"}
                      </Text>
                    </View>
                  </View>
                  <Text style={localStyles.subText}>
                    {formatDate(item.FechaCreacion, false)}
                  </Text>
                </View>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorOrdenServicio)}
                </Text>
              </View>
              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver orden PDF")}
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
                  onPress={() => showDevAlert("Editar orden")}
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
                  onPress={() => showDevAlert("Enviar orden por email")}
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

      {codigosBarras.length > 0 && (
        <InfoSection
          title={`Código de Barras / Pre-Facturas (${codigosBarras.length})`}
          icon="barcode-outline"
        >
          {codigosBarras.map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="barcode-outline"
                  size={20}
                  color={item.Pagado ? COLORS.success : COLORS.danger}
                />
                <View style={{ flex: 1 }}>
                  <View style={localStyles.headerRow}>
                    <Text style={styles.txText}>
                      Pre-Factura #{item.Consecutivo}
                    </Text>
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
              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver proforma PDF")}
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
                  onPress={() => showDevAlert("Enviar proforma por email")}
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
    </View>
  );
};

const localStyles = StyleSheet.create({
  formCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 6,
  },
  formActions: {
    flexDirection: "row",
    gap: 8,
  },
  formActionBtn: {
    padding: 6,
  },
  openFormBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F0F4FF",
    gap: 6,
  },
  openFormText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  insuranceNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  insuranceText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "500",
  },
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

export default CrmStorageFull;
