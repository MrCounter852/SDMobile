import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobal } from "../../../core/global";
import leadService from "../services/leadService";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";

const { width } = Dimensions.get("window");

// Paleta de colores de la marca (según DESIGN_PATTERNS.md)
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
  danger: "#EF4444",
};

const EstadosProcesos = [
  { ID: null, Nombre: "Todos" },
  { ID: 1, Nombre: "Procesos activos" },
  { ID: null, Nombre: "Procesos cerrados" },
];

const ContactInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contact } = route.params || {};
  const { user } = useGlobal();

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.lightGray}
          />
          <Text style={styles.emptyText}>No hay datos del contacto</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [loading, setLoading] = useState(true);
  const [busquedas, setBusquedas] = useState({});
  const [estadoID, setEstadoID] = useState(contact.EstadoID || null);
  const [showEditContact, setShowEditContact] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editNombre, setEditNombre] = useState(contact.Nombre || "");
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(contact.Cliente || "");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const relaciones = await leadService.consultarRelacionesContacto({
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: 1,
        Rows: 0,
        SucursalID: user?.SucursalID,
        Token: user?.Token,
      });

      setBusquedas(relaciones || {});
    } catch (error) {
      console.error("ContactInfoScreen: Error loading contact info:", error);
      Alert.alert("Error", "No se pudo cargar la información del contacto");
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (value) => {
    setEstadoID(value);
    // TODO: Save to API
  };

  const handleEditContact = async () => {
    if (!editNombre.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }
    // TODO: Save to API
    setShowEditContact(false);
  };

  const handleEditClient = async () => {
    // TODO: Save to API
    setShowEditClient(false);
  };

  const renderSection = (title, icon, items, renderItem) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>
            {title} ({items.length})
          </Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            {renderItem(item)}
          </View>
        ))}
      </View>
    );
  };

  const renderProcesoComercial = (item) => (
    <>
      <View style={styles.itemCardHeader}>
        <View style={styles.itemIconContainer}>
          <Ionicons name="funnel" size={16} color={COLORS.danger} />
        </View>
        <Text style={styles.itemCardTitle}>Proceso comercial</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>#{item.Consecutivo}</Text>
        </View>
      </View>
      <View style={styles.itemCardBody}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Contacto</Text>
          <Text style={styles.fieldValue}>{item.Contacto || "N/A"}</Text>
        </View>
        <View style={styles.fieldRowDouble}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Estado</Text>
            <Text style={styles.fieldValue}>{item.Estado || "N/A"}</Text>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <Text style={styles.fieldValue}>{item.Tipo || "N/A"}</Text>
          </View>
        </View>
        {item.Cliente && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Text style={styles.fieldValue}>{item.Cliente}</Text>
          </View>
        )}
        {item.Asesor && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Asesor</Text>
            <Text style={styles.fieldValue}>{item.Asesor}</Text>
          </View>
        )}
      </View>
      <View style={styles.itemCardFooter}>
        {item.Link && (
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="open-outline" size={14} color={COLORS.primary} />
            <Text style={styles.linkButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.dateText}>
          {new Date(item.Fecha).toLocaleDateString("es-CO")}
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
        />
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerContent}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Información del Contacto</Text>
                <View style={{ width: 40 }} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header con Gradiente */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            {/* Círculos decorativos */}
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />

            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Información del Contacto</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Contact Card flotante */}
      <View style={styles.contactCardContainer}>
        <View style={styles.contactCard}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {contact.Nombre?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </LinearGradient>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.Nombre}
            </Text>
            <View style={styles.contactPhoneRow}>
              <Ionicons name="call-outline" size={14} color={COLORS.gray} />
              <Text style={styles.contactPhone}>
                {contact.FormatoCelular || contact.Telefono || "Sin teléfono"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editContactButton}
            onPress={() => setShowEditContact(true)}
          >
            <Feather name="edit-2" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons
              name="business-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.infoCardTitle}>Cliente Asociado</Text>
          </View>
          <View style={styles.infoCardBody}>
            <View style={styles.clientRow}>
              <View style={styles.clientIconContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.clientName}>
                {contact.Cliente || "Cliente sin identificar"}
              </Text>
              <TouchableOpacity
                style={styles.changeClientButton}
                onPress={() => setShowEditClient(true)}
              >
                <Feather name="refresh-cw" size={14} color={COLORS.primary} />
                <Text style={styles.changeClientText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Estado Picker Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="flag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoCardTitle}>Estado del Contacto</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={estadoID}
              onValueChange={handleEstadoChange}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {EstadosProcesos.map((item, index) => (
                <Picker.Item
                  key={index}
                  label={item.Nombre}
                  value={item.ID}
                  color={COLORS.dark}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Sections */}
        {renderSection(
          "Procesos comerciales",
          "funnel-outline",
          busquedas.ProcesosComerciales,
          renderProcesoComercial,
        )}

        {/* Empty State */}
        {(!busquedas.ProcesosComerciales ||
          busquedas.ProcesosComerciales.length === 0) &&
          (!busquedas.ContratosServicios ||
            busquedas.ContratosServicios.length === 0) && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="folder-open-outline"
                  size={40}
                  color={COLORS.lightGray}
                />
              </View>
              <Text style={styles.emptyStateTitle}>Sin resultados</Text>
              <Text style={styles.emptyStateText}>
                No hay procesos o contratos asociados a este contacto
              </Text>
            </View>
          )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Contact Modal */}
      <Modal visible={showEditContact} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.modalTitle}>Editar Contacto</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditContact(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre del contacto</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.lightGray}
                />
                <TextInput
                  style={styles.input}
                  value={editNombre}
                  onChangeText={setEditNombre}
                  placeholder="Ingrese el nombre"
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditContact(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButtonContainer}
                onPress={handleEditContact}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                  <Feather name="check" size={16} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Client Modal */}
      <Modal visible={showEditClient} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.modalTitle}>Asignar Cliente</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditClient(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.pendingFeature}>
                <Ionicons
                  name="construct-outline"
                  size={32}
                  color={COLORS.lightGray}
                />
                <Text style={styles.pendingFeatureText}>
                  Funcionalidad en desarrollo
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => setShowEditClient(false)}
              >
                <Text style={styles.cancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 60,
  },
  patternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -40,
  },
  patternCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    left: -30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  contactCardContainer: {
    marginTop: -40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  contactPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  contactPhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  editContactButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(51,122,183,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCardBody: {
    paddingLeft: 4,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 12,
  },
  changeClientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(51,122,183,0.1)",
    gap: 6,
  },
  changeClientText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 10,
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(51,122,183,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  itemCardBody: {
    gap: 10,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldRowDouble: {
    flexDirection: "row",
    gap: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
    marginTop: 2,
  },
  itemCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(148,163,184,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(51,122,183,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    height: "100%",
  },
  pendingFeature: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  pendingFeatureText: {
    fontSize: 14,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
  },
  saveButtonContainer: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  saveButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "700",
  },
});

export default ContactInfoScreen;
