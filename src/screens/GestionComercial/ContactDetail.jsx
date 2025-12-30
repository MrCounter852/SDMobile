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
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);

  useEffect(() => {
    loadContactDetail();
    loadActivities();
    loadFollowups();
    loadCustomFieldsConfig();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#337ab7" />
        </TouchableOpacity>
      ),
      headerTitle: 'Detalle',
      headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
      headerTintColor: '#337ab7',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil-outline" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

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

  const loadCustomFieldsConfig = async () => {
    if (!contact.OrigenPreContactoID) return;

    try {
      const response = await GestionComercialService.consultarCombosOrigenes(contact.OrigenPreContactoID);
      setCustomFieldsConfig(response.data || []);
    } catch (error) {
      console.error('Error loading custom fields config:', error);
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

  const getEstratosStr = (item) => {
    const estratos = [];
    for (let i = 1; i <= 6; i++) {
      if (item[`Estrato${i}`]) estratos.push(i);
    }
    return estratos.length > 0 ? estratos.join(', ') : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(value);
    } catch (e) {
      return '$0';
    }
  };

  const safeParseArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      if (data === '[]' || data === '') return [];
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Summary Card */}
        <View>
          {contactDetail && contactDetail.ProcesoID ? (
            <View>
              <ContactItem item={contactDetail} />
              {contactDetail.OrigenPreContactoNombre && (
                <View style={styles.originBadgeContainer}>
                  <LinearGradient
                    colors={['#337ab7', '#00ACC4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.originBadge}
                  >
                    <Ionicons name="pricetag-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.originBadgeText}>{contactDetail.OrigenPreContactoNombre}</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ textAlign: 'center', color: '#8E8E93' }}>Cargando...</Text>
            </View>
          )}
        </View>

        {/* Additional Details */}
        {/* TEMPORARILY COMMENTED FOR DEBUGGING */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información General</Text>
            <Ionicons name="information-circle-outline" size={20} color="#AEAEB2" />
          </View>

          <View style={styles.detailGrid}>
            {(contactDetail.Email || contactDetail.Celular) && (
              <View style={styles.gridRow}>
                {contactDetail.Email && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{String(contactDetail.Email)}</Text>
                  </View>
                )}
                {contactDetail.Celular && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Celular</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.Celular)}</Text>
                  </View>
                )}
              </View>
            )}

            {(contactDetail.AsesorNombreCompleto || contactDetail.EstadoProcesoNombre) && (
              <View style={styles.gridRow}>
                {contactDetail.AsesorNombreCompleto && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Asesor</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{String(contactDetail.AsesorNombreCompleto)}</Text>
                  </View>
                )}
                {contactDetail.EstadoProcesoNombre && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.EstadoProcesoNombre)}</Text>
                  </View>
                )}
              </View>
            )}

            {(contactDetail.OrigenPreContactoNombre || contactDetail.FormaContactoNombre) && (
              <View style={styles.gridRow}>
                {contactDetail.OrigenPreContactoNombre && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Origen</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.OrigenPreContactoNombre)}</Text>
                  </View>
                )}
                {contactDetail.FormaContactoNombre && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Forma Contacto</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.FormaContactoNombre)}</Text>
                  </View>
                )}
              </View>
            )}

            {contactDetail.FormaComoNosConocioNombre && (
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.detailLabel}>¿Cómo nos conoció?</Text>
                  <Text style={styles.detailValue}>{String(contactDetail.FormaComoNosConocioNombre)}</Text>
                </View>
                {contactDetail.FormaComoNosConocioDetalleNombre && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Detalle</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.FormaComoNosConocioDetalleNombre)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Row 5: Fechas */}
            {(contactDetail.Fecha || contactDetail.FechaCierre) && (
              <View style={styles.gridRow}>
                {contactDetail.Fecha && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Fecha Registro</Text>
                    <Text style={styles.detailValue}>{formatDate(contactDetail.Fecha)}</Text>
                  </View>
                )}
                {contactDetail.FechaCierre && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Fecha Cierre</Text>
                    <Text style={styles.detailValue}>{formatDate(contactDetail.FechaCierre)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Row 6: Fecha Posible Servicio & Estado General */}
            {(contactDetail.FechaPosibleServicio || contactDetail.EstadoGeneral) && (
              <View style={styles.gridRow}>
                {contactDetail.FechaPosibleServicio && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Fecha Posible Servicio</Text>
                    <Text style={styles.detailValue}>{formatDate(contactDetail.FechaPosibleServicio)}</Text>
                  </View>
                )}
                {contactDetail.EstadoGeneral && (
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Estado General</Text>
                    <Text style={styles.detailValue}>
                      {contactDetail.EstadoGeneral === 'R' ? 'Regular' :
                        contactDetail.EstadoGeneral === 'V' ? 'Verde' :
                          contactDetail.EstadoGeneral === 'A' ? 'Amarillo' :
                            String(contactDetail.EstadoGeneral)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {contactDetail.Observaciones && (
            <View style={styles.observations}>
              <Text style={styles.detailLabel}>Observaciones</Text>
              <View style={styles.observationCard}>
                <Text style={styles.observationsText}>{String(contactDetail.Observaciones)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Avaluos Section - OrigenPreContactoID = 7 */}
        {contactDetail.OrigenPreContactoID == 7 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Información del Avalúo</Text>
              <Ionicons name="document-text-outline" size={20} color="#AEAEB2" />
            </View>

            <View style={styles.detailGrid}>
              {contactDetail.TipoAvaluoNombre && (
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Tipo de Avalúo</Text>
                    <Text style={styles.detailValue}>{String(contactDetail.TipoAvaluoNombre)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Property Search & Preferences Section */}
        {(contactDetail.PresupuestoDesde || contactDetail.PresupuestoHasta || contactDetail.AreaDesde || contactDetail.AreaHasta || contactDetail.CondicionInmuebleNombre || contactDetail.AntiguedadInmuebleNombre) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Búsqueda y Preferencias</Text>
              <Ionicons name="search-outline" size={20} color="#AEAEB2" />
            </View>

            <View style={styles.detailGrid}>
              {(contactDetail.PresupuestoDesde || contactDetail.PresupuestoHasta) && (
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Presupuesto</Text>
                    <Text style={styles.detailValue}>
                      {contactDetail.PresupuestoDesde ? formatCurrency(contactDetail.PresupuestoDesde) : '$0'} - {contactDetail.PresupuestoHasta ? formatCurrency(contactDetail.PresupuestoHasta) : 'Máz.'}
                    </Text>
                  </View>
                </View>
              )}
              {(contactDetail.AreaDesde || contactDetail.AreaHasta) && (
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <Text style={styles.detailLabel}>Área (m²)</Text>
                    <Text style={styles.detailValue}>
                      {contactDetail.AreaDesde || 0} - {contactDetail.AreaHasta || 'Máz.'} m²
                    </Text>
                  </View>
                  {(contactDetail.Estrato1 || contactDetail.Estrato2 || contactDetail.Estrato3 || contactDetail.Estrato4 || contactDetail.Estrato5 || contactDetail.Estrato6) && (
                    <View style={styles.gridItem}>
                      <Text style={styles.detailLabel}>Estratos</Text>
                      <Text style={styles.detailValue}>{getEstratosStr(contactDetail)}</Text>
                    </View>
                  )}
                </View>
              )}
              {(contactDetail.CondicionInmuebleNombre || contactDetail.AntiguedadInmuebleNombre) && (
                <View style={styles.gridRow}>
                  {contactDetail.CondicionInmuebleNombre && (
                    <View style={styles.gridItem}>
                      <Text style={styles.detailLabel}>Condición</Text>
                      <Text style={styles.detailValue}>{String(contactDetail.CondicionInmuebleNombre)}</Text>
                    </View>
                  )}
                  {contactDetail.AntiguedadInmuebleNombre && (
                    <View style={styles.gridItem}>
                      <Text style={styles.detailLabel}>Antigüedad</Text>
                      <Text style={styles.detailValue}>{String(contactDetail.AntiguedadInmuebleNombre)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Property Details Section */}
        {(contactDetail.OrigenPreContactoID == 2 || contactDetail.OrigenPreContactoID == 4 || contactDetail.OrigenPreContactoID == 5) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detalles del Inmueble</Text>
              <Ionicons name="home-outline" size={20} color="#AEAEB2" />
            </View>

            {(contactDetail.Cantidadhabitaciones || contactDetail.Habitaciones || contactDetail.CantidadGarajes || contactDetail.Garajes || contactDetail.CantidadBanos || contactDetail.Banos || contactDetail.TipoOfertaNombre || contactDetail.TipoInmuebleNombre || contactDetail.EstadoMandato || contactDetail.EstadoCorretaje) ? (
              <View style={styles.propertyDetails}>
                {(contactDetail.TipoOfertaNombre || contactDetail.TipoInmuebleNombre) && (
                  <View style={styles.propertyRow}>
                    {contactDetail.TipoOfertaNombre && (
                      <View style={styles.propertyItem}>
                        <Ionicons name="business-outline" size={16} color="#337ab7" />
                        <Text style={styles.propertyLabel}>Tipo Oferta</Text>
                        <Text style={styles.propertyValue}>{String(contactDetail.TipoOfertaNombre)}</Text>
                      </View>
                    )}
                    {contactDetail.TipoInmuebleNombre && (
                      <View style={styles.propertyItem}>
                        <Ionicons name="home-outline" size={16} color="#337ab7" />
                        <Text style={styles.propertyLabel}>Tipo Inmueble</Text>
                        <Text style={styles.propertyValue}>{String(contactDetail.TipoInmuebleNombre)}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.propertyRow}>
                  <View style={styles.propertyItem}>
                    <Ionicons name="bed-outline" size={16} color="#337ab7" />
                    <Text style={styles.propertyLabel}>Habitaciones</Text>
                    <Text style={styles.propertyValue}>{String(contactDetail.Cantidadhabitaciones || contactDetail.Habitaciones || '0')}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Ionicons name="car-outline" size={16} color="#337ab7" />
                    <Text style={styles.propertyLabel}>Garajes</Text>
                    <Text style={styles.propertyValue}>{String(contactDetail.CantidadGarajes || contactDetail.Garajes || '0')}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Ionicons name="water-outline" size={16} color="#337ab7" />
                    <Text style={styles.propertyLabel}>Baños</Text>
                    <Text style={styles.propertyValue}>{String(contactDetail.CantidadBanos || contactDetail.Banos || '0')}</Text>
                  </View>
                </View>

                {/* Captaciones specific fields: EstadoMandato & EstadoCorretaje */}
                {contactDetail.OrigenPreContactoID == 2 && (contactDetail.EstadoMandato || contactDetail.EstadoCorretaje) && (
                  <View style={styles.propertyRow}>
                    {contactDetail.EstadoMandato && (
                      <View style={styles.propertyItem}>
                        <Ionicons name="document-text-outline" size={16} color="#337ab7" />
                        <Text style={styles.propertyLabel}>Estado Mandato</Text>
                        <Text style={styles.propertyValue}>{String(contactDetail.EstadoMandato)}</Text>
                      </View>
                    )}
                    {contactDetail.EstadoCorretaje && (
                      <View style={styles.propertyItem}>
                        <Ionicons name="ribbon-outline" size={16} color="#337ab7" />
                        <Text style={styles.propertyLabel}>Estado Corretaje</Text>
                        <Text style={styles.propertyValue}>{String(contactDetail.EstadoCorretaje)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay detalles del inmueble registrados</Text>
            )}
          </View>
        )}

        {/* Associated Properties (InmueblesProcesos) */}
        {(safeParseArray(contactDetail.InmueblesProcesos).length > 0 || safeParseArray(contactDetail.Inmueble).length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inmuebles Asociados ({safeParseArray(contactDetail.InmueblesProcesos).length || safeParseArray(contactDetail.Inmueble).length})</Text>
              <Ionicons name="location-outline" size={20} color="#AEAEB2" />
            </View>

            {safeParseArray(contactDetail.InmueblesProcesos).map((inmueble, index) => (
              <View key={`inm-${index}`} style={styles.propertyCard}>
                <View style={styles.propertyCardHeader}>
                  <Text style={styles.propertyCardTitle}>{inmueble.TipoInmueble} - N°. {inmueble.InmuebleConsecutivo}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#1565C0' }]}>{inmueble.EstadoProcesoInmuebleNombre}</Text>
                  </View>
                </View>
                <Text style={styles.propertyCardAddress}>{inmueble.InmuebleDireccion}</Text>
                <Text style={styles.propertyCardSub}>{inmueble.Barrio} | {inmueble.Localidad}</Text>

                <View style={styles.propertyCardGrid}>
                  <View style={styles.propertyCardStat}>
                    <Text style={styles.statLabel}>Canon</Text>
                    <Text style={styles.statValue}>{formatCurrency(inmueble.ValorCanon)}</Text>
                  </View>
                  <View style={styles.propertyCardStat}>
                    <Text style={styles.statLabel}>Admón</Text>
                    <Text style={styles.statValue}>{formatCurrency(inmueble.ValorAdmin)}</Text>
                  </View>
                  {inmueble.ValorVenta && (
                    <View style={styles.propertyCardStat}>
                      <Text style={styles.statLabel}>Venta</Text>
                      <Text style={styles.statValue}>{formatCurrency(inmueble.ValorVenta)}</Text>
                    </View>
                  ) || (
                      <View style={styles.propertyCardStat}>
                        <Text style={styles.statLabel}>Habs/Baños</Text>
                        <Text style={styles.statValue}>{inmueble.Habitaciones}/{inmueble.Banos}</Text>
                      </View>
                    )}
                </View>
              </View>
            ))}

            {safeParseArray(contactDetail.InmueblesProcesos).length === 0 && safeParseArray(contactDetail.Inmueble).map((inmueble, index) => (
              <View key={`legacy-inm-${index}`} style={styles.inmuebleItem}>
                <Ionicons name="location-outline" size={16} color="#337ab7" />
                <View style={styles.inmuebleContent}>
                  <Text style={styles.inmuebleConsecutivo}>Inmueble N°. {String(inmueble.Consecutivo)}</Text>
                  <Text style={styles.inmuebleDireccion}>{String(inmueble.Direccion)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Locations of Interest */}
        {safeParseArray(contactDetail.ProcesosInmobiliariaLocalidades).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ubicaciones de Interés</Text>
              <Ionicons name="map-outline" size={20} color="#AEAEB2" />
            </View>
            <View style={styles.tagContainer}>
              {safeParseArray(contactDetail.ProcesosInmobiliariaLocalidades).map((loc, index) => (
                <View key={index} style={styles.locationTag}>
                  <Text style={styles.locationTagText}>{loc.LocalidadNombre || loc.Nombre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Custom Fields Section */}
        {safeParseArray(customFieldsConfig).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Campos Personalizados</Text>
              <Ionicons name="list-outline" size={20} color="#AEAEB2" />
            </View>

            <View style={styles.customFields}>
              {safeParseArray(customFieldsConfig).map((field) => {
                const value = contactDetail[`Valor${field.ModelCampo}`];
                if (!value) return null;
                return (
                  <View key={field.CampoPreContactoID} style={styles.customFieldItem}>
                    <Text style={styles.detailLabel}>{String(field.LabelCampo)}</Text>
                    <Text style={styles.detailValue}>{String(value)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Storage Specific: Initial Services */}
        {(contactDetail.OrigenPreContactoID == 1 || contactDetail.OrigenPreContactoID == 6) && safeParseArray(contactDetail.ProcesosServiciosIniciales).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Servicios Iniciales Interesado</Text>
              <Ionicons name="cube-outline" size={20} color="#AEAEB2" />
            </View>
            <View style={styles.tagContainer}>
              {safeParseArray(contactDetail.ProcesosServiciosIniciales).map((servicio, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{servicio.Nombre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Financial Section: Cotizaciones, Ordenes, Facturas */}
        {(safeParseArray(contactDetail.Cotizaciones).length > 0 || safeParseArray(contactDetail.OrdenesServicios).length > 0 || safeParseArray(contactDetail.PreFacturas).length > 0 || safeParseArray(contactDetail.Facturas).length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gestión Comercial y Financiera</Text>
              <Ionicons name="card-outline" size={20} color="#AEAEB2" />
            </View>

            {/* Cotizaciones */}
            {safeParseArray(contactDetail.Cotizaciones).length > 0 && (
              <View style={styles.financialSubsection}>
                <Text style={styles.subsectionTitle}>Cotizaciones</Text>
                {safeParseArray(contactDetail.Cotizaciones).map((cot, index) => (
                  <View key={index} style={styles.financialItem}>
                    <View style={styles.financialItemHeader}>
                      <Text style={styles.financialItemTitle}>Cotización #{cot.Consecutivo}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: cot.Aprobada ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Text style={[styles.statusBadgeText, { color: cot.Aprobada ? '#2E7D32' : '#EF6C00' }]}>
                          {cot.Aprobada ? 'Aprobada' : 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.financialItemContent}>
                      <Text style={styles.financialItemValue}>{formatCurrency(cot.ValorCotizacion)}</Text>
                      <Text style={styles.financialItemDate}>{formatDate(cot.FechaElaboracion)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ordenes de Servicio */}
            {safeParseArray(contactDetail.OrdenesServicios).length > 0 && (
              <View style={styles.financialSubsection}>
                <Text style={styles.subsectionTitle}>Órdenes de Servicio</Text>
                {safeParseArray(contactDetail.OrdenesServicios).map((os, index) => (
                  <View key={index} style={styles.financialItem}>
                    <View style={styles.financialItemHeader}>
                      <Text style={styles.financialItemTitle}>OS #{os.Consecutivo}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#1565C0' }]}>
                          {os.EstadoOrdenServicioNombre}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.financialItemContent}>
                      <Text style={styles.financialItemValue}>{formatCurrency(os.ValorOrdenServicio)}</Text>
                      <Text style={styles.financialItemDate}>{formatDate(os.FechaElaboracion)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Facturación */}
            {(safeParseArray(contactDetail.PreFacturas).length > 0 || safeParseArray(contactDetail.Facturas).length > 0) && (
              <View style={styles.financialSubsection}>
                <Text style={styles.subsectionTitle}>Facturación</Text>
                {safeParseArray(contactDetail.PreFacturas).map((pf, index) => (
                  <View key={`pf-${index}`} style={styles.financialItem}>
                    <View style={styles.financialItemHeader}>
                      <Text style={styles.financialItemTitle}>Pre-Factura {pf.Prefijo}-{pf.Consecutivo}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#F3E5F5' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#7B1FA2' }]}>Borrador</Text>
                      </View>
                    </View>
                    <View style={styles.financialItemContent}>
                      <Text style={styles.financialItemValue}>{formatCurrency(pf.ValorPreFactura)}</Text>
                      <Text style={styles.financialItemDate}>{formatDate(pf.FechaCreacion)}</Text>
                    </View>
                  </View>
                ))}
                {safeParseArray(contactDetail.Facturas).map((f, index) => (
                  <View key={`f-${index}`} style={styles.financialItem}>
                    <View style={styles.financialItemHeader}>
                      <Text style={styles.financialItemTitle}>Factura {f.Prefijo}{f.Consecutivo}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#2E7D32' }]}>Emitida</Text>
                      </View>
                    </View>
                    <View style={styles.financialItemContent}>
                      <Text style={styles.financialItemValue}>{formatCurrency(f.ValorFactura)}</Text>
                      <Text style={styles.financialItemDate}>{formatDate(f.FechaCreacion)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Documentation Section */}
        {(contactDetail.FormatoVinculacion?.FormatoVinculacionID || contactDetail.FormatoSeguro?.FormatoSeguroID) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Documentación</Text>
              <Ionicons name="document-attach-outline" size={20} color="#AEAEB2" />
            </View>
            {contactDetail.FormatoVinculacion?.FormatoVinculacionID && (
              <View style={styles.documentItem}>
                <Ionicons name="document-text-outline" size={24} color="#337ab7" />
                <View style={styles.documentContent}>
                  <Text style={styles.documentTitle}>Formato de Vinculación #{contactDetail.FormatoVinculacion.Consecutivo}</Text>
                  <Text style={styles.documentStatus}>{contactDetail.FormatoVinculacion.EstadoFirmasSignio || 'En proceso'}</Text>
                </View>
              </View>
            )}
            {contactDetail.FormatoSeguro?.FormatoSeguroID && (
              <View style={styles.documentItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
                <View style={styles.documentContent}>
                  <Text style={styles.documentTitle}>{contactDetail.FormatoSeguro.TipoFormatoSeguroNombre || 'Formato de Seguro'}</Text>
                  <Text style={styles.documentStatus}>{contactDetail.FormatoSeguro.EstadoFirmaSignio || 'En proceso'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

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
                    {String(activity.Asunto)}
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
                    {String(followup.Observaciones)}
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
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  originBadgeContainer: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 10,
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#337ab7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  originBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    color: '#337ab7',
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
    color: '#337ab7',
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
    color: '#337ab7',
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceTag: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#337ab720',
  },
  serviceTagText: {
    color: '#337ab7',
    fontSize: 13,
    fontWeight: '600',
  },
  financialSubsection: {
    marginBottom: 20,
    marginTop: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  financialItem: {
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  financialItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  financialItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#337ab7',
  },
  financialItemDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  documentContent: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  documentStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  propertyCard: {
    backgroundColor: '#F8F8FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#337ab7',
  },
  propertyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  propertyCardAddress: {
    fontSize: 14,
    color: '#3A3A3C',
    fontWeight: '500',
    marginBottom: 2,
  },
  propertyCardSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },
  propertyCardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  propertyCardStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#337ab7',
  },
  locationTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#AEAEB230',
  },
  locationTagText: {
    color: '#3A3A3C',
    fontSize: 13,
    fontWeight: '600',
  },
  propertyDetails: {
    gap: 16,
  },
  propertyRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  propertyItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    padding: 12,
    borderRadius: 12,
  },
  propertyLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
  propertyValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  inmueblesSection: {
    marginTop: 16,
  },
  inmuebleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8FA',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  inmuebleContent: {
    flex: 1,
    marginLeft: 8,
  },
  inmuebleConsecutivo: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  inmuebleDireccion: {
    fontSize: 12,
    color: '#3A3A3C',
    marginTop: 2,
    lineHeight: 16,
  },
  customFields: {
    gap: 12,
  },
  customFieldItem: {
    backgroundColor: '#F8F8FA',
    padding: 12,
    borderRadius: 12,
  },
});

export default ContactDetail;