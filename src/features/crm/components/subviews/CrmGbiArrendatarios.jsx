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

// Helper function to get Estado color based on EstadoProcesoInmuebleID
const getEstadoColor = (item) => {
  if (item.EstadoProcesoInmuebleNombre === "Corretaje")
    return COLORS.info || "#17a2b8";
  if (item.EstadoProcesoInmuebleNombre === "Rentando") return COLORS.primary;
  if ([1, 4, 5].includes(item.EstadoProcesoInmuebleID)) return COLORS.success;
  return COLORS.danger;
};

const CrmGbiArrendatarios = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  // Count uploaded documents
  const documentosSubidos = safeParseArray(
    contactDetail.ProcesosDocumentos,
  ).filter((d) => d.Ruta != null).length;
  const documentosRequeridos =
    contactDetail.CountDocumentosRequeridos ||
    safeParseArray(contactDetail.ProcesosDocumentos).length;

  // Check if there are contracts not annulled
  const hasActiveContracts = safeParseArray(contactDetail.Contratos).some(
    (c) => c.Anulado === false,
  );

  return (
    <View>
      {/* 1. Inmuebles de Interés */}
      {safeParseArray(contactDetail.InmueblesProcesos).length > 0 && (
        <InfoSection
          title={`Inmuebles de interés (${
            safeParseArray(contactDetail.InmueblesProcesos).length
          })`}
          icon="home-outline"
        >
          {safeParseArray(contactDetail.InmueblesProcesos).map((item, idx) => (
            <View key={idx} style={localStyles.propertyCard}>
              {/* Header with property number and badges */}
              <View style={localStyles.propertyHeader}>
                <View style={localStyles.propertyTitleRow}>
                  <Text style={localStyles.propertyTitle}>
                    Inmueble #{item.InmuebleConsecutivo}
                  </Text>
                  {item.Principal && (
                    <Ionicons name="star" size={16} color={COLORS.secondary} />
                  )}
                </View>
                {/* Estado Badge */}
                {item.EstadoProcesoInmuebleNombre && (
                  <View
                    style={[
                      localStyles.badge,
                      { backgroundColor: getEstadoColor(item) },
                    ]}
                  >
                    <Text style={localStyles.badgeText}>
                      {item.EstadoProcesoInmuebleNombre}
                    </Text>
                  </View>
                )}
              </View>

              {/* Address */}
              <Text style={localStyles.addressText}>
                {item.InmuebleDireccion}
              </Text>

              {/* Property characteristics row */}
              <View style={localStyles.characteristicsRow}>
                <View style={localStyles.characteristicItem}>
                  <Ionicons name="bed-outline" size={14} color={COLORS.gray} />
                  <Text style={localStyles.characteristicText}>
                    {item.Habitaciones ?? 0}
                  </Text>
                </View>
                <View style={localStyles.characteristicItem}>
                  <Ionicons
                    name="water-outline"
                    size={14}
                    color={COLORS.gray}
                  />
                  <Text style={localStyles.characteristicText}>
                    {item.Banos ?? 0}
                  </Text>
                </View>
                <View style={localStyles.characteristicItem}>
                  <Ionicons name="car-outline" size={14} color={COLORS.gray} />
                  <Text style={localStyles.characteristicText}>
                    {item.Parqueaderos ?? 0}
                  </Text>
                </View>
              </View>

              {/* Data grid */}
              <View style={styles.dataGrid}>
                <DataItem label="Tipo" value={item.TipoInmueble} />
                <DataItem
                  label="Canon"
                  value={formatCurrency(item.ValorCanon)}
                />
                <DataItem
                  label="Administración"
                  value={formatCurrency(item.ValorAdmin)}
                />
                <View style={[styles.dataItem, { justifyContent: "center" }]}>
                  <View
                    style={[
                      localStyles.badge,
                      {
                        backgroundColor: item.Interesado
                          ? COLORS.success
                          : COLORS.danger,
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text style={localStyles.badgeText}>
                      {item.Interesado ? "Interesado" : "No interesado"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action buttons row */}
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
                  onPress={() => showDevAlert("Ver PDF del inmueble")}
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
                  onPress={() => showDevAlert("Agendar cita")}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.info || "#17a2b8"}
                  />
                  <Text style={localStyles.actionText}>Cita</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.actionButton}
                  onPress={() => showDevAlert("Más opciones")}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={COLORS.gray}
                  />
                  <Text style={localStyles.actionText}>Más</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2. Cupones de Pago Procesos */}
      {safeParseArray(contactDetail.PreFacturas).length > 0 && (
        <InfoSection
          title={`Cupones de pagos (${
            safeParseArray(contactDetail.PreFacturas).length
          })`}
          icon="receipt-outline"
        >
          {safeParseArray(contactDetail.PreFacturas).map((item, idx) => (
            <View key={idx} style={localStyles.cuponCard}>
              <View style={localStyles.cuponHeader}>
                <Ionicons
                  name="mail-open-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
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
              <TouchableOpacity
                style={localStyles.emailButton}
                onPress={() => showDevAlert("Enviar cupón por email")}
              >
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={COLORS.success}
                />
                <Text style={localStyles.emailButtonText}>Enviar email</Text>
              </TouchableOpacity>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2b. Cupones de Pago Contratos */}
      {safeParseArray(contactDetail.PreFacturasContratos).length > 0 && (
        <InfoSection
          title={`Cupones de pagos contratos (${
            safeParseArray(contactDetail.PreFacturasContratos).length
          })`}
          icon="receipt-outline"
        >
          {safeParseArray(contactDetail.PreFacturasContratos).map(
            (item, idx) => (
              <View key={idx} style={localStyles.cuponCard}>
                <View style={localStyles.cuponHeader}>
                  <Ionicons
                    name="mail-open-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
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
                <TouchableOpacity
                  style={localStyles.emailButton}
                  onPress={() => showDevAlert("Enviar cupón por email")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.emailButtonText}>Enviar email</Text>
                </TouchableOpacity>
              </View>
            ),
          )}
        </InfoSection>
      )}

      {/* 3. Documentos */}
      {safeParseArray(contactDetail.ProcesosDocumentos).length > 0 && (
        <InfoSection
          title={`Documentos solicitud contrato (${documentosSubidos} de ${documentosRequeridos})`}
          icon="document-attach-outline"
        >
          {safeParseArray(contactDetail.ProcesosDocumentos).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name={
                  item.Ruta ? "document-attach-outline" : "document-outline"
                }
                size={16}
                color={item.Ruta ? COLORS.success : COLORS.gray}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>{item.Nombre}</Text>
                {item.NombreArchivo && (
                  <Text style={localStyles.subText}>{item.NombreArchivo}</Text>
                )}
              </View>
              {item.Ruta && (
                <TouchableOpacity onPress={() => showDevAlert("Ver documento")}>
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!hasActiveContracts && (
            <TouchableOpacity
              style={localStyles.sectionActionButton}
              onPress={() => showDevAlert("Solicitud contrato")}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={localStyles.sectionActionText}>
                Solicitud contrato
              </Text>
            </TouchableOpacity>
          )}
        </InfoSection>
      )}

      {/* 4. Proceso Arrendamiento (Highlight) */}
      {contactDetail.Inmueble && (
        <View
          style={[
            styles.sectionCard,
            {
              borderColor: contactDetail.Inmueble
                .ArrendamientoCausalDevolucionContratoID
                ? COLORS.danger
                : COLORS.success,
            },
          ]}
        >
          <View style={localStyles.processHeader}>
            <Ionicons
              name={
                contactDetail.Inmueble.ArrendamientoCausalDevolucionContratoID
                  ? "alert-circle"
                  : "checkmark-circle"
              }
              size={24}
              color={
                contactDetail.Inmueble.ArrendamientoCausalDevolucionContratoID
                  ? COLORS.danger
                  : COLORS.success
              }
            />
            <Text
              style={[
                localStyles.processTitle,
                {
                  color: contactDetail.Inmueble
                    .ArrendamientoCausalDevolucionContratoID
                    ? COLORS.danger
                    : COLORS.success,
                },
              ]}
            >
              {contactDetail.Inmueble.ArrendamientoCausalDevolucionContratoID
                ? "Solicitud Rechazada"
                : "Proceso Arrendamiento"}
            </Text>
          </View>
          <Text style={localStyles.processText}>
            Inmueble N°.{contactDetail.Inmueble.InmuebleConsecutivo}
          </Text>
          {contactDetail.Inmueble
            .ArrendamientoDevolucionContratoObservaciones && (
            <View style={styles.observationBox}>
              <Text style={styles.observationText}>
                {
                  contactDetail.Inmueble
                    .ArrendamientoDevolucionContratoObservaciones
                }
              </Text>
            </View>
          )}
          {/* Enviar operaciones button */}
          {!hasActiveContracts &&
            !contactDetail.Inmueble.ArrendamientoCausalDevolucionContratoID && (
              <TouchableOpacity
                style={[localStyles.sectionActionButton, { marginTop: 12 }]}
                onPress={() => showDevAlert("Enviar operaciones")}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={18}
                  color={COLORS.success}
                />
                <Text
                  style={[
                    localStyles.sectionActionText,
                    { color: COLORS.success },
                  ]}
                >
                  Enviar operaciones
                </Text>
              </TouchableOpacity>
            )}
        </View>
      )}

      {/* 5. Contratos y Documentos */}
      {safeParseArray(contactDetail.Contratos).length > 0 && (
        <InfoSection
          title="Contratos y Documentos"
          icon="file-tray-full-outline"
        >
          {safeParseArray(contactDetail.Contratos).map((item, idx) => (
            <View key={idx} style={localStyles.contractCard}>
              <View style={localStyles.contractHeader}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={localStyles.contractTitle}>
                  Contrato {item.Prefijo}
                  {item.Consecutivo}
                </Text>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.Anulado
                        ? COLORS.danger
                        : item.Ruta
                          ? COLORS.success
                          : COLORS.accent,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.Anulado
                      ? "Anulado"
                      : item.Ruta
                        ? "Generado"
                        : "Pendiente"}
                  </Text>
                </View>
              </View>

              <View style={styles.dataGrid}>
                <DataItem
                  label="Valor Canon"
                  value={formatCurrency(item.Canon)}
                />
                <DataItem
                  label="Fecha Inicio"
                  value={formatDate(item.FechaInicio, false)}
                />
                <DataItem
                  label="Inmueble"
                  value={`#${item.InmuebleConsecutivo}`}
                />
                <DataItem label="Tipo" value={item.TipoInmuebleNombre} />
              </View>

              {/* Inventario and Acta info with actions */}
              {!item.Anulado && (
                <View style={localStyles.docsGrid}>
                  {/* Inventario */}
                  <View style={localStyles.docItemCard}>
                    <View style={localStyles.docItemHeader}>
                      <Ionicons
                        name="list-outline"
                        size={18}
                        color={
                          item.ContratoInventarioID &&
                          item.RutaInventarioEntrega
                            ? COLORS.success
                            : item.ContratoInventarioID
                              ? COLORS.accent
                              : COLORS.danger
                        }
                      />
                      <Text style={localStyles.docItemTitle}>Inventario</Text>
                      <Text
                        style={[
                          localStyles.docItemStatus,
                          {
                            color:
                              item.ContratoInventarioID &&
                              item.RutaInventarioEntrega
                                ? COLORS.success
                                : item.ContratoInventarioID
                                  ? COLORS.accent
                                  : COLORS.danger,
                          },
                        ]}
                      >
                        {item.ContratoInventarioID && item.RutaInventarioEntrega
                          ? "Cargado"
                          : item.ContratoInventarioID
                            ? "Generado"
                            : "Sin generar"}
                      </Text>
                    </View>
                    <View style={localStyles.docItemActions}>
                      <TouchableOpacity
                        style={localStyles.smallActionButton}
                        onPress={() =>
                          showDevAlert(
                            item.ContratoInventarioID
                              ? "Modificar inventario"
                              : "Generar inventario",
                          )
                        }
                      >
                        <Ionicons
                          name={
                            item.ContratoInventarioID
                              ? "create-outline"
                              : "add-outline"
                          }
                          size={14}
                          color={COLORS.primary}
                        />
                        <Text style={localStyles.smallActionText}>
                          {item.ContratoInventarioID ? "Modificar" : "Generar"}
                        </Text>
                      </TouchableOpacity>
                      {item.ContratoInventarioID && (
                        <TouchableOpacity
                          style={localStyles.smallActionButton}
                          onPress={() => showDevAlert("Ver PDF inventario")}
                        >
                          <Ionicons
                            name="document-outline"
                            size={14}
                            color={COLORS.success}
                          />
                          <Text style={localStyles.smallActionText}>PDF</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Acta Entrega */}
                  <View style={localStyles.docItemCard}>
                    <View style={localStyles.docItemHeader}>
                      <Ionicons
                        name="clipboard-outline"
                        size={18}
                        color={
                          item.RutaActaInmueble ? COLORS.success : COLORS.danger
                        }
                      />
                      <Text style={localStyles.docItemTitle}>Acta Entrega</Text>
                      <Text
                        style={[
                          localStyles.docItemStatus,
                          {
                            color: item.RutaActaInmueble
                              ? COLORS.success
                              : COLORS.danger,
                          },
                        ]}
                      >
                        {item.RutaActaInmueble ? "Cargado" : "Sin cargar"}
                      </Text>
                    </View>
                    <View style={localStyles.docItemActions}>
                      <TouchableOpacity
                        style={localStyles.smallActionButton}
                        onPress={() => showDevAlert("Cargar acta de entrega")}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={14}
                          color={COLORS.primary}
                        />
                        <Text style={localStyles.smallActionText}>Cargar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={localStyles.smallActionButton}
                        onPress={() => showDevAlert("Ver PDF acta")}
                      >
                        <Ionicons
                          name="document-outline"
                          size={14}
                          color={COLORS.success}
                        />
                        <Text style={localStyles.smallActionText}>PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </InfoSection>
      )}

      {/* 6. Facturas */}
      {safeParseArray(contactDetail.Facturas).length > 0 && (
        <InfoSection
          title={`Facturas (${safeParseArray(contactDetail.Facturas).length})`}
          icon="document-text-outline"
        >
          {safeParseArray(contactDetail.Facturas).map((item, idx) => (
            <View key={idx} style={localStyles.cuponCard}>
              <View style={localStyles.cuponHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.txText}>
                    Factura #{item.Prefijo}
                    {item.Consecutivo}
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
              <View style={localStyles.facturaActions}>
                <TouchableOpacity
                  style={localStyles.emailButton}
                  onPress={() => showDevAlert("Ver factura PDF")}
                >
                  <Ionicons
                    name="document-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={localStyles.emailButtonText}>Ver PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={localStyles.emailButton}
                  onPress={() => showDevAlert("Enviar factura por email")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={localStyles.emailButtonText}>Enviar email</Text>
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
  subText: {
    fontSize: 11,
    color: COLORS.gray,
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
  propertyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  characteristicsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  characteristicItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  characteristicText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "600",
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
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
  },
  cuponCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cuponHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  emailButtonText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: "500",
  },
  facturaActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  sectionActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  sectionActionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  processHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  processText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
    marginLeft: 34,
  },
  contractCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contractHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  contractTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  docsGrid: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  docItemCard: {
    backgroundColor: COLORS.border + "30",
    borderRadius: 10,
    padding: 12,
  },
  docItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  docItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.dark,
  },
  docItemStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  docItemActions: {
    flexDirection: "row",
    gap: 10,
  },
  smallActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallActionText: {
    fontSize: 11,
    color: COLORS.dark,
    fontWeight: "500",
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  docText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "600",
  },
});

export default CrmGbiArrendatarios;
