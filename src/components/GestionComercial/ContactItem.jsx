import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vibration } from 'react-native';

const ContactItem = ({ item, onPress, onLongPress, isSelected }) => {
  // Normalize data to handle inconsistent field names from different API endpoints
  const d = {
    nombre: item.NombreCompleto || item.nombreCompleto || item.Nombre || item.nombre ||
      (item.Nombres || item.nombres ? `${item.Nombres || item.nombres} ${item.Apellidos || item.apellidos || ''}`.trim() : 'Contacto sin nombre'),
    estado: item.EstadoProcesoNombre || item.Estado || 'N/A',
    celular: item.Celular || item.celular || item.Telefono || item.telefono || 'Sin celular',
    asesor: item.AsesorNombreCompleto || item.asesorNombreCompleto || '',
    fecha: item.Fecha || item.fecha || item.FechaRegistro || item.fechaRegistro || '',
    valor: item.ValorNegocio || item.valorNegocio || 0,
    seguimientos: item.CountSeguimientos || item.countSeguimientos || 0,
    actividades: item.CountActividades || item.countActividades || 0,
    estadoGeneral: item.EstadoGeneral || item.estadoGeneral || '',
    color: item.Color || item.color || null,
  };

  const getEstadoColor = (estado) => {
    const est = String(estado).toLowerCase();
    if (est.includes('nuevo')) return '#337ab7';
    if (est.includes('gesti')) return '#00ACC4';
    if (est.includes('cerra')) return '#88E782';
    if (est.includes('invia')) return '#0086C8';
    return '#8E8E93';
  };

  const statusColor = d.color || getEstadoColor(d.estado);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
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
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPress && onPress(item)}
      onLongPress={() => {
        Vibration.vibrate(50);
        onLongPress && onLongPress(item);
      }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {d.nombre}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {d.estado}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {d.seguimientos > 0 && (
              <View style={styles.badge}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#337ab7" />
                <Text style={styles.badgeText}>{d.seguimientos}</Text>
              </View>
            )}
            {d.actividades > 0 && (
              <View style={styles.badge}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={d.estadoGeneral === 'V' ? '#88E782' : d.estadoGeneral === 'A' ? '#00ACC4' : '#337ab7'}
                />
                <Text style={styles.badgeText}>{d.actividades}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={12} color="#8E8E93" />
            </View>
            <Text style={styles.detailText}>{d.celular}</Text>
          </View>

          {!!d.asesor && (
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={12} color="#8E8E93" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{d.asesor}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={12} color="#AEAEB2" />
            <Text style={styles.dateText}>{formatDate(d.fecha)}</Text>
          </View>
          {d.valor > 0 && (
            <Text style={styles.valueText}>{formatCurrency(d.valor)}</Text>
          )}
        </View>
      </View>

      {/* Re-implemented color indicator with proper clipping and border radius support */}
      <View style={[
        styles.colorIndicator,
        { backgroundColor: statusColor }
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 110,
    overflow: 'hidden', // Essential for shadow rounding and indicator clipping
  },
  content: {
    padding: 16,
    paddingLeft: 22, // Space for the 6px indicator
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
    // The overflow: 'hidden' on the container will clip this to the container's radius
  },
  selectedContainer: {
    backgroundColor: '#e0f7fa',
  },
});

export default ContactItem;
