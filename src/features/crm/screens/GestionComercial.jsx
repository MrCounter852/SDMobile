import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobal } from "../../../core/global";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";
import { COLORS } from "../../../core/theme";

const GestionComercialService = require("../services/crmService").default;

import FilterModal from "../components/FilterModal";
import CalendarFilterModal from "../components/CalendarFilterModal";
import ColorPickerModal from "../components/ColorPickerModal";
import TableView from "../components/TableView";
import TimelineView from "../components/TimelineView";
import CalendarView from "../components/CalendarView";
import ActiveFilterTags from "../components/ActiveFilterTags";
import { FILTER_OPTIONS } from "../components/FilterConstants";

const Tab = createMaterialTopTabNavigator();

const GestionComercial = ({ navigation }) => {
  const { user, permisos } = useGlobal();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("Tabla");
  const [searchFilters, setSearchFilters] = useState({
    OrigenPreContactoID: null,
    EstadoProcesoID: "1,4",
    FechaInicial: null,
    FechaFinal: null,
    FullSearch: "",
    EstadoGeneral: null,
    EstadoActividadID: "3,4",
    TipoCalendarioActividadID: null,
    AsesorID: user?.AsesorID || null,
    UsuarioID: user?.UsuarioID || null,
    NombreCompleto: "",
    FormaContactoID: null,
    FechaInicialCierre: null,
    FechaFinalCierre: null,
    ClienteNombreCompleto: "",
    Documento: "",
    Telefono: "",
    Celular: "",
    Email: "",
    SucursalID: user?.SucursalID || null,
    FechaInicialPosibleServicio: null,
    FechaFinalPosibleServicio: null,
  });
  const [hasFilters, setHasFilters] = useState(false);
  const [origenes, setOrigenes] = useState([]);
  const [tiposCalendarioActividades, setTiposCalendarioActividades] = useState(
    [],
  );
  const [asesores, setAsesores] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formasContacto, setFormasContacto] = useState([]);
  const [estadosProcesos, setEstadosProcesos] = useState([]);
  const [filterDataLoading, setFilterDataLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isInitialMount = useRef(true);

  const getCurrentMode = useCallback(() => {
    switch (currentTab) {
      case "Tabla":
        return "table";
      case "LineaTiempo":
        return "timeline";
      case "Calendario":
        return "calendar";
      default:
        return "table";
    }
  }, [currentTab]);

  useEffect(() => {
    if (user?.SucursalID || user?.AsesorID) {
      setSearchFilters((prev) => ({
        ...prev,
        AsesorID: prev.AsesorID || user?.AsesorID || null,
        UsuarioID: prev.UsuarioID || user?.UsuarioID || null,
        SucursalID: prev.SucursalID || user?.SucursalID || null,
      }));
    }
  }, [user?.SucursalID, user?.AsesorID]);

  useEffect(() => {
    const loadFilterData = async () => {
      setFilterDataLoading(true);
      try {
        const origenesResponse =
          await GestionComercialService.consultarOrigenesPreContactosSucursales(
            {
              SucursalID: user?.SucursalID,
            },
          );
        setOrigenes(origenesResponse.rows || []);

        const tiposResponse =
          await GestionComercialService.consultarTiposCalendarioActividades();
        setTiposCalendarioActividades(tiposResponse.rows || []);

        const asesoresResponse =
          await GestionComercialService.consultarAsesores({
            SucursalID: user?.SucursalID,
            Rows: 0,
          });
        setAsesores(asesoresResponse.rows || []);

        const sucursalesResponse =
          await GestionComercialService.consultarSucursalesUsuarios({
            UsuarioID: user?.UsuarioID,
          });
        setSucursales(sucursalesResponse.rows || []);

        const formasResponse =
          await GestionComercialService.consultarFormasContacto({
            SucursalID: user?.SucursalID,
            Rows: 0,
          });
        setFormasContacto(formasResponse.rows || []);

        const estadosProcesosResponse =
          await GestionComercialService.consultarEstadosProcesos();
        setEstadosProcesos(
          estadosProcesosResponse.rows || estadosProcesosResponse || [],
        );

        await GestionComercialService.loadCrmPermissions();
      } catch (error) {
        console.error("Error loading filter data:", error);
      } finally {
        setFilterDataLoading(false);
      }
    };

    if (user?.SucursalID) {
      loadFilterData();
    }
  }, [user?.SucursalID]);

  const handleDeselectContact = useCallback(() => {
    setSelectedContact(null);
    setIsSelectionMode(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialMount.current) {
        handleDeselectContact();
      } else {
        isInitialMount.current = false;
      }
    }, [handleDeselectContact]),
  );

  const handleApplyFilters = useCallback(
    (filters) => {
      setSearchFilters(filters);
      const mode = getCurrentMode();
      let defaultValues = {};
      if (mode === "table" || mode === "timeline") {
        defaultValues = { EstadoProcesoID: "1,4" };
      } else if (mode === "calendar") {
        defaultValues = { EstadoActividadID: "3,4" };
      }
      setHasFilters(
        Object.keys(filters).some(
          (key) =>
            filters[key] !== null &&
            filters[key] !== "" &&
            filters[key] !== defaultValues[key],
        ),
      );
    },
    [getCurrentMode],
  );

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const onSearchAsesores = useCallback(
    async (text) => {
      try {
        const response = await GestionComercialService.consultarAsesores({
          NombreCompleto: text,
          Rows: 20,
          SucursalID: searchFilters.SucursalID || user?.SucursalID,
        });
        return response.rows || response || [];
      } catch (error) {
        console.error("GestionComercial:onSearchAsesores", error);
        return [];
      }
    },
    [searchFilters.SucursalID, user?.SucursalID],
  );

  const handleAdvisorSelected = useCallback(
    (advisor) => {
      const exists = asesores.some((a) => a.AsesorID === advisor.AsesorID);
      if (!exists) {
        setAsesores((prev) => [...prev, advisor]);
      }
    },
    [asesores],
  );

  const handleSelectContact = useCallback((contact) => {
    setSelectedContact(contact);
    setIsSelectionMode(true);
  }, []);

  const handleColorSelect = async (colorId) => {
    if (!selectedContact) return;

    try {
      await GestionComercialService.cambiarColorProceso({
        ProcesoID: selectedContact.ProcesoID,
        Color: colorId,
      });

      Alert.alert("Éxito", "Color aplicado correctamente");
      handleRefresh();
    } catch (error) {
      console.error("Error changing color:", error);
      Alert.alert("Error", "No se pudo cambiar el color");
    }
  };

  const handleViewDetails = () => {
    if (selectedContact) {
      handleDeselectContact();
      navigation.navigate("ContactDetail", { contact: selectedContact });
    }
  };

  const handleViewActivities = () => {
    if (selectedContact) {
      handleDeselectContact();
      navigation.navigate("ActivityFollowupScreen", {
        contact: selectedContact,
      });
    }
  };

  const getActiveFilterTags = useCallback(() => {
    if (filterDataLoading) return [];
    const tags = [];
    const mode = getCurrentMode();

    if (searchFilters.FullSearch) {
      tags.push({ key: "FullSearch", label: `"${searchFilters.FullSearch}"` });
    }

    if (searchFilters.OrigenPreContactoID) {
      const origen = origenes.find(
        (o) => o.OrigenPreContactoID === searchFilters.OrigenPreContactoID,
      );
      if (origen) {
        tags.push({ key: "OrigenPreContactoID", label: origen.Nombre });
      }
    }

    if (searchFilters.TipoCalendarioActividadID) {
      const tipo = tiposCalendarioActividades.find(
        (t) =>
          t.TipoCalendarioActividadID ===
          searchFilters.TipoCalendarioActividadID,
      );
      if (tipo) {
        tags.push({ key: "TipoCalendarioActividadID", label: tipo.Nombre });
      }
    }

    if (searchFilters.AsesorID) {
      const asesor = asesores.find(
        (a) => a.AsesorID === searchFilters.AsesorID,
      );
      if (asesor) {
        tags.push({
          key: "AsesorID",
          label: `Asesor: ${asesor.NombreCompleto}`,
          removable: permisos?.FiltroAsesor === true,
        });
      }
    }

    if (searchFilters.SucursalID) {
      const sucursal = sucursales.find(
        (s) => s.SucursalID === searchFilters.SucursalID,
      );
      if (sucursal) {
        tags.push({
          key: "SucursalID",
          label: `Sucursal: ${sucursal.Nombre}`,
          removable: permisos?.FiltroSucursal === true,
        });
      }
    }

    if (searchFilters.FormaContactoID) {
      const forma = formasContacto.find(
        (f) => f.FormaContactoID === searchFilters.FormaContactoID,
      );
      if (forma) {
        tags.push({ key: "FormaContactoID", label: forma.Nombre });
      }
    }

    if (searchFilters.NombreCompleto) {
      tags.push({
        key: "NombreCompleto",
        label: `Contacto: ${searchFilters.NombreCompleto}`,
      });
    }

    if (searchFilters.ClienteNombreCompleto) {
      tags.push({
        key: "ClienteNombreCompleto",
        label: `Cliente: ${searchFilters.ClienteNombreCompleto}`,
      });
    }

    if (searchFilters.Documento) {
      tags.push({ key: "Documento", label: `Doc: ${searchFilters.Documento}` });
    }

    if (searchFilters.Telefono || searchFilters.Celular) {
      tags.push({
        key: "Phones",
        label: `Tel: ${searchFilters.Celular || searchFilters.Telefono}`,
      });
    }

    if (searchFilters.Email) {
      tags.push({ key: "Email", label: searchFilters.Email });
    }

    if (searchFilters.FechaInicial || searchFilters.FechaFinal) {
      const start = searchFilters.FechaInicial
        ? searchFilters.FechaInicial.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinal
        ? searchFilters.FechaFinal.split(" ")[0]
        : "...";
      tags.push({ key: "Dates", label: `Fecha: ${start} a ${end}` });
    }

    if (searchFilters.FechaInicialCierre || searchFilters.FechaFinalCierre) {
      const start = searchFilters.FechaInicialCierre
        ? searchFilters.FechaInicialCierre.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinalCierre
        ? searchFilters.FechaFinalCierre.split(" ")[0]
        : "...";
      tags.push({ key: "DatesCierre", label: `Cierre: ${start} a ${end}` });
    }

    if (
      searchFilters.FechaInicialPosibleServicio ||
      searchFilters.FechaFinalPosibleServicio
    ) {
      const start = searchFilters.FechaInicialPosibleServicio
        ? searchFilters.FechaInicialPosibleServicio.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinalPosibleServicio
        ? searchFilters.FechaFinalPosibleServicio.split(" ")[0]
        : "...";
      tags.push({ key: "DatesServicio", label: `Servicio: ${start} a ${end}` });
    }

    if (mode === "table" || mode === "timeline") {
      if (
        searchFilters.EstadoProcesoID &&
        searchFilters.EstadoProcesoID !== "1,4"
      ) {
        const estado = FILTER_OPTIONS.estados.find(
          (e) => e.ID === searchFilters.EstadoProcesoID,
        );
        tags.push({
          key: "EstadoProcesoID",
          label: estado ? estado.Nombre : "Estados",
        });
      }

      if (searchFilters.EstadoGeneral) {
        const estadoG = FILTER_OPTIONS.estadosGenerales.find(
          (e) => e.ID === searchFilters.EstadoGeneral,
        );
        tags.push({
          key: "EstadoGeneral",
          label: estadoG ? estadoG.Nombre : searchFilters.EstadoGeneral,
        });
      }
    } else if (mode === "calendar") {
      if (
        searchFilters.EstadoActividadID &&
        searchFilters.EstadoActividadID !== "3,4"
      ) {
        const estadoA = FILTER_OPTIONS.estadosActividades.find(
          (e) => e.ID === searchFilters.EstadoActividadID,
        );
        tags.push({
          key: "EstadoActividadID",
          label: estadoA ? estadoA.Nombre : "Estados Act.",
        });
      }
    }

    return tags;
  }, [
    filterDataLoading,
    getCurrentMode,
    searchFilters,
    origenes,
    tiposCalendarioActividades,
    asesores,
    sucursales,
    formasContacto,
    permisos,
  ]);

  const clearFilter = useCallback(
    (key) => {
      const newFilters = { ...searchFilters };

      if (key === "Dates") {
        newFilters.FechaInicial = null;
        newFilters.FechaFinal = null;
      } else if (key === "DatesCierre") {
        newFilters.FechaInicialCierre = null;
        newFilters.FechaFinalCierre = null;
      } else if (key === "DatesServicio") {
        newFilters.FechaInicialPosibleServicio = null;
        newFilters.FechaFinalPosibleServicio = null;
      } else if (key === "Phones") {
        newFilters.Telefono = "";
        newFilters.Celular = "";
      } else if (key === "EstadoProcesoID") {
        newFilters.EstadoProcesoID = "1,4";
      } else if (key === "EstadoActividadID") {
        newFilters.EstadoActividadID = "3,4";
      } else if (key === "FullSearch") {
        newFilters.FullSearch = "";
      } else if (
        key === "NombreCompleto" ||
        key === "ClienteNombreCompleto" ||
        key === "Documento" ||
        key === "Email"
      ) {
        newFilters[key] = "";
      } else {
        newFilters[key] = null;
      }

      handleApplyFilters(newFilters);
    },
    [searchFilters, handleApplyFilters],
  );

  const activeTags = useMemo(
    () => getActiveFilterTags(),
    [getActiveFilterTags],
  );

  const queryFilters = useMemo(
    () => ({
      ...searchFilters,
    }),
    [
      searchFilters.OrigenPreContactoID,
      searchFilters.EstadoProcesoID,
      searchFilters.FechaInicial,
      searchFilters.FechaFinal,
      searchFilters.FullSearch,
      searchFilters.EstadoGeneral,
      searchFilters.EstadoActividadID,
      searchFilters.TipoCalendarioActividadID,
      searchFilters.AsesorID,
      searchFilters.NombreCompleto,
      searchFilters.FormaContactoID,
      searchFilters.FechaInicialCierre,
      searchFilters.FechaFinalCierre,
      searchFilters.ClienteNombreCompleto,
      searchFilters.Documento,
      searchFilters.Telefono,
      searchFilters.Celular,
      searchFilters.Email,
      searchFilters.SucursalID,
      searchFilters.FechaInicialPosibleServicio,
      searchFilters.FechaFinalPosibleServicio,
    ],
  );

  const renderTableScreen = useCallback(
    (props) => (
      <TableView
        {...props}
        searchFilters={queryFilters}
        refreshTrigger={refreshTrigger}
        selectedContact={selectedContact}
        onSelectContact={handleSelectContact}
        onDeselectContact={handleDeselectContact}
      />
    ),
    [
      queryFilters,
      refreshTrigger,
      selectedContact,
      handleSelectContact,
      handleDeselectContact,
    ],
  );

  const renderTimelineScreen = useCallback(
    (props) => (
      <TimelineView
        {...props}
        searchFilters={queryFilters}
        refreshTrigger={refreshTrigger}
        onSelectContact={handleSelectContact}
      />
    ),
    [queryFilters, refreshTrigger, handleSelectContact],
  );

  const renderCalendarScreen = useCallback(
    (props) => (
      <CalendarView
        {...props}
        searchFilters={queryFilters}
        refreshTrigger={refreshTrigger}
      />
    ),
    [queryFilters, refreshTrigger],
  );

  return (
    <View style={styles.mainContainer}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {isSelectionMode ? (
        <SafeAreaView edges={["top"]} style={styles.selectionHeaderContainer}>
          <View style={styles.selectedHeader}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedContact(null);
              }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={handleViewDetails}
            >
              <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={handleViewActivities}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() =>
                Alert.alert("Flag", "Funcionalidad de flag pendiente")
              }
            >
              <Ionicons name="flag-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => setColorPickerVisible(true)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
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
              <View>
                <Text style={styles.headerSubtitle}>Centro de</Text>
                <Text style={styles.headerTitle}>Gestión comercial</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    hasFilters && styles.headerButtonActive,
                  ]}
                  onPress={() => setFilterModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      currentTab === "Calendario"
                        ? hasFilters
                          ? "calendar"
                          : "calendar-outline"
                        : hasFilters
                          ? "filter"
                          : "filter-outline"
                    }
                    size={20}
                    color="#FFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate("NewLeadScreen")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      )}

      {!isSelectionMode && activeTags.length > 0 && (
        <ActiveFilterTags tags={activeTags} onClear={clearFilter} />
      )}

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#337ab7",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarIndicatorStyle: {
            backgroundColor: "#337ab7",
            height: 3,
            borderRadius: 3,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
            textTransform: "none",
          },
          tabBarStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#F2F2F7",
          },
          swipeEnabled: false,
        }}
        screenListeners={{
          state: (e) => {
            const routeName = e.data.state.routes[e.data.state.index].name;
            if (routeName !== currentTab) {
              setCurrentTab(routeName);
            }
          },
        }}
      >
        <Tab.Screen name="Tabla" options={{ tabBarLabel: "Tabla" }}>
          {renderTableScreen}
        </Tab.Screen>
        <Tab.Screen
          name="LineaTiempo"
          options={{ tabBarLabel: "Línea Tiempo" }}
        >
          {renderTimelineScreen}
        </Tab.Screen>
        <Tab.Screen name="Calendario" options={{ tabBarLabel: "Calendario" }}>
          {renderCalendarScreen}
        </Tab.Screen>
      </Tab.Navigator>

      {currentTab === "Calendario" ? (
        <CalendarFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={searchFilters}
          tiposCalendarioActividades={tiposCalendarioActividades}
          asesores={asesores}
          onSearchAsesores={onSearchAsesores}
          sucursales={sucursales}
          loading={filterDataLoading}
        />
      ) : (
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={searchFilters}
          mode={getCurrentMode()}
          origenes={origenes}
          tiposCalendarioActividades={tiposCalendarioActividades}
          asesores={asesores}
          onSearchAsesores={onSearchAsesores}
          onAdvisorSelected={handleAdvisorSelected}
          sucursales={sucursales}
          formasContacto={formasContacto}
          estadosProcesos={estadosProcesos}
          loading={filterDataLoading}
        />
      )}

      <ColorPickerModal
        visible={colorPickerVisible}
        onClose={() => setColorPickerVisible(false)}
        onColorSelect={handleColorSelect}
        selectedContacts={selectedContact ? [selectedContact] : []}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    left: -30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionHeaderContainer: {
    backgroundColor: "#fff",
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  selectionButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GestionComercial;
