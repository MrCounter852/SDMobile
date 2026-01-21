import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const showDevAlert = (actionName) => {
  Alert.alert(
    "En desarrollo",
    `La funcionalidad "${actionName}" está en desarrollo.`,
    [{ text: "OK" }],
  );
};

const CrmGbiPropietarios = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  return (
    <View>
      {safeParseArray(contactDetail.Cotizaciones).length > 0 && (
        <InfoSection
          title={`Propuestas comerciales (${
            safeParseArray(contactDetail.Cotizaciones).length
          })`}
          icon="calculator-outline"
          headerAction={
            <TouchableOpacity
              style={localStyles.headerButton}
              onPress={() => showDevAlert("Nueva propuesta")}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          }
        >
          {safeParseArray(contactDetail.Cotizaciones).map((item, idx) => (
            <View key={idx} style={localStyles.card}>
              <View style={styles.txRow}>
                <Ionicons
                  name="file-tray-full-outline"
                  size={20}
                  color={item.Aprobado ? COLORS.success : COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>
                    Propuesta #{item.Consecutivo}
                  </Text>
                  <Text style={localStyles.subText}>
                    {formatDate(item.FechaElaboracion, false)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.txValue}>
                    {formatCurrency(item.ValorCotizacion)}
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
                      {item.Aprobado ? "Aprobado" : "Sin aprobar"}
                    </Text>
                  </View>
                </View>
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
                  onPress={() => showDevAlert("Ver PDF propuesta")}
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
                  onPress={() => showDevAlert("Editar propuesta")}
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
                    onPress={() => showDevAlert("Generar cupón de pago")}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={COLORS.secondary}
                    />
                    <Text style={localStyles.actionText}>Cupón</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Enviar por email")}
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

      {safeParseArray(contactDetail.PreFacturas).length > 0 && (
        <InfoSection
          title={`Cupones de pagos (${
            safeParseArray(contactDetail.PreFacturas).length
          })`}
          icon="receipt-outline"
        >
          {safeParseArray(contactDetail.PreFacturas).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={localStyles.card}
              onPress={() => showDevAlert("Ver cupón PDF")}
            >
              <View style={styles.txRow}>
                <Ionicons
                  name="mail-open-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>Cupón #{item.Consecutivo}</Text>
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
                  onPress={() => showDevAlert("Enviar cupón por email")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.actionText}>Email</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </InfoSection>
      )}

      {safeParseArray(contactDetail.Facturas).length > 0 && (
        <InfoSection
          title={`Facturas (${safeParseArray(contactDetail.Facturas).length})`}
          icon="cash-outline"
        >
          {safeParseArray(contactDetail.Facturas).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={localStyles.card}
              onPress={() => showDevAlert("Ver factura PDF")}
            >
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
            </TouchableOpacity>
          ))}
        </InfoSection>
      )}

      {safeParseArray(contactDetail.Inmuebles).length > 0 && (
        <InfoSection
          title={`Captación del inmueble (${
            safeParseArray(contactDetail.Inmuebles).length
          })`}
          icon="home-outline"
          headerAction={
            <TouchableOpacity
              style={localStyles.headerButton}
              onPress={() => showDevAlert("Nuevo inmueble")}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          }
        >
          {safeParseArray(contactDetail.Inmuebles).map((item, idx) => (
            <View key={idx} style={localStyles.propertyCard}>
              <View style={localStyles.propertyHeader}>
                <Text style={localStyles.propertyTitle}>
                  Inmueble #{item.Consecutivo}
                </Text>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor:
                        item.EstadoProcesoInmuebleID == 2
                          ? COLORS.success
                          : item.EstadoProcesoInmuebleID == 3
                            ? COLORS.danger
                            : COLORS.primary,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.EstadoProcesoInmuebleNombre}
                  </Text>
                </View>
              </View>

              {item.CausalDevolucionContratoNombre && (
                <View style={localStyles.rejectionRow}>
                  <Ionicons
                    name="warning-outline"
                    size={14}
                    color={COLORS.danger}
                  />
                  <Text style={localStyles.rejectionText}>
                    {item.CausalDevolucionContratoNombre}
                  </Text>
                </View>
              )}

              <Text style={localStyles.addressText}>{item.Direccion}</Text>

              <View style={styles.dataGrid}>
                <DataItem label="Tipo" value={item.TipoInmuebleNombre} />
                <DataItem label="Oferta" value={item.TipoOfertaNombre} />
                <DataItem
                  label={item.TipoOfertaID == 1 ? "Canon" : "Valor Venta"}
                  value={formatCurrency(
                    item.TipoOfertaID == 1 ? item.ValorCanon : item.ValorVenta,
                  )}
                />
              </View>

              {item.TipoOfertaID == 1 && (
                <View style={localStyles.inventoryBox}>
                  <Ionicons
                    name={
                      item.InmuebleInventarioID != null
                        ? "checkmark-circle"
                        : "alert-circle-outline"
                    }
                    size={20}
                    color={
                      item.InmuebleInventarioID != null
                        ? COLORS.success
                        : COLORS.danger
                    }
                  />
                  <Text
                    style={[
                      localStyles.inventoryText,
                      {
                        color:
                          item.InmuebleInventarioID != null
                            ? COLORS.success
                            : COLORS.danger,
                      },
                    ]}
                  >
                    Inventario:{" "}
                    {item.InmuebleInventarioID != null
                      ? item.RutaInventario != null
                        ? "Cargado"
                        : "Generado"
                      : "Sin generar"}
                  </Text>
                  {item.InmuebleInventarioID == null ? (
                    <TouchableOpacity
                      style={localStyles.inventoryButton}
                      onPress={() => showDevAlert("Generar inventario")}
                    >
                      <Text style={localStyles.inventoryButtonText}>
                        Generar
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={localStyles.inventoryActions}>
                      <TouchableOpacity
                        style={localStyles.inventoryButton}
                        onPress={() => showDevAlert("Modificar inventario")}
                      >
                        <Ionicons
                          name="create-outline"
                          size={14}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={localStyles.inventoryButton}
                        onPress={() => showDevAlert("Descargar PDF inventario")}
                      >
                        <Ionicons
                          name="download-outline"
                          size={14}
                          color={COLORS.success}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={localStyles.actionsRow}>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Ver ficha del inmueble")}
                >
                  <Ionicons
                    name="home-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={localStyles.actionText}>Ficha</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Editar inmueble")}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.secondary}
                  />
                  <Text style={localStyles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Publicar en plataformas")}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={COLORS.info || "#17a2b8"}
                  />
                  <Text style={localStyles.actionText}>Publicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {safeParseArray(contactDetail.Inmuebles).filter(
        (i) => i.EnTramiteMandato == true,
      ).length > 0 && (
        <InfoSection
          title={`Contratos (${safeParseArray(contactDetail.Inmuebles).filter((i) => i.EnTramiteMandato == true).length})`}
          icon="key-outline"
        >
          {safeParseArray(contactDetail.Inmuebles)
            .filter((i) => i.EnTramiteMandato == true)
            .map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={localStyles.card}
                onPress={() => showDevAlert("Ver contrato")}
              >
                <View style={styles.txRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={
                      item.ContratoMandatoAprobado
                        ? COLORS.success
                        : COLORS.danger
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txText}>
                      {item.ContratoMandatoAprobado
                        ? `Contrato #${item.ContratoMandatoConsecutivo}`
                        : "En trámite"}
                    </Text>
                    <Text style={localStyles.subText}>
                      Inmueble #{item.Consecutivo} - {item.TipoOfertaNombre}
                    </Text>
                    <Text style={localStyles.subText} numberOfLines={1}>
                      {item.Direccion}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View
                      style={[
                        localStyles.badge,
                        {
                          backgroundColor: item.ContratoMandatoAprobado
                            ? item.ContratoMandatoRuta != null
                              ? COLORS.success
                              : COLORS.secondary
                            : COLORS.danger,
                        },
                      ]}
                    >
                      <Text style={localStyles.badgeText}>
                        {item.ContratoMandatoAprobado
                          ? item.ContratoMandatoRuta != null
                            ? "Aprobado"
                            : "Pendiente firma"
                          : "Solicitado"}
                      </Text>
                    </View>
                    <Text style={[styles.txValue, { marginTop: 4 }]}>
                      {formatCurrency(
                        item.TipoOfertaID == 1
                          ? item.ValorCanon
                          : item.ValorVenta,
                      )}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </InfoSection>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  subText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  propertyCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
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
  rejectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    padding: 6,
    backgroundColor: "#FFF5F5",
    borderRadius: 6,
  },
  rejectionText: {
    fontSize: 11,
    color: COLORS.danger,
    flex: 1,
  },
  inventoryBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  inventoryText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  inventoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inventoryButtonText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  inventoryActions: {
    flexDirection: "row",
    gap: 8,
  },
});

export default CrmGbiPropietarios;
