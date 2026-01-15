import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmGbiPropietarios = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  return (
    <View>
      {/* 1. Propuestas Comerciales */}
      {safeParseArray(contactDetail.Cotizaciones).length > 0 && (
        <InfoSection
          title={`Propuestas comerciales (${
            safeParseArray(contactDetail.Cotizaciones).length
          })`}
          icon="calculator-outline"
        >
          {safeParseArray(contactDetail.Cotizaciones).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name="file-tray-full-outline"
                size={16}
                color={COLORS.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>Propuesta #{item.Consecutivo}</Text>
                <Text style={localStyles.subText}>
                  Estado: {item.Aprobado ? "Aprobado" : "Sin aprobar"} |{" "}
                  {formatDate(item.FechaElaboracion, false)}
                </Text>
              </View>
              <Text style={styles.txValue}>
                {formatCurrency(item.ValorCotizacion)}
              </Text>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2. Cupones de Pago */}
      {safeParseArray(contactDetail.PreFacturas).length > 0 && (
        <InfoSection
          title={`Cupones de pagos (${
            safeParseArray(contactDetail.PreFacturas).length
          })`}
          icon="receipt-outline"
        >
          {safeParseArray(contactDetail.PreFacturas).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name="mail-open-outline"
                size={16}
                color={COLORS.secondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>Cupón #{item.Consecutivo}</Text>
                <Text style={localStyles.subText}>
                  {formatDate(item.FechaCreacion, false)}
                </Text>
              </View>
              <Text style={styles.txValue}>
                {formatCurrency(item.ValorPreFactura)}
              </Text>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 3. Facturas */}
      {safeParseArray(contactDetail.Facturas).length > 0 && (
        <InfoSection
          title={`Facturas (${safeParseArray(contactDetail.Facturas).length})`}
          icon="cash-outline"
        >
          {safeParseArray(contactDetail.Facturas).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color={COLORS.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>
                  Factura {item.Prefijo}#{item.Consecutivo}
                </Text>
                <Text style={localStyles.subText}>
                  {formatDate(item.FechaCreacion, false)}
                </Text>
              </View>
              <Text style={styles.txValue}>
                {formatCurrency(item.ValorFactura)}
              </Text>
            </View>
          ))}
        </InfoSection>
      )}

      {/* 4. Captación del Inmueble */}
      {safeParseArray(contactDetail.Inmuebles).length > 0 && (
        <InfoSection
          title={`Captación del inmueble (${
            safeParseArray(contactDetail.Inmuebles).length
          })`}
          icon="home-outline"
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
                          : COLORS.primary,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.EstadoProcesoInmuebleNombre}
                  </Text>
                </View>
              </View>
              <Text style={localStyles.addressText}>{item.Direccion}</Text>
              <View style={styles.dataGrid}>
                <DataItem label="Tipo" value={item.TipoInmuebleNombre} />
                <DataItem label="Oferta" value={item.TipoOfertaNombre} />
                <DataItem
                  label={item.TipoOfertaID == 1 ? "Canon" : "Valor Venta"}
                  value={formatCurrency(
                    item.TipoOfertaID == 1 ? item.ValorCanon : item.ValorVenta
                  )}
                />
              </View>

              {/* Inventario info if applicable */}
              {item.TipoOfertaID == 1 && (
                <View style={localStyles.inventoryBox}>
                  <Ionicons
                    name="list-circle-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={localStyles.inventoryText}>
                    Inventario:{" "}
                    {item.InmuebleInventarioID != null
                      ? "Cargado"
                      : "Sin generar"}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </InfoSection>
      )}

      {/* 5. Contratos */}
      {safeParseArray(contactDetail.Inmuebles).filter(
        (i) => i.EnTramiteMandato == true
      ).length > 0 && (
        <InfoSection title="Contratos" icon="key-outline">
          {safeParseArray(contactDetail.Inmuebles)
            .filter((i) => i.EnTramiteMandato == true)
            .map((item, idx) => (
              <View key={idx} style={styles.txRow}>
                <Ionicons
                  name="contract-outline"
                  size={16}
                  color={COLORS.dark}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txText}>
                    {item.ContratoMandatoAprobado
                      ? `Contrato #${item.ContratoMandatoConsecutivo}`
                      : "En trámite"}
                  </Text>
                  <Text style={localStyles.subText}>
                    Inmueble #{item.Consecutivo}
                  </Text>
                </View>
                <View
                  style={[
                    localStyles.badge,
                    {
                      backgroundColor: item.ContratoMandatoAprobado
                        ? COLORS.success
                        : COLORS.danger,
                    },
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {item.ContratoMandatoAprobado ? "Aprobado" : "Solicitado"}
                  </Text>
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
    color: COLORS.dark,
    fontWeight: "600",
  },
});

export default CrmGbiPropietarios;
