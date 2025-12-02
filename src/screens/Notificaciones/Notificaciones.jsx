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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore } from '../../core/chatStore';
import chatApi from '../../services/chat/chatService';
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
  const [filterVisto, setFilterVisto] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const loadingRef = useRef(false);
  const currentFilterRef = useRef(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (loadingRef.current) return;

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
          const currentNotifications = useChatStore.getState().notifications;
          setNotifications([...currentNotifications, ...response.rows]);
        } else {
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

  useEffect(() => {
    setInitialLoadDone(false);
  }, [usuarioID]);

  useEffect(() => {
    if (usuarioID && !initialLoadDone) {
      loadNotifications(1, false);
      setInitialLoadDone(true);
    }
  }, [usuarioID, initialLoadDone, loadNotifications]);

  useEffect(() => {
    if (usuarioID && initialLoadDone && !notificationsLoading && currentFilterRef.current !== filterVisto) {
      currentFilterRef.current = filterVisto;
      const timeoutId = setTimeout(() => {
        loadNotifications(1, false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [filterVisto, usuarioID, initialLoadDone, notificationsLoading, loadNotifications]);

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

  const openNotificationUrl = (notificacion) => {
    if (notificacion.Url) {
      if (!notificacion.Visto) {
        markAsRead(notificacion);
      }
      console.log('Abrir URL:', notificacion.Url);
    }
  };

  // Componente de notificación con animación
  const NotificationCard = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const isUnread = !item.Visto;

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            isUnread && styles.unreadNotification,
          ]}
          onPress={() => openNotificationUrl(item)}
          activeOpacity={0.8}
        >
          {/* Indicador de no leída */}
          {isUnread && (
            <View style={styles.unreadIndicator}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unreadGradient}
              />
            </View>
          )}

          {/* Icono de notificación */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={isUnread ? ['#667eea', '#764ba2'] : ['#e0e0e0', '#bdbdbd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons
                name="notifications"
                size={22}
                color="#fff"
              />
            </LinearGradient>
          </View>

          {/* Contenido */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  isUnread && styles.unreadTitle,
                ]}
                numberOfLines={2}
              >
                {item.Titulo}
              </Text>
              {isUnread && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NUEVO</Text>
                </View>
              )}
            </View>

            <Text style={styles.notificationText} numberOfLines={3}>
              {item.Texto}
            </Text>

            <View style={styles.notificationFooter}>
              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={14} color="#9e9e9e" />
                <Text style={styles.notificationDate}>
                  {new Date(item.Fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Acciones */}
          <View style={styles.notificationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                item.Visto ? markAsUnread(item) : markAsRead(item);
              }}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name={item.Visto ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={item.Visto ? '#9e9e9e' : '#667eea'}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteNotification(item);
              }}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="trash-outline" size={20} color="#ef5350" />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderNotificationItem = ({ item, index }) => (
    <NotificationCard item={item} index={index} />
  );

  // Contar notificaciones por filtro
  const getFilterCounts = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.Visto).length;
    const read = notifications.filter(n => n.Visto).length;
    return { total, unread, read };
  };

  const counts = getFilterCounts();

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filterVisto === null && styles.filterActive]}
        onPress={() => setFilterVisto(null)}
        activeOpacity={0.7}
      >
        {filterVisto === null ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.filterGradient}
          >
            <Text style={styles.filterTextActive}>Todas</Text>
            {counts.total > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{counts.total}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <Text style={styles.filterText}>Todas</Text>
            {counts.total > 0 && (
              <View style={styles.filterBadgeInactive}>
                <Text style={styles.filterBadgeTextInactive}>{counts.total}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filterVisto === false && styles.filterActive]}
        onPress={() => setFilterVisto(false)}
        activeOpacity={0.7}
      >
        {filterVisto === false ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.filterGradient}
          >
            <Text style={styles.filterTextActive}>No Vistas</Text>
            {counts.unread > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{counts.unread}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <Text style={styles.filterText}>No Vistas</Text>
            {counts.unread > 0 && (
              <View style={styles.filterBadgeInactive}>
                <Text style={styles.filterBadgeTextInactive}>{counts.unread}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterButton, filterVisto === true && styles.filterActive]}
        onPress={() => setFilterVisto(true)}
        activeOpacity={0.7}
      >
        {filterVisto === true ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.filterGradient}
          >
            <Text style={styles.filterTextActive}>Vistas</Text>
            {counts.read > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{counts.read}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.filterInactive}>
            <Text style={styles.filterText}>Vistas</Text>
            {counts.read > 0 && (
              <View style={styles.filterBadgeInactive}>
                <Text style={styles.filterBadgeTextInactive}>{counts.read}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              <Text style={styles.headerSubtitle}>
                {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
              </Text>
            </View>
            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={deleteAllNotifications}
                activeOpacity={0.7}
              >
                <View style={styles.clearAllButtonInner}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de notificaciones */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.NotificacionUsuarioID.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
          />
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
            <LinearGradient
              colors={['#f5f7fa', '#c3cfe2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <Ionicons name="notifications-off-outline" size={80} color="#9e9e9e" />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
              <Text style={styles.emptySubtext}>
                Cuando recibas notificaciones aparecerán aquí
              </Text>
            </LinearGradient>
          </View>
        }
        ListFooterComponent={
          notificationsLoading && !refreshing ? (
            <ActivityIndicator style={styles.loadingIndicator} size="large" color="#667eea" />
          ) : null
        }
      />
    </View>
  );
};

export default Notificaciones;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  clearAllButton: {
    padding: 8,
  },
  clearAllButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  filterInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
    borderRadius: 25,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '600',
  },
  filterTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  filterBadgeInactive: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeTextInactive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadNotification: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  unreadGradient: {
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
    marginLeft: 4,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#000',
  },
  newBadge: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notificationText: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  notificationActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  emptyText: {
    fontSize: 20,
    color: '#616161',
    marginTop: 20,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});