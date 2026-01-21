import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SearchableModal from "./SearchableModal";
import { COLORS } from "../core/theme";

const PropertySelectionModal = ({
  visible,
  onClose,
  inmueblesDisponibles,
  loadingInmuebles,
  searchTerm,
  onSearchChange,
  onSelectInmueble,
  selectedInmuebleID,
}) => {
  const renderItem = (item, selectedId) => {
    const isSelected = selectedId === item.InmuebleID;
    return (
      <TouchableOpacity
        style={[styles.inmuebleCard, isSelected && styles.inmuebleCardSelected]}
        onPress={() => onSelectInmueble(item)}
      >
        <View style={styles.inmuebleCardHeader}>
          <Text style={styles.inmuebleTitle}>
            {item.Descripcion ||
              `Inmueble Nro. ${item.Consecutivo ?? item.InmuebleID}`}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
          )}
        </View>
        <View style={styles.inmuebleMetaRow}>
          {item.TipoInmuebleNombre ? (
            <Text style={styles.inmuebleMeta}>{item.TipoInmuebleNombre}</Text>
          ) : null}
          {item.CiudadNombre ? (
            <Text style={styles.inmuebleMeta}>{item.CiudadNombre}</Text>
          ) : null}
          {item.EstadoInmuebleNombre ? (
            <Text style={styles.inmuebleStatus}>
              {item.EstadoInmuebleNombre}
            </Text>
          ) : null}
        </View>
        {item.Direccion ? (
          <Text style={styles.inmuebleAddress}>{item.Direccion}</Text>
        ) : null}
        <View style={styles.inmuebleInfoRow}>
          <Text style={styles.inmuebleInfo}>
            Hab: {item.Habitaciones ?? "—"}
          </Text>
          <Text style={styles.inmuebleInfo}>Baños: {item.Banos ?? "—"}</Text>
          <Text style={styles.inmuebleInfo}>
            Parqueaderos: {item.Parqueaderos ?? "—"}
          </Text>
        </View>
        <View style={styles.inmueblePrices}>
          {item.ValorCanon ? (
            <Text style={styles.inmueblePrice}>
              Canon ${Number(item.ValorCanon).toLocaleString("es-CO")}
            </Text>
          ) : null}
          {item.ValorVenta ? (
            <Text style={styles.inmueblePrice}>
              Venta ${Number(item.ValorVenta).toLocaleString("es-CO")}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SearchableModal
      visible={visible}
      onClose={onClose}
      title="Inmuebles disponibles"
      searchPlaceholder="Buscar inmuebles..."
      data={inmueblesDisponibles}
      loading={loadingInmuebles}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      onSelect={() => {}} // Not used since renderItem handles it
      renderItem={renderItem}
      selectedItemId={selectedInmuebleID}
      emptyText="No hay inmuebles disponibles para mostrar."
    />
  );
};

const styles = StyleSheet.create({
  inmuebleCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  inmuebleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },
  inmuebleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inmuebleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  inmuebleMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  inmuebleMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inmuebleStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  inmuebleAddress: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
  },
  inmuebleInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  inmuebleInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inmueblePrices: {
    flexDirection: "row",
    gap: 12,
  },
  inmueblePrice: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
});

export default PropertySelectionModal;
