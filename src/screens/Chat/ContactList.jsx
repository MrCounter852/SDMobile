import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Vibration,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatStore } from "../../core/chatStore";
import ChatApiService from "../../services/chat/chatService";
import ChatStorageService from "../../services/chat/chatStorageService";
import { useGlobal } from "../../core/global";
import FocusAwareStatusBar from "../../components/FocusAwareStatusBar";
import { COLORS } from "../../core/theme";

const { width } = Dimensions.get("window");

const ContactList = ({ navigation }) => {
  const {
    contacts,
    contactsLoading,
    searchFilters,
    updateSearchFilters,
    setContacts,
    setSelectedContact,
    setContactsLoading,
  } = useChatStore();

  const { usuarioID, user } = useGlobal();
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(1);
  const [selectedContactItem, setSelectedContactItem] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { id: null, name: "Todos", icon: "apps-outline" },
    { id: 1, name: "Pendiente y Abierto", icon: "time-outline" },
    { id: 2, name: "Abierto", icon: "checkmark-circle-outline" },
    { id: 3, name: "Pendiente", icon: "hourglass-outline" },
    { id: 4, name: "Cerrado", icon: "close-circle-outline" },
  ];

  const statusFilters = [
    { ID: null, Nombre: "Todos", Filtros: [] },
    {
      ID: 1,
      Filtros: [{ EstadoGestionContactoID: 1 }, { EstadoGestionContactoID: 2 }],
      Nombre: "Pendiente y Abierto",
    },
    { ID: 2, Filtros: [{ EstadoGestionContactoID: 1 }], Nombre: "Abierto" },
    { ID: 3, Filtros: [{ EstadoGestionContactoID: 2 }], Nombre: "Pendiente" },
    { ID: 4, Filtros: [{ EstadoGestionContactoID: 3 }], Nombre: "Cerrado" },
  ];

  useEffect(() => {
    loadContacts();
  }, [selectedStatus, searchText]);

  const loadContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      if (!searchText) {
        const localContacts = await ChatStorageService.getContacts();
        if (localContacts && localContacts.length > 0) {
          setContacts(localContacts);
        }
      }

      const filtros = {
        ...searchFilters,
        EstadosGestionContacto:
          statusFilters.find((x) => x.ID == selectedStatus)?.Filtros || [],
        ContactosUsuarioID: usuarioID,
        FullSearch: searchText,
        Token: user?.Token,
      };

      const response = await ChatApiService.consultarContactos(filtros);
      setContacts(response.data || []);

      if (!searchText && (!selectedStatus || selectedStatus === 1)) {
        await ChatStorageService.saveContacts(response.data || []);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      if (contacts.length === 0) {
        Alert.alert("Error", "No se pudieron cargar los contactos");
      }
    } finally {
      setContactsLoading(false);
    }
  }, [searchText, selectedStatus, usuarioID, user?.Token, searchFilters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  const handleContactPress = (contact) => {
    setSelectedContact(contact);
    navigation.navigate("ChatScreen", { contact });
  };

  const getStatusColor = (estadoID) => {
    switch (estadoID) {
      case 1:
        return COLORS.success;
      case 2:
        return "#F59E0B";
      case 3:
        return "#EF4444";
      default:
        return COLORS.lightGray;
    }
  };

  const getStatusName = (estadoID) => {
    switch (estadoID) {
      case 1:
        return "Abierto";
      case 2:
        return "Pendiente";
      case 3:
        return "Cerrado";
      default:
        return "Sin estado";
    }
  };

  const getIconName = (tipo) => {
    switch (tipo) {
      case "image":
        return "image";
      case "audio":
        return "musical-note";
      case "video":
        return "videocam";
      case "document":
        return "document";
      case "sticker":
        return "happy";
      default:
        return "chatbubble";
    }
  };

  const getTypeText = (tipo) => {
    switch (tipo) {
      case "image":
        return "Imagen";
      case "audio":
        return "Audio";
      case "video":
        return "Video";
      case "document":
        return "Documento";
      case "sticker":
        return "Sticker";
      default:
        return tipo || "Mensaje";
    }
  };

  // Action handlers
  const handleUpdateName = async () => {
    if (newName && newName.trim()) {
      try {
        const contacto = { ...selectedContactItem, Nombre: newName.trim() };
        await ChatApiService.actualizarEstadoContacto(contacto);
        Alert.alert("Éxito", "Nombre actualizado");
        loadContacts();
        setSelectedContactItem(null);
        setShowNameInput(false);
      } catch (error) {
        Alert.alert("Error", "No se pudo actualizar el nombre");
      }
    }
  };

  const handleAssignUser = async () => {
    if (selectedUser) {
      if (selectedUser === selectedContactItem.UsuarioID) {
        Alert.alert("Info", "El usuario ya tiene asignado este chat");
        setSelectedContactItem(null);
        setShowUserList(false);
        return;
      }
      try {
        const contacto = {
          ...selectedContactItem,
          NuevoUsuarioID: selectedUser,
        };
        await ChatApiService.asignarUsuario(contacto);
        const userName =
          users.find((u) => u.UsuarioID === selectedUser)?.NombreCompleto ||
          "Usuario";
        Alert.alert("Éxito", `Usuario asignado: ${userName}`);
        loadContacts();
        setSelectedContactItem(null);
        setShowUserList(false);
      } catch (error) {
        Alert.alert("Error", "No se pudo asignar el usuario");
      }
    }
  };

  const handleSelfAssign = async () => {
    try {
      const contacto = { ...selectedContactItem, NuevoUsuarioID: usuarioID };
      await ChatApiService.asignarUsuario(contacto);
      Alert.alert("Éxito", "Chat asignado a usted");
      loadContacts();
      setSelectedContactItem(null);
    } catch (error) {
      Alert.alert("Error", "No se pudo asignar el chat");
    }
  };

  const handleMarkUnread = async () => {
    try {
      const contacto = { ...selectedContactItem, MensajeLeido: false };
      await ChatApiService.marcacionMensajes(contacto);
      Alert.alert("Éxito", "Mensaje marcado como no leído");
      loadContacts();
      setSelectedContactItem(null);
    } catch (error) {
      Alert.alert("Error", "No se pudo marcar el mensaje");
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      const contacto = {
        ...selectedContactItem,
        EstadoGestionContactoID: newStatus,
      };
      await ChatApiService.actualizarEstadoContacto(contacto);
      const statusName = getStatusName(newStatus);
      Alert.alert("Éxito", `Estado cambiado a ${statusName.toLowerCase()}`);
      loadContacts();
      setSelectedContactItem(null);
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado");
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedContactItem?.CuentaMensajeriaContactoID ===
          item.CuentaMensajeriaContactoID && styles.selectedContactItem,
      ]}
      onPress={() => handleContactPress(item)}
      onLongPress={() => {
        setSelectedContactItem(item);
        Vibration.vibrate(50);
      }}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.contactAvatar}
      >
        <Text style={styles.avatarText}>
          {item.Nombre?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </LinearGradient>

      <View style={styles.contactInfo}>
        {/* Header: Name & Time */}
        <View style={styles.contactHeader}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.Nombre}
          </Text>
          <Text style={styles.contactTime}>
            {item.Fecha ? new Date(item.Fecha).toLocaleDateString() : ""}
          </Text>
        </View>

        {/* Message preview */}
        <View style={styles.messagePreview}>
          {item.Texto ? (
            <Text style={styles.contactMessage} numberOfLines={1}>
              {item.Texto}
            </Text>
          ) : (
            <View style={styles.mediaMessage}>
              <Ionicons
                name={getIconName(item.TipoMensaje)}
                size={14}
                color={COLORS.gray}
              />
              <Text style={styles.mediaMessageText}>
                {getTypeText(item.TipoMensaje)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Account & Status */}
        <View style={styles.contactFooter}>
          <View style={styles.accountTag}>
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={COLORS.secondary}
            />
            <Text style={styles.contactAccount}>
              {item.Cuenta || "Sin cuenta"}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getStatusColor(item.EstadoGestionContactoID),
                },
              ]}
            />
            <Text style={styles.statusText}>
              {getStatusName(item.EstadoGestionContactoID)}
            </Text>
          </View>
        </View>

        {/* Assigned user */}
        <View style={styles.assignedRow}>
          <Ionicons
            name="person-outline"
            size={12}
            color={item.Usuario ? COLORS.gray : COLORS.lightGray}
          />
          <Text
            style={[
              styles.contactAssigned,
              !item.Usuario && styles.notAssigned,
            ]}
          >
            {item.Usuario || "Sin asignar"}
          </Text>
        </View>
      </View>

      {/* Unread badge */}
      {item.CantidadMensajesSinLeer > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.CantidadMensajesSinLeer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View style={styles.statusFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.id}
            style={[
              styles.filterChip,
              selectedStatus === status.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(status.id)}
            activeOpacity={0.7}
          >
            {selectedStatus === status.id ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterChipGradient}
              >
                <Ionicons name={status.icon} size={14} color="#FFF" />
                <Text style={styles.filterChipTextActive}>{status.name}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterChipInactive}>
                <Ionicons name={status.icon} size={14} color={COLORS.gray} />
                <Text style={styles.filterChipText}>{status.name}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNameInputHeader = () => (
    <SafeAreaView edges={["top"]} style={styles.actionHeaderContainer}>
      <View style={styles.actionHeader}>
        <TouchableOpacity
          style={styles.actionHeaderBtn}
          onPress={() => setShowNameInput(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.nameInputWrapper}>
          <TextInput
            style={styles.nameInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nuevo nombre"
            placeholderTextColor={COLORS.lightGray}
            maxLength={25}
          />
        </View>
        <TouchableOpacity
          style={styles.actionHeaderBtn}
          onPress={handleUpdateName}
        >
          <Ionicons name="checkmark" size={24} color={COLORS.success} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderUserListHeader = () => (
    <SafeAreaView edges={["top"]} style={styles.actionHeaderContainer}>
      <View style={styles.actionHeader}>
        <TouchableOpacity
          style={styles.actionHeaderBtn}
          onPress={() => setShowUserList(false)}
        >
          <Ionicons name="close" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedUser}
            onValueChange={(itemValue) => setSelectedUser(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Seleccionar usuario" value={null} />
            {users.map((u) => (
              <Picker.Item
                key={u.UsuarioID}
                label={u.NombreCompleto}
                value={u.UsuarioID}
              />
            ))}
          </Picker>
        </View>
        <TouchableOpacity
          style={styles.actionHeaderBtn}
          onPress={handleAssignUser}
        >
          <Ionicons name="checkmark" size={24} color={COLORS.success} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderSelectedHeader = () => {
    const currentStatus = selectedContactItem.EstadoGestionContactoID;

    return (
      <SafeAreaView edges={["top"]} style={styles.selectionHeaderContainer}>
        <View style={styles.selectedHeader}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setSelectedContactItem(null)}
          >
            <View style={styles.actionBtnIcon}>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectionActionsScroll}
          >
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                setNewName(selectedContactItem.Nombre);
                setShowNameInput(true);
              }}
            >
              <View style={styles.actionBtnIcon}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.actionBtnLabel}>Editar</Text>
            </TouchableOpacity>

            {selectedContactItem.UsuarioID != usuarioID && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  Alert.alert(
                    "Confirmar",
                    `¿Desea asignarse el contacto ${selectedContactItem.Nombre}?`,
                    [
                      { text: "Cancelar" },
                      { text: "Aceptar", onPress: handleSelfAssign },
                    ]
                  )
                }
              >
                <View style={styles.actionBtnIcon}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.accent}
                  />
                </View>
                <Text style={styles.actionBtnLabel}>Asignarme</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                setShowUserList(true);
                setSelectedUser(null);
                try {
                  const response = await ChatApiService.consultarUsuarios({});
                  setUsers(response.rows || []);
                } catch (error) {
                  Alert.alert("Error", "No se pudieron cargar los usuarios");
                }
              }}
            >
              <View style={styles.actionBtnIcon}>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.actionBtnLabel}>Asignar</Text>
            </TouchableOpacity>

            {/* Status Actions */}
            {currentStatus !== 1 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleChangeStatus(1)}
              >
                <View style={styles.actionBtnIcon}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
                <Text style={styles.actionBtnLabel}>Abrir</Text>
              </TouchableOpacity>
            )}

            {currentStatus !== 2 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleChangeStatus(2)}
              >
                <View style={styles.actionBtnIcon}>
                  <Ionicons
                    name="hourglass-outline"
                    size={20}
                    color="#F59E0B"
                  />
                </View>
                <Text style={styles.actionBtnLabel}>Pendiente</Text>
              </TouchableOpacity>
            )}

            {currentStatus !== 3 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleChangeStatus(3)}
              >
                <View style={styles.actionBtnIcon}>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#EF4444"
                  />
                </View>
                <Text style={styles.actionBtnLabel}>Cerrar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                Alert.alert(
                  "Confirmar",
                  "¿Desea marcar como mensaje no leído?",
                  [
                    { text: "Cancelar" },
                    { text: "Aceptar", onPress: handleMarkUnread },
                  ]
                )
              }
            >
              <View style={styles.actionBtnIcon}>
                <Ionicons
                  name="mail-unread-outline"
                  size={20}
                  color={COLORS.highlight}
                />
              </View>
              <Text style={styles.actionBtnLabel}>No leído</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  };

  const renderMainHeader = () => (
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
            <Text style={styles.headerTitle}>Contacto</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("NewChat")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]}
              style={styles.newChatButton}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.newChatButtonText}>Nuevo Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="chatbubbles-outline"
          size={64}
          color={COLORS.lightGray}
        />
      </View>
      <Text style={styles.emptyTitle}>Sin contactos</Text>
      <Text style={styles.emptyText}>
        No hay contactos disponibles con los filtros seleccionados
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header */}
      {selectedContactItem
        ? showNameInput
          ? renderNameInputHeader()
          : showUserList
          ? renderUserListHeader()
          : renderSelectedHeader()
        : renderMainHeader()}

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={COLORS.secondary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contactos..."
            placeholderTextColor={COLORS.lightGray}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchText("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.lightGray}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter */}
      {renderStatusFilter()}

      {/* Contact list */}
      {contactsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Cargando contactos...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item, index) =>
            item?.CuentaMensajeriaContactoID?.toString() || index.toString()
          }
          style={styles.contactsList}
          contentContainerStyle={styles.contactsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.accent]}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  newChatButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Action headers
  actionHeaderContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  actionHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  nameInputWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  nameInput: {
    fontSize: 16,
    color: COLORS.dark,
  },
  pickerWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    flex: 1,
  },

  // Selected header
  selectionHeaderContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  selectionActionsScroll: {
    paddingRight: 20,
    gap: 16,
    alignItems: "center",
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: "500",
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIconContainer: {
    width: 48,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: COLORS.dark,
  },
  clearSearchBtn: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
  },

  // Status filter
  statusFilterContainer: {
    paddingVertical: 12,
    paddingLeft: 20,
  },
  filterChip: {
    marginRight: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  filterChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  filterChipInactive: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "500",
  },
  filterChipTextActive: {
    fontSize: 13,
    color: "#FFF",
    fontWeight: "500",
  },

  // Contact list
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    padding: 16,
    paddingTop: 8,
  },
  contactItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedContactItem: {
    backgroundColor: "#E0F2FE",
    borderColor: COLORS.secondary,
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  contactTime: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  messagePreview: {
    marginBottom: 8,
  },
  contactMessage: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  mediaMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mediaMessageText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  contactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  accountTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactAccount: {
    fontSize: 12,
    color: 'COLORS.secondary',
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactAssigned: {
    fontSize: 11,
    color: COLORS.gray,
  },
  notAssigned: {
    color: COLORS.lightGray,
    fontStyle: "italic",
  },
  unreadBadge: {
    position: "absolute",
    top: 40,
    right: 16,
    backgroundColor: COLORS.highlight,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ContactList;
