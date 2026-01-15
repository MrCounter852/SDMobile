import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmGbiVentas = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  const inmuebleCompra = contactDetail.InmuebleCompra || {};
  const ofertaAceptada = contactDetail.OfertaAceptada || {};

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
              <View style={localStyles.propertyHeader}>
                <Text style={localStyles.propertyTitle}>
                  Inmueble #{item.InmuebleConsecutivo}
                </Text>
                {item.Principal && (
                  <Ionicons name="star" size={16} color={COLORS.secondary} />
                )}
              </View>
              <Text style={localStyles.addressText}>
                {item.InmuebleDireccion}
              </Text>
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
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2. Ofertas del Inmueble */}
      {inmuebleCompra.InmuebleConsecutivo && (
        <InfoSection title="Ofertas del inmueble" icon="pricetag-outline">
          <View style={localStyles.propertySummary}>
            <Text style={localStyles.propertyTitle}>
              Inmueble #{inmuebleCompra.InmuebleConsecutivo}
            </Text>
            <Text style={localStyles.addressText}>
              {inmuebleCompra.InmuebleDireccion}
            </Text>
          </View>

          {safeParseArray(inmuebleCompra.InmueblesProcesosProcesosOfertas).map(
            (item, idx) => (
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
                {item.Aceptada && (
                  <View
                    style={[
                      localStyles.badge,
                      { backgroundColor: COLORS.success, marginTop: 8 },
                    ]}
                  >
                    <Text style={localStyles.badgeText}>Aceptada</Text>
                  </View>
                )}
              </View>
            )
          )}
        </InfoSection>
      )}

      {/* 3. Condiciones de Pago */}
      {ofertaAceptada.InmuebleProcesoProcesoOfertaID && (
        <InfoSection title="Condiciones de pago" icon="cash-outline">
          <View style={styles.dataGrid}>
            <DataItem
              label="Valor Oferta"
              value={formatCurrency(
                ofertaAceptada.ValorContraOferta || ofertaAceptada.ValorOferta
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
                )
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
                    {item.Documento} | {item.Celular}
                  </Text>
                </View>
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
              </View>
            )
          )}
        </InfoSection>
      )}

      {/* 5. Documentos */}
      {(ofertaAceptada.ProcesosDocumentos?.length > 0 ||
        inmuebleCompra.RutaPromesaCompraventa) && (
        <InfoSection title="Documentos cargados" icon="document-attach-outline">
          {inmuebleCompra.RutaPromesaCompraventa && (
            <View style={styles.txRow}>
              <Ionicons name="document-text" size={16} color={COLORS.danger} />
              <Text style={styles.txText}>Promesa de venta</Text>
            </View>
          )}
          {safeParseArray(ofertaAceptada.ProcesosDocumentos).map(
            (item, idx) => (
              <View key={idx} style={styles.txRow}>
                <Ionicons
                  name="document-outline"
                  size={16}
                  color={COLORS.gray}
                />
                <Text style={styles.txText}>
                  {item.NombreArchivo || item.Nombre}
                </Text>
              </View>
            )
          )}
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
  propertySummary: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  conditionsBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default CrmGbiVentas;
