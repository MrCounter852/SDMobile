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
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useGlobal } from "../../../core/global";
import SearchableModal from "../../../components/SearchableModal";
import { FILTER_OPTIONS } from "./FilterConstants";

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

const CalendarFilterModal = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
  tiposCalendarioActividades = [],
  asesores = [],
  sucursales = [],
  loading = false,
  onSearchAsesores,
}) => {
  const { user, permisos } = useGlobal();
  const [filters, setFilters] = useState(initialFilters || {});
  const [showDatePicker, setShowDatePicker] = useState(null); // 'FechaInicial', 'FechaFinal'

  const [advisorModalVisible, setAdvisorModalVisible] = useState(false);
  const [advisorSearch, setAdvisorSearch] = useState("");
  const [remoteAsesores, setRemoteAsesores] = useState([]);
  const [advisorSearching, setAdvisorSearching] = useState(false);
  const searchTimeout = useRef(null);
  const insets = useSafeAreaInsets();

  // Sincronizar filtros cuando cambian los filtros iniciales
  useEffect(() => {
    setFilters({ ...initialFilters });
  }, [initialFilters, visible]);

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
      ...initialFilters,
      FullSearch: "",
      EstadoActividadID: null, // Match web default (All)
      TipoCalendarioActividadID: null,
      AsesorID: null, // Reset to all
      UsuarioID: null,
      FechaInicial: null,
      FechaFinal: null,
    };
    setFilters(defaultFilters);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(null);
    if (selectedDate && event.type !== "dismissed") {
      // Use local date parts to avoid TZ shifts
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day} 00:00:00`;
      setFilters((prev) => ({ ...prev, [showDatePicker]: formattedDate }));
    }
  };

  const getCalendarDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Handle "DD/MM/YYYY" or "YYYY-MM-DD"
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    const [y, m, d] = dateStr.split(" ")[0].split("-");
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

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
          console.error("CalendarFilterModal:handleAdvisorSearch", error);
        } finally {
          setAdvisorSearching(false);
        }
      }, 500);
    },
    [onSearchAsesores],
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

    if (!onSearchAsesores && advisorSearch) {
      return result.filter(
        (a) =>
          a.ID === null ||
          a.Nombre.toLowerCase().includes(advisorSearch.toLowerCase()),
      );
    }

    return result;
  }, [asesores, remoteAsesores, advisorSearch, onSearchAsesores]);

  const estadosActividadesOptions = useMemo(
    () => FILTER_OPTIONS.estadosActividades,
    [],
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

  const sucursalesOptions = useMemo(
    () => [
      { ID: null, Nombre: "Todas" },
      ...sucursales.map((s) => ({ ID: s.SucursalID, Nombre: s.Nombre })),
    ],
    [sucursales],
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
                  name="calendar-clear-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.headerTitle}>Filtros de Calendario</Text>
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
                {/* Buscador Rápido */}
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
                      placeholder="Asunto, contacto..."
                      placeholderTextColor={COLORS.lightGray}
                      value={filters.FullSearch}
                      onChangeText={(text) =>
                        setFilters((prev) => ({ ...prev, FullSearch: text }))
                      }
                    />
                  </View>
                </FilterSection>

                {/* Estado Actividad */}
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

                {/* Tipo de Actividad */}
                <FilterSection title="Tipo de actividad" icon="layers-outline">
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

                {/* Rango de Fechas */}
                <FilterSection title="Rango de fechas" icon="calendar-outline">
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

                {/* Organización Section */}
                {(permisos?.FiltroSucursal === true ||
                  permisos?.FiltroAsesor === true) && (
                  <FilterSection title="Organización" icon="business-outline">
                    {permisos?.FiltroSucursal === true && (
                      <>
                        <Text style={styles.subSectionTitle}>Sucursal</Text>
                        <ChipSelector
                          options={sucursalesOptions}
                          selectedValue={filters.SucursalID}
                          onSelect={(id) =>
                            setFilters((prev) => ({ ...prev, SucursalID: id }))
                          }
                        />
                      </>
                    )}

                    {permisos?.FiltroSucursal === true &&
                      permisos?.FiltroAsesor === true && (
                        <View style={{ height: 16 }} />
                      )}

                    {permisos?.FiltroAsesor === true && (
                      <>
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
                      </>
                    )}
                  </FilterSection>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 20) },
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
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={getCalendarDate(filters[showDatePicker])}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
          />
        )}

        {/* Modal Selección Asesor */}
        <SearchableModal
          visible={advisorModalVisible}
          onClose={() => setAdvisorModalVisible(false)}
          title="Seleccionar Asesor"
          searchPlaceholder="Buscar asesor..."
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateButton: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.lightGray,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
  },
  dateArrow: {
    paddingHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingLeft: 4,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.lightGray,
    marginBottom: 8,
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    marginRight: 10,
  },
  flexInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    margin: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  searchableSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchableSelectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    marginHorizontal: 10,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: COLORS.white,
  },
  resetButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray,
  },
  applyButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  applyButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 14,
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

export default CalendarFilterModal;
