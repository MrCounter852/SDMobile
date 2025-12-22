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
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobal } from '../../core/global';
const GestionComercialService = require('../../services/GestionComercial/gestionComercialService').default;
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Detalle
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Summary Card */}
        <View style={styles.heroSection}>
          <ContactItem item={contactDetail} />
        </View>

        {/* Additional Details */}
        {/* Info Grid Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información</Text>
            <Ionicons name="information-circle-outline" size={20} color="#AEAEB2" />
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.detailLabel}>Tipo</Text>
                <Text style={styles.detailValue}>{contactDetail.OrigenNombre || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.detailLabel}>Asesor</Text>
                <Text style={styles.detailValue}>{contactDetail.AsesorNombreCompleto || 'No asignado'}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.detailLabel}>Contacto</Text>
                <Text style={styles.detailValue}>{contactDetail.FormaContactoNombre || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.detailLabel}>Origen</Text>
                <Text style={styles.detailValue}>{contactDetail.FormaComoNosConocioNombre || 'N/A'}</Text>
              </View>
            </View>

            {contactDetail.ValorNegocio && (
              <View style={styles.gridRow}>
                <View style={[styles.gridItem, { flex: 1 }]}>
                  <Text style={styles.detailLabel}>Valor Negocio</Text>
                  <Text style={[styles.detailValue, styles.valueHighlight]}>{formatCurrency(contactDetail.ValorNegocio)}</Text>
                </View>
              </View>
            )}
          </View>

          {contactDetail.Observaciones && (
            <View style={styles.observations}>
              <Text style={styles.detailLabel}>Observaciones</Text>
              <View style={styles.observationCard}>
                <Text style={styles.observationsText}>{contactDetail.Observaciones}</Text>
              </View>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  heroSection: {
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E5F1FF',
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '700',
  },
  detailGrid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  observations: {
    marginTop: 20,
  },
  observationCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  observationsText: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  followupItem: {
    paddingVertical: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
    paddingLeft: 16,
    marginLeft: 8,
    marginBottom: 8,
  },
  followupContent: {
    flex: 1,
  },
  followupText: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 20,
    fontWeight: '500',
  },
  followupDate: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#AEAEB2',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 16,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default ContactDetail;