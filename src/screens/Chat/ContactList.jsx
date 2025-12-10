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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../core/chatStore';
import ChatApiService from '../../services/chat/chatService';
import ChatStorageService from '../../services/chat/chatStorageService';
import { useGlobal } from '../../core/global';

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

  const statusOptions = [
    { id: null, name: 'Todos' },
    { id: 1, name: 'Pendiente y Abierto' },
    { id: 2, name: 'Abierto' },
    { id: 3, name: 'Pendiente' },
    { id: 4, name: 'Cerrado' },
  ];

  useEffect(() => {
    console.log('useEffect triggered: selectedStatus =', selectedStatus, 'searchText =', searchText);
    loadContacts();
  }, [selectedStatus, searchText]);

  const loadContacts = async () => {
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
        EstadoID: selectedStatus,
        ContactosUsuarioID: usuarioID,
        FullSearch: searchText,
        Token: user?.Token,
      };

      console.log('Filtros being sent to API:', filtros);
      console.log('Calling consultarContactos API');

      const response = await ChatApiService.consultarContactos(filtros);

      console.log('API response received:', response);
      console.log('Response data length:', response.data?.length || 0);

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
  };

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
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Centro de Contacto</Text>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => navigation.navigate('NewChat')}
          >
            <Text style={styles.newChatButtonText}>Nuevo Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
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
            keyExtractor={(item) => item?.CuentaMensajeriaContactoID?.toString() || Math.random().toString()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  newChatButton: {
    backgroundColor: '#337ab7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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