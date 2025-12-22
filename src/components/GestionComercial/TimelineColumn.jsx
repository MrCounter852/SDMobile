import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ContactItem from './ContactItem';

const TimelineColumn = ({ linea, onContactPress, onMoveContact }) => {
  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {linea.Nombre}
        </Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contactsContainer}
      >
        {!!linea.Procesos && linea.Procesos.map((contacto, index) => (
          <View key={contacto.ProcesoID || index} style={styles.contactWrapper}>
            <ContactItem
              item={contacto}
              onPress={() => onContactPress && onContactPress(contacto)}
            />
            {/* Move buttons for mobile - simplified version */}
            <View style={styles.moveButtons}>
              <TouchableOpacity
                style={[styles.moveButton, styles.moveLeft]}
                onPress={() => onMoveContact && onMoveContact(contacto, 'left')}
              >
                <Ionicons name="chevron-back" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moveButton, styles.moveRight]}
                onPress={() => onMoveContact && onMoveContact(contacto, 'right')}
              >
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {(!linea.Procesos || linea.Procesos.length === 0) && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay contactos en esta etapa</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Total:</Text>
          <Text style={styles.footerValue}>{linea.TotalProcesos || 0}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Valor:</Text>
          <Text style={styles.footerValue}>{formatCurrency(linea.TotalValorNegocio)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 400,
  },
  contactsContainer: {
    padding: 8,
  },
  contactWrapper: {
    marginBottom: 8,
    position: 'relative',
  },
  moveButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  moveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  moveLeft: {
    backgroundColor: '#2196F3',
  },
  moveRight: {
    backgroundColor: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  footerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});

export default TimelineColumn;