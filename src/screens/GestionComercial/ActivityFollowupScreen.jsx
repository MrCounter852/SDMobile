import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerComponent from "@react-native-community/datetimepicker";
import { useGlobal } from "../../core/global";

const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;

const Tab = createMaterialTopTabNavigator();

const COLORS = {
  primary: "#337ab7",
  secondary: "#88E782",
  background: "#F3F4F6",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F9FAFB",
  focus: "#337ab7",
  white: "#FFFFFF",
  danger: "#DC2626",
  success: "#10B981",
  warning: "#F59E0B",
};

// --- Helper Components ---

const CustomInput = ({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  icon,
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
    <View
      style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.textSecondary}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value ? String(value) : ""}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const CustomPicker = ({
  label,
  required,
  selectedValue,
  onValueChange,
  items = [],
  placeholder,
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
        dropdownIconColor={COLORS.textSecondary}
      >
        <Picker.Item
          label={placeholder || "Seleccione"}
          value=""
          color={COLORS.textSecondary}
          style={{ fontSize: 14 }}
        />
        {items.map((item, index) => (
          <Picker.Item
            key={item.id || item.value || index}
            label={
              item.label ||
              item.Nombre ||
              item.NombreCompleto ||
              item.Descripcion ||
              String(item)
            }
            value={
              item.value ||
              item.id ||
              item.TipoCalendarioActividadID ||
              item.UsuarioID ||
              item.ComplejoID ||
              item.CausalInviabilidadID ||
              item
            }
            color={COLORS.text}
            style={{ fontSize: 14 }}
          />
        ))}
      </Picker>
    </View>
  </View>
);

const DateTimePicker = ({ label, required, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("date");

  const handlePress = () => {
    setMode("date");
    setShow(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShow(false);
      return;
    }

    const currentDate = selectedDate || new Date();

    if (Platform.OS === "android" && mode === "date") {
      setShow(false); // Hide date picker before showing time picker
      setTimeout(() => {
        setMode("time");
        setShow(true);
      }, 100);
    } else {
      setShow(Platform.OS === "ios");

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const hours = String(currentDate.getHours()).padStart(2, "0");
      const minutes = String(currentDate.getMinutes()).padStart(2, "0");

      const formattedValue = `${year}-${month}-${day} ${hours}:${minutes}`;
      onChange(formattedValue);
    }
  };

  // Create a Date object from the string value for the picker
  const getPickerDate = () => {
    if (!value) return new Date();
    try {
      // Assuming value is "YYYY-MM-DD HH:MM"
      const [datePart, timePart] = value.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
      return new Date();
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity style={styles.datePickerWrapper} onPress={handlePress}>
        <Text style={[styles.input, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {show && (
        <DateTimePickerComponent
          value={getPickerDate()}
          mode={mode}
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

// --- Sub-components ---

const ContactInfoHeader = ({ contact }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.contextHeader}>
      <View style={styles.contextRow}>
        <View style={styles.contextMain}>
          <Text style={styles.contextLabel}>Contacto:</Text>
          <Text style={styles.contextValue}>
            {contact.NombreCompleto || contact.Nombres}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoToggleButton}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Ionicons
            name={showInfo ? "chevron-up" : "information-circle-outline"}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contextRow}>
        <View style={styles.contextMain}>
          <Text style={styles.contextLabel}>Celular:</Text>
          <Text style={styles.contextValue}>{contact.Celular || "N/A"}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => Linking.openURL(`tel:${contact.Celular}`)}
          >
            <Ionicons name="call" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() =>
              Linking.openURL(`whatsapp://send?phone=${contact.Celular}`)
            }
          >
            <Ionicons name="logo-whatsapp" size={18} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      </View>

      {showInfo && (
        <View style={styles.extraInfoContainer}>
          <View style={styles.infoLine}>
            <Ionicons
              name="person-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              Asesor:{" "}
              {contact.AsesorNombreCompleto || contact.Asesor || "No asignado"}
            </Text>
          </View>
          {contact.Email && (
            <View style={styles.infoLine}>
              <Ionicons
                name="mail-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>Email: {contact.Email}</Text>
            </View>
          )}
          {contact.Fecha && (
            <View style={styles.infoLine}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>
                Registro: {new Date(contact.Fecha).toLocaleDateString()}
              </Text>
            </View>
          )}
          {contact.Observaciones && (
            <View style={styles.infoLine}>
              <Ionicons
                name="chatbox-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>Obs: {contact.Observaciones}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const InviableAlert = ({ contact }) => {
  if (contact.EstadoProcesoID !== 7) return null;
  return (
    <View style={styles.inviableAlert}>
      <View style={styles.alertHeader}>
        <Ionicons name="warning" size={20} color={COLORS.danger} />
        <Text style={styles.alertTitle}>Contacto Inviable</Text>
      </View>
      <Text style={styles.alertText}>
        <Text style={styles.boldLabel}>Causa: </Text>
        {contact.CausalInviabilidadNombre}
      </Text>
      {contact.FechaInviabilidad && (
        <Text style={styles.alertText}>
          <Text style={styles.boldLabel}>Fecha: </Text>
          {new Date(contact.FechaInviabilidad).toLocaleDateString()}
        </Text>
      )}
      {contact.ObservacionesInviabilidad && (
        <Text style={styles.alertText}>
          <Text style={styles.boldLabel}>Obs: </Text>
          {contact.ObservacionesInviabilidad}
        </Text>
      )}
    </View>
  );
};

const ActivityForm = ({ contact, onRefresh }) => {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [activityTypes, setActivityTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [complejos, setComplejos] = useState([]);

  const [showInmuebleSelector, setShowInmuebleSelector] = useState(false);
  const [showVisitanteFields, setShowVisitanteFields] = useState(false);
  const [showComplejoSelector, setShowComplejoSelector] = useState(false);

  const [form, setForm] = useState({
    TipoCalendarioActividadID: "",
    Asunto: "",
    FechaInicio: "",
    FechaVencimiento: "",
    Descripcion: "",
    UsuarioID: user?.UsuarioID || "",
    Contacto: contact?.NombreCompleto || "",
    Celular: contact?.Celular || "",
    Email: contact?.Email || "",
    Link: "",
    VisitanteDocumento: "",
    VisitanteNombreCompleto: "",
    ComplejoID: "",
    InmuebleID: "",
    AsignarProceso: false,
    Notificacion: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [typesResp, usersResp, complejosResp] = await Promise.all([
        GestionComercialService.consultarTiposCalendarioActividades(),
        GestionComercialService.consultarAsesores(),
        GestionComercialService.consultarComplejos(),
      ]);
      setActivityTypes(typesResp.rows || []);
      setUsers(usersResp.rows || []);
      setComplejos(complejosResp.rows || []);
    } catch (error) {
      console.error("Error loading activity data:", error);
    }
  };

  useEffect(() => {
    const isVisitType =
      contact.OrigenPreContactoID === 1 || contact.OrigenPreContactoID === 6;
    const isPropertyType = form.TipoCalendarioActividadID === 3;

    setShowVisitanteFields(isVisitType);
    setShowComplejoSelector(isVisitType);
    setShowInmuebleSelector(isPropertyType);
  }, [form.TipoCalendarioActividadID, contact.OrigenPreContactoID]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !form.TipoCalendarioActividadID ||
      !form.Asunto ||
      !form.FechaInicio ||
      !form.FechaVencimiento
    ) {
      Alert.alert("Error", "Por favor complete los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        CalendarioActividadOrigenID: 2,
        CodigoOrigen: contact.ProcesoID,
        Token: user?.Token,
      };
      await GestionComercialService.insertarActividadCalendario(payload);
      Alert.alert("Éxito", "Actividad guardada correctamente");
      setForm({
        ...form,
        TipoCalendarioActividadID: "",
        Asunto: "",
        FechaInicio: "",
        FechaVencimiento: "",
        Descripcion: "",
        Link: "",
        VisitanteDocumento: "",
        VisitanteNombreCompleto: "",
        ComplejoID: "",
        InmuebleID: "",
        AsignarProceso: false,
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving activity:", error);
      Alert.alert("Error", "No se pudo guardar la actividad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formSectionContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la actividad</Text>
        <CustomPicker
          label="Tipo de actividad"
          required
          selectedValue={form.TipoCalendarioActividadID}
          onValueChange={(v) => updateForm("TipoCalendarioActividadID", v)}
          items={activityTypes.map((t) => ({
            label: t.Nombre,
            value: t.TipoCalendarioActividadID,
          }))}
        />
        <CustomInput
          label="Asunto"
          required
          value={form.Asunto}
          onChangeText={(v) => updateForm("Asunto", v)}
          placeholder="Ingrese un asunto descriptivo"
        />
        <DateTimePicker
          label="Fecha Inicio"
          required
          value={form.FechaInicio}
          onChange={(v) => updateForm("FechaInicio", v)}
          placeholder="YYYY-MM-DD HH:MM"
        />
        <DateTimePicker
          label="Fecha Vencimiento"
          required
          value={form.FechaVencimiento}
          onChange={(v) => updateForm("FechaVencimiento", v)}
          placeholder="YYYY-MM-DD HH:MM"
        />
        <CustomInput
          label="Descripción"
          value={form.Descripcion}
          onChangeText={(v) => updateForm("Descripcion", v)}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguimiento y Registro</Text>
        <CustomPicker
          label="Responsable"
          required
          selectedValue={form.UsuarioID}
          onValueChange={(v) => updateForm("UsuarioID", v)}
          items={users.map((u) => ({
            label: u.NombreCompleto,
            value: u.UsuarioID,
          }))}
        />
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkboxWrapper}
            onPress={() => updateForm("AsignarProceso", !form.AsignarProceso)}
          >
            <Ionicons
              name={form.AsignarProceso ? "checkbox" : "square-outline"}
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.checkboxLabel}>
              Asignar proceso al responsable
            </Text>
          </TouchableOpacity>
        </View>
        <CustomInput
          label="Email Invitados"
          value={form.Email}
          onChangeText={(v) => updateForm("Email", v)}
          placeholder="correos separados por ;"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atributos ERP Web</Text>
        {showVisitanteFields && (
          <>
            <CustomInput
              label="Documento Visitante"
              value={form.VisitanteDocumento}
              onChangeText={(v) => updateForm("VisitanteDocumento", v)}
              keyboardType="numeric"
            />
            <CustomInput
              label="Nombre Visitante"
              value={form.VisitanteNombreCompleto}
              onChangeText={(v) => updateForm("VisitanteNombreCompleto", v)}
            />
          </>
        )}
        {showComplejoSelector && (
          <CustomPicker
            label="Complejo"
            selectedValue={form.ComplejoID}
            onValueChange={(v) => updateForm("ComplejoID", v)}
            items={complejos.map((c) => ({
              label: c.Nombre,
              value: c.ComplejoID,
            }))}
          />
        )}
        {showInmuebleSelector && (
          <CustomInput
            label="ID Inmueble"
            value={form.InmuebleID}
            onChangeText={(v) => updateForm("InmuebleID", v)}
          />
        )}
        <CustomInput
          label="Link Reunión"
          value={form.Link}
          onChangeText={(v) => updateForm("Link", v)}
          placeholder="Zoom, Table, etc."
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={["#337ab7", "#00ACC4"]}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Actividad</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FollowupForm = ({ contact, onRefresh }) => {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  const handleSave = async () => {
    if (!observaciones.trim()) {
      Alert.alert("Error", "Ingrese las observaciones");
      return;
    }

    setLoading(true);
    try {
      await GestionComercialService.insertarSeguimiento({
        OrigenID: contact.ProcesoID,
        OrigenSeguimientoID: "CRM-PRO",
        Comentario: observaciones,
        Token: user?.Token,
      });
      Alert.alert("Éxito", "Seguimiento guardado");
      setObservaciones("");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving followup:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formSectionContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuevo Seguimiento</Text>
        <CustomInput
          label="Observaciones"
          required
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          placeholder="¿Qué novedades hay con este contacto?"
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={["#337ab7", "#00ACC4"]}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Seguimiento</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FollowupList = ({ contact, refreshKey }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [refreshKey]);

  const load = async () => {
    try {
      const resp = await GestionComercialService.consultarSeguimientos({
        OrigenID: contact.ProcesoID,
        OrigenSeguimientoID: "CRM-PRO",
      });
      setItems(resp.rows || (Array.isArray(resp) ? resp : []));
    } catch (e) {
      console.error("FollowupList - Error loading:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
    );

  return (
    <View style={styles.listSectionContainer}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No hay seguimientos registrados.</Text>
      ) : (
        items.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.listItemDate}>
                {item.FechaRegistroAmigable ||
                  new Date(item.FechaRegistro).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.listItemContent}>{item.Comentario}</Text>
            <Text style={styles.listItemUser}>Por: {item.NombreCompleto}</Text>
          </View>
        ))
      )}
    </View>
  );
};

const ActivityList = ({ contact, refreshKey }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [refreshKey]);

  const load = async () => {
    try {
      const resp = await GestionComercialService.consultarActividadesCalendario(
        {
          CalendarioActividadOrigenID: 2,
          CodigoOrigen: contact.ProcesoID,
        }
      );
      setItems(resp.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
    );

  return (
    <View style={styles.listSectionContainer}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No hay actividades registradas.</Text>
      ) : (
        items.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Ionicons
                name={item.Completada ? "checkmark-circle" : "calendar-outline"}
                size={20}
                color={item.Completada ? COLORS.success : COLORS.primary}
              />
              <Text style={styles.listItemTitle}>{item.Asunto}</Text>
            </View>
            <Text style={styles.listItemContent}>{item.Descripcion}</Text>
            <View style={styles.activityStats}>
              <Text style={styles.detailText}>
                Inicio: {new Date(item.FechaInicio).toLocaleDateString()}
              </Text>
              <Text style={styles.detailText}>
                Vence: {new Date(item.FechaVencimiento).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

// --- Main Screen ---

const ActivityFollowupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contact } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Actividades y seguimientos",
      headerTitleStyle: { fontSize: 18, fontWeight: "bold" },
      headerTintColor: "#337ab7",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 16, marginLeft: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (!contact) return null;

  const FollowupsTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
      <ScrollView style={styles.tabContainer}>
        <FollowupForm
          contact={contact}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <View style={styles.tabSeparator} />
        <FollowupList contact={contact} refreshKey={refreshKey} />
      </ScrollView>
    );
  };

  const ActivitiesTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
      <ScrollView style={styles.tabContainer}>
        <ActivityForm
          contact={contact}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <View style={styles.tabSeparator} />
        <ActivityList contact={contact} refreshKey={refreshKey} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ContactInfoHeader contact={contact} />
      <InviableAlert contact={contact} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: COLORS.primary,
            tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
            tabBarStyle: { elevation: 0, shadowOpacity: 0 },
            tabBarIndicatorStyle: { backgroundColor: COLORS.primary },
          }}
        >
          <Tab.Screen name="Seguimientos" component={FollowupsTab} />
          <Tab.Screen name="Actividades" component={ActivitiesTab} />
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contextHeader: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contextMain: { flex: 1 },
  contextLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  contextValue: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  infoToggleButton: { padding: 4 },
  actionButtons: { flexDirection: "row" },
  actionIcon: { marginLeft: 16, padding: 4 },
  extraInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
  },
  infoLine: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 8 },
  inviableAlert: {
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.danger,
    marginLeft: 8,
  },
  alertText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  boldLabel: { fontWeight: "700", color: COLORS.text },
  tabContainer: { flex: 1 },
  formSectionContainer: { padding: 16 },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputContainer: { marginBottom: 14 },
  labelContainer: { flexDirection: "row", marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  required: { color: COLORS.danger, marginLeft: 2 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 45,
  },
  inputWrapperMultiline: {
    height: 80,
    alignItems: "flex-start",
    paddingTop: 8,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.text },
  inputMultiline: { textAlignVertical: "top" },
  inputIcon: { marginRight: 8 },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 45,
    justifyContent: "center",
  },
  picker: { width: "100%", color: COLORS.text },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 45,
  },
  placeholderText: { color: COLORS.textSecondary },
  checkboxContainer: { marginBottom: 14 },
  checkboxWrapper: { flexDirection: "row", alignItems: "center" },
  checkboxLabel: { marginLeft: 8, fontSize: 14, color: COLORS.textSecondary },
  buttonContainer: { marginTop: 8 },
  saveButton: { paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  saveButtonDisabled: { opacity: 0.5 },
  listSectionContainer: { padding: 16 },
  listItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 8,
  },
  listItemDate: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
  listItemContent: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  listItemUser: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  detailText: { fontSize: 11, color: COLORS.textSecondary },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 32,
  },
  tabSeparator: { height: 8, backgroundColor: COLORS.background },
});

export default ActivityFollowupScreen;
