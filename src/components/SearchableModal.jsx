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

const SearchableModal = ({
  visible,
  onClose,
  title,
  searchPlaceholder,
  data,
  loading,
  searchTerm,
  onSearchChange,
  onSelect,
  renderItem,
  selectedItemId,
  emptyText = 'No hay elementos disponibles para mostrar.',
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          {searchPlaceholder && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChangeText={onSearchChange}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          )}
          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, index) => String(item.id || item.ID || index)}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => renderItem(item, selectedItemId)}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
});

export default SearchableModal;
