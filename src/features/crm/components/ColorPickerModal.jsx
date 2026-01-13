import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ColorPickerModal = ({ visible, onClose, onColorSelect, selectedContacts }) => {
  const colors = [
    { id: '#ffc4c9', name: 'Color 1', icon: 'ellipse', color: '#ffc4c9' },
    { id: '#ffc107', name: 'Color 2', icon: 'ellipse', color: '#ffc107' },
    { id: '#d4edda', name: 'Color 3', icon: 'ellipse', color: '#d4edda' },
    { id: '#e0a5ea', name: 'Color 4', icon: 'ellipse', color: '#e0a5ea' },
    { id: null, name: 'Quitar color', icon: 'ellipse-outline', color: '#666' },
  ];

  const handleColorPress = (colorId) => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'No hay contactos seleccionados');
      return;
    }

    onColorSelect(colorId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Marcar registro</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color.id || 'none'}
                style={styles.colorOption}
                onPress={() => handleColorPress(color.id)}
              >
                <View style={styles.colorPreview}>
                  <Ionicons
                    name={color.icon}
                    size={24}
                    color={color.color}
                  />
                </View>
                <Text style={styles.colorName}>{color.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  colorPreview: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  colorName: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default ColorPickerModal;