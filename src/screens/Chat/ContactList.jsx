import React, { useEffect, useState } from 'react';
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
  Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../core/chatStore';
import ChatApiService from '../../services/chat/chatService';
import ChatStorageService from '../../services/chat/chatStorageService';
import { useGlobal } from '../../core/global';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';
import { useCallback } from 'react';
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
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(1);
  const [selectedContactItem, setSelectedContactItem] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const statusOptions = [
    { id: null, name: 'Todos' },
    { id: 1, name: 'Pendiente y Abierto' },
    { id: 2, name: 'Abierto' },
    { id: 3, name: 'Pendiente' },
    { id: 4, name: 'Cerrado' },
  ];

  const statusFilters = [
    { ID: null, Nombre: "Todos", Filtros: [] },
    { ID: 1, Filtros: [{ EstadoGestionContactoID: 1 }, { EstadoGestionContactoID: 2 }], Nombre: "Pendiente y Abierto" },
    { ID: 2, Filtros: [{ EstadoGestionContactoID: 1 }], Nombre: "Abierto" },
    { ID: 3, Filtros: [{ EstadoGestionContactoID: 2 }], Nombre: "Pendiente" },
    { ID: 4, Filtros: [{ EstadoGestionContactoID: 3 }], Nombre: "Cerrado" }
  ];

  useEffect(() => {
    loadContacts();
  }, [selectedStatus, searchText]);

  const loadContacts = useCallback(async () => {
    try {
      // 1. Cargar contactos locales primero (Offline-first)
      // Solo cargamos del storage si no estamos filtrando por texto (para mantener la búsqueda rápida pero real)
      // O podríamos filtrar localmente también, pero por simplicidad cargamos todo si no hay filtro
      if (!searchText) {
        const localContacts = await ChatStorageService.getContacts();
        if (localContacts && localContacts.length > 0) {
          setContacts(localContacts);
          // Si hay datos locales, no mostramos loading spinner bloqueante
        } else {
          setContactsLoading(true);
        }
      } else {
        setContactsLoading(true);
      }

      // 2. Consultar API en segundo plano
      const filtros = {
        ...searchFilters,
        EstadosGestionContacto: statusFilters.find(x => x.ID == selectedStatus)?.Filtros || [],
        ContactosUsuarioID: usuarioID,
        FullSearch: searchText,
        Token: user?.Token,
      };

      const response = await ChatApiService.consultarContactos(filtros);

      // 3. Actualizar UI y guardar en local (si no es búsqueda)
      setContacts(response.data || []);

      if (!searchText && (!selectedStatus || selectedStatus === 1)) {
        // Guardamos "por defecto" la lista principal
        await ChatStorageService.saveContacts(response.data || []);
      }

    } catch (error) {
      console.error('Error loading contacts:', error);
      if (contacts.length === 0) {
        Alert.alert('Error', 'No se pudieron cargar los contactos');
      }
    } finally {
      setContactsLoading(false);
    }
  }, [searchText, selectedStatus, usuarioID, user?.Token, searchFilters]);

  const handleContactPress = (contact) => {
    setSelectedContact(contact);
    navigation.navigate('ChatScreen', { contact });
  };

  const getStatusColor = (estadoID) => {
    switch (estadoID) {
      case 1: return '#28a745'; // Abierto - verde
      case 2: return '#ffc107'; // Pendiente - amarillo
      case 3: return '#dc3545'; // Cerrado - rojo
      default: return '#6c757d'; // Default - gris
    }
  };

  const getStatusName = (estadoID) => {
    switch (estadoID) {
      case 1: return 'Abierto';
      case 2: return 'Pendiente';
      case 3: return 'Cerrado';
      default: return 'Sin estado';
    }
  };

  const getIconName = (tipo) => {
    switch (tipo) {
      case 'image': return 'image';
      case 'audio': return 'musical-note';
      case 'video': return 'videocam';
      case 'document': return 'document';
      case 'sticker': return 'happy';
      default: return 'chatbubble';
    }
  };

  const getTypeText = (tipo) => {
    switch (tipo) {
      case 'image': return 'Imagen';
      case 'audio': return 'Audio';
      case 'video': return 'Video';
      case 'document': return 'Documento';
      case 'sticker': return 'Sticker';
      default: return tipo || 'Mensaje';
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedContactItem?.CuentaMensajeriaContactoID === item.CuentaMensajeriaContactoID && styles.selectedContactItem
      ]}
      onPress={() => handleContactPress(item)}
      onLongPress={() => {
        setSelectedContactItem(item);
        Vibration.vibrate(50);
      }}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.Nombre?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.Nombre}
          </Text>
          <Text style={styles.contactTime}>
            {item.Fecha ? new Date(item.Fecha).toLocaleDateString() : ''}
          </Text>
        </View>

        <Text style={styles.contactMessage} numberOfLines={1}>
          {item.Texto ? (
            item.Texto
          ) : (
            <>
              <Ionicons name={getIconName(item.TipoMensaje)} size={14} color="#666" />
              {' ' + getTypeText(item.TipoMensaje)}
            </>
          )}
        </Text>

        <View style={styles.contactFooter}>
          <Text style={styles.contactAccount}>
            {item.Cuenta || 'Sin cuenta'}
          </Text>
          <View style={styles.contactStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(item.EstadoGestionContactoID) }
              ]}
            />
            <Text style={styles.statusText}>
              {getStatusName(item.EstadoGestionContactoID)}
            </Text>
          </View>
        </View>

        <Text style={[styles.contactAssigned, item.Usuario ? styles.assigned : styles.notAssigned]}>
          {item.Usuario || 'Sin usuario asignado'}
        </Text>

        {item.CantidadMensajesSinLeer > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.CantidadMensajesSinLeer}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View style={styles.statusFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status.id}
            style={[
              styles.statusButton,
              selectedStatus === status.id && styles.statusButtonActive
            ]}
            onPress={() => {
              console.log('Status button pressed:', status.name, 'id:', status.id);
              setSelectedStatus(status.id);
            }}
          >
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === status.id && styles.statusButtonTextActive
              ]}
            >
              {status.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FocusAwareStatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        {selectedContactItem ? (
          showNameInput ? (
            <View style={styles.nameInputHeader}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowNameInput(false)}>
                <Ionicons name="close" size={24} color="#337ab7" />
              </TouchableOpacity>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Nuevo nombre"
                maxLength={25}
              />
              <TouchableOpacity style={styles.headerButton} onPress={async () => {
                if (newName && newName.trim()) {
                  try {
                    const contacto = { ...selectedContactItem, Nombre: newName.trim() };
                    await ChatApiService.actualizarEstadoContacto(contacto);
                    Alert.alert('Éxito', 'Nombre actualizado');
                    loadContacts();
                    setSelectedContactItem(null);
                    setShowNameInput(false);
                  } catch (error) {
                    Alert.alert('Error', 'No se pudo actualizar el nombre');
                  }
                }
              }}>
                <Ionicons name="checkmark" size={24} color="#337ab7" />
              </TouchableOpacity>
            </View>
          ) : showUserList ? (
            <View style={styles.nameInputHeader}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowUserList(false)}>
                <Ionicons name="close" size={24} color="#337ab7" />
              </TouchableOpacity>
              <Picker
                selectedValue={selectedUser}
                onValueChange={(itemValue) => setSelectedUser(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar usuario" value={null} />
                {users.map((user) => (
                  <Picker.Item key={user.UsuarioID} label={user.NombreCompleto} value={user.UsuarioID} />
                ))}
              </Picker>
              <TouchableOpacity style={styles.headerButton} onPress={async () => {
                if (selectedUser) {
                  if (selectedUser === selectedContactItem.UsuarioID) {
                    Alert.alert('Info', 'El usuario ya tiene asignado este chat');
                    setSelectedContactItem(null);
                    setShowUserList(false);
                    return;
                  }
                  try {
                    const contacto = { ...selectedContactItem, NuevoUsuarioID: selectedUser };
                    await ChatApiService.asignarUsuario(contacto);
                    const userName = users.find(u => u.UsuarioID === selectedUser)?.NombreCompleto || 'Usuario';
                    Alert.alert('Éxito', `Usuario asignado: ${userName}`);
                    loadContacts();
                    setSelectedContactItem(null);
                    setShowUserList(false);
                  } catch (error) {
                    Alert.alert('Error', 'No se pudo asignar el usuario');
                  }
                }
              }}>
                <Ionicons name="checkmark" size={24} color="#337ab7" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectedHeader}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setSelectedContactItem(null)}>
                <Ionicons name="arrow-back" size={24} color="#337ab7" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => {
                setNewName(selectedContactItem.Nombre);
                setShowNameInput(true);
              }}>
                <Ionicons name="create-outline" size={24} color="#337ab7" />
              </TouchableOpacity>
              {selectedContactItem.UsuarioID != usuarioID && (
                <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Confirmar', `¿Desea asignarse el contacto ${selectedContactItem.Nombre}?`, [
                  { text: 'Cancelar' },
                  {
                    text: 'Aceptar', onPress: async () => {
                      try {
                        const contacto = { ...selectedContactItem, NuevoUsuarioID: usuarioID };
                        await ChatApiService.asignarUsuario(contacto);
                        Alert.alert('Éxito', 'Chat asignado a usted');
                        loadContacts();
                        setSelectedContactItem(null);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo asignar el chat');
                      }
                    }
                  }
                ])}>
                  <Ionicons name="person-outline" size={24} color="#337ab7" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.headerButton} onPress={async () => {
                setShowUserList(true);
                setSelectedUser(null);
                try {
                  const response = await ChatApiService.consultarUsuarios({});
                  setUsers(response.rows || []);
                } catch (error) {
                  Alert.alert('Error', 'No se pudieron cargar los usuarios');
                }
              }}>
                <Ionicons name="person-add-outline" size={24} color="#337ab7" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Confirmar', '¿Desea marcar como mensaje no leido?', [
                { text: 'Cancelar' },
                {
                  text: 'Aceptar', onPress: async () => {
                    try {
                      const contacto = { ...selectedContactItem, MensajeLeido: false };
                      await ChatApiService.marcacionMensajes(contacto);
                      Alert.alert('Éxito', 'Mensaje marcado como no leido');
                      loadContacts();
                      setSelectedContactItem(null);
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo marcar el mensaje');
                    }
                  }
                }
              ])}>
                <Ionicons name="mail-unread-outline" size={24} color="#337ab7" />
              </TouchableOpacity>
              {selectedContactItem.EstadoGestionContactoID != 2 && (
                <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Confirmar', '¿Desea cambiar a pendiente?', [
                  { text: 'Cancelar' },
                  {
                    text: 'Aceptar', onPress: async () => {
                      try {
                        const contacto = { ...selectedContactItem, EstadoGestionContactoID: 2 };
                        await ChatApiService.actualizarEstadoContacto(contacto);
                        Alert.alert('Éxito', 'Estado cambiado a pendiente');
                        loadContacts();
                        setSelectedContactItem(null);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo cambiar el estado');
                      }
                    }
                  }
                ])}>
                  <Ionicons name="time-outline" size={24} color="#337ab7" />
                </TouchableOpacity>
              )}
              {selectedContactItem.EstadoGestionContactoID != 1 && (
                <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Confirmar', '¿Desea cambiar a abierto?', [
                  { text: 'Cancelar' },
                  {
                    text: 'Aceptar', onPress: async () => {
                      try {
                        const contacto = { ...selectedContactItem, EstadoGestionContactoID: 1 };
                        await ChatApiService.actualizarEstadoContacto(contacto);
                        Alert.alert('Éxito', 'Estado cambiado a abierto');
                        loadContacts();
                        setSelectedContactItem(null);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo cambiar el estado');
                      }
                    }
                  }
                ])}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#337ab7" />
                </TouchableOpacity>
              )}
              {selectedContactItem.EstadoGestionContactoID != 3 && (
                <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Confirmar', '¿Desea cambiar a cerrado?', [
                  { text: 'Cancelar' },
                  {
                    text: 'Aceptar', onPress: async () => {
                      try {
                        const contacto = { ...selectedContactItem, EstadoGestionContactoID: 3 };
                        await ChatApiService.actualizarEstadoContacto(contacto);
                        Alert.alert('Éxito', 'Estado cambiado a cerrado');
                        loadContacts();
                        setSelectedContactItem(null);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo cambiar el estado');
                      }
                    }
                  }
                ])}>
                  <Ionicons name="close-circle-outline" size={24} color="#337ab7" />
                </TouchableOpacity>
              )}
            </View>
          )
        ) : (
          <LinearGradient
            colors={['#337ab7', '#0086C8', '#00ACC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerSubtitle}>Centro de</Text>
                <Text style={styles.title}>Contacto</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('NewChat')}
                >
                  <LinearGradient
                    colors={['#337ab7', '#00ACC4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.newChatButton}
                  >
                    <Text style={styles.newChatButtonText}>Nuevo Chat</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="search" size={20} color="#0086C8" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contactos..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {renderStatusFilter()}

        {contactsLoading && contacts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#337ab7" />
            <Text style={styles.loadingText}>Cargando contactos...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item, index) => item?.CuentaMensajeriaContactoID?.toString() || index.toString()}
            style={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay contactos disponibles</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  patternCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  patternCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -30,
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
    color: '#337ab7',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newChatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    height: 75,
  },
  headerButton: {
    padding: 8,
  },
  nameInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  userList: {
    maxHeight: 125,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  userItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  userText: {
    fontSize: 14,
    color: '#333',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  inputIconContainer: {
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1E293B',
    paddingRight: 16,
  },
  statusFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#337ab7',
    borderColor: '#337ab7',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#6c757d',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedContactItem: {
    backgroundColor: '#e0f7fa',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#337ab7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  contactTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  contactMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingRight: 40,
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactAccount: {
    fontSize: 12,
    color: '#337ab7',
    fontWeight: '500',
  },
  contactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6c757d',
  },
  contactAssigned: {
    fontSize: 10,
    textAlign: 'left',
    marginTop: 2,
  },
  assigned: {
    color: '#9a9b9bff',
  },
  notAssigned: {
    color: '#9a9b9bff', // red
  },
  unreadBadge: {
    position: 'absolute',
    top: 25,
    right: 8,
    backgroundColor: '#88E782',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ContactList;