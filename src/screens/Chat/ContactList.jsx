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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../core/chatStore';
import ChatApiService from '../../core/chatApi';
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
    loadContacts();
  }, [selectedStatus, searchText]);

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      const filtros = {
        ...searchFilters,
        EstadoID: selectedStatus,
        ContactosUsuarioID: usuarioID,
        FullSearch: searchText,
        Token: user?.Token,
      };

      const response = await ChatApiService.consultarContactos(filtros);
      setContacts(response.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'No se pudieron cargar los contactos');
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
          {item.Texto || item.TipoMensaje || 'Sin mensajes'}
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
            onPress={() => setSelectedStatus(status.id)}
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
    <SafeAreaView style={styles.container}>
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

      {contactsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337ab7" />
          <Text style={styles.loadingText}>Cargando contactos...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.CuentaMensajeriaContactoID.toString()}
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
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
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