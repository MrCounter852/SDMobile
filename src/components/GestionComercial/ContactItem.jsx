import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ContactItem = ({ item, onPress }) => {
  const navigation = useNavigation();

  const getEstadoColor = (estado) => {
    const est = estado?.toLowerCase() || '';
    if (est.includes('nuevo')) return '#337ab7';
    if (est.includes('gesti')) return '#00ACC4';
    if (est.includes('cerra')) return '#88E782';
    if (est.includes('invia')) return '#0086C8';
    return '#8E8E93';
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
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={() => onPress && onPress(item)}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {item.NombreCompleto || item.nombreCompleto || item.Nombre || item.nombre || (item.Nombres || item.nombres ? `${item.Nombres || item.nombres} ${item.Apellidos || item.apellidos || ''}` : 'Contacto sin nombre')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.EstadoNombre || item.estadoNombre || item.Estado || item.estado) }]}>
              <Text style={styles.statusText}>
                {item.EstadoNombre || item.estadoNombre || item.Estado || item.estado || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {(item.CountSeguimientos > 0 || item.countSeguimientos > 0) && (
              <View style={styles.badge}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#337ab7" />
                <Text style={styles.badgeText}>{item.CountSeguimientos || item.countSeguimientos}</Text>
              </View>
            )}
            {(item.CountActividades > 0 || item.countActividades > 0) && (
              <View style={styles.badge}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={(item.EstadoGeneral || item.estadoGeneral) === 'V' ? '#88E782' : (item.EstadoGeneral || item.estadoGeneral) === 'A' ? '#00ACC4' : '#337ab7'}
                />
                <Text style={styles.badgeText}>{item.CountActividades || item.countActividades}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
            </View>
            <Text style={styles.detailText}>{item.Celular || item.celular || item.Telefono || item.telefono || 'Sin celular'}</Text>
          </View>

          {(item.AsesorNombreCompleto || item.asesorNombreCompleto) ? (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{item.AsesorNombreCompleto || item.asesorNombreCompleto}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={12} color="#AEAEB2" />
            <Text style={styles.dateText}>{formatDate(item.Fecha || item.fecha || item.FechaRegistro || item.fechaRegistro)}</Text>
          </View>
          {(item.ValorNegocio || item.valorNegocio) ? (
            <Text style={styles.valueText}>{formatCurrency(item.ValorNegocio || item.valorNegocio)}</Text>
          ) : null}
        </View>
      </View>

      <View style={[
        styles.colorIndicator,
        { backgroundColor: item.Color || item.color || getEstadoColor(item.EstadoNombre || item.estadoNombre || item.Estado || item.estado) }
      ]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    // Fix square shadow on Android
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: 110,
    // Add overflow hidden to ensure color indicator is clipped
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#3A3A3C',
    marginLeft: 4,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F8F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#3A3A3C',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginBottom: 12,
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
  dateText: {
    fontSize: 12,
    color: '#AEAEB2',
    marginLeft: 6,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 15,
    color: '#337ab7',
    fontWeight: '700',
  },
  colorIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
});

export default ContactItem;