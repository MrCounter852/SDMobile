import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: '#337ab7', // User requested blue
  secondary: '#88E782', // User requested green (for gradient)
  background: '#F3F4F6', // Light Gray background from original
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  inputBg: '#F9FAFB', // Restored light gray input bg
  focus: '#337ab7',
  white: '#FFFFFF',
  danger: '#DC2626',
  success: '#10B981',
};

const PropertySelectionModal = ({
  visible,
  onClose,
  inmueblesDisponibles,
  loadingInmuebles,
  searchTerm,
  onSearchChange,
  onSelectInmueble,
  selectedInmuebleID
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inmuebles disponibles</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar inmuebles..."
              value={searchTerm}
              onChangeText={onSearchChange}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          {loadingInmuebles ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : inmueblesDisponibles.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>No hay inmuebles disponibles para mostrar.</Text>
            </View>
          ) : (
            <FlatList
              data={inmueblesDisponibles}
              keyExtractor={(item) => String(item.InmuebleID)}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => {
                const isSelected = selectedInmuebleID === item.InmuebleID;
                return (
                  <TouchableOpacity
                    style={[styles.inmuebleCard, isSelected && styles.inmuebleCardSelected]}
                    onPress={() => onSelectInmueble(item)}
                  >
                    <View style={styles.inmuebleCardHeader}>
                      <Text style={styles.inmuebleTitle}>
                        {item.Descripcion || `Inmueble Nro. ${item.Consecutivo ?? item.InmuebleID}`}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
                    </View>
                    <View style={styles.inmuebleMetaRow}>
                      {item.TipoInmuebleNombre ? (
                        <Text style={styles.inmuebleMeta}>{item.TipoInmuebleNombre}</Text>
                      ) : null}
                      {item.CiudadNombre ? (
                        <Text style={styles.inmuebleMeta}>{item.CiudadNombre}</Text>
                      ) : null}
                      {item.EstadoInmuebleNombre ? (
                        <Text style={styles.inmuebleStatus}>{item.EstadoInmuebleNombre}</Text>
                      ) : null}
                    </View>
                    {item.Direccion ? (
                      <Text style={styles.inmuebleAddress}>{item.Direccion}</Text>
                    ) : null}
                    <View style={styles.inmuebleInfoRow}>
                      <Text style={styles.inmuebleInfo}>
                        Hab: {item.Habitaciones ?? '—'}
                      </Text>
                      <Text style={styles.inmuebleInfo}>
                        Baños: {item.Banos ?? '—'}
                      </Text>
                      <Text style={styles.inmuebleInfo}>
                        Parqueaderos: {item.Parqueaderos ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.inmueblePrices}>
                      {item.ValorCanon ? (
                        <Text style={styles.inmueblePrice}>Canon ${Number(item.ValorCanon).toLocaleString('es-CO')}</Text>
                      ) : null}
                      {item.ValorVenta ? (
                        <Text style={styles.inmueblePrice}>Venta ${Number(item.ValorVenta).toLocaleString('es-CO')}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 15,
    color: COLORS.text,
  },
  emptyWrapper: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loadingWrapper: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  inmuebleCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  inmuebleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  inmuebleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inmuebleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  inmuebleMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  inmuebleAddress: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
  },
  inmuebleInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  inmuebleInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inmueblePrices: {
    flexDirection: 'row',
    gap: 12,
  },
  inmueblePrice: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default PropertySelectionModal;