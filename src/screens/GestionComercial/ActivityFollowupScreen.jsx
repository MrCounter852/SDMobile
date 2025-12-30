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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { useGlobal } from "../../core/global";
import { Line } from "react-native-svg";
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
};

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
          size={20}
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
              item
            }
            value={
              item.id ||
              item.value ||
              item.TipoCalendarioActividadID ||
              item.UsuarioID ||
              item.CalendarioActividadCierreDetalleID ||
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

const DateTimePicker = ({
  label,
  required,
  value,
  onChange,
  placeholder,
  mode = "datetime",
}) => {
  const [show, setShow] = useState(false);

  const handlePress = () => {
    // For now, just show a placeholder - would need a proper date picker
    Alert.alert(
      "Date Picker",
      "Date picker functionality would be implemented here"
    );
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
        <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

// Activity Form Component
const ActivityForm = ({ contact }) => {
  const navigation = useNavigation();
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [activityTypes, setActivityTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [closureTypes, setClosureTypes] = useState([]);

  const [form, setForm] = useState({
    TipoCalendarioActividadID: "",
    Asunto: "",
    FechaInicio: "",
    FechaVencimiento: "",
    Descripcion: "",
    UsuarioID: user?.UsuarioID || "",
    Contacto: contact?.NombreCompleto || "",
    Cliente: "",
    Celular: contact?.Celular || "",
    Email: contact?.Email || "",
    Direccion: "",
    Telefono: "",
    Link: "",
    Entregable: false,
    Notificacion: true,
    ObservacionesCierre: "",
    CalendarioActividadCierreDetalleID: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [typesResp, usersResp, closureResp] = await Promise.all([
        GestionComercialService.consultarTiposCalendarioActividades(),
        GestionComercialService.consultarAsesores(),
        GestionComercialService.consultarCalendariosActividadesCierresDetalles(),
      ]);
      setActivityTypes(typesResp.rows || []);
      setUsers(usersResp.rows || []);
      setClosureTypes(closureResp.rows || []);
    } catch (error) {
      console.error("Error loading activity data:", error);
    }
  };

  const handleSave = async () => {
    if (
      !form.TipoCalendarioActividadID ||
      !form.Asunto ||
      !form.FechaInicio ||
      !form.FechaVencimiento
    ) {
      Alert.alert("Error", "Por favor complete todos los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        CalendarioActividadOrigenID: 2, // Pre-contactos
        CodigoOrigen: contact.ProcesoID,
        DirIP: user.Ip,
        Usuario: user.UsuarioID,
        Token: user.Token,
      };

      const response =
        await GestionComercialService.insertarActividadCalendario(payload);
      Alert.alert(
        "Éxito",
        response.rows[0]?.Descripcion || "Actividad guardada correctamente",
        [{
          text: "OK", onPress: () => {
            setForm({
              TipoCalendarioActividadID: "",
              Asunto: "",
              FechaInicio: "",
              FechaVencimiento: "",
              Descripcion: "",
              UsuarioID: user?.UsuarioID || "",
              Contacto: contact?.NombreCompleto || "",
              Cliente: "",
              Celular: contact?.Celular || "",
              Email: contact?.Email || "",
              Direccion: "",
              Telefono: "",
              Link: "",
              Entregable: false,
              Notificacion: true,
              ObservacionesCierre: "",
              CalendarioActividadCierreDetalleID: "",
            });
            if (onRefresh) onRefresh();
          }
        }]
      );
    } catch (error) {
      console.error("Error saving activity:", error);
      Alert.alert("Error", "No se pudo guardar la actividad");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.formSectionContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la actividad</Text>

        <CustomPicker
          label="Tipo de actividad"
          required
          selectedValue={form.TipoCalendarioActividadID}
          onValueChange={(value) =>
            updateForm("TipoCalendarioActividadID", value)
          }
          items={activityTypes}
          placeholder="Seleccione tipo de actividad"
        />

        <CustomInput
          label="Asunto"
          required
          value={form.Asunto}
          onChangeText={(value) => updateForm("Asunto", value)}
          placeholder="Ingrese el asunto de la actividad"
          icon="document-text"
        />

        <DateTimePicker
          label="Fecha de inicio"
          required
          value={form.FechaInicio}
          onChange={(value) => updateForm("FechaInicio", value)}
          placeholder="Seleccione fecha de inicio"
        />

        <DateTimePicker
          label="Fecha de vencimiento"
          required
          value={form.FechaVencimiento}
          onChange={(value) => updateForm("FechaVencimiento", value)}
          placeholder="Seleccione fecha de vencimiento"
        />

        <CustomInput
          label="Descripción"
          value={form.Descripcion}
          onChangeText={(value) => updateForm("Descripcion", value)}
          placeholder="Ingrese descripción detallada"
          multiline
          icon="information-circle"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignación</Text>

        <CustomPicker
          label="Usuario asignado"
          selectedValue={form.UsuarioID}
          onValueChange={(value) => updateForm("UsuarioID", value)}
          items={users}
          placeholder="Seleccione usuario"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de contacto</Text>

        <CustomInput
          label="Contacto"
          value={form.Contacto}
          onChangeText={(value) => updateForm("Contacto", value)}
          placeholder="Nombre del contacto"
          icon="person"
        />

        <CustomInput
          label="Cliente"
          value={form.Cliente}
          onChangeText={(value) => updateForm("Cliente", value)}
          placeholder="Nombre del cliente"
          icon="business"
        />

        <CustomInput
          label="Celular"
          value={form.Celular}
          onChangeText={(value) => updateForm("Celular", value)}
          placeholder="Número de celular"
          keyboardType="phone-pad"
          icon="call"
        />

        <CustomInput
          label="Email"
          value={form.Email}
          onChangeText={(value) => updateForm("Email", value)}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          icon="mail"
        />

        <CustomInput
          label="Dirección"
          value={form.Direccion}
          onChangeText={(value) => updateForm("Direccion", value)}
          placeholder="Dirección"
          icon="location"
        />

        <CustomInput
          label="Teléfono"
          value={form.Telefono}
          onChangeText={(value) => updateForm("Telefono", value)}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          icon="call"
        />

        <CustomInput
          label="Link de reuniones"
          value={form.Link}
          onChangeText={(value) => updateForm("Link", value)}
          placeholder="Link de zoom o meet"
          icon="link"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={["#337ab7", "#00ACC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar actividad</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Followup Form Component
const FollowupForm = ({ contact, onRefresh }) => {
  const navigation = useNavigation();
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    Observaciones: "",
  });

  const handleSave = async () => {
    if (!form.Observaciones.trim()) {
      Alert.alert(
        "Error",
        "Por favor ingrese las observaciones del seguimiento"
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        OrigenID: contact.ProcesoID,
        OrigenSeguimientoID: "CRM-PRO",
        Observaciones: form.Observaciones,
        DirIP: user.Ip,
        Usuario: user.UsuarioID,
        Token: user.Token,
      };

      const response = await GestionComercialService.insertarSeguimiento(
        payload
      );
      Alert.alert(
        "Éxito",
        response.rows[0]?.Descripcion || "Seguimiento guardado correctamente",
        [{
          text: "OK", onPress: () => {
            setForm({ Observaciones: "" }); // Clear form
            if (onRefresh) onRefresh(); // Refresh the list
          }
        }]
      );
    } catch (error) {
      console.error("Error saving followup:", error);
      Alert.alert("Error", "No se pudo guardar el seguimiento");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.formSectionContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuevo seguimiento</Text>

        <CustomInput
          label="Observaciones"
          required
          value={form.Observaciones}
          onChangeText={(value) => updateForm("Observaciones", value)}
          placeholder="Ingrese las observaciones del seguimiento"
          multiline
          icon="document-text"
        />

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            Este seguimiento se asociará al contacto: {contact?.NombreCompleto}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={["#337ab7", "#00ACC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar seguimiento</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Followup List Component
const FollowupList = ({ contact, refreshKey }) => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowups();
  }, [refreshKey]);

  const loadFollowups = async () => {
    try {
      const response = await GestionComercialService.consultarSeguimientos({
        OrigenID: contact.ProcesoID,
        OrigenSeguimientoID: "CRM-PRO",
      });
      setFollowups(response.rows || []);
    } catch (error) {
      console.error("Error loading followups:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
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

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando seguimientos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listSectionContainer}>
      {followups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay seguimientos registrados</Text>
        </View>
      ) : (
        followups.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Ionicons name="document-text" size={20} color={COLORS.primary} />
              <Text style={styles.listItemDate}>{formatDate(item.FechaRegistro)}</Text>
            </View>
            <Text style={styles.listItemContent}>{item.Observaciones}</Text>
            {item.RegistroUsuario && (
              <Text style={styles.listItemUser}>Por: {item.RegistroUsuario}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
};

// Activity List Component
const ActivityList = ({ contact, onRefresh, refreshKey }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [refreshKey]);

  const loadActivities = async () => {
    try {
      const response = await GestionComercialService.consultarActividadesCalendario({
        CalendarioActividadOrigenID: 2,
        CodigoOrigen: contact.ProcesoID,
      });
      setActivities(response.rows || []);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeActivity = (activity) => {
    Alert.alert(
      "Finalizar actividad",
      `¿Desea finalizar la actividad "${activity.Asunto}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () => finalizeActivity(activity)
        }
      ]
    );
  };

  const finalizeActivity = async (activity) => {
    try {
      const response = await GestionComercialService.cerrarActividadCalendario({
        CalendarioActividadID: activity.CalendarioActividadID,
        ObservacionesCierre: "Finalizada desde móvil",
        DirIP: "mobile",
        Usuario: activity.UsuarioID,
        Token: activity.Token,
      });
      Alert.alert("Éxito", "Actividad finalizada correctamente");
      loadActivities(); // Reload activities
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error finalizing activity:", error);
      Alert.alert("Error", "No se pudo finalizar la actividad");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
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

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando actividades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listSectionContainer}>
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay actividades registradas</Text>
        </View>
      ) : (
        activities.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Ionicons
                name={item.Completada ? "checkmark-circle" : "calendar"}
                size={20}
                color={item.Completada ? COLORS.success : COLORS.primary}
              />
              <Text style={styles.listItemTitle}>{item.Asunto}</Text>
              {!item.Completada && (
                <TouchableOpacity
                  style={styles.finalizeButton}
                  onPress={() => handleFinalizeActivity(item)}
                >
                  <Text style={styles.finalizeButtonText}>Finalizar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.listItemContent}>{item.Descripcion}</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.detailText}>
                Inicio: {formatDate(item.FechaInicio)}
              </Text>
              <Text style={styles.detailText}>
                Fin: {formatDate(item.FechaVencimiento)}
              </Text>
            </View>
            {item.Email && (
              <Text style={styles.detailText}>Email: {item.Email}</Text>
            )}
            {item.Link && (
              <Text style={styles.detailText}>Link: {item.Link}</Text>
            )}
            {item.Completada && item.ObservacionesCierre && (
              <View style={styles.closureNotes}>
                <Text style={styles.closureTitle}>Observaciones de cierre:</Text>
                <Text style={styles.closureText}>{item.ObservacionesCierre}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

const ActivityFollowupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contact } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{ color: "#337ab7", fontSize: 18, fontWeight: "bold" }}>
          Actividades y seguimientos
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
  }, [navigation]);

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>
            No se encontró información del contacto
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const FollowupsTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    return (
      <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
        <FollowupForm contact={contact} onRefresh={handleRefresh} />
        <View style={styles.tabSeparator} />
        <FollowupList contact={contact} refreshKey={refreshKey} />
      </ScrollView>
    );
  };

  const ActivitiesTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    return (
      <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
        <ActivityForm contact={contact} onRefresh={handleRefresh} />
        <View style={styles.tabSeparator} />
        <ActivityList contact={contact} refreshKey={refreshKey} onRefresh={handleRefresh} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#337ab7",
            tabBarInactiveTintColor: "#666",
            tabBarIndicatorStyle: { backgroundColor: "#337ab7" },
            tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
            tabBarStyle: { backgroundColor: "#fff" },
          }}
        >
          <Tab.Screen
            name="SeguimientosTab"
            component={FollowupsTab}
            options={{
              tabBarLabel: "Seguimientos",
            }}
          />
          <Tab.Screen
            name="ActividadesTab"
            component={ActivitiesTab}
            options={{
              tabBarLabel: "Actividades",
            }}
          />
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabContainer: {
    flex: 1,
  },
  formSectionContainer: {
    padding: 20,
  },
  listSectionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  required: {
    color: COLORS.danger,
    marginLeft: 2,
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: "100%",
  },
  inputMultiline: {
    textAlignVertical: "top",
  },
  inputIcon: {
    marginRight: 10,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    height: 50,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: COLORS.text,
  },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  listItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },
  listItemDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  listItemContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  listItemUser: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  activityDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  finalizeButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  finalizeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  closureNotes: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  closureTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  closureText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
});

export default ActivityFollowupScreen;
