import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import ChatApiService from "../services/chatService";
import { useGlobal } from "../../../core/global";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";
import { COLORS } from "../../../core/theme";

const { width } = Dimensions.get("window");

const NewChat = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useGlobal();
  const [currentView, setCurrentView] = useState("contacts"); // 'contacts' or 'template'

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPhone, setManualPhone] = useState("");

  // Template/Chat State
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  // UI State for Template View
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [formData, setFormData] = useState({
    CuentaMensajeriaID: null,
    PlantillaComunicacionID: null,
    MensajeEnvio: "",
    Variables: [],
  });

  useEffect(() => {
    if (currentView === "contacts") {
      loadContacts();
    }
    loadCuentasMensajeria();

    navigation.setOptions({
      headerShown: false, // Use our custom header
    });
  }, [currentView, searchText, navigation, selectedContact]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const filtros = {
        Page: 1,
        Rows: 50,
        FullSearch: searchText,
        Token: user?.Token,
      };
      const response = await ChatApiService.consultarContactos(filtros);
      setContacts(response.data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "No se pudieron cargar los contactos");
    } finally {
      setLoadingContacts(false);
    }
  }, [searchText, user?.Token]);

  const loadCuentasMensajeria = async () => {
    try {
      const response = await ChatApiService.consultarCuentasMensajeria();
      if (response.rows) {
        setCuentas(response.rows);
      }
    } catch (error) {
      console.error("Error loading cuentas:", error);
    }
  };

  const loadPlantillas = async (cuentaID) => {
    if (!cuentaID) {
      setPlantillas([]);
      return;
    }
    try {
      const response =
        await ChatApiService.consultarPlantillasComunicacion(cuentaID);
      if (response.rows) {
        setPlantillas(response.rows);
      }
    } catch (error) {
      console.error("Error loading plantillas:", error);
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({
      ...prev,
      CuentaMensajeriaID: contact.CuentaMensajeriaID || null,
    }));
    if (contact.CuentaMensajeriaID) {
      loadPlantillas(contact.CuentaMensajeriaID);
    }
    setCurrentView("template");
  };

  const handleManualPhoneSubmit = () => {
    if (!manualPhone || manualPhone.trim() === "") {
      Alert.alert("Error", "Ingrese un número de celular");
      return;
    }
    const contact = {
      Telefono: manualPhone.trim(),
      Nombre: "Nuevo contacto",
    };
    setSelectedContact(contact);
    setFormData((prev) => ({
      ...prev,
      CuentaMensajeriaID: null,
    }));
    setShowManualInput(false);
    setManualPhone("");
    setCurrentView("template");
  };

  const handleCuentaChange = (cuentaID) => {
    setFormData((prev) => ({
      ...prev,
      CuentaMensajeriaID: cuentaID,
      PlantillaComunicacionID: null,
      MensajeEnvio: "",
      Variables: [],
    }));
    setPlantillaSeleccionada(null);
    loadPlantillas(cuentaID);
  };

  const extractVariablesFromTemplate = (texto) => {
    const regex = /(@\[[^\]]+\])/g;
    const coincidencias = new Set();
    let match;
    while ((match = regex.exec(texto)) !== null) {
      coincidencias.add(match[1]);
    }
    return Array.from(coincidencias).map((item) => ({
      Nombre: item,
      Valor: "",
    }));
  };

  const handlePlantillaSelect = async (plantilla) => {
    setTemplateModalVisible(false);
    setLoadingTemplate(true);
    const plantillaID = plantilla.PlantillaComunicacionID;
    try {
      const detalle = await ChatApiService.consultarPlantillaDetalle({
        PlantillaComunicacionID: plantillaID,
        Token: user?.Token,
      });
      const template = detalle.data?.Template || "";
      const variables = extractVariablesFromTemplate(template);
      setPlantillaSeleccionada({ ...detalle.data, Template: template });
      setFormData((prev) => ({
        ...prev,
        PlantillaComunicacionID: plantillaID,
        MensajeEnvio: template,
        Variables: variables,
      }));
    } catch (error) {
      console.error("Error loading plantilla detalle:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la plantilla");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleVariableChange = (index, value) => {
    const newVariables = [...formData.Variables];
    newVariables[index] = { ...newVariables[index], Valor: value };
    setFormData((prev) => ({
      ...prev,
      Variables: newVariables,
    }));
    updateMensajeConVariables(newVariables);
  };

  const updateMensajeConVariables = (variables) => {
    let mensaje = plantillaSeleccionada?.Template || "";
    variables.forEach((variable) => {
      if (variable.Valor && variable.Valor !== "") {
        const regex = new RegExp(
          variable.Nombre.replace(/[\[\]]/g, "\\$&"),
          "g",
        );
        mensaje = mensaje.replace(regex, variable.Valor);
      }
    });
    setFormData((prev) => ({
      ...prev,
      MensajeEnvio: mensaje,
    }));
  };

  const validateForm = () => {
    if (!formData.CuentaMensajeriaID) {
      Alert.alert("Error", "Debe seleccionar una cuenta de mensajería");
      return false;
    }
    if (!selectedContact?.Telefono) {
      Alert.alert("Error", "No hay número de celular disponible");
      return false;
    }
    if (!formData.PlantillaComunicacionID) {
      Alert.alert("Error", "Debe seleccionar una plantilla de comunicación");
      return false;
    }
    for (const variable of formData.Variables) {
      if (!variable.Valor || variable.Valor.trim() === "") {
        Alert.alert("Error", `La variable "${variable.Nombre}" es obligatoria`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const chatData = {
        CuentaMensajeriaID: formData.CuentaMensajeriaID,
        Telefono: selectedContact.Telefono,
        Nombre: selectedContact.Nombre,
        PlantillaComunicacionID: formData.PlantillaComunicacionID,
        Mensaje: formData.MensajeEnvio,
        Token: user?.Token,
      };
      await ChatApiService.iniciarNuevoChat(chatData);
      Alert.alert("Éxito", "Chat iniciado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating chat:", error);
      Alert.alert("Error", error.message || "No se pudo iniciar el chat");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER FUNCTIONS --- //

  const renderHeader = () => {
    const title =
      currentView === "contacts"
        ? "Nuevo chat"
        : selectedContact?.Nombre || "Nuevo contacto";
    const subtitle =
      currentView === "contacts"
        ? "Selecciona un contacto"
        : selectedContact?.Telefono;

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
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (currentView === "template") {
                    setCurrentView("contacts");
                    setSelectedContact(null);
                    setFormData({
                      CuentaMensajeriaID: null,
                      PlantillaComunicacionID: null,
                      MensajeEnvio: "",
                      Variables: [],
                    });
                    setPlantillas([]);
                    setPlantillaSeleccionada(null);
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            </View>
            {currentView === "contacts" && (
              <TouchableOpacity
                style={styles.headerRightButton}
                onPress={() => setShowManualInput(!showManualInput)}
              >
                <Ionicons
                  name={showManualInput ? "close" : "person-add"}
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  const renderTemplateModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={templateModalVisible}
      onRequestClose={() => setTemplateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plantillas disponibles</Text>
            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
              <Ionicons
                name="close-circle"
                size={28}
                color={COLORS.lightGray}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={plantillas}
            keyExtractor={(item) => item.PlantillaComunicacionID?.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateItem}
                onPress={() => handlePlantillaSelect(item)}
              >
                <View style={styles.templateIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{item.Nombre}</Text>
                  <Text style={styles.templatePreview} numberOfLines={1}>
                    Toque para seleccionar esta plantilla
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.lightGray}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={COLORS.lightGray}
                />
                <Text style={styles.emptyText}>
                  No hay plantillas disponibles
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => handleContactSelect(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.contactAvatar}
      >
        <Text style={styles.avatarText}>
          {item.Nombre?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </LinearGradient>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.Nombre}
        </Text>
        <Text style={styles.contactPhone}>{item.Telefono}</Text>
        <View style={styles.accountTag}>
          <Ionicons
            name="chatbubble-outline"
            size={12}
            color={COLORS.secondary}
          />
          <Text style={styles.contactAccount}>
            {item.Cuenta || "Sin cuenta"}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.lightGray} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search-outline" size={64} color={COLORS.lightGray} />
      </View>
      <Text style={styles.emptyTitle}>Sin resultados</Text>
      <Text style={styles.emptyText}>
        No encontramos contactos que coincidan con tu búsqueda
      </Text>
    </View>
  );

  if (currentView === "contacts") {
    return (
      <View style={styles.container}>
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
        />
        {renderHeader()}

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={COLORS.secondary} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar contactos..."
              placeholderTextColor={COLORS.lightGray}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.lightGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showManualInput && (
          <View style={styles.manualInputSection}>
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Número manual</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={COLORS.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Ej: 3001234567"
                  value={manualPhone}
                  onChangeText={setManualPhone}
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>
              <View style={styles.manualButtons}>
                <TouchableOpacity
                  style={[styles.manualButton, styles.cancelBtn]}
                  onPress={() => {
                    setShowManualInput(false);
                    setManualPhone("");
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualButton, styles.addBtn]}
                  onPress={handleManualPhoneSubmit}
                >
                  <Text style={styles.addBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {loadingContacts && !contacts.length ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item, index) =>
              item.CuentaMensajeriaContactoID?.toString() || index.toString()
            }
            style={styles.contactsList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    );
  }

  // --- TEMPLATE VIEW ---
  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Account Selection */}
          <View style={styles.card}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons
                name="business-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.sectionLabel}>Cuenta de envío</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.CuentaMensajeriaID}
                onValueChange={handleCuentaChange}
                style={styles.picker}
              >
                <Picker.Item
                  label="Seleccionar cuenta..."
                  value={null}
                  color={COLORS.lightGray}
                />
                {cuentas.map((cuenta) => (
                  <Picker.Item
                    key={cuenta.CuentaMensajeriaID}
                    label={cuenta.Nombre}
                    value={cuenta.CuentaMensajeriaID}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* 2. Template Selection */}
          <View style={styles.card}>
            <View style={styles.cardHeaderSmall}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.sectionLabel}>Plantilla</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                !formData.CuentaMensajeriaID && styles.disabled,
              ]}
              onPress={() =>
                formData.CuentaMensajeriaID &&
                !loadingTemplate &&
                setTemplateModalVisible(true)
              }
              disabled={!formData.CuentaMensajeriaID || loadingTemplate}
            >
              {loadingTemplate ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.selectorText}>Cargando plantilla...</Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.selectorText,
                      !plantillaSeleccionada && styles.placeholder,
                    ]}
                  >
                    {plantillaSeleccionada
                      ? plantillaSeleccionada.Nombre
                      : "Toca para seleccionar..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Message Preview */}
          {formData.MensajeEnvio ? (
            <View style={styles.bubbleWrapper}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{formData.MensajeEnvio}</Text>
                <View style={styles.bubbleFooter}>
                  <Text style={styles.bubbleTime}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Ionicons
                    name="checkmark-done"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderBubble}>
              <Text style={styles.placeholderTextCenter}>
                La vista previa del mensaje aparecerá aquí al seleccionar una
                plantilla.
              </Text>
            </View>
          )}

          {/* 4. Variables */}
          {formData.Variables.length > 0 && (
            <View style={styles.variablesCard}>
              <Text style={styles.variablesTitle}>Completar información</Text>
              {formData.Variables.map((variable, index) => (
                <View key={index} style={styles.varRow}>
                  <Text style={styles.varLabel}>
                    {variable.Nombre.replace(/[@\[\]]/g, "")}
                  </Text>
                  <TextInput
                    style={styles.varInput}
                    placeholder="Escribe el valor aquí..."
                    value={variable.Valor}
                    onChangeText={(text) => handleVariableChange(index, text)}
                    placeholderTextColor={COLORS.lightGray}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.fabWrapper}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !formData.MensajeEnvio}
            style={styles.fabShadow}
          >
            <LinearGradient
              colors={
                loading || !formData.MensajeEnvio
                  ? [COLORS.lightGray, COLORS.gray]
                  : [COLORS.primary, COLORS.highlight]
              }
              style={styles.fab}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Feather name="send" size={24} color="#FFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {renderTemplateModal()}
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
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  titleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
  },
  headerRightButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchSection: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },

  // Manual Input
  manualInputSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  manualCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  manualInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  manualButtons: {
    flexDirection: "row",
    gap: 12,
  },
  manualButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: {
    color: COLORS.gray,
    fontWeight: "600",
  },
  addBtn: {
    backgroundColor: COLORS.primary,
  },
  addBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },

  // List
  contactsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  accountTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactAccount: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: "600",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(51, 122, 183, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Template View
  chatContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  selectorText: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  placeholder: {
    color: COLORS.lightGray,
  },
  disabled: {
    opacity: 0.5,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Bubble
  bubbleWrapper: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  bubble: {
    backgroundColor: COLORS.highlight,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.dark,
    lineHeight: 20,
  },
  bubbleFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  bubbleTime: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
  },
  placeholderBubble: {
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  placeholderTextCenter: {
    color: COLORS.gray,
    textAlign: "center",
    fontSize: 13,
    fontStyle: "italic",
  },

  // Variables
  variablesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  variablesTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 20,
  },
  varRow: {
    marginBottom: 16,
  },
  varLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  varInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 15,
    color: COLORS.dark,
  },

  // FAB
  fabWrapper: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  fabShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 2,
  },
  templatePreview: {
    fontSize: 12,
    color: COLORS.gray,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 14,
  },
});

export default NewChat;
