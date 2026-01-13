import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useChatStore } from "../../features/chat/store/chatStore";
import chatApi from "../../features/chat/services/chatService";
import { useGlobal } from "../../core/global";
import FocusAwareStatusBar from "../../components/FocusAwareStatusBar";
import { COLORS } from "../../core/theme";

const Notificaciones = ({ navigation }) => {
  const {
    notifications,
    notificationsLoading,
    setNotifications,
    fetchNotifications, // Import action
    updateNotification,
    removeNotification,
    clearNotifications,
  } = useChatStore();

  const { usuarioID } = useGlobal();
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisto, setFilterVisto] = useState(false); // Default to Unread (No Vistas)
  // Removed local loading states that are now handled in store or not needed
  const currentFilterRef = useRef(null);

  // Reload notifications (Fetches ALL)
  const loadNotifications = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(usuarioID);
    setRefreshing(false);
  }, [usuarioID, fetchNotifications]);

  // Local Filtering
  const filteredNotifications = useMemo(() => {
    if (filterVisto === null) return notifications;
    return notifications.filter((n) => n.Visto === filterVisto);
  }, [notifications, filterVisto]);

  const markAsRead = async (notificacion) => {
    if (notificacion.Visto) return;

    // Optimistic Update
    updateNotification(notificacion.NotificacionUsuarioID, { Visto: true });

    try {
      const response = await chatApi.actualizarNotificacionPush({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Visto: true,
      });

      if (response && response.result !== 1) {
        updateNotification(notificacion.NotificacionUsuarioID, {
          Visto: false,
        });
        Alert.alert("Error", "No se pudo marcar como leída");
      }
    } catch (error) {
      updateNotification(notificacion.NotificacionUsuarioID, { Visto: false });
      console.error("Error marking notification as read:", error);
    }
  };

  const markAsUnread = async (notificacion) => {
    if (!notificacion.Visto) return;

    // Optimistic Update
    updateNotification(notificacion.NotificacionUsuarioID, { Visto: false });

    try {
      const response = await chatApi.actualizarNotificacionPush({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Visto: false,
      });

      if (response && response.result !== 1) {
        updateNotification(notificacion.NotificacionUsuarioID, { Visto: true });
        Alert.alert("Error", "No se pudo marcar como no leída");
      }
    } catch (error) {
      updateNotification(notificacion.NotificacionUsuarioID, { Visto: true });
      console.error("Error marking notification as unread:", error);
    }
  };

  const deleteNotification = (notificacion) => {
    Alert.alert(
      "Eliminar Notificación",
      "¿Está seguro de que desea eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // Optimistic Delete
            removeNotification(notificacion.NotificacionUsuarioID);

            try {
              const response = await chatApi.eliminarNotificacionPush({
                NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
              });

              if (response && response.result !== 1) {
                // Rollback (requires fetching or adding back, simplified: Alert + reload)
                Alert.alert("Error", "No se pudo eliminar la notificación");
                loadNotifications(); // Reload to sync
              }
            } catch (error) {
              console.error("Error deleting notification:", error);
              Alert.alert("Error", "No se pudo eliminar la notificación");
              loadNotifications(); // Reload to sync
            }
          },
        },
      ]
    );
  };

  const deleteAllNotifications = () => {
    Alert.alert(
      "Eliminar Todas las Notificaciones",
      "¿Está seguro de que desea eliminar todas las notificaciones?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar Todas",
          style: "destructive",
          onPress: async () => {
            // Optimistic clear
            const backupNotifications = [...notifications]; // Backup in case of error (optional but good practice)
            clearNotifications();

            try {
              const response = await chatApi.eliminarTodasNotificacionesPush();
              if (response && response.result !== 1) {
                // Error handled by reload
                Alert.alert(
                  "Error",
                  "No se pudieron eliminar las notificaciones"
                );
                loadNotifications();
              }
            } catch (error) {
              console.error("Error deleting all notifications:", error);
              Alert.alert(
                "Error",
                "No se pudieron eliminar las notificaciones"
              );
              loadNotifications();
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
      console.log("Abrir URL:", notificacion.Url);
    }
  };

  // Componente de notificación con animación
  const NotificationCard = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const heightAnim = useRef(new Animated.Value(200)).current; // Estimated initial height? Or auto?
    const isUnread = !item.Visto;
    const swipeableRef = useRef(null);

    const closeSwipeable = () => {
      swipeableRef.current?.close();
    };

    const animateExit = (callback) => {
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        callback();
      });
    };

    const handleMarkAsRead = () => {
      if (filterVisto === false) {
        // Unread Tab -> Exit
        animateExit(() => markAsRead(item));
      } else {
        // All Tab -> Just update
        markAsRead(item);
        closeSwipeable();
      }
    };

    const handleMarkAsUnread = () => {
      if (filterVisto === true) {
        // Read Tab -> Exit
        animateExit(() => markAsUnread(item));
      } else {
        // All Tab -> Just update
        markAsUnread(item);
        closeSwipeable();
      }
    };

    const renderLeftActions = (progress, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [0, 50, 100, 101],
        outputRange: [-20, 0, 0, 1],
      });
      return (
        <View style={styles.leftActionContainer}>
          <Animated.View
            style={[
              styles.actionPanel,
              styles.readActionPanel,
              {
                transform: [{ translateX: trans }],
              },
            ]}
          >
            <Ionicons name="eye-sharp" size={30} color="#fff" />
          </Animated.View>
        </View>
      );
    };

    const renderRightActions = (progress, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [-101, -100, -50, 0],
        outputRange: [-1, 0, 0, 20],
      });
      return (
        <View style={styles.rightActionContainer}>
          <Animated.View
            style={[
              styles.actionPanel,
              styles.unreadActionPanel,
              {
                transform: [{ translateX: trans }],
              },
            ]}
          >
            <Ionicons name="eye-off-sharp" size={30} color="#fff" />
          </Animated.View>
        </View>
      );
    };

    // Strict Rules:
    // Unread Tab (false): Swipe Right ONLY (Mark Read).
    // Read Tab (true): Swipe Left ONLY (Mark Unread).
    // All Tab (null): NO Swipe.

    const canSwipeRight = filterVisto === false; // Only Unread Tab
    const canSwipeLeft = filterVisto === true; // Only Read Tab

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            maxHeight: heightAnim, // Use maxHeight to animate collapse
            overflow: "hidden", // Essential for collapsing
          },
        ]}
      >
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={canSwipeRight ? renderLeftActions : null}
          renderRightActions={canSwipeLeft ? renderRightActions : null}
          onSwipeableLeftOpen={canSwipeRight ? handleMarkAsRead : null}
          onSwipeableRightOpen={canSwipeLeft ? handleMarkAsUnread : null}
          overshootFriction={8} // Add friction to make full swipe feel heavier/intentional? Or native feel.
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
                  colors={[COLORS.primary, COLORS.highlight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.unreadGradient}
                />
              </View>
            )}

            {/* Icono de notificación */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={
                  isUnread
                    ? [COLORS.primary, COLORS.highlight]
                    : [COLORS.lightGray, COLORS.gray]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="notifications" size={22} color="#fff" />
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
                    {new Date(item.Fecha).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
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
                  deleteNotification(item);
                }}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="trash-outline" size={20} color="#015CAB" />
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderNotificationItem = ({ item, index }) => (
    <NotificationCard item={item} index={index} />
  );

  // Contadores para los badges
  const counts = useMemo(() => {
    return {
      unread: notifications.filter((n) => !n.Visto).length,
      read: notifications.filter((n) => n.Visto).length,
      total: notifications.length,
    };
  }, [notifications]);

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterVisto === false && styles.filterActive,
        ]}
        onPress={() => setFilterVisto(false)}
        activeOpacity={0.7}
      >
        {filterVisto === false ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
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
                <Text style={styles.filterBadgeTextInactive}>
                  {counts.unread}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterVisto === true && styles.filterActive,
        ]}
        onPress={() => setFilterVisto(true)}
        activeOpacity={0.7}
      >
        {filterVisto === true ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
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
                <Text style={styles.filterBadgeTextInactive}>
                  {counts.read}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filterVisto === null && styles.filterActive,
        ]}
        onPress={() => setFilterVisto(null)}
        activeOpacity={0.7}
      >
        {filterVisto === null ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
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
                <Text style={styles.filterBadgeTextInactive}>
                  {counts.total}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const onRefresh = () => {
    loadNotifications();
  };

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header con gradiente */}
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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              <Text style={styles.headerSubtitle}>
                {notifications.length}{" "}
                {notifications.length === 1 ? "notificación" : "notificaciones"}
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
        data={filteredNotifications}
        keyExtractor={(item) => item.NotificacionUsuarioID.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary, COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#f5f7fa", "#c3cfe2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <Ionicons
                name="notifications-off-outline"
                size={80}
                color="#9e9e9e"
              />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
              <Text style={styles.emptySubtext}>
                Cuando recibas notificaciones aparecerán aquí
              </Text>
            </LinearGradient>
          </View>
        }
        ListFooterComponent={
          notificationsLoading && !refreshing ? (
            <ActivityIndicator
              style={styles.loadingIndicator}
              size="large"
              color={COLORS.accent}
            />
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
    left: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontWeight: "500",
  },
  clearAllButton: {
    padding: 8,
  },
  clearAllButtonInner: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  filterInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 25,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "600",
  },
  filterTextActive: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  filterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "700",
  },
  filterBadgeInactive: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  filterBadgeTextInactive: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  unreadNotification: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(51, 122, 183, 0.2)",
  },
  unreadIndicator: {
    position: "absolute",
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
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    flex: 1,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: "700",
    color: COLORS.dark,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  notificationActions: {
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.gray,
    marginTop: 20,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  leftActionContainer: {
    flex: 1,
    backgroundColor: COLORS.success, // Green
    justifyContent: "center",
    marginBottom: 12,
    borderRadius: 16,
  },
  rightActionContainer: {
    flex: 1,
    backgroundColor: COLORS.primary, // Blue
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 12,
    borderRadius: 16,
  },
  actionPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    width: 200,
  },
  readActionPanel: {
    justifyContent: "flex-start",
  },
  unreadActionPanel: {
    justifyContent: "flex-end",
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 10,
    marginRight: 10,
  },
});
