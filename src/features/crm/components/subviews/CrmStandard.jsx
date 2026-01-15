import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoSection, DataItem, styles, COLORS } from "./CrmSubViewComponents";

const CrmStandard = ({
  contactDetail,
  formatDate,
  formatCurrency,
  safeParseArray,
}) => {
  return (
    <View>
      {/* Transactional History & Documents */}
      <InfoSection title="Historial y Documentos" icon="document-text-outline">
        {/* Cotizaciones */}
        {safeParseArray(contactDetail.Cotizaciones).length > 0 && (
          <View style={styles.txGroup}>
            <Text style={styles.txGroupLabel}>Cotizaciones</Text>
            {safeParseArray(contactDetail.Cotizaciones).map((item, idx) => (
              <View key={idx} style={styles.txRow}>
                <Ionicons
                  name="calculator-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.txText}>
                  #{item.Consecutivo} -{" "}
                  {formatDate(item.FechaElaboracion, false)}
                </Text>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorCotizacion)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Facturas */}
        {safeParseArray(contactDetail.Facturas).length > 0 && (
          <View style={styles.txGroup}>
            <Text style={styles.txGroupLabel}>Facturas</Text>
            {safeParseArray(contactDetail.Facturas).map((item, idx) => (
              <View key={idx} style={styles.txRow}>
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={COLORS.success}
                />
                <Text style={styles.txText}>
                  {item.Prefijo}
                  {item.Consecutivo} - {formatDate(item.FechaCreacion, false)}
                </Text>
                <Text style={styles.txValue}>
                  {formatCurrency(item.ValorFactura)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Generic Document List for Standard */}
        {safeParseArray(contactDetail.ProcesosDocumentos).length > 0 && (
          <View style={styles.txGroup}>
            <Text style={styles.txGroupLabel}>Documentos</Text>
            {safeParseArray(contactDetail.ProcesosDocumentos).map(
              (item, idx) => (
                <View key={idx} style={styles.txRow}>
                  <Ionicons
                    name={item.Cargado ? "document" : "document-outline"}
                    size={16}
                    color={item.Cargado ? COLORS.success : COLORS.gray}
                  />
                  <Text style={styles.txText}>{item.Nombre}</Text>
                </View>
              )
            )}
          </View>
        )}
      </InfoSection>
    </View>
  );
};

export default CrmStandard;
