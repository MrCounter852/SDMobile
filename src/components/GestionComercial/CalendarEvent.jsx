import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CalendarEvent = ({ event, onPress }) => {
  const getEventColor = (tipo) => {
    switch (tipo) {
      case 'Llamada': return '#2196F3';
      case 'Reunión': return '#4CAF50';
      case 'Visita': return '#FF9800';
      case 'Correo': return '#9C27B0';
      default: return '#337ab7';
    }
  };

  const getStatusIcon = (completada) => {
    return completada ? 'checkmark-circle' : 'time-outline';
  };

  const getStatusColor = (completada) => {
    return completada ? '#4CAF50' : '#FF9800';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: getEventColor(event.TipoCalendarioActividadNombre) }]}
      onPress={() => onPress && onPress(event)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {event.Asunto}
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(event.Completada) }]}>
            <Ionicons
              name={getStatusIcon(event.Completada)}
              size={12}
              color="#fff"
            />
          </View>
        </View>
        <Text style={styles.time}>
          {formatTime(event.FechaInicio)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.contact} numberOfLines={1}>
          {event.Contacto || 'Sin contacto'}
        </Text>
        <Text style={styles.type}>
          {event.TipoCalendarioActividadNombre}
        </Text>
      </View>

      {event.Descripcion && (
        <Text style={styles.description} numberOfLines={2}>
          {event.Descripcion}
        </Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  time: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  details: {
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    color: '#337ab7',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default CalendarEvent;