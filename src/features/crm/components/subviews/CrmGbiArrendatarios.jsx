import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmGbiArrendatarios = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
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
            </View>
          ))}
        </InfoSection>
      )}

      {/* 2. Cupones de Pago - Similar to Propietarios but filtered if not corretaje */}
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

      {/* 3. Documentos */}
      {safeParseArray(contactDetail.ProcesosDocumentos).length > 0 && (
        <InfoSection
          title="Documentos solicitud contrato"
          icon="document-attach-outline"
        >
          {safeParseArray(contactDetail.ProcesosDocumentos).map((item, idx) => (
            <View key={idx} style={styles.txRow}>
              <Ionicons
                name={item.Ruta ? "document-check" : "document-outline"}
                size={16}
                color={item.Ruta ? COLORS.success : COLORS.gray}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txText}>{item.Nombre}</Text>
                {item.NombreArchivo && (
                  <Text style={localStyles.subText}>{item.NombreArchivo}</Text>
                )}
              </View>
            </View>
          ))}
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

              {/* Inventario and Acta info */}
              <View style={localStyles.docsGrid}>
                <View style={localStyles.docItem}>
                  <Ionicons
                    name="list-outline"
                    size={16}
                    color={
                      item.ContratoInventarioID ? COLORS.success : COLORS.gray
                    }
                  />
                  <Text style={localStyles.docText}>Inventario</Text>
                </View>
                <View style={localStyles.docItem}>
                  <Ionicons
                    name="clipboard-outline"
                    size={16}
                    color={item.RutaActaInmueble ? COLORS.success : COLORS.gray}
                  />
                  <Text style={localStyles.docText}>Acta Entrega</Text>
                </View>
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
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
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
