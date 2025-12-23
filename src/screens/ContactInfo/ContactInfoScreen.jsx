import React, { useState, useEffect, useFocusEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useGlobal } from "../../core/global";
import leadService from "../../services/leads/leadService";

const COLORS = {
  primary: "#337ab7",
  secondary: "#88E782",
  background: "#F3F4F6",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  danger: "#DC2626",
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
        <Text>No contact data</Text>
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

  useEffect(
      React.useCallback(() => {
        navigation.setOptions({
          headerTitle: () => (
            <Text style={{ color: "#337ab7", fontSize: 18, fontWeight: "bold" }}>
              Información del contacto
            </Text>
          ),
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#337ab7" />
            </TouchableOpacity>
          ),
          headerRight: () => null,
        });
      }, [navigation])
    );

  const loadData = async () => {
    console.log("ContactInfoScreen: loadData start", contact.CuentaMensajeriaContactoID);
    setLoading(true);
    try {
      const relaciones = await leadService.consultarRelacionesContacto({
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: 1,
        Rows: 0,
        SucursalID: user?.SucursalID,
        Token: user?.Token,
      });
      console.log("ContactInfoScreen: relaciones loaded", relaciones);
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
          <View key={index} style={styles.card}>
            {renderItem(item)}
          </View>
        ))}
      </View>
    );
  };

  const renderProcesoComercial = (item) => (
    <>
      <View style={styles.cardHeader}>
        <Ionicons name="funnel" size={16} color="#DC2626" />
        <Text style={styles.cardTitle}>Proceso comercial</Text>
        <Text style={styles.cardBadge}>#{item.Consecutivo}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Contacto: </Text>
          {item.Contacto || "N/A"}
        </Text>
        <View style={styles.row}>
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Estado: </Text>
            {item.Estado || "N/A"}
          </Text>
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Tipo: </Text>
            {item.Tipo || "N/A"}
          </Text>
        </View>
        {item.Cliente && (
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Cliente: </Text>
            {item.Cliente}
          </Text>
        )}
        {item.Asesor && (
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Asesor: </Text>
            {item.Asesor}
          </Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        {item.Link && (
          <TouchableOpacity style={styles.link}>
            <Ionicons name="open-outline" size={16} />
            <Text style={styles.linkText}>Ver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.date}>
          {new Date(item.Fecha).toLocaleDateString("es-CO")}
        </Text>
      </View>
    </>
  );

  // Similar render functions for other types...

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  console.log("ContactInfoScreen: rendering", loading, busquedas);

  return (
    <SafeAreaView style={styles.container} edges={'bottom'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Header */}
        <View style={styles.contactHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.Nombre}</Text>
            <Text style={styles.contactPhone}>{contact.FormatoCelular || contact.Telefono}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.card}>
          <Text style={styles.field}>
            <Text style={styles.fieldLabel}>Cliente: </Text>
            {contact.Cliente || "Cliente sin identificar"}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditClient(true)}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Estado */}
        <View style={styles.card}>
          <Text style={styles.label}>Estado:</Text>
          <Picker
            selectedValue={estadoID}
            onValueChange={handleEstadoChange}
            style={styles.picker}
          >
            {EstadosProcesos.map((item) => (
              <Picker.Item
                key={item.ID}
                label={item.Nombre}
                value={item.ID}
              />
            ))}
          </Picker>
        </View>

        {/* Sections */}
        {renderSection(
          "Procesos comerciales",
          "funnel",
          busquedas.ProcesosComerciales,
          renderProcesoComercial
        )}
        {/* Add other sections similarly */}

        {(!busquedas.ProcesosComerciales ||
          busquedas.ProcesosComerciales.length === 0) &&
        (!busquedas.ContratosServicios || busquedas.ContratosServicios.length === 0) &&
        // ... other checks
        (
          <View style={styles.empty}>
            <Ionicons name="folder-open" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No hay resultados encontrados</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Contact Modal */}
      <Modal visible={showEditContact} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Contacto</Text>
            <TextInput
              style={styles.input}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Nombre del contacto"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEditContact(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleEditContact}
              >
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Client Modal - Placeholder */}
      <Modal visible={showEditClient} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Cliente</Text>
            <Text>Funcionalidad pendiente</Text>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowEditClient(false)}
            >
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  editButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  cardBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  cardBody: {
    marginBottom: 12,
  },
  field: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  fieldLabel: {
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  empty: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    color: COLORS.text,
  },
  saveText: {
    color: COLORS.white,
  },
});

export default ContactInfoScreen;