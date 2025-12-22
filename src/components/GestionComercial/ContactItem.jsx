import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ContactItem = ({ item, onPress }) => {
  const navigation = useNavigation();

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Nuevo': return '#0091ae';
      case 'En gestión': return '#009688';
      case 'Cerrado': return '#FF9800';
      case 'Inviable': return '#f44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress && onPress(item)}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {item.NombreCompleto || `${item.Nombres} ${item.Apellidos}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.EstadoNombre) }]}>
            <Text style={styles.statusText}>{item.EstadoNombre}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {item.CountSeguimientos > 0 && (
            <View style={styles.badge}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#337ab7" />
              <Text style={styles.badgeText}>
                {item.CountSeguimientos > 9 ? '9+' : item.CountSeguimientos}
              </Text>
            </View>
          )}
          {item.CountActividades > 0 && (
            <View style={styles.badge}>
              <Ionicons name="calendar" size={16} color={item.EstadoGeneral === 'V' ? '#4CAF50' : item.EstadoGeneral === 'A' ? '#FF9800' : '#f44336'} />
              <Text style={styles.badgeText}>
                {item.CountActividades > 9 ? '9+' : item.CountActividades}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={14} color="#666" />
          <Text style={styles.detailText}>{item.Celular || 'Sin celular'}</Text>
        </View>
        {!!item.Email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>{item.Email}</Text>
          </View>
        )}
        {!!item.AsesorNombreCompleto && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>{item.AsesorNombreCompleto}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.dateText}>{formatDate(item.Fecha)}</Text>
        </View>
        {!!item.ValorNegocio && (
          <View style={styles.footerRight}>
            <Ionicons name="cash" size={14} color="#4CAF50" />
            <Text style={styles.valueText}>{formatCurrency(item.ValorNegocio)}</Text>
          </View>
        )}
      </View>

      {!!item.Color && (
        <View style={[styles.colorIndicator, { backgroundColor: item.Color }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#337ab7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 2,
    fontWeight: '500',
  },
  details: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  colorIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default ContactItem;