import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../core/global';
const GestionComercialService = require('../../services/GestionComercial/gestionComercialService').default;
import ContactItem from '../../components/GestionComercial/ContactItem';
import FilterModal from '../../components/GestionComercial/FilterModal';
import TimelineColumn from '../../components/GestionComercial/TimelineColumn';
import CalendarEvent from '../../components/GestionComercial/CalendarEvent';

const Tab = createMaterialTopTabNavigator();

// Table View Component
const TableView = ({ navigation, searchFilters, onRefresh }) => {
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

      const response = await GestionComercialService.consultarPreContactos(filters);
      const newContacts = response.rows || [];

      if (pageNum === 1) {
        setContacts(newContacts);
      } else {
        setContacts(prev => [...prev, ...newContacts]);
      }

      setHasMore(newContacts.length === 30);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts(1, true);
  }, [searchFilters]);

  useFocusEffect(
    useCallback(() => {
      loadContacts(1, true);
    }, [])
  );

  const handleRefresh = () => {
    loadContacts(1, true);
    onRefresh && onRefresh();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadContacts(page + 1);
    }
  };

  const handleContactPress = (contact) => {
    navigation.navigate('ContactDetail', { contact });
  };

  const renderContact = ({ item }) => (
    <ContactItem
      item={item}
      onPress={handleContactPress}
    />
  );

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
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.ProcesoID?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#337ab7']}
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
const TimelineView = ({ navigation, searchFilters, onRefresh }) => {
  const { user } = useGlobal();
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeline = async (isRefresh = false) => {
    // Timeline requires a specific origin to be selected
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

      const response = await GestionComercialService.consultarLineasTiempo(filters);
      setTimelineData(response.data || []);
    } catch (error) {
      console.error('Error loading timeline:', error);
      Alert.alert('Error', 'No se pudo cargar la línea de tiempo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [searchFilters]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline(true);
    }, [])
  );

  const handleRefresh = () => {
    loadTimeline(true);
    onRefresh && onRefresh();
  };

  const handleContactPress = (contact) => {
    navigation.navigate('ContactDetail', { contact });
  };

  const handleMoveContact = async (contact, direction) => {
    // Simplified move logic for mobile
    Alert.alert(
      'Mover contacto',
      `¿Mover "${contact.NombreCompleto}" ${direction === 'left' ? 'a la izquierda' : 'a la derecha'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover',
          onPress: async () => {
            try {
              // Find target column
              const currentIndex = timelineData.findIndex(linea =>
                linea.Procesos?.some(p => p.ProcesoID === contact.ProcesoID)
              );

              if (currentIndex === -1) return;

              const targetIndex = direction === 'left'
                ? Math.max(0, currentIndex - 1)
                : Math.min(timelineData.length - 1, currentIndex + 1);

              if (targetIndex === currentIndex) return;

              await GestionComercialService.moverLineaTiempo({
                ProcesoID: contact.ProcesoID,
                ProcesoLineaTiempoID: timelineData[targetIndex].ProcesoLineaTiempoID,
              });

              loadTimeline(true);
            } catch (error) {
              console.error('Error moving contact:', error);
              Alert.alert('Error', 'No se pudo mover el contacto');
            }
          }
        }
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
          <Text style={styles.emptyText}>No hay línea de tiempo configurada</Text>
        </View>
      )}
    </ScrollView>
  );
};

// Calendar View Component
const CalendarView = ({ navigation, searchFilters, onRefresh }) => {
  const { user } = useGlobal();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        EstadoActividadID: "3,4",
        SucursalID: user?.SucursalID,
        UsuarioID: user?.UsuarioID,
      };

      const response = await GestionComercialService.consultarMiCalendarioTabla(filters);
      setEvents(response.rows || []);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      Alert.alert('Error', 'No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [searchFilters]);

  useFocusEffect(
    useCallback(() => {
      loadEvents(true);
    }, [])
  );

  const handleRefresh = () => {
    loadEvents(true);
    onRefresh && onRefresh();
  };

  const handleEventPress = (event) => {
    navigation.navigate('ActivityDetail', { activity: event });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#337ab7" />
        <Text style={styles.loadingText}>Cargando actividades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <CalendarEvent
            event={item}
            onPress={handleEventPress}
          />
        )}
        keyExtractor={(item) => item.CalendarioActividadID?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#337ab7']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay actividades programadas</Text>
          </View>
        }
        contentContainerStyle={events.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

// Main Component
const GestionComercial = ({ navigation }) => {
  const { user } = useGlobal();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    OrigenPreContactoID: null,
    EstadoProcesoID: "1,4",
    AsesorID: null,
    FechaInicial: null,
    FechaFinal: null,
    FullSearch: '',
    EstadoGeneral: null,
  });
  const [hasFilters, setHasFilters] = useState(false);

  useEffect(() => {
    const loadDefaultOrigin = async () => {
      try {
        const response = await GestionComercialService.consultarOrigenesPreContactosSucursales({
          SucursalID: user?.SucursalID,
        });
        if (response.rows && response.rows.length > 0) {
          setSearchFilters(prev => ({
            ...prev,
            OrigenPreContactoID: response.rows[0].OrigenPreContactoID
          }));
        }
        // Keep OrigenPreContactoID as null to allow loading all contacts if no origins found
      } catch (error) {
        console.error('Error loading default origin:', error);
        // Keep OrigenPreContactoID as null to allow loading all contacts
      }
    };

    if (user?.SucursalID) {
      loadDefaultOrigin();
    }
  }, [user?.SucursalID]);

  const handleApplyFilters = (filters) => {
    setSearchFilters(filters);
    setHasFilters(Object.values(filters).some(value =>
      value !== null && value !== '' && value !== "1,4"
    ));
  };

  const handleRefresh = () => {
    // This will trigger refresh in child components
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Procesos de</Text>
          <Text style={styles.title}>Gestión Comercial</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, hasFilters && styles.headerButtonActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name={hasFilters ? "filter" : "filter-outline"}
              size={22}
              color={hasFilters ? "#337ab7" : "#3A3A3C"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewLeadScreen')}
          >
            <LinearGradient
              colors={['#337ab7', '#00ACC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#337ab7',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarIndicatorStyle: {
            backgroundColor: '#337ab7',
            height: 3,
            borderRadius: 3,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#F2F2F7',
          },
          swipeEnabled: false, // Fix navigation conflict with horizontal timeline
        }}
      >
        <Tab.Screen
          name="Tabla"
          children={() => (
            <TableView
              navigation={navigation}
              searchFilters={searchFilters}
              onRefresh={handleRefresh}
            />
          )}
          options={{
            tabBarLabel: 'Tabla',
          }}
        />
        <Tab.Screen
          name="LineaTiempo"
          children={() => (
            <TimelineView
              navigation={navigation}
              searchFilters={searchFilters}
              onRefresh={handleRefresh}
            />
          )}
          options={{
            tabBarLabel: 'Línea Tiempo',
          }}
        />
        <Tab.Screen
          name="Calendario"
          children={() => (
            <CalendarView
              navigation={navigation}
              searchFilters={searchFilters}
              onRefresh={handleRefresh}
            />
          )}
          options={{
            tabBarLabel: 'Calendario',
          }}
        />
      </Tab.Navigator>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={searchFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#E5F1FF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#337ab7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingFooter: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  timelineContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  emptyTimeline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 64,
  },
});

export default GestionComercial;