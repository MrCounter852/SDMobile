import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerComponent from "@react-native-community/datetimepicker";
import { useGlobal } from "../../../core/global";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";
import PropertySelectionModal from "../../../components/PropertySelectionModal";

const GestionComercialService = require("../services/crmService").default;

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");
import { COLORS } from "../../../core/theme";

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
          color={COLORS.secondary}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value ? String(value) : ""}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGray}
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
        dropdownIconColor={COLORS.dark}
      >
        <Picker.Item
          label={placeholder || "Seleccione"}
          value=""
          color={COLORS.lightGray}
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
            color={COLORS.dark}
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
      setShow(false);
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

  const getPickerDate = () => {
    if (!value) return new Date();
    try {
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
        <Text style={[styles.dateInput, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={COLORS.secondary} />
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

const ContactInfoHeader = ({ contact }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.contextCard}>
      <View style={styles.contextSummary}>
        <View style={styles.contextAvatar}>
          <Text style={styles.avatarText}>
            {contact.NombreCompleto?.charAt(0) ||
              contact.Nombres?.charAt(0) ||
              "C"}
          </Text>
        </View>
        <View style={styles.contextMain}>
          <Text style={styles.contextLabel}>Contacto Asociado</Text>
          <Text style={styles.contextValue} numberOfLines={1}>
            {contact.NombreCompleto || contact.Nombres}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoToggleButton}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Ionicons
            name={showInfo ? "chevron-up-circle" : "information-circle"}
            size={28}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contextActionsRow}>
        <View style={styles.phoneLabel}>
          <Ionicons name="call-outline" size={14} color={COLORS.gray} />
          <Text style={styles.phoneValue}>{contact.Celular || "N/A"}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              { backgroundColor: "rgba(51, 122, 183, 0.1)" },
            ]}
            onPress={() =>
              contact.Celular && Linking.openURL(`tel:${contact.Celular}`)
            }
          >
            <Ionicons name="call" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              { backgroundColor: "rgba(0, 205, 167, 0.1)" },
            ]}
            onPress={() =>
              contact.Celular &&
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
              color={COLORS.secondary}
            />
            <Text style={styles.infoText}>
              Asesor: {contact.AsesorNombreCompleto || "No asignado"}
            </Text>
          </View>
          {contact.Email && (
            <View style={styles.infoLine}>
              <Ionicons
                name="mail-outline"
                size={14}
                color={COLORS.secondary}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                Email: {contact.Email}
              </Text>
            </View>
          )}
          {contact.Observaciones && (
            <View style={styles.infoLine}>
              <Ionicons
                name="chatbox-outline"
                size={14}
                color={COLORS.secondary}
              />
              <Text style={styles.infoText} numberOfLines={2}>
                Obs: {contact.Observaciones}
              </Text>
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
      <LinearGradient
        colors={["rgba(255, 59, 48, 0.1)", "rgba(255, 59, 48, 0.05)"]}
        style={styles.alertGradient}
      >
        <View style={styles.alertHeader}>
          <Ionicons name="warning" size={20} color={COLORS.danger} />
          <Text style={styles.alertTitle}>Contacto Inviable</Text>
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertText}>
            <Text style={styles.boldLabel}>Causa: </Text>
            {contact.CausalInviabilidadNombre}
          </Text>
          {contact.ObservacionesInviabilidad && (
            <Text style={styles.alertText}>
              <Text style={styles.boldLabel}>Obs: </Text>
              {contact.ObservacionesInviabilidad}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const ActivityForm = ({
  contact,
  onRefresh,
  setShowInmuebleModal,
  inmueblesDisponibles,
  loadingInmuebles,
  searchTerm,
  setSearchTerm,
  onRegisterOnSelect,
}) => {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activityTypes, setActivityTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [complejos, setComplejos] = useState([]);

  const [showInmuebleSelector, setShowInmuebleSelector] = useState(false);
  const [showVisitanteFields, setShowVisitanteFields] = useState(false);
  const [showComplejoSelector, setShowComplejoSelector] = useState(false);

  const [form, setForm] = useState({
    TipoCalendarioActividadID: "",
    TipoActividadID: null,
    Entregable: false,
    TipoCalendarioActividadNombre: "",
    Asunto: "",
    FechaInicio: "",
    FechaVencimiento: "",
    Descripcion: "",
    UsuarioID: user?.UsuarioID || "",
    Contacto: contact?.NombreCompleto || "",
    Celular: contact?.Celular || "",
    Telefono: "",
    Direccion: "",
    Email: contact?.Email || "",
    Link: "",
    VisitanteDocumento: "",
    VisitanteNombreCompleto: "",
    ComplejoID: "",
    InmuebleID: "",
    AsignarProceso: false,
    Notificacion: true,
    NotificarPropietario: false,
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

    setShowVisitanteFields(isVisitType || !!form.VisitanteDocumento);
    setShowComplejoSelector(isVisitType || !!form.ComplejoID);
    setShowInmuebleSelector(isPropertyType);
  }, [
    form.TipoCalendarioActividadID,
    contact.OrigenPreContactoID,
    form.VisitanteDocumento,
    form.ComplejoID,
  ]);

  const handleTipoActividadChange = (id) => {
    const selectedType = activityTypes.find(
      (t) => t.TipoCalendarioActividadID === id,
    );

    if (selectedType) {
      const isEntregable = selectedType.Entregable === true;
      const isNotifyProp = selectedType.TipoActividadID === 1;

      setForm((prev) => ({
        ...prev,
        TipoCalendarioActividadID: id,
        TipoActividadID: selectedType.TipoActividadID,
        Entregable: isEntregable,
        TipoCalendarioActividadNombre: selectedType.Nombre,
        Direccion: isEntregable ? "" : prev.Direccion,
        Telefono: isEntregable ? "" : prev.Telefono,
        Celular: isEntregable ? "" : prev.Celular,
        Email: isNotifyProp ? contact?.Email || prev.Email : prev.Email,
        NotificarPropietario: isNotifyProp ? true : prev.NotificarPropietario,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        TipoCalendarioActividadID: "",
        TipoActividadID: null,
        Entregable: false,
        TipoCalendarioActividadNombre: "",
      }));
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (onRegisterOnSelect) {
      onRegisterOnSelect((item) => {
        setForm((prev) => ({ ...prev, InmuebleID: item.InmuebleID }));
      });
    }
  }, [onRegisterOnSelect]);

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
      setIsCollapsed(true);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving activity:", error);
      Alert.alert("Error", "No se pudo guardar la actividad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContent}>
      <TouchableOpacity
        style={styles.collapseToggle}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["rgba(51, 122, 183, 0.05)", "transparent"]}
          style={styles.toggleGradient}
        >
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIconCircle}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.toggleTitle}>Añadir Nueva Actividad</Text>
          </View>
          <Ionicons
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color={COLORS.gray}
          />
        </LinearGradient>
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.expandedContent}>
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Detalles de la Actividad</Text>
            </View>

            <CustomPicker
              label="Tipo de actividad"
              required
              selectedValue={form.TipoCalendarioActividadID}
              onValueChange={handleTipoActividadChange}
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
              placeholder={
                form.TipoCalendarioActividadNombre ||
                "¿De qué trata la actividad?"
              }
              icon="text-outline"
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DateTimePicker
                  label="Inicio"
                  required
                  value={form.FechaInicio}
                  onChange={(v) => updateForm("FechaInicio", v)}
                  placeholder="Fecha y hora"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <DateTimePicker
                  label="Vencimiento"
                  required
                  value={form.FechaVencimiento}
                  onChange={(v) => updateForm("FechaVencimiento", v)}
                  placeholder="Fecha y hora"
                />
              </View>
            </View>
            <CustomInput
              label="Descripción"
              value={form.Descripcion}
              onChangeText={(v) => updateForm("Descripcion", v)}
              multiline
              placeholder="Añade más detalles aquí..."
            />
          </View>

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Asignación y Notificación</Text>
            </View>

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

            <TouchableOpacity
              style={styles.checkboxLine}
              onPress={() => updateForm("AsignarProceso", !form.AsignarProceso)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  form.AsignarProceso && styles.checkboxActive,
                ]}
              >
                {form.AsignarProceso && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                Asignar proceso al responsable
              </Text>
            </TouchableOpacity>

            <CustomInput
              label="Email Invitados"
              value={form.Email}
              onChangeText={(v) => updateForm("Email", v)}
              placeholder="ejemplo1@mail.com; ejemplo2@mail.com"
              icon="mail-outline"
            />
            <Text style={styles.helperText}>
              Para ingresar varios emails separarlo por ; sin espacios.
            </Text>

            <CustomInput
              label="Link de Reunión"
              value={form.Link}
              onChangeText={(v) => updateForm("Link", v)}
              placeholder="Enlace de Zoom, Teams, etc."
              icon="videocam-outline"
            />

            {form.TipoActividadID === 1 && (
              <TouchableOpacity
                style={styles.checkboxLine}
                onPress={() =>
                  updateForm("NotificarPropietario", !form.NotificarPropietario)
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    form.NotificarPropietario && styles.checkboxActive,
                  ]}
                >
                  {form.NotificarPropietario && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={styles.checkboxText}>Notificar a propietario</Text>
              </TouchableOpacity>
            )}
          </View>

          {!form.Entregable && (
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>Ubicación y Contacto</Text>
              </View>
              <CustomInput
                label="Dirección Actividad"
                value={form.Direccion}
                onChangeText={(v) => updateForm("Direccion", v)}
                placeholder="Dirección del encuentro"
                icon="location-outline"
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <CustomInput
                    label="Teléfono"
                    value={form.Telefono}
                    onChangeText={(v) => updateForm("Telefono", v)}
                    placeholder="Teléfono fijo"
                    icon="call-outline"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <CustomInput
                    label="Celular"
                    value={form.Celular}
                    onChangeText={(v) => updateForm("Celular", v)}
                    placeholder="Número celular"
                    icon="phone-portrait-outline"
                  />
                </View>
              </View>
            </View>
          )}

          {(showVisitanteFields ||
            showComplejoSelector ||
            showInmuebleSelector) && (
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIcon}>
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>Información Adicional</Text>
              </View>

              {showVisitanteFields && (
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <CustomInput
                      label="Doc. Visitante"
                      value={form.VisitanteDocumento}
                      onChangeText={(v) => updateForm("VisitanteDocumento", v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <CustomInput
                      label="Nombre Visitante"
                      value={form.VisitanteNombreCompleto}
                      onChangeText={(v) =>
                        updateForm("VisitanteNombreCompleto", v)
                      }
                    />
                  </View>
                </View>
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
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ID Inmueble</Text>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setShowInmuebleModal(true)}
                  >
                    <Text
                      style={[
                        styles.selectBoxText,
                        !form.InmuebleID && styles.selectBoxPlaceholder,
                      ]}
                    >
                      {form.InmuebleID
                        ? `Inmueble #${form.InmuebleID}`
                        : "Seleccionar inmueble..."}
                    </Text>
                    <Ionicons name="search" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  loading
                    ? [COLORS.lightGray, COLORS.gray]
                    : [COLORS.primary, COLORS.secondary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Guardar Actividad</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFF"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const FollowupForm = ({ contact, onRefresh }) => {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
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
      setIsCollapsed(true);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving followup:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContent}>
      <TouchableOpacity
        style={styles.collapseToggle}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["rgba(51, 122, 183, 0.05)", "transparent"]}
          style={styles.toggleGradient}
        >
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIconCircle}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.toggleTitle}>Añadir Nuevo Seguimiento</Text>
          </View>
          <Ionicons
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color={COLORS.gray}
          />
        </LinearGradient>
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.expandedContent}>
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Nuevo Seguimiento</Text>
            </View>
            <CustomInput
              label="Observaciones"
              required
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              placeholder="Escribe aquí las novedades o avances con este contacto..."
            />
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  loading
                    ? [COLORS.lightGray, COLORS.gray]
                    : [COLORS.primary, COLORS.secondary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      Guardar Seguimiento
                    </Text>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFF"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
      <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />
    );

  return (
    <View style={styles.listSection}>
      <Text style={styles.listSectionTitle}>Historial de Seguimientos</Text>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubble-outline"
            size={48}
            color={COLORS.lightGray}
          />
          <Text style={styles.emptyText}>No hay seguimientos registrados.</Text>
        </View>
      ) : (
        items.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <View style={styles.listAvatar}>
                <Text style={styles.avatarTextSmall}>
                  {item.NombreCompleto?.charAt(0) || "U"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemUser}>{item.NombreCompleto}</Text>
                <Text style={styles.listItemDate}>
                  {item.FechaRegistroAmigable ||
                    new Date(item.FechaRegistro).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.bubbleContent}>
              <Text style={styles.listItemContent}>{item.Comentario}</Text>
            </View>
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
        },
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
      <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />
    );

  return (
    <View style={styles.listSection}>
      <Text style={styles.listSectionTitle}>Actividades Programadas</Text>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={COLORS.lightGray}
          />
          <Text style={styles.emptyText}>No hay actividades registradas.</Text>
        </View>
      ) : (
        items.map((item, idx) => (
          <View key={idx} style={styles.activityItem}>
            <View style={styles.activityItemHeader}>
              <View
                style={[
                  styles.activityStatusIcon,
                  {
                    backgroundColor: item.Completada
                      ? "rgba(0, 205, 167, 0.1)"
                      : "rgba(51, 122, 183, 0.1)",
                  },
                ]}
              >
                <Ionicons
                  name={item.Completada ? "checkmark-circle" : "time"}
                  size={20}
                  color={item.Completada ? COLORS.success : COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityItemTitle}>{item.Asunto}</Text>
                <Text style={styles.activityItemDate}>
                  Programado por:{" "}
                  {item.UsuarioNombreCompleto || item.UsuarioNombre || "N/A"}
                </Text>
              </View>
              {item.TiposCalendariosActividadesEntregable && (
                <View style={styles.entregableBadge}>
                  <Text style={styles.entregableBadgeText}>Entregable</Text>
                </View>
              )}
            </View>

            {item.InmuebleDescripcion || item.ComplejoNombre ? (
              <View style={styles.activityMetaContainer}>
                {item.ComplejoNombre && (
                  <View style={styles.activityMetaRow}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.activityMetaText}>
                      {item.ComplejoNombre}
                    </Text>
                  </View>
                )}
                {item.InmuebleDescripcion && (
                  <View style={styles.activityMetaRow}>
                    <Ionicons
                      name="home-outline"
                      size={14}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.activityMetaText}>
                      {item.InmuebleDescripcion}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {item.Direccion && (
              <View style={styles.activityMetaRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.gray}
                />
                <Text style={styles.activityMetaText}>
                  Lugar:{" "}
                  <Text style={{ fontWeight: "700" }}>{item.Direccion}</Text>
                </Text>
              </View>
            )}

            {item.VisitanteNombreCompleto && (
              <View style={styles.activityMetaRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={14}
                  color={COLORS.gray}
                />
                <Text style={styles.activityMetaText}>
                  Visitante:{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {item.VisitanteNombreCompleto}
                  </Text>
                  {item.VisitanteDocumento
                    ? ` (${item.VisitanteDocumento})`
                    : ""}
                </Text>
              </View>
            )}

            {(item.Celular || item.Email) && (
              <View style={styles.activityMetaRow}>
                <Ionicons name="call-outline" size={14} color={COLORS.gray} />
                <Text style={styles.activityMetaText}>
                  {item.Celular} {item.Email ? `| ${item.Email}` : ""}
                </Text>
              </View>
            )}

            {item.Link && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(item.Link)}
              >
                <Ionicons
                  name="videocam-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.linkButtonText} numberOfLines={1}>
                  Unirse a la reunión
                </Text>
              </TouchableOpacity>
            )}

            {item.Completada && (
              <View style={styles.closureCard}>
                <View style={[styles.activityMetaRow, { marginBottom: 2 }]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={14}
                    color={COLORS.success}
                  />
                  <Text style={styles.closureTitle}>Actividad Finalizada</Text>
                </View>
                {item.CalendarioActividadCierreDetalle && (
                  <Text style={styles.closureDetailText}>
                    Motivo:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {item.CalendarioActividadCierreDetalle}
                    </Text>
                  </Text>
                )}
                <Text style={styles.closureDetailText}>
                  Cerrada por: {item.UsuarioCierreNombreCompleto || "N/A"} el{" "}
                  {new Date(item.FechaCierre).toLocaleDateString()}
                </Text>
                {item.ObservacionesCierre && (
                  <Text style={styles.closureObsText}>
                    "{item.ObservacionesCierre}"
                  </Text>
                )}
              </View>
            )}

            {item.CausalInviabilidadProcesoNombre && (
              <View style={[styles.activityMetaRow, { marginTop: 8 }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={COLORS.danger}
                />
                <Text
                  style={[
                    styles.activityMetaText,
                    { color: COLORS.danger, fontWeight: "700" },
                  ]}
                >
                  Causa Inviabilidad: {item.CausalInviabilidadProcesoNombre}
                </Text>
              </View>
            )}

            {item.Descripcion ? (
              <Text style={styles.activityItemText}>{item.Descripcion}</Text>
            ) : null}

            <View style={styles.activityTimeline}>
              <View style={styles.timelinePoint}>
                <Text style={styles.timelineLabel}>INICIO</Text>
                <Text style={styles.timelineValue}>
                  {item.FechaInicioAmigable ||
                    new Date(item.FechaInicio).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                </Text>
              </View>
              <View style={styles.timelineArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={COLORS.lightGray}
                />
              </View>
              <View style={styles.timelinePoint}>
                <Text style={styles.timelineLabel}>VENCE</Text>
                <Text style={styles.timelineValue}>
                  {new Date(item.FechaVencimiento).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.registrationInfo}>
              <Ionicons
                name="create-outline"
                size={12}
                color={COLORS.lightGray}
              />
              <Text style={styles.registrationText}>
                Registrado por {item.RegistroUsuario} el{" "}
                {new Date(item.RegistroFecha).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const ActivityFollowupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { contact } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (!contact) return null;

  const FollowupsTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
      <ScrollView
        style={styles.tabContainer}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <FollowupForm
          contact={contact}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <View style={styles.tabSectionDivider} />
        <FollowupList contact={contact} refreshKey={refreshKey} />
      </ScrollView>
    );
  };

  const ActivitiesTab = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [showInmuebleModal, setShowInmuebleModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingInmuebles, setLoadingInmuebles] = useState(false);
    const [inmueblesDisponibles, setInmueblesDisponibles] = useState([]);

    const loadInmuebles = useCallback(async (search = "") => {
      setLoadingInmuebles(true);
      try {
        const id = Number(contact.OrigenPreContactoID);
        const tipoOferta = id === 5 ? 2 : 1;
        const data =
          await GestionComercialService.consultarInmueblesDisponibles({
            TipoOfertaID: tipoOferta,
            FullSearch: search,
          });
        setInmueblesDisponibles(data || []);
      } catch (error) {
        console.error("ActivityFollowupScreen:loadInmuebles", error);
      } finally {
        setLoadingInmuebles(false);
      }
    }, []);

    useEffect(() => {
      if (showInmuebleModal) {
        loadInmuebles(searchTerm);
      }
    }, [showInmuebleModal, searchTerm, loadInmuebles]);

    const onSelectRef = useRef(null);

    return (
      <View style={{ flex: 1 }}>
        <PropertySelectionModal
          visible={showInmuebleModal}
          onClose={() => setShowInmuebleModal(false)}
          inmueblesDisponibles={inmueblesDisponibles}
          loadingInmuebles={loadingInmuebles}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectInmueble={(item) => {
            if (onSelectRef.current) {
              onSelectRef.current(item);
            }
            setShowInmuebleModal(false);
          }}
          selectedInmuebleID={null}
        />
        <ScrollView
          style={styles.tabContainer}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <ActivityForm
            contact={contact}
            onRefresh={() => setRefreshKey((k) => k + 1)}
            setShowInmuebleModal={setShowInmuebleModal}
            inmueblesDisponibles={inmueblesDisponibles}
            loadingInmuebles={loadingInmuebles}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onRegisterOnSelect={(fn) => {
              onSelectRef.current = fn;
            }}
          />
          <View style={styles.tabSectionDivider} />
          <ActivityList contact={contact} refreshKey={refreshKey} />
        </ScrollView>
      </View>
    );
  };

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
          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
          </View>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSubtitle}>Gestión de Contacto</Text>
              <Text style={styles.headerTitle}>Actividades y Seguimientos</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={{ flex: 1, marginTop: -20 }}>
        <ContactInfoHeader contact={contact} />
        <InviableAlert contact={contact} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.gray,
              tabBarLabelStyle: {
                fontSize: 13,
                fontWeight: "800",
                textTransform: "capitalize",
              },
              tabBarStyle: {
                backgroundColor: COLORS.white,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              },
              tabBarIndicatorStyle: {
                backgroundColor: COLORS.primary,
                height: 3,
                borderRadius: 3,
              },
            }}
          >
            <Tab.Screen name="Seguimientos" component={FollowupsTab} />
            <Tab.Screen name="Actividades" component={ActivitiesTab} />
          </Tab.Navigator>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: { flex: 1, marginLeft: 16 },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },

  contextCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 16,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 12,
  },
  contextSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contextAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  contextMain: { flex: 1, paddingHorizontal: 12 },
  contextLabel: {
    fontSize: 11,
    color: COLORS.lightGray,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  contextValue: { fontSize: 16, fontWeight: "800", color: COLORS.dark },
  infoToggleButton: { padding: 4 },
  contextActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  phoneLabel: { flexDirection: "row", alignItems: "center" },
  phoneValue: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "600",
  },
  actionButtons: { flexDirection: "row", gap: 10 },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  extraInfoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    gap: 8,
  },
  infoLine: { flexDirection: "row", alignItems: "center" },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 8,
    fontWeight: "500",
  },

  inviableAlert: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  alertGradient: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.danger,
    marginLeft: 10,
  },
  alertContent: { paddingLeft: 30 },
  alertText: { fontSize: 13, color: COLORS.gray, marginBottom: 4 },
  boldLabel: { fontWeight: "800", color: COLORS.dark },

  tabContainer: { flex: 1, backgroundColor: COLORS.background },
  tabSectionDivider: { height: 12, backgroundColor: "rgba(0,0,0,0.02)" },

  formContent: { padding: 16 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.dark },

  inputContainer: { marginBottom: 16 },
  labelContainer: { flexDirection: "row", marginBottom: 6, paddingLeft: 4 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: { color: COLORS.danger, marginLeft: 2 },
  helperText: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: -4,
    marginBottom: 12,
    fontStyle: "italic",
    paddingLeft: 4,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  selectBoxText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
  },
  selectBoxPlaceholder: {
    color: COLORS.lightGray,
    fontWeight: "400",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: "flex-start",
    paddingTop: 10,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.dark, fontWeight: "500" },
  inputMultiline: { textAlignVertical: "top" },
  inputIcon: { marginRight: 10 },

  pickerWrapper: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  picker: { width: "100%", color: COLORS.dark },

  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  dateInput: { fontSize: 14, color: COLORS.dark, fontWeight: "600" },
  placeholderText: { color: COLORS.lightGray, fontWeight: "400" },

  row: { flexDirection: "row" },

  checkboxLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingLeft: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxActive: { backgroundColor: COLORS.primary },
  checkboxText: { fontSize: 14, color: COLORS.gray, fontWeight: "600" },

  buttonWrapper: { marginTop: 8 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },

  collapseToggle: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  expandedContent: {
    marginTop: 4,
  },

  listSection: { padding: 16 },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 16,
    paddingLeft: 4,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTextSmall: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  listItemUser: { fontSize: 14, fontWeight: "800", color: COLORS.dark },
  listItemDate: { fontSize: 11, color: COLORS.lightGray, fontWeight: "600" },
  bubbleContent: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 14,
  },
  listItemContent: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    fontWeight: "500",
  },

  activityItem: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItemHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  activityStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  activityItemTitle: { fontSize: 15, fontWeight: "800", color: COLORS.dark },
  activityItemDate: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: "600",
  },
  entregableBadge: {
    backgroundColor: "rgba(0, 205, 167, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  entregableBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.success,
    textTransform: "uppercase",
  },
  activityItemText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
  },
  activityTimeline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 12,
  },
  activityMetaContainer: {
    backgroundColor: "rgba(0, 134, 200, 0.05)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  activityMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  activityMetaText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
    flex: 1,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  closureCard: {
    backgroundColor: "rgba(0, 205, 167, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 205, 167, 0.2)",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  closureTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.success,
    textTransform: "uppercase",
  },
  closureDetailText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 22,
    marginBottom: 2,
  },
  closureObsText: {
    fontSize: 12,
    color: COLORS.dark,
    fontStyle: "italic",
    marginLeft: 22,
    marginTop: 4,
  },
  registrationInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 4,
    opacity: 0.7,
  },
  registrationText: {
    fontSize: 10,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  timelinePoint: { flex: 1, alignItems: "center" },
  timelineLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.lightGray,
    marginBottom: 2,
  },
  timelineValue: { fontSize: 12, fontWeight: "800", color: COLORS.secondary },
  timelineArrow: { paddingHorizontal: 10 },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.lightGray,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ActivityFollowupScreen;
