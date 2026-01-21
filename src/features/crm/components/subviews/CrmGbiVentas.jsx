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

// Helper function to get Estado color
const getEstadoColor = (item) => {
  if (item.EstadoProcesoInmuebleNombre === "Rentando") return COLORS.primary;
  if ([1, 4, 5].includes(item.EstadoProcesoInmuebleID)) return COLORS.success;
  return COLORS.danger;
};

const CrmGbiVentas = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const inmuebleCompra = contactDetail.InmuebleCompra || {};
  const ofertaAceptada = contactDetail.OfertaAceptada || {};
  const actividades = safeParseArray(contactDetail.ActividadesCalendario);
  const facturas = safeParseArray(contactDetail.Facturas);

  // Check if there's no InmuebleCompra selected yet
  const canAssociateProperties = !inmuebleCompra.InmuebleConsecutivo;

  return (
    <View>
      {/* 1. Inmuebles de Interés */}
      {safeParseArray(contactDetail.InmueblesProcesos).length > 0 && (
        <InfoSection
          title={`Inmuebles de interés (${
            safeParseArray(contactDetail.InmueblesProcesos).length
          })`}
          icon="home-outline"
          headerAction={
            canAssociateProperties && (
              <TouchableOpacity
                style={localStyles.headerButton}
                onPress={() => showDevAlert("Asociar inmuebles")}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )
          }
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

              <View style={styles.dataGrid}>
                <DataItem label="Tipo" value={item.TipoInmueble} />
                <DataItem
                  label="Valor Venta"
                  value={formatCurrency(item.ValorVenta)}
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
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2. Ofertas del Inmueble */}
      {inmuebleCompra.InmuebleConsecutivo && (
        <InfoSection
          title="Ofertas del inmueble"
          icon="pricetag-outline"
          headerAction={
            <TouchableOpacity
              style={localStyles.headerButton}
              onPress={() => showDevAlert("Modificar ofertas")}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          }
        >
          <View style={localStyles.propertySummary}>
            <Text style={localStyles.propertyTitle}>
              Inmueble #{inmuebleCompra.InmuebleConsecutivo}
            </Text>
            <Text style={localStyles.addressText}>
              {inmuebleCompra.InmuebleDireccion}
            </Text>
            {/* Additional property details */}
            <View style={localStyles.characteristicsRow}>
              <View style={localStyles.characteristicItem}>
                <Ionicons name="bed-outline" size={14} color={COLORS.gray} />
                <Text style={localStyles.characteristicText}>
                  {inmuebleCompra.Habitaciones ?? 0}
                </Text>
              </View>
              <View style={localStyles.characteristicItem}>
                <Ionicons name="water-outline" size={14} color={COLORS.gray} />
                <Text style={localStyles.characteristicText}>
                  {inmuebleCompra.Banos ?? 0}
                </Text>
              </View>
              <View style={localStyles.characteristicItem}>
                <Ionicons name="car-outline" size={14} color={COLORS.gray} />
                <Text style={localStyles.characteristicText}>
                  {inmuebleCompra.Parqueaderos ?? 0}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={localStyles.sectionActionButton}
              onPress={() => showDevAlert("Ver ficha del inmueble")}
            >
              <Ionicons name="home-outline" size={16} color={COLORS.danger} />
              <Text
                style={[
                  localStyles.sectionActionText,
                  { color: COLORS.danger },
                ]}
              >
                Ver ficha
              </Text>
            </TouchableOpacity>
          </View>

          {safeParseArray(inmuebleCompra.InmueblesProcesosProcesosOfertas).map(
            (item, idx, arr) => (
              <View key={idx} style={localStyles.offerRow}>
                <View style={localStyles.offerCol}>
                  <Text style={localStyles.offerLabel}>Oferta</Text>
                  <Text style={localStyles.offerValue}>
                    {formatCurrency(item.ValorOferta)}
                  </Text>
                  <Text style={localStyles.offerDate}>
                    {formatDate(item.FechaOferta, true)}
                  </Text>
                </View>
                {item.ValorContraOferta > 0 && (
                  <View style={localStyles.offerCol}>
                    <Text style={localStyles.offerLabel}>Contra oferta</Text>
                    <Text
                      style={[
                        localStyles.offerValue,
                        { color: COLORS.secondary },
                      ]}
                    >
                      {formatCurrency(item.ValorContraOferta)}
                    </Text>
                    <Text style={localStyles.offerDate}>
                      {formatDate(item.FechaContraOferta, true)}
                    </Text>
                  </View>
                )}
                {item.Aceptada ? (
                  <View
                    style={[
                      localStyles.badge,
                      { backgroundColor: COLORS.success, marginTop: 8 },
                    ]}
                  >
                    <Text style={localStyles.badgeText}>Aceptada</Text>
                  </View>
                ) : (
                  idx === arr.length - 1 &&
                  !ofertaAceptada.InmuebleProcesoProcesoOfertaID && (
                    <TouchableOpacity
                      style={[localStyles.acceptButton, { marginTop: 8 }]}
                      onPress={() => showDevAlert("Aceptar oferta")}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color="#FFF"
                      />
                      <Text style={localStyles.acceptButtonText}>Aceptar</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            ),
          )}
        </InfoSection>
      )}

      {/* 3. Condiciones de Pago */}
      {ofertaAceptada.InmuebleProcesoProcesoOfertaID && (
        <InfoSection
          title="Condiciones de pago"
          icon="cash-outline"
          headerAction={
            <TouchableOpacity
              style={localStyles.headerButton}
              onPress={() => showDevAlert("Modificar condición de pago")}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.dataGrid}>
            <DataItem
              label="Valor Oferta"
              value={formatCurrency(
                ofertaAceptada.ValorContraOferta || ofertaAceptada.ValorOferta,
              )}
            />
            <DataItem
              label="Forma de Pago"
              value={ofertaAceptada.FormaPagoCompraInmuebleNombre}
            />
            <DataItem
              label="Comisión"
              value={`${ofertaAceptada.PorcentajeComision}%`}
            />
            <DataItem
              label="IVA Incluido"
              value={ofertaAceptada.IVAIncluido ? "Sí" : "No"}
            />
          </View>

          {/* Action buttons for condiciones */}
          <View style={localStyles.condicionesActions}>
            <TouchableOpacity
              style={localStyles.condicionButton}
              onPress={() => showDevAlert("Enviar a sagrlaft")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={COLORS.success}
              />
              <Text
                style={[
                  localStyles.condicionButtonText,
                  { color: COLORS.success },
                ]}
              >
                Sagrlaft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.condicionButton}
              onPress={() => showDevAlert("Ver promesa de venta")}
            >
              <Ionicons
                name="attach-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text
                style={[
                  localStyles.condicionButtonText,
                  { color: COLORS.primary },
                ]}
              >
                Promesa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.condicionButton}
              onPress={() => showDevAlert("Enviar a facturación")}
            >
              <Ionicons
                name="receipt-outline"
                size={16}
                color={COLORS.danger}
              />
              <Text
                style={[
                  localStyles.condicionButtonText,
                  { color: COLORS.danger },
                ]}
              >
                Facturar
              </Text>
            </TouchableOpacity>
          </View>

          {safeParseArray(ofertaAceptada.OfertasCondicionesPagos).length >
            0 && (
            <View style={localStyles.conditionsBox}>
              <Text style={styles.txGroupLabel}>Detalle de pagos</Text>
              {safeParseArray(ofertaAceptada.OfertasCondicionesPagos).map(
                (item, idx) => (
                  <View key={idx} style={styles.txRow}>
                    <Text style={[styles.txText, { flex: 0, width: 45 }]}>
                      {item.Porcentaje}%
                    </Text>
                    <Text style={styles.txText}>{item.Descripcion}</Text>
                  </View>
                ),
              )}
            </View>
          )}
        </InfoSection>
      )}

      {/* 4. Compradores / Vendedores */}
      {safeParseArray(ofertaAceptada.CompradoresVendedores).length > 0 && (
        <InfoSection title="Compradores y Propietarios" icon="people-outline">
          {safeParseArray(ofertaAceptada.CompradoresVendedores).map(
            (item, idx) => (
              <View key={idx} style={styles.txRow}>
                <Ionicons
                  name={item.Comprador ? "person-add" : "person"}
                  size={20}
                  color={item.Comprador ? COLORS.success : COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>{item.NombreCompleto}</Text>
                  <Text style={localStyles.subText}>
                    {item.TipoDocumentoAbreviatura}: {item.Documento} |{" "}
                    {item.Celular}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      localStyles.badge,
                      {
                        backgroundColor: item.Comprador
                          ? COLORS.success
                          : COLORS.primary,
                      },
                    ]}
                  >
                    <Text style={localStyles.badgeText}>
                      {item.Comprador ? "Comprador" : "Propietario"}
                    </Text>
                  </View>
                  {/* Sarglaft indicator */}
                  {item.AprobacionSarglaft !== undefined && (
                    <Ionicons
                      name={
                        item.AprobacionSarglaft === null
                          ? "warning-outline"
                          : item.AprobacionSarglaft
                            ? "checkmark-circle-outline"
                            : "close-circle-outline"
                      }
                      size={18}
                      color={
                        item.AprobacionSarglaft === null
                          ? COLORS.secondary
                          : item.AprobacionSarglaft
                            ? COLORS.success
                            : COLORS.danger
                      }
                      style={{ marginTop: 4 }}
                    />
                  )}
                </View>
              </View>
            ),
          )}
        </InfoSection>
      )}

      {/* 5. Actividades del proceso de venta */}
      {actividades.length > 0 && (
        <InfoSection
          title="Actividades del proceso"
          icon="calendar-outline"
          headerAction={
            <TouchableOpacity
              style={localStyles.headerButton}
              onPress={() => showDevAlert("Agendar actividad")}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.success}
              />
            </TouchableOpacity>
          }
        >
          {actividades.map((item, idx) => (
            <View key={idx} style={localStyles.activityCard}>
              <View style={localStyles.activityHeader}>
                <Ionicons
                  name={
                    item.Completada ? "checkmark-circle" : "calendar-outline"
                  }
                  size={24}
                  color={item.Completada ? COLORS.success : COLORS.primary}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={localStyles.activityTitle}>
                    {item.TipoCalendarioActividadNombre}
                  </Text>
                  <Text style={localStyles.subText}>
                    {item.FechaInicio
                      ? formatDate(item.FechaInicio, true)
                      : "Sin asignar"}
                  </Text>
                </View>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.Completada
                        ? COLORS.success
                        : COLORS.primary,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.Completada ? "Completada" : "Pendiente"}
                  </Text>
                </View>
              </View>
              {item.Direccion && (
                <Text style={localStyles.activityDetail}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={COLORS.gray}
                  />{" "}
                  {item.Direccion}
                </Text>
              )}
              {/* Activity actions */}
              <View style={localStyles.activityActions}>
                {!item.Completada && item.CalendarioActividadID && (
                  <>
                    <TouchableOpacity
                      style={localStyles.activityButton}
                      onPress={() => showDevAlert("Reprogramar actividad")}
                    >
                      <Text
                        style={[
                          localStyles.activityButtonText,
                          { color: COLORS.primary },
                        ]}
                      >
                        Reprogramar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={localStyles.activityButton}
                      onPress={() => showDevAlert("Finalizar actividad")}
                    >
                      <Text
                        style={[
                          localStyles.activityButtonText,
                          { color: COLORS.danger },
                        ]}
                      >
                        Finalizar
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.Completada && (
                  <TouchableOpacity
                    style={localStyles.activityButton}
                    onPress={() => showDevAlert("Ver actividad")}
                  >
                    <Text
                      style={[
                        localStyles.activityButtonText,
                        { color: COLORS.success },
                      ]}
                    >
                      Ver detalle
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 6. Documentos */}
      {(ofertaAceptada.ProcesosDocumentos?.length > 0 ||
        inmuebleCompra.RutaPromesaCompraventa) && (
        <InfoSection
          title="Documentos cargados"
          icon="document-attach-outline"
          headerAction={
            !inmuebleCompra.RutaPromesaCompraventa && (
              <TouchableOpacity
                style={localStyles.headerButton}
                onPress={() => showDevAlert("Adjuntar promesa de venta")}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={COLORS.success}
                />
              </TouchableOpacity>
            )
          }
        >
          {inmuebleCompra.RutaPromesaCompraventa && (
            <TouchableOpacity
              style={styles.txRow}
              onPress={() => showDevAlert("Ver promesa de venta")}
            >
              <Ionicons name="document-text" size={16} color={COLORS.danger} />
              <Text style={styles.txText}>Promesa de venta</Text>
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {safeParseArray(ofertaAceptada.ProcesosDocumentos).map(
            (item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.txRow}
                onPress={() => showDevAlert("Ver documento")}
              >
                <Ionicons
                  name="document-outline"
                  size={16}
                  color={COLORS.gray}
                />
                <Text style={styles.txText}>
                  {item.NombreArchivo || item.Nombre}
                </Text>
                {item.Ruta && (
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ),
          )}
        </InfoSection>
      )}

      {/* 7. Facturas */}
      {facturas.length > 0 && (
        <InfoSection
          title={`Facturas (${facturas.length})`}
          icon="document-text-outline"
        >
          {facturas.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={localStyles.facturaCard}
              onPress={() => showDevAlert("Ver factura PDF")}
            >
              <View style={localStyles.facturaHeader}>
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
                  <Text style={localStyles.subText} numberOfLines={1}>
                    {item.NombreCompleto}
                  </Text>
                </View>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorFactura)}
                </Text>
              </View>
              <Text style={localStyles.facturaDate}>
                {formatDate(item.FechaCreacion, false)}
              </Text>
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
  propertySummary: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  offerRow: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  offerCol: {
    marginBottom: 4,
  },
  offerLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  offerValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  offerDate: {
    fontSize: 11,
    color: COLORS.gray,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  acceptButtonText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  conditionsBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  condicionesActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  condicionButton: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  condicionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  activityDetail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
  },
  activityActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activityButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  facturaCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  facturaHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  facturaDate: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 6,
    marginLeft: 30,
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
});

export default CrmGbiVentas;
