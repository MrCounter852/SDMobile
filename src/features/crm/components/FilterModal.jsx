import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import SearchableModal from "../../../components/SearchableModal";
import { FILTER_OPTIONS } from "./FilterConstants";

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
};

const FilterSection = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const ChipSelector = ({
  options,
  selectedValue,
  onSelect,
  multiSelect = false,
}) => (
  <View style={styles.chipsContainer}>
    {options.map((option) => {
      const isSelected = multiSelect
        ? selectedValue?.toString().split(",").includes(option.ID?.toString())
        : selectedValue === option.ID;

      return (
        <TouchableOpacity
          key={`${option.ID ?? "null"}-${option.Nombre}`}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => onSelect(option.ID)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.chipText, isSelected && styles.chipTextSelected]}
          >
            {option.Nombre}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const FilterModal = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
  mode = "table", // 'table', 'timeline', 'calendar'
  origenes = [],
  tiposCalendarioActividades = [],
  asesores = [],
  sucursales = [],
  formasContacto = [],
  estadosProcesos = [],
  loading = false,
  onSearchAsesores,
}) => {
  const [filters, setFilters] = useState(initialFilters || {});
  const [showDatePicker, setShowDatePicker] = useState(null); // 'FechaInicial', 'FechaFinal', etc.

  const [advisorModalVisible, setAdvisorModalVisible] = useState(false);
  const [advisorSearch, setAdvisorSearch] = useState("");
  const [remoteAsesores, setRemoteAsesores] = useState([]);
  const [advisorSearching, setAdvisorSearching] = useState(false);
  const searchTimeout = useRef(null);
  const insets = useSafeAreaInsets();

  // Sincronizar filtros cuando cambian los filtros iniciales
  useEffect(() => {
    setFilters({
      ...initialFilters,
    });
  }, [initialFilters]);

  // Reset y carga inicial de asesores remotos al abrir el modal de selección
  useEffect(() => {
    if (advisorModalVisible) {
      setAdvisorSearch("");
      if (onSearchAsesores) {
        setAdvisorSearching(true);
        onSearchAsesores("")
          .then((results) => {
            setRemoteAsesores(results);
            setAdvisorSearching(false);
          })
          .catch(() => setAdvisorSearching(false));
      } else {
        setRemoteAsesores([]);
      }
    }
  }, [advisorModalVisible, onSearchAsesores]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      OrigenPreContactoID: null,
      EstadoProcesoID: "1,4",
      FechaInicial: null,
      FechaFinal: null,
      FullSearch: "",
      EstadoGeneral: null,
      EstadoActividadID: "3,4",
      TipoCalendarioActividadID: null,
      AsesorID: null,
      UsuarioID: null,
      NombreCompleto: "",
      FormaContactoID: null,
      FechaInicialCierre: null,
      FechaFinalCierre: null,
      ClienteNombreCompleto: "",
      Documento: "",
      Telefono: "",
      Celular: "",
      Email: "",
      SucursalID: null,
      FechaInicialPosibleServicio: null,
      FechaFinalPosibleServicio: null,
    };
    setFilters(defaultFilters);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(null);
    if (selectedDate && event.type !== "dismissed") {
      const formattedDate =
        selectedDate.toISOString().split("T")[0] + " 00:00:00";
      setFilters((prev) => ({ ...prev, [showDatePicker]: formattedDate }));
    }
  };

  // Opciones predefinidas
  const estadosOptions = useMemo(
    () => [
      { ID: "1,4", Nombre: "Nuevo y En gestión" },
      ...estadosProcesos.map((e) => ({
        ID: e.EstadoProcesoID?.toString(),
        Nombre: e.Nombre,
      })),
      { ID: null, Nombre: "Todos" },
    ],
    [estadosProcesos],
  );

  const estadosGenerales = useMemo(() => FILTER_OPTIONS.estadosGenerales, []);

  const estadosActividadesOptions = useMemo(
    () => [
      { ID: "3,4", Nombre: "Pendientes y Vencidas" },
      { ID: "1", Nombre: "Finalizadas" },
      { ID: "2", Nombre: "Vigentes" },
      { ID: "3", Nombre: "Vencidas" },
      { ID: "4", Nombre: "Pendientes o próximas" },
      { ID: null, Nombre: "Todas" },
    ],
    [],
  );

  const origenesOptions = useMemo(
    () => [
      { ID: null, Nombre: "Todos" },
      ...origenes.map((o) => ({ ID: o.OrigenPreContactoID, Nombre: o.Nombre })),
    ],
    [origenes],
  );

  const tiposActividadesOptions = useMemo(
    () => [
      { ID: null, Nombre: "Todos" },
      ...tiposCalendarioActividades.map((t) => ({
        ID: t.TipoCalendarioActividadID,
        Nombre: t.Nombre,
      })),
    ],
    [tiposCalendarioActividades],
  );

  const asesoresOptions = useMemo(() => {
    const list = asesores.map((a) => ({
      ID: a.AsesorID,
      UsuarioID: a.UsuarioID,
      Nombre: a.NombreCompleto,
    }));

    return [{ ID: null, UsuarioID: null, Nombre: "Todos" }, ...list];
  }, [asesores]);

  const sucursalesOptions = useMemo(
    () => [
      { ID: null, Nombre: "Todas" },
      ...sucursales.map((s) => ({ ID: s.SucursalID, Nombre: s.Nombre })),
    ],
    [sucursales],
  );

  const formasContactoOptions = useMemo(
    () => [
      { ID: null, Nombre: "Todas" },
      ...formasContacto.map((f) => ({
        ID: f.FormaContactoID,
        Nombre: f.Nombre,
      })),
    ],
    [formasContacto],
  );

  const filteredAsesores = useMemo(() => {
    const list =
      remoteAsesores.length > 0
        ? remoteAsesores.map((a) => ({
            ID: a.AsesorID,
            UsuarioID: a.UsuarioID,
            Nombre: a.NombreCompleto || a.Nombre,
          }))
        : asesores.map((a) => ({
            ID: a.AsesorID,
            UsuarioID: a.UsuarioID,
            Nombre: a.NombreCompleto,
          }));

    const result = [{ ID: null, UsuarioID: null, Nombre: "Todos" }, ...list];

    // Si hay búsqueda local (por si acaso no hay onSearch), filtramos
    if (!onSearchAsesores && advisorSearch) {
      return result.filter(
        (a) =>
          a.ID === null ||
          a.Nombre.toLowerCase().includes(advisorSearch.toLowerCase()),
      );
    }

    return result;
  }, [asesores, remoteAsesores, advisorSearch, onSearchAsesores]);

  const handleAdvisorSearch = useCallback(
    (text) => {
      setAdvisorSearch(text);
      if (!onSearchAsesores) return;

      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      if (!text.trim()) {
        setRemoteAsesores([]);
        setAdvisorSearching(false);
        return;
      }

      setAdvisorSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await onSearchAsesores(text);
          setRemoteAsesores(results);
        } catch (error) {
          console.error("FilterModal:handleAdvisorSearch", error);
        } finally {
          setAdvisorSearching(false);
        }
      }, 500);
    },
    [onSearchAsesores],
  );

  const selectedAdvisorName = useMemo(() => {
    if (filters.AsesorID === null) return "Todos";
    const advisor = asesores.find((a) => a.AsesorID === filters.AsesorID);
    return advisor ? advisor.NombreCompleto : "Seleccionar asesor";
  }, [filters.AsesorID, asesores]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconContainer}>
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.headerTitle}>Filtros de Búsqueda</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando opciones...</Text>
              </View>
            ) : (
              <>
                {/* Buscador General */}
                <FilterSection title="Búsqueda rápida" icon="search-outline">
                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="search"
                      size={18}
                      color={COLORS.lightGray}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.flexInput}
                      placeholder={
                        mode === "calendar"
                          ? "Asunto, contacto..."
                          : "Nombre, email, celular..."
                      }
                      placeholderTextColor={COLORS.lightGray}
                      value={filters.FullSearch}
                      onChangeText={(text) =>
                        setFilters((prev) => ({ ...prev, FullSearch: text }))
                      }
                    />
                  </View>
                </FilterSection>

                {(mode === "table" || mode === "timeline") && (
                  <>
                    <FilterSection
                      title="Tipo de contacto"
                      icon="people-outline"
                    >
                      <ChipSelector
                        options={origenesOptions}
                        selectedValue={filters.OrigenPreContactoID}
                        onSelect={(id) =>
                          setFilters((prev) => ({
                            ...prev,
                            OrigenPreContactoID: id,
                          }))
                        }
                      />
                    </FilterSection>

                    <FilterSection
                      title="Estado del proceso"
                      icon="stats-chart-outline"
                    >
                      <ChipSelector
                        options={estadosOptions}
                        selectedValue={filters.EstadoProcesoID}
                        onSelect={(id) =>
                          setFilters((prev) => ({
                            ...prev,
                            EstadoProcesoID: id,
                          }))
                        }
                      />
                    </FilterSection>

                    <FilterSection
                      title="Estado general"
                      icon="alert-circle-outline"
                    >
                      <ChipSelector
                        options={estadosGenerales}
                        selectedValue={filters.EstadoGeneral}
                        onSelect={(id) =>
                          setFilters((prev) => ({ ...prev, EstadoGeneral: id }))
                        }
                      />
                    </FilterSection>
                  </>
                )}

                {mode === "calendar" && (
                  <>
                    <FilterSection
                      title="Estado de actividad"
                      icon="checkmark-circle-outline"
                    >
                      <ChipSelector
                        options={estadosActividadesOptions}
                        selectedValue={filters.EstadoActividadID}
                        onSelect={(id) =>
                          setFilters((prev) => ({
                            ...prev,
                            EstadoActividadID: id,
                          }))
                        }
                      />
                    </FilterSection>

                    <FilterSection
                      title="Tipo de actividad"
                      icon="layers-outline"
                    >
                      <ChipSelector
                        options={tiposActividadesOptions}
                        selectedValue={filters.TipoCalendarioActividadID}
                        onSelect={(id) =>
                          setFilters((prev) => ({
                            ...prev,
                            TipoCalendarioActividadID: id,
                          }))
                        }
                      />
                    </FilterSection>

                    <FilterSection
                      title="Rango de fechas"
                      icon="calendar-outline"
                    >
                      <View style={styles.datesContainer}>
                        <TouchableOpacity
                          style={styles.dateButton}
                          onPress={() => setShowDatePicker("FechaInicial")}
                        >
                          <Text style={styles.dateLabel}>Desde</Text>
                          <Text style={styles.dateValue}>
                            {filters.FechaInicial
                              ? filters.FechaInicial.split(" ")[0]
                              : "Seleccionar"}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.dateArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={COLORS.lightGray}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.dateButton}
                          onPress={() => setShowDatePicker("FechaFinal")}
                        >
                          <Text style={styles.dateLabel}>Hasta</Text>
                          <Text style={styles.dateValue}>
                            {filters.FechaFinal
                              ? filters.FechaFinal.split(" ")[0]
                              : "Seleccionar"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </FilterSection>
                  </>
                )}

                {/* --- WEB ADAPTATION FIELDS --- */}

                {/* Organización Section */}
                <FilterSection title="Organización" icon="business-outline">
                  <Text style={styles.subSectionTitle}>Sucursal</Text>
                  <ChipSelector
                    options={sucursalesOptions}
                    selectedValue={filters.SucursalID}
                    onSelect={(id) =>
                      setFilters((prev) => ({ ...prev, SucursalID: id }))
                    }
                  />

                  <View style={{ height: 16 }} />
                  <Text style={styles.subSectionTitle}>Asesor</Text>
                  <TouchableOpacity
                    style={styles.searchableSelector}
                    onPress={() => setAdvisorModalVisible(true)}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.searchableSelectorText,
                        filters.AsesorID === null && {
                          color: COLORS.lightGray,
                        },
                      ]}
                    >
                      {selectedAdvisorName}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={COLORS.lightGray}
                    />
                  </TouchableOpacity>
                </FilterSection>

                {/* Información de Contacto Section */}
                <FilterSection
                  title="Información de Contacto"
                  icon="person-outline"
                >
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre Contacto</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={COLORS.lightGray}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.flexInput}
                        placeholder="Nombre completo"
                        placeholderTextColor={COLORS.lightGray}
                        value={filters.NombreCompleto}
                        onChangeText={(text) =>
                          setFilters((prev) => ({
                            ...prev,
                            NombreCompleto: text,
                          }))
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cliente</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons
                        name="business-outline"
                        size={18}
                        color={COLORS.lightGray}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.flexInput}
                        placeholder="Nombre del cliente"
                        placeholderTextColor={COLORS.lightGray}
                        value={filters.ClienteNombreCompleto}
                        onChangeText={(text) =>
                          setFilters((prev) => ({
                            ...prev,
                            ClienteNombreCompleto: text,
                          }))
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Documento</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons
                        name="card-outline"
                        size={18}
                        color={COLORS.lightGray}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.flexInput}
                        placeholder="Documento de identidad"
                        placeholderTextColor={COLORS.lightGray}
                        keyboardType="numeric"
                        value={filters.Documento}
                        onChangeText={(text) =>
                          setFilters((prev) => ({ ...prev, Documento: text }))
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Teléfono</Text>
                      <View style={styles.inputWithIcon}>
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color={COLORS.lightGray}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.flexInput}
                          placeholder="Fijo"
                          placeholderTextColor={COLORS.lightGray}
                          keyboardType="phone-pad"
                          value={filters.Telefono}
                          onChangeText={(text) =>
                            setFilters((prev) => ({ ...prev, Telefono: text }))
                          }
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Celular</Text>
                      <View style={styles.inputWithIcon}>
                        <Ionicons
                          name="phone-portrait-outline"
                          size={18}
                          color={COLORS.lightGray}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.flexInput}
                          placeholder="Móvil"
                          placeholderTextColor={COLORS.lightGray}
                          keyboardType="phone-pad"
                          value={filters.Celular}
                          onChangeText={(text) =>
                            setFilters((prev) => ({ ...prev, Celular: text }))
                          }
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={COLORS.lightGray}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.flexInput}
                        placeholder="Correo electrónico"
                        placeholderTextColor={COLORS.lightGray}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={filters.Email}
                        onChangeText={(text) =>
                          setFilters((prev) => ({ ...prev, Email: text }))
                        }
                      />
                    </View>
                  </View>

                  <View style={{ height: 8 }} />
                  <Text style={styles.subSectionTitle}>
                    ¿Cómo se contactaron?
                  </Text>
                  <ChipSelector
                    options={formasContactoOptions}
                    selectedValue={filters.FormaContactoID}
                    onSelect={(id) =>
                      setFilters((prev) => ({ ...prev, FormaContactoID: id }))
                    }
                  />
                </FilterSection>

                {/* Fechas de Cierre Section */}
                <FilterSection title="Fechas de Cierre" icon="calendar-outline">
                  <View style={styles.datesContainer}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker("FechaInicialCierre")}
                    >
                      <Text style={styles.dateLabel}>Inicial Cierre</Text>
                      <Text style={styles.dateValue}>
                        {filters.FechaInicialCierre
                          ? filters.FechaInicialCierre.split(" ")[0]
                          : "Seleccionar"}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.dateArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={COLORS.lightGray}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker("FechaFinalCierre")}
                    >
                      <Text style={styles.dateLabel}>Final Cierre</Text>
                      <Text style={styles.dateValue}>
                        {filters.FechaFinalCierre
                          ? filters.FechaFinalCierre.split(" ")[0]
                          : "Seleccionar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </FilterSection>

                {/* Fechas de Servicio Section */}
                <FilterSection
                  title="Fechas de Servicio"
                  icon="briefcase-outline"
                >
                  <View style={styles.datesContainer}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() =>
                        setShowDatePicker("FechaInicialPosibleServicio")
                      }
                    >
                      <Text style={styles.dateLabel}>Inicial Servicio</Text>
                      <Text style={styles.dateValue}>
                        {filters.FechaInicialPosibleServicio
                          ? filters.FechaInicialPosibleServicio.split(" ")[0]
                          : "Seleccionar"}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.dateArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={COLORS.lightGray}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() =>
                        setShowDatePicker("FechaFinalPosibleServicio")
                      }
                    >
                      <Text style={styles.dateLabel}>Final Servicio</Text>
                      <Text style={styles.dateValue}>
                        {filters.FechaFinalPosibleServicio
                          ? filters.FechaFinalPosibleServicio.split(" ")[0]
                          : "Seleccionar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </FilterSection>

                {/* Original Date Ranges (Now always visible if not calendar mode) */}
                {mode !== "calendar" && (
                  <FilterSection
                    title="Rango de Fechas"
                    icon="calendar-outline"
                  >
                    <View style={styles.datesContainer}>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker("FechaInicial")}
                      >
                        <Text style={styles.dateLabel}>Desde</Text>
                        <Text style={styles.dateValue}>
                          {filters.FechaInicial
                            ? filters.FechaInicial.split(" ")[0]
                            : "Seleccionar"}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.dateArrow}>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.lightGray}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker("FechaFinal")}
                      >
                        <Text style={styles.dateLabel}>Hasta</Text>
                        <Text style={styles.dateValue}>
                          {filters.FechaFinal
                            ? filters.FechaFinal.split(" ")[0]
                            : "Seleccionar"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </FilterSection>
                )}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(20, insets.bottom) },
            ]}
          >
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButtonContainer}
              onPress={handleApply}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                <Feather name="check" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={
            filters[showDatePicker]
              ? new Date(filters[showDatePicker].replace(" ", "T"))
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      <SearchableModal
        visible={advisorModalVisible}
        onClose={() => setAdvisorModalVisible(false)}
        title="Seleccionar Asesor"
        searchPlaceholder="Buscar por nombre..."
        data={filteredAsesores}
        loading={advisorSearching}
        searchTerm={advisorSearch}
        onSearchChange={handleAdvisorSearch}
        selectedItemId={filters.AsesorID}
        renderItem={(item, selectedId) => (
          <TouchableOpacity
            style={[
              styles.modalItem,
              item.ID === selectedId && styles.modalItemSelected,
            ]}
            onPress={() => {
              setFilters((prev) => ({
                ...prev,
                AsesorID: item.ID,
                UsuarioID: item.UsuarioID,
              }));
              setAdvisorModalVisible(false);
              setAdvisorSearch("");
            }}
          >
            <Text
              style={[
                styles.modalItemText,
                item.ID === selectedId && styles.modalItemTextSelected,
              ]}
            >
              {item.Nombre}
            </Text>
            {item.ID === selectedId && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.white}
              />
            )}
          </TouchableOpacity>
        )}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(51,122,183,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
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
  sectionContent: {
    paddingLeft: 4,
  },
  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: "rgba(51,122,183,0.1)",
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  // Search Input
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  flexInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    height: "100%",
    paddingVertical: 0,
  },
  // Dates
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
  },
  dateArrow: {
    width: 24,
    alignItems: "center",
  },
  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  resetButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resetButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  applyButtonContainer: {
    flex: 2,
  },
  applyButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.lightGray,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchableSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: 16,
  },
  searchableSelectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.dark,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  modalItemSelected: {
    backgroundColor: COLORS.primary,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default FilterModal;
