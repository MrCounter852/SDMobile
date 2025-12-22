import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../core/global';
import GestionComercialService from '../../services/GestionComercial/gestionComercialService';
import ContactItem from '../../components/GestionComercial/ContactItem';

const ContactDetail = ({ navigation, route }) => {
  const { contact } = route.params;
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contactDetail, setContactDetail] = useState(contact);
  const [activities, setActivities] = useState([]);
  const [followups, setFollowups] = useState([]);

  useEffect(() => {
    loadContactDetail();
    loadActivities();
    loadFollowups();
  }, []);

  const loadContactDetail = async () => {
    if (!contact.ProcesoID) return;

    try {
      const response = await GestionComercialService.consultarPreContactoDetallado({
        ProcesoID: contact.ProcesoID,
      });
      if (response.data) {
        setContactDetail({ ...contact, ...response.data });
      }
    } catch (error) {
      console.error('Error loading contact detail:', error);
    }
  };

  const loadActivities = async () => {
    if (!contact.ProcesoID) return;

    try {
      const response = await GestionComercialService.consultarActividadesCalendario({
        CalendarioActividadOrigenID: 2, // Pre-contactos
        CodigoOrigen: contact.ProcesoID,
      });
      setActivities(response.rows || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadFollowups = async () => {
    if (!contact.ProcesoID) return;

    try {
      const response = await GestionComercialService.consultarSeguimientos({
        OrigenID: 2, // Pre-contactos
        OrigenSeguimientoID: contact.ProcesoID,
      });
      setFollowups(response.rows || []);
    } catch (error) {
      console.error('Error loading followups:', error);
    }
  };

  const handleEdit = () => {
    navigation.navigate('NewLeadScreen', { preContacto: contactDetail });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar contacto',
      '¿Está seguro de que desea eliminar este contacto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await GestionComercialService.eliminarPreContacto({
                ProcesoID: contactDetail.ProcesoID,
              });
              Alert.alert('Éxito', 'Contacto eliminado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'No se pudo eliminar el contacto');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddActivity = () => {
    navigation.navigate('ActivityFollowupScreen', { contact: contactDetail });
  };

  const handleAddFollowup = () => {
    navigation.navigate('ActivityFollowupScreen', { contact: contactDetail });
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#337ab7" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Detalle de Contacto
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={20} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Summary */}
        <View style={styles.section}>
          <ContactItem item={contactDetail} />
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información adicional</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <Text style={styles.detailValue}>{contactDetail.OrigenNombre || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Asesor:</Text>
              <Text style={styles.detailValue}>{contactDetail.AsesorNombreCompleto || 'No asignado'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Forma contacto:</Text>
              <Text style={styles.detailValue}>{contactDetail.FormaContactoNombre || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Como nos conoció:</Text>
              <Text style={styles.detailValue}>{contactDetail.FormaComoNosConocioNombre || 'N/A'}</Text>
            </View>

            {contactDetail.ValorNegocio && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Valor negocio:</Text>
                <Text style={styles.detailValue}>{formatCurrency(contactDetail.ValorNegocio)}</Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fecha registro:</Text>
              <Text style={styles.detailValue}>{formatDate(contactDetail.Fecha)}</Text>
            </View>

            {contactDetail.FechaCierre && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Fecha cierre:</Text>
                <Text style={styles.detailValue}>{formatDate(contactDetail.FechaCierre)}</Text>
              </View>
            )}
          </View>

          {contactDetail.Observaciones && (
            <View style={styles.observations}>
              <Text style={styles.detailLabel}>Observaciones:</Text>
              <Text style={styles.observationsText}>{contactDetail.Observaciones}</Text>
            </View>
          )}
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividades ({activities.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddActivity}
            >
              <Ionicons name="add" size={16} color="#337ab7" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity) => (
              <TouchableOpacity
                key={activity.CalendarioActividadID}
                style={styles.activityItem}
                onPress={() => navigation.navigate('ActivityDetail', { activity })}
              >
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={activity.Completada ? "checkmark-circle" : "time-outline"}
                    size={20}
                    color={activity.Completada ? "#4CAF50" : "#FF9800"}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.Asunto}
                  </Text>
                  <Text style={styles.activityDate}>
                    {formatDate(activity.FechaInicio)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay actividades registradas</Text>
          )}

          {activities.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>Ver todas las actividades</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Follow-ups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seguimientos ({followups.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFollowup}
            >
              <Ionicons name="add" size={16} color="#337ab7" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {followups.length > 0 ? (
            followups.slice(0, 5).map((followup) => (
              <View key={followup.SeguimientoID} style={styles.followupItem}>
                <View style={styles.followupContent}>
                  <Text style={styles.followupText} numberOfLines={2}>
                    {followup.Observaciones}
                  </Text>
                  <Text style={styles.followupDate}>
                    {formatDate(followup.FechaRegistro)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay seguimientos registrados</Text>
          )}

          {followups.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>Ver todos los seguimientos</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#337ab7" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 12,
    color: '#337ab7',
    marginLeft: 4,
    fontWeight: '500',
  },
  detailGrid: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  observations: {
    marginTop: 16,
  },
  observationsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  followupItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followupContent: {
    flex: 1,
  },
  followupText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  followupDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  viewMoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#337ab7',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactDetail;