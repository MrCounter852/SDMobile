import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobal } from "../../core/global";
const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;
import ContactItem from "../../components/GestionComercial/ContactItem";
import FilterModal from "../../components/GestionComercial/FilterModal";
import TimelineColumn from "../../components/GestionComercial/TimelineColumn";
import CalendarEvent from "../../components/GestionComercial/CalendarEvent";
import ColorPickerModal from "../../components/GestionComercial/ColorPickerModal";
import GestionComercialCalendar from "../../components/GestionComercial/GestionComercialCalendar";

const Tab = createMaterialTopTabNavigator();

// Table View Component
const TableView = ({
  navigation,
  searchFilters,
  refreshTrigger,
  selectedContact,
  onSelectContact,
  onDeselectContact,
}) => {
  const { user } = useGlobal();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadContacts = async (pageNum = 1, isRefresh = false) => {
    if (loading && !isRefresh) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        ...searchFilters,
        Page: pageNum,
        Rows: 30,
        SucursalID: user?.SucursalID,
      };

      // Remove OrigenPreContactoID if it's null to allow loading all contacts
      if (filters.OrigenPreContactoID === null) {
        delete filters.OrigenPreContactoID;
      }

      const response = await GestionComercialService.consultarPreContactos(
        filters
      );
      const newContacts = response.rows || [];

      if (pageNum === 1) {
        setContacts(newContacts);
      } else {
        setContacts((prev) => [...prev, ...newContacts]);
      }

      setHasMore(newContacts.length === 30);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "No se pudieron cargar los contactos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts(1, true);
  }, [searchFilters, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadContacts(1, true);
    }, [searchFilters, refreshTrigger])
  );

  const handleRefresh = () => {
    loadContacts(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadContacts(page + 1);
    }
  };

  const handleContactPress = (contact) => {
    navigation.navigate("ContactDetail", { contact });
  };

  const renderContact = ({ item }) => {
    const isSelected = selectedContact?.ProcesoID === item.ProcesoID;
    return (
      <ContactItem
        item={item}
        onPress={handleContactPress}
        onLongPress={(contact) => onSelectContact(contact)}
        isSelected={isSelected}
      />
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#337ab7" />
        <Text style={styles.loadingText}>Cargando más...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {searchFilters.tags && searchFilters.tags.length > 0 && (
        <View style={styles.tagsOuterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          >
            {searchFilters.tags.map((tag) => (
              <TouchableOpacity
                key={tag.key}
                style={styles.tagItem}
                onPress={() => searchFilters.onClear(tag.key)}
              >
                <Text style={styles.tagLabel}>{tag.label}</Text>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#337ab7"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) =>
          item.ProcesoID?.toString() || Math.random().toString()
        }
        key={refreshTrigger}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#337ab7"]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay contactos disponibles</Text>
            </View>
          )
        }
        contentContainerStyle={contacts.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

// Timeline View Component
const TimelineView = ({
  navigation,
  searchFilters,
  refreshTrigger,
  onSelectContact,
}) => {
  const { user } = useGlobal();
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeline = async (isRefresh = false) => {
    if (!searchFilters.OrigenPreContactoID) {
      setTimelineData([]);
      return;
    }
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        ...searchFilters,
        SucursalID: user?.SucursalID,
      };

      const response = await GestionComercialService.consultarLineasTiempo(
        filters
      );
      setTimelineData(response.data || []);
    } catch (error) {
      console.error("Error loading timeline:", error);
      setTimelineData([]);
      // Alert.alert('Error', 'No se pudo cargar la línea de tiempo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [searchFilters, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline(true);
    }, [searchFilters, refreshTrigger])
  );

  const handleRefresh = () => {
    loadTimeline(true);
  };

  const handleContactPress = (contact) => {
    navigation.navigate("ContactDetail", { contact });
  };

  const handleLongPress = (contact) => {
    onSelectContact(contact);
  };

  const handleMoveContact = async (contact, direction) => {
    // Simplified move logic for mobile
    Alert.alert(
      "Mover contacto",
      `¿Mover "${contact.NombreCompleto}" ${
        direction === "left" ? "a la izquierda" : "a la derecha"
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Mover",
          onPress: async () => {
            try {
              // Find target column
              const currentIndex = timelineData.findIndex((linea) =>
                linea.Procesos?.some((p) => p.ProcesoID === contact.ProcesoID)
              );

              if (currentIndex === -1) return;

              const targetIndex =
                direction === "left"
                  ? Math.max(0, currentIndex - 1)
                  : Math.min(timelineData.length - 1, currentIndex + 1);

              if (targetIndex === currentIndex) return;

              await GestionComercialService.moverLineaTiempo({
                ProcesoID: contact.ProcesoID,
                ProcesoLineaTiempoID:
                  timelineData[targetIndex].ProcesoLineaTiempoID,
              });

              loadTimeline(true);
            } catch (error) {
              console.error("Error moving contact:", error);
              Alert.alert("Error", "No se pudo mover el contacto");
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#337ab7" />
        <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {searchFilters.tags && searchFilters.tags.length > 0 && (
        <View style={styles.tagsOuterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          >
            {searchFilters.tags.map((tag) => (
              <TouchableOpacity
                key={tag.key}
                style={styles.tagItem}
                onPress={() => searchFilters.onClear(tag.key)}
              >
                <Text style={styles.tagLabel}>{tag.label}</Text>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#337ab7"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineContainer}
      >
        {timelineData.map((linea) => (
          <TimelineColumn
            key={linea.ProcesoLineaTiempoID}
            linea={linea}
            onContactPress={handleContactPress}
            onMoveContact={handleMoveContact}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ))}

        {timelineData.length === 0 && (
          <View style={styles.emptyTimeline}>
            <Ionicons name="git-branch-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay línea de tiempo configurada
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Calendar View Component
const CalendarView = ({
  navigation,
  searchFilters,
  refreshTrigger,
}) => {
  return (
    <GestionComercialCalendar
      navigation={navigation}
      searchFilters={searchFilters}
      refreshTrigger={refreshTrigger}
    />
  );
};

// Main Component
const GestionComercial = ({ navigation }) => {
  const { user } = useGlobal();
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
  });
  const [hasFilters, setHasFilters] = useState(false);
  const [origenes, setOrigenes] = useState([]);
  const [tiposCalendarioActividades, setTiposCalendarioActividades] = useState(
    []
  );
  const [filterDataLoading, setFilterDataLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const isInitialMount = useRef(true);

  const getCurrentMode = () => {
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
  };

  useEffect(() => {
    const loadFilterData = async () => {
      setFilterDataLoading(true);
      try {
        // Load origenes
        const origenesResponse =
          await GestionComercialService.consultarOrigenesPreContactosSucursales(
            {
              SucursalID: user?.SucursalID,
            }
          );
        setOrigenes(origenesResponse.rows || []);

        // Load tipos calendario actividades
        const tiposResponse =
          await GestionComercialService.consultarTiposCalendarioActividades();
        setTiposCalendarioActividades(tiposResponse.rows || []);
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



  // Salir automáticamente del modo selección cuando se regresa a esta pantalla
  useFocusEffect(
    useCallback(() => {
      // Solo actuar si no es el montaje inicial y hay algo seleccionado
      if (!isInitialMount.current) {
        handleDeselectContact();
      } else {
        isInitialMount.current = false;
      }
    }, [handleDeselectContact])
  );

  const handleApplyFilters = (filters) => {
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
          filters[key] !== defaultValues[key]
      )
    );
  };

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setIsSelectionMode(true);
  };

  const handleDeselectContact = useCallback(() => {
    setSelectedContact(null);
    setIsSelectionMode(false);
  }, []);

  const handleColorSelect = async (colorId) => {
    if (!selectedContact) return;

    try {
      await GestionComercialService.cambiarColorProceso({
        ProcesoID: selectedContact.ProcesoID,
        Color: colorId,
      });

      Alert.alert("Éxito", "Color aplicado correctamente");

      // Recargar datos después del éxito de la API
      handleRefresh();
    } catch (error) {
      console.error("Error changing color:", error);
      Alert.alert("Error", "No se pudo cambiar el color");
    }
  };

  const handleViewDetails = () => {
    if (selectedContact) {
      handleDeselectContact(); // Salir del modo selección antes de navegar
      navigation.navigate("ContactDetail", { contact: selectedContact });
    }
  };

  const handleViewActivities = () => {
    if (selectedContact) {
      handleDeselectContact(); // Salir del modo selección antes de navegar
      navigation.navigate("ActivityFollowupScreen", {
        contact: selectedContact,
      });
    }
  };

  const getActiveFilterTags = () => {
    if (filterDataLoading) return [];
    const tags = [];
    const mode = getCurrentMode();

    if (searchFilters.FullSearch) {
      tags.push({ key: "FullSearch", label: `"${searchFilters.FullSearch}"` });
    }

    if (searchFilters.OrigenPreContactoID) {
      const origen = origenes.find(
        (o) => o.OrigenPreContactoID === searchFilters.OrigenPreContactoID
      );
      if (origen) {
        tags.push({ key: "OrigenPreContactoID", label: origen.Nombre });
      }
    }

    if (searchFilters.TipoCalendarioActividadID) {
      const tipo = tiposCalendarioActividades.find(
        (t) =>
          t.TipoCalendarioActividadID ===
          searchFilters.TipoCalendarioActividadID
      );
      if (tipo) {
        tags.push({ key: "TipoCalendarioActividadID", label: tipo.Nombre });
      }
    }

    if (searchFilters.FechaInicial || searchFilters.FechaFinal) {
      const start = searchFilters.FechaInicial
        ? searchFilters.FechaInicial.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinal
        ? searchFilters.FechaFinal.split(" ")[0]
        : "...";
      tags.push({ key: "Dates", label: `${start} a ${end}` });
    }

    if (mode === "table" || mode === "timeline") {
      if (
        searchFilters.EstadoProcesoID &&
        searchFilters.EstadoProcesoID !== "1,4"
      ) {
        tags.push({ key: "EstadoProcesoID", label: "Estados" });
      }
    } else if (mode === "calendar") {
      if (
        searchFilters.EstadoActividadID &&
        searchFilters.EstadoActividadID !== "3,4"
      ) {
        tags.push({ key: "EstadoActividadID", label: "Estados Act." });
      }
    }

    return tags;
  };

  const clearFilter = (key) => {
    const mode = getCurrentMode();
    const newFilters = { ...searchFilters };

    if (key === "Dates") {
      newFilters.FechaInicial = null;
      newFilters.FechaFinal = null;
    } else if (key === "EstadoProcesoID") {
      newFilters.EstadoProcesoID = "1,4";
    } else if (key === "EstadoActividadID") {
      newFilters.EstadoActividadID = "3,4";
    } else if (key === "FullSearch") {
      newFilters.FullSearch = "";
    } else {
      newFilters[key] = null;
    }

    handleApplyFilters(newFilters);
  };

  const activeTags = getActiveFilterTags();

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top", "left", "right"]}>
      {isSelectionMode ? (
        <View style={styles.selectedHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedContact(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleViewDetails}
          >
            <Ionicons name="eye-outline" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleViewActivities}
          >
            <Ionicons name="calendar-outline" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              Alert.alert("Flag", "Funcionalidad de flag pendiente")
            }
          >
            <Ionicons name="flag-outline" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setColorPickerVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#337ab7" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Centro de</Text>
            <Text style={styles.title}>Gestión comercial</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                hasFilters && styles.headerButtonActive,
              ]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons
                name={hasFilters ? "filter" : "filter-outline"}
                size={22}
                color={hasFilters ? "#337ab7" : "#3A3A3C"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("NewLeadScreen")}
            >
              <LinearGradient
                colors={["#337ab7", "#00ACC4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Tab.Navigator
        screenOptions={({ route }) => ({
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
          swipeEnabled: false, // Fix navigation conflict with horizontal timeline
          tabBarOnPress: () => {
            setCurrentTab(route.name);
          },
        })}
      >
        <Tab.Screen
          name="Tabla"
          children={() => (
            <TableView
              navigation={navigation}
              searchFilters={{
                ...searchFilters,
                tags: activeTags,
                onClear: clearFilter,
              }}
              refreshTrigger={refreshTrigger}
              selectedContact={selectedContact}
              onSelectContact={handleSelectContact}
              onDeselectContact={handleDeselectContact}
            />
          )}
          options={{
            tabBarLabel: "Tabla",
          }}
        />
        <Tab.Screen
          name="LineaTiempo"
          children={() => (
            <TimelineView
              navigation={navigation}
              searchFilters={{
                ...searchFilters,
                tags: activeTags,
                onClear: clearFilter,
              }}
              refreshTrigger={refreshTrigger}
              onSelectContact={handleSelectContact}
            />
          )}
          options={{
            tabBarLabel: "Línea Tiempo",
          }}
        />
        <Tab.Screen
          name="Calendario"
          children={() => (
            <CalendarView
              navigation={navigation}
              searchFilters={{
                ...searchFilters,
                tags: activeTags,
                onClear: clearFilter,
              }}
              refreshTrigger={refreshTrigger}
            />
          )}
          options={{
            tabBarLabel: "Calendario",
          }}
        />
      </Tab.Navigator>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={searchFilters}
        mode={getCurrentMode()}
        origenes={origenes}
        tiposCalendarioActividades={tiposCalendarioActividades}
        loading={filterDataLoading}
      />

      <ColorPickerModal
        visible={colorPickerVisible}
        onClose={() => setColorPickerVisible(false)}
        onColorSelect={handleColorSelect}
        selectedContacts={selectedContact ? [selectedContact] : []}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#337ab7",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "#E5F1FF",
    borderRadius: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#337ab7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    height: 75,
  },
  headerButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingFooter: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEAEB2",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  timelineContainer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  emptyTimeline: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 64,
  },
  tagsOuterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#337ab720",
  },
  tagLabel: {
    fontSize: 13,
    color: "#337ab7",
    fontWeight: "600",
  },
});

export default GestionComercial;
