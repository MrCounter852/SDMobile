import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../core/chatStore';
import chatApi from '../../core/chatApi';
import { useGlobal } from '../../core/global';

const Notificaciones = ({ navigation }) => {
  const {
    notifications,
    notificationsLoading,
    notificationFilters,
    setNotifications,
    setNotificationsLoading,
    updateNotification,
    removeNotification,
    clearNotifications,
    updateNotificationFilters,
  } = useChatStore();

  const { usuarioID } = useGlobal();
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisto, setFilterVisto] = useState(null); // null = todas, true = vistas, false = no vistas
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const loadingRef = useRef(false); // Ref para evitar llamadas API simultáneas
  const currentFilterRef = useRef(null); // Ref para evitar recargas innecesarias por cambios de filtro

  // Cargar notificaciones
  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (loadingRef.current) return; // Evitar llamadas simultáneas

    try {
      loadingRef.current = true;
      setNotificationsLoading(true);
      const filters = {
        Page: page,
        Rows: 20,
        UsuarioID: usuarioID,
        Visto: filterVisto,
        FullSearch: null,
      };

      const response = await chatApi.consultarNotificacionesPush(filters);

      if (response.result === 1) {
        if (append && page > 1) {
          // Agregar a la lista existente - get current notifications to avoid dependency
          const currentNotifications = useChatStore.getState().notifications;
          setNotifications([...currentNotifications, ...response.rows]);
        } else {
          // Reemplazar la lista
          setNotifications(response.rows || []);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setNotificationsLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [usuarioID, filterVisto, setNotifications, setNotificationsLoading]);

  // Resetear estado cuando cambia el usuario
  useEffect(() => {
    setInitialLoadDone(false);
  }, [usuarioID]);


  // Cargar notificaciones iniciales (similar al ERP web)
  useEffect(() => {
    if (usuarioID && !initialLoadDone) {
      console.log('Loading initial notifications (ERP style)');
      loadNotifications(1, false);
      setInitialLoadDone(true);
    }
  }, [usuarioID, initialLoadDone, loadNotifications]);

  // Recargar cuando cambian filtros (con debounce como en ERP)
  // Solo recarga después de 500ms de inactividad, NO cada 500ms
  useEffect(() => {
    if (usuarioID && initialLoadDone && !notificationsLoading && currentFilterRef.current !== filterVisto) {
      currentFilterRef.current = filterVisto;
      const timeoutId = setTimeout(() => {
        console.log('Reloading notifications due to filter change:', filterVisto);
        loadNotifications(1, false);
      }, 500); // Espera 500ms de inactividad antes de recargar

      return () => clearTimeout(timeoutId); // Cancela si cambia antes
    }
  }, [filterVisto, usuarioID, initialLoadDone, notificationsLoading, loadNotifications]);

  // Marcar notificación como vista
  const markAsRead = async (notificacion) => {
    if (notificacion.Visto) return;

    try {
      await chatApi.actualizarNotificacionPush({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Visto: true,
      });

      updateNotification(notificacion.NotificacionUsuarioID, {
        Visto: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar notificación como no vista
  const markAsUnread = async (notificacion) => {
    if (!notificacion.Visto) return;

    try {
      await chatApi.actualizarNotificacionPush({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Visto: false,
      });

      updateNotification(notificacion.NotificacionUsuarioID, {
        Visto: false,
      });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  // Eliminar notificación
  const deleteNotification = (notificacion) => {
    Alert.alert(
      'Eliminar Notificación',
      '¿Está seguro de que desea eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatApi.eliminarNotificacionPush({
                NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
              });

              removeNotification(notificacion.NotificacionUsuarioID);
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'No se pudo eliminar la notificación');
            }
          },
        },
      ]
    );
  };

  // Eliminar todas las notificaciones
  const deleteAllNotifications = () => {
    Alert.alert(
      'Eliminar Todas las Notificaciones',
      '¿Está seguro de que desea eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todas',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatApi.eliminarTodasNotificacionesPush();
              clearNotifications();
            } catch (error) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
            }
          },
        },
      ]
    );
  };

  // Abrir URL de la notificación
  const openNotificationUrl = (notificacion) => {
    if (notificacion.Url) {
      // Marcar como vista si no lo está
      if (!notificacion.Visto) {
        markAsRead(notificacion);
      }
      // Aquí puedes usar Linking para abrir URLs
      console.log('Abrir URL:', notificacion.Url);
      // Linking.openURL(notificacion.Url);
    }
  };

  // Renderizar item de notificación
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => openNotificationUrl(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={2}>
            {item.Titulo}
          </Text>
          <Text style={styles.notificationDate}>
            {new Date(item.Fecha).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.notificationText} numberOfLines={3}>
          {item.Texto}
        </Text>
      </View>

      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => item.Visto ? markAsUnread(item) : markAsRead(item)}
        >
          <Ionicons
            name={item.Visto ? "eye-off" : "eye"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteNotification(item)}
        >
          <Ionicons name="trash" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Filtros
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filterVisto === null && styles.filterActive]}
        onPress={() => setFilterVisto(null)}
      >
        <Text style={[styles.filterText, filterVisto === null && styles.filterTextActive]}>
          Todas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filterVisto === false && styles.filterActive]}
        onPress={() => setFilterVisto(false)}
      >
        <Text style={[styles.filterText, filterVisto === false && styles.filterTextActive]}>
          No Vistas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filterVisto === true && styles.filterActive]}
        onPress={() => setFilterVisto(true)}
      >
        <Text style={[styles.filterText, filterVisto === true && styles.filterTextActive]}>
          Vistas
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={deleteAllNotifications}
          >
            <Ionicons name="trash" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de notificaciones */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.NotificacionUsuarioID.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (!notificationsLoading && notifications.length > 0) {
            const nextPage = Math.ceil(notifications.length / notificationFilters.Rows) + 1;
            loadNotifications(nextPage, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
          </View>
        }
        ListFooterComponent={
          notificationsLoading && !refreshing ? (
            <ActivityIndicator style={styles.loadingIndicator} color="#337ab7" />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default Notificaciones;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#28a745',
    marginLeft: 4,
    fontWeight: '500',
  },
  connectionTextOffline: {
    color: '#dc3545',
  },
  clearAllButton: {
    padding: 5,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#337ab7',
  },
  filterActive: {
    backgroundColor: '#337ab7',
  },
  filterText: {
    fontSize: 14,
    color: '#337ab7',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 10,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  newNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#337ab7',
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  notificationDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  notificationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginBottom: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 10,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});