import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobal } from "../../../core/global";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";

const GestionComercialService = require("../services/crmService").default;
const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#337ab7",
  secondary: "#0086C8",
  accent: "#00ACC4",
  success: "#00CDA7",
  highlight: "#88E782",
  dark: "#1E293B",
  gray: "#64748B",
  lightGray: "#94A3B8",
  background: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  danger: "#FF3B30",
};

const ContactDetail = ({ navigation, route }) => {
  const { contact } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contactDetail, setContactDetail] = useState(contact);
  const [activities, setActivities] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);

  useEffect(() => {
    loadAllData();
    navigation.setOptions({
      headerShown: false,
    });
  }, [contact.ProcesoID]);

  const loadAllData = async () => {
    setLoading(true);
    // Limpiar datos previos para evitar "ghosting"
    setActivities([]);
    setFollowups([]);

    try {
      await Promise.all([
        loadContactDetail(),
        loadActivities(),
        loadFollowups(),
        loadCustomFieldsConfig(),
      ]);
    } catch (error) {
      console.error("Error loading all data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactDetail = async () => {
    if (!contact.ProcesoID) return;
    try {
      const response =
        await GestionComercialService.consultarPreContactoDetallado({
          ProcesoID: contact.ProcesoID,
        });
      if (response.data) {
        setContactDetail({ ...contact, ...response.data });
      }
    } catch (error) {
      console.error("Error loading contact detail:", error);
    }
  };

  const loadActivities = async () => {
    if (!contact.ProcesoID) return;
    try {
      const response =
        await GestionComercialService.consultarActividadesCalendario({
          CalendarioActividadOrigenID: 2,
          CodigoOrigen: contact.ProcesoID,
        });
      setActivities(response.rows || []);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const loadFollowups = async () => {
    if (!contact.ProcesoID) return;
    try {
      const response = await GestionComercialService.consultarSeguimientos({
        OrigenID: contact.ProcesoID,
        OrigenSeguimientoID: "CRM-PRO",
      });
      setFollowups(response.rows || (Array.isArray(response) ? response : []));
    } catch (error) {
      console.error("Error loading followups:", error);
    }
  };

  const loadCustomFieldsConfig = async () => {
    if (!contact.OrigenPreContactoID) return;
    try {
      const response = await GestionComercialService.consultarCombosOrigenes(
        contact.OrigenPreContactoID
      );
      setCustomFieldsConfig(response.data || []);
    } catch (error) {
      console.error("Error loading custom fields config:", error);
    }
  };

  const handleEdit = () => {
    navigation.navigate("NewLeadScreen", { preContacto: contactDetail });
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar contacto",
      "¿Está seguro de que desea eliminar este contacto? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await GestionComercialService.eliminarPreContacto({
                ProcesoID: contactDetail.ProcesoID,
              });
              Alert.alert("Éxito", "Contacto eliminado correctamente", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Error", "No se pudo eliminar el contacto");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddActivity = () => {
    navigation.navigate("ActivityFollowupScreen", { contact: contactDetail });
  };

  const handleAddFollowup = () => {
    navigation.navigate("ActivityFollowupScreen", { contact: contactDetail });
  };

  const getEstratosStr = (item) => {
    const estratos = [];
    for (let i = 1; i <= 6; i++) {
      if (item[`Estrato${i}`]) estratos.push(i);
    }
    return estratos.length > 0 ? estratos.join(", ") : "N/A";
  };

  const formatDate = (dateString, withTime = true) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
      if (withTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return date.toLocaleDateString("es-CO", options);
    } catch (e) {
      return "N/A";
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return "$0";
    }
  };

  const safeParseArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      if (data === "[]" || data === "") return [];
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // --- RENDER FUNCTIONS --- //

  const renderHeader = () => {
    const contactName =
      contactDetail.NombreCompleto ||
      contactDetail.Nombre ||
      "Detalle del Contacto";
    const contactRole = contactDetail.OrigenPreContactoNombre || "Pre-contacto";

    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
          </View>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSubtitle}>{contactRole}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {contactName}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtn, { marginLeft: 8 }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  const InfoSection = ({ title, icon, children, onAdd }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContent}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name={icon} size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onAdd && (
          <TouchableOpacity style={styles.sectionAddBtn} onPress={onAdd}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );

  const DataItem = ({
    label,
    value,
    fullWidth = false,
    isCurrency = false,
  }) => (
    <View style={[styles.dataItem, fullWidth && styles.fullWidth]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, isCurrency && styles.currencyValue]}>
        {isCurrency ? formatCurrency(value) : value || "N/A"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Summary Badge Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.statusBadge}>
            <View
              style={[styles.statusDot, { backgroundColor: COLORS.success }]}
            />
            <Text style={styles.statusBadgeText}>
              {contactDetail.EstadoProcesoNombre || "Nuevo"}
            </Text>
          </View>
          {contactDetail.AsesorNombreCompleto && (
            <View style={styles.asesorBadge}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color={COLORS.secondary}
              />
              <Text style={styles.asesorBadgeText}>
                {contactDetail.AsesorNombreCompleto}
              </Text>
            </View>
          )}
        </View>

        {/* 2. General Information */}
        <InfoSection
          title="Información General"
          icon="information-circle-outline"
        >
          <View style={styles.dataGrid}>
            <DataItem label="Email" value={contactDetail.Email} />
            <DataItem label="Celular" value={contactDetail.Celular} />
            <DataItem
              label="Origen"
              value={contactDetail.OrigenPreContactoNombre}
            />
            <DataItem
              label="Forma Contacto"
              value={contactDetail.FormaContactoNombre}
            />
            <DataItem
              label="Fecha Registro"
              value={formatDate(contactDetail.Fecha)}
            />
            <DataItem
              label="Fecha Cierre"
              value={formatDate(contactDetail.FechaCierre)}
            />
            <DataItem
              label="Posible Servicio"
              value={formatDate(contactDetail.FechaPosibleServicio, false)}
            />
            <DataItem
              label="Estado General"
              value={
                contactDetail.EstadoGeneral === "R"
                  ? "Regular"
                  : contactDetail.EstadoGeneral === "V"
                  ? "Verde"
                  : contactDetail.EstadoGeneral === "A"
                  ? "Amarillo"
                  : contactDetail.EstadoGeneral
              }
            />
          </View>
          {contactDetail.Observaciones && (
            <View style={styles.observationBox}>
              <Text style={styles.dataLabel}>Observaciones</Text>
              <Text style={styles.observationText}>
                {contactDetail.Observaciones}
              </Text>
            </View>
          )}
        </InfoSection>

        {/* 3. Property Search Preferences */}
        {(contactDetail.PresupuestoDesde ||
          contactDetail.AreaDesde ||
          contactDetail.CondicionInmuebleNombre) && (
          <InfoSection title="Búsqueda y Preferencias" icon="search-outline">
            <View style={styles.dataGrid}>
              <DataItem
                label="Presupuesto"
                value={`${formatCurrency(contactDetail.PresupuestoDesde)} - ${
                  contactDetail.PresupuestoHasta
                    ? formatCurrency(contactDetail.PresupuestoHasta)
                    : "Máx."
                }`}
                fullWidth
              />
              <DataItem
                label="Área (m²)"
                value={`${contactDetail.AreaDesde || 0} - ${
                  contactDetail.AreaHasta || "Máx."
                }`}
              />
              <DataItem
                label="Estratos"
                value={getEstratosStr(contactDetail)}
              />
              <DataItem
                label="Condición"
                value={contactDetail.CondicionInmuebleNombre}
              />
              <DataItem
                label="Antigüedad"
                value={contactDetail.AntiguedadInmuebleNombre}
              />
            </View>
          </InfoSection>
        )}

        {/* 4. Property Details (If applicable) */}
        {(contactDetail.OrigenPreContactoID == 2 ||
          contactDetail.OrigenPreContactoID == 4 ||
          contactDetail.OrigenPreContactoID == 5) && (
          <InfoSection title="Detalles del Inmueble" icon="home-outline">
            <View style={styles.propertyStats}>
              <View style={styles.statChip}>
                <Ionicons name="bed-outline" size={16} color={COLORS.primary} />
                <Text style={styles.statLabelSmall}>HAB</Text>
                <Text style={styles.statValueSmall}>
                  {contactDetail.Cantidadhabitaciones ||
                    contactDetail.Habitaciones ||
                    "0"}
                </Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons
                  name="water-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.statLabelSmall}>BAÑOS</Text>
                <Text style={styles.statValueSmall}>
                  {contactDetail.CantidadBanos || contactDetail.Banos || "0"}
                </Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons name="car-outline" size={16} color={COLORS.primary} />
                <Text style={styles.statLabelSmall}>GAR</Text>
                <Text style={styles.statValueSmall}>
                  {contactDetail.CantidadGarajes ||
                    contactDetail.Garajes ||
                    "0"}
                </Text>
              </View>
            </View>
            <View style={styles.dataGrid}>
              <DataItem
                label="Tipo Oferta"
                value={contactDetail.TipoOfertaNombre}
              />
              <DataItem
                label="Tipo Inmueble"
                value={contactDetail.TipoInmuebleNombre}
              />
              {contactDetail.OrigenPreContactoID == 2 && (
                <DataItem
                  label="Estado Mandato"
                  value={contactDetail.EstadoMandato}
                />
              )}
              {contactDetail.OrigenPreContactoID == 2 && (
                <DataItem
                  label="Estado Corretaje"
                  value={contactDetail.EstadoCorretaje}
                />
              )}
            </View>
          </InfoSection>
        )}

        {/* 5. Associated Properties */}
        {safeParseArray(contactDetail.InmueblesProcesos).length > 0 && (
          <InfoSection
            title={`Inmuebles Asociados (${
              safeParseArray(contactDetail.InmueblesProcesos).length
            })`}
            icon="location-outline"
          >
            {safeParseArray(contactDetail.InmueblesProcesos).map((inm, idx) => (
              <View key={idx} style={styles.associatedCard}>
                <View
                  style={[
                    styles.asocHeader,
                    { borderLeftColor: COLORS.secondary },
                  ]}
                >
                  <Text style={styles.asocTitle}>
                    {inm.TipoInmueble} - #{inm.InmuebleConsecutivo}
                  </Text>
                  <View style={styles.asocBadge}>
                    <Text style={styles.asocBadgeText}>
                      {inm.EstadoProcesoInmuebleNombre}
                    </Text>
                  </View>
                </View>
                <Text style={styles.asocAddress}>{inm.InmuebleDireccion}</Text>
                <View style={styles.asocStats}>
                  <View style={styles.asocStat}>
                    <Text style={styles.asocStatLabel}>CANON</Text>
                    <Text style={styles.asocStatValue}>
                      {formatCurrency(inm.ValorCanon)}
                    </Text>
                  </View>
                  <View style={styles.asocStat}>
                    <Text style={styles.asocStatLabel}>ADMÓN</Text>
                    <Text style={styles.asocStatValue}>
                      {formatCurrency(inm.ValorAdmin)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </InfoSection>
        )}

        {/* 6. Activities */}
        <InfoSection
          title={`Actividades (${activities.length})`}
          icon="calendar-outline"
          onAdd={handleAddActivity}
        >
          {activities.length > 0 ? (
            activities.slice(0, 3).map((activity, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.itemRow}
                onPress={() =>
                  navigation.navigate("ActivityDetail", { activity })
                }
              >
                <View
                  style={[
                    styles.itemIcon,
                    {
                      backgroundColor: activity.Completada
                        ? "rgba(0, 205, 167, 0.1)"
                        : "rgba(51, 122, 183, 0.1)",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      activity.Completada ? "checkmark-circle" : "time-outline"
                    }
                    size={18}
                    color={
                      activity.Completada ? COLORS.success : COLORS.primary
                    }
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {activity.Asunto}
                  </Text>
                  <Text style={styles.itemDate}>
                    {formatDate(activity.FechaInicio)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.lightGray}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay actividades registradas</Text>
          )}
        </InfoSection>

        {/* 7. Follow-ups */}
        <InfoSection
          title={`Seguimientos (${followups.length})`}
          icon="chatbubble-ellipses-outline"
          onAdd={handleAddFollowup}
        >
          {followups.length > 0 ? (
            followups.slice(0, 3).map((follow, idx) => (
              <View key={idx} style={styles.followupCard}>
                <View style={styles.followupHeader}>
                  <Text style={styles.followAvatar}>
                    {follow.NombreCompleto?.charAt(0) || "U"}
                  </Text>
                  <View style={styles.followMeta}>
                    <Text style={styles.followUser}>
                      {follow.NombreCompleto || "Usuario"}
                    </Text>
                    <Text style={styles.followDate}>
                      {follow.FechaRegistroAmigable ||
                        formatDate(follow.FechaRegistro)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.followComment}>
                  {follow.Comentario ||
                    follow.Observaciones ||
                    "Sin comentarios"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No hay seguimientos registrados
            </Text>
          )}
        </InfoSection>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -50,
  },
  patternCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(136,231,130,0.12)",
    bottom: -40,
    left: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Summary Badges
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
  },
  asesorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 134, 200, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  asesorBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  // Sections
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
  },
  sectionAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(51, 122, 183, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Data Display
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  dataItem: {
    width: "47%",
  },
  fullWidth: {
    width: "100%",
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.lightGray,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  currencyValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  observationBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  observationText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },

  // Property Stats
  propertyStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabelSmall: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.lightGray,
    marginTop: 4,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
    marginTop: 2,
  },

  // Associated Properties
  associatedCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  asocHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    paddingLeft: 10,
    marginBottom: 8,
  },
  asocTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  asocBadge: {
    backgroundColor: "rgba(0, 205, 167, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  asocBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.success,
  },
  asocAddress: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
  },
  asocStats: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  asocStat: {
    flex: 1,
  },
  asocStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.lightGray,
  },
  asocStatValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Row items (Activities)
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },

  // Follow-ups
  followupCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  followupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  followAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    color: "#FFF",
    textAlign: "center",
    lineHeight: 32,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },
  followMeta: {
    flex: 1,
  },
  followUser: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },
  followDate: {
    fontSize: 11,
    color: COLORS.lightGray,
  },
  followComment: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Más opaco para ocultar el contenido anterior
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

export default ContactDetail;
