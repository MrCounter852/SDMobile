import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import ChatApiService from '../../services/chat/chatService';
import { useGlobal } from '../../core/global';

const NewChat = ({ navigation }) => {
  const { user } = useGlobal();
  const [currentView, setCurrentView] = useState('contacts'); // 'contacts' or 'template'
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    CuentaMensajeriaID: null,
    PlantillaComunicacionID: null,
    MensajeEnvio: '',
    Variables: [],
  });

  useEffect(() => {
    if (currentView === 'contacts') {
      loadContacts();
    }
    loadCuentasMensajeria();
  }, [currentView, searchText]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const filtros = {
        Page: 1,
        Rows: 50,
        FullSearch: searchText,
        Token: user?.Token,
      };
      const response = await ChatApiService.consultarContactos(filtros);
      setContacts(response.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'No se pudieron cargar los contactos');
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadCuentasMensajeria = async () => {
    try {
      const response = await ChatApiService.consultarCuentasMensajeria();
      if (response.rows) {
        setCuentas(response.rows);
      }
    } catch (error) {
      console.error('Error loading cuentas:', error);
      Alert.alert('Error', 'No se pudieron cargar las cuentas de mensajería');
    }
  };

  const loadPlantillas = async (cuentaID) => {
    if (!cuentaID) {
      setPlantillas([]);
      return;
    }

    try {
      const response = await ChatApiService.consultarPlantillasComunicacion(cuentaID);
      if (response.rows) {
        setPlantillas(response.rows);
      }
    } catch (error) {
      console.error('Error loading plantillas:', error);
      Alert.alert('Error', 'No se pudieron cargar las plantillas');
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      CuentaMensajeriaID: contact.CuentaMensajeriaID || null,
    }));
    loadPlantillas(contact.CuentaMensajeriaID);
    setCurrentView('template');
  };

  const handleManualPhoneSubmit = () => {
    if (!manualPhone || manualPhone.trim() === '') {
      Alert.alert('Error', 'Ingrese un número de celular');
      return;
    }
    const contact = {
      Telefono: manualPhone.trim(),
      Nombre: 'Nuevo contacto',
    };
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      CuentaMensajeriaID: null, // Will be selected in template view
    }));
    setShowManualInput(false);
    setManualPhone('');
    setCurrentView('template');
  };

  const handleCuentaChange = (cuentaID) => {
    setFormData(prev => ({
      ...prev,
      CuentaMensajeriaID: cuentaID,
      PlantillaComunicacionID: null,
      MensajeEnvio: '',
      Variables: [],
    }));
    setPlantillaSeleccionada(null);
    loadPlantillas(cuentaID);
  };

  const extractVariablesFromTemplate = (texto) => {
    const regex = /(@\[[^\]]+\])/g;
    const coincidencias = new Set();
    let match;
    while ((match = regex.exec(texto)) !== null) {
      coincidencias.add(match[1]);
    }
    return Array.from(coincidencias).map(item => ({
      Nombre: item,
      Valor: ''
    }));
  };

  const handlePlantillaChange = async (plantillaID) => {
    if (!plantillaID) {
      setPlantillaSeleccionada(null);
      setFormData(prev => ({
        ...prev,
        PlantillaComunicacionID: plantillaID,
        MensajeEnvio: '',
        Variables: [],
      }));
      return;
    }

    try {
      const plantilla = plantillas.find(p => p.PlantillaComunicacionID === plantillaID);
      if (plantilla) {
        const detalle = await ChatApiService.consultarPlantillaDetalle({
          PlantillaComunicacionID: plantillaID,
          Token: user?.Token,
        });

        const template = detalle.data?.Template || '';
        const variables = extractVariablesFromTemplate(template);
        setPlantillaSeleccionada({ ...detalle.data, Template: template });
        setFormData(prev => ({
          ...prev,
          PlantillaComunicacionID: plantillaID,
          MensajeEnvio: template,
          Variables: variables,
        }));
      }
    } catch (error) {
      console.error('Error loading plantilla detalle:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la plantilla');
    }
  };

  const handleVariableChange = (index, value) => {
    const newVariables = [...formData.Variables];
    newVariables[index] = { ...newVariables[index], Valor: value };
    setFormData(prev => ({
      ...prev,
      Variables: newVariables,
    }));

    // Actualizar mensaje con variables
    updateMensajeConVariables(newVariables);
  };

  const updateMensajeConVariables = (variables) => {
    let mensaje = plantillaSeleccionada?.Template || '';

    variables.forEach((variable) => {
      if (variable.Valor && variable.Valor !== '') {
        const regex = new RegExp(variable.Nombre.replace(/[\[\]]/g, '\\$&'), 'g');
        mensaje = mensaje.replace(regex, variable.Valor);
      }
    });

    setFormData(prev => ({
      ...prev,
      MensajeEnvio: mensaje,
    }));
  };

  const validateForm = () => {
    if (!formData.CuentaMensajeriaID) {
      Alert.alert('Error', 'Debe seleccionar una cuenta de mensajería');
      return false;
    }

    if (!selectedContact?.Telefono) {
      Alert.alert('Error', 'No hay número de celular disponible');
      return false;
    }

    if (!formData.PlantillaComunicacionID) {
      Alert.alert('Error', 'Debe seleccionar una plantilla de comunicación');
      return false;
    }

    // Validar variables requeridas
    for (const variable of formData.Variables) {
      if (!variable.Valor || variable.Valor.trim() === '') {
        Alert.alert('Error', `La variable "${variable.Nombre}" es obligatoria`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const chatData = {
        CuentaMensajeriaID: formData.CuentaMensajeriaID,
        Telefono: selectedContact.Telefono,
        Nombre: selectedContact.Nombre,
        PlantillaComunicacionID: formData.PlantillaComunicacionID,
        Mensaje: formData.MensajeEnvio,
        Token: user?.Token,
      };

      const response = await ChatApiService.iniciarNuevoChat(chatData);

      Alert.alert('Éxito', 'Chat iniciado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', error.message || 'No se pudo iniciar el chat');
    } finally {
      setLoading(false);
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.Nombre?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.Nombre}
        </Text>
        <Text style={styles.contactPhone}>
          {item.Telefono}
        </Text>
        <Text style={styles.contactAccount}>
          {item.Cuenta || 'Sin cuenta'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (currentView === 'contacts') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#337ab7" />
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo chat</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="person-add" size={24} color="#337ab7" />
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

        {showManualInput && (
          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.manualInput}
              placeholder="Ingrese número de celular"
              value={manualPhone}
              onChangeText={setManualPhone}
              keyboardType="phone-pad"
              maxLength={20}
            />
            <View style={styles.manualButtons}>
              <TouchableOpacity
                style={[styles.manualButton, styles.cancelManual]}
                onPress={() => {
                  setShowManualInput(false);
                  setManualPhone('');
                }}
              >
                <Text style={styles.cancelManualText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualButton, styles.addManual]}
                onPress={handleManualPhoneSubmit}
              >
                <Text style={styles.addManualText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loadingContacts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#337ab7" />
            <Text style={styles.loadingText}>Cargando contactos...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.CuentaMensajeriaContactoID?.toString() || Math.random().toString()}
            style={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay contactos disponibles</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // Template view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            setCurrentView('contacts');
            setSelectedContact(null);
            setFormData({
              CuentaMensajeriaID: null,
              PlantillaComunicacionID: null,
              MensajeEnvio: '',
              Variables: [],
            });
            setPlantillas([]);
            setPlantillaSeleccionada(null);
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#337ab7" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedContact?.Nombre || 'Nuevo contacto'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          {/* Cuenta de mensajería */}
          <View style={styles.field}>
            <Text style={styles.label}>Cuenta de mensajería *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.CuentaMensajeriaID}
                onValueChange={handleCuentaChange}
                style={styles.picker}
              >
                <Picker.Item label="Seleccione una cuenta..." value={null} />
                {cuentas.map((cuenta) => (
                  <Picker.Item
                    key={cuenta.CuentaMensajeriaID}
                    label={cuenta.Nombre}
                    value={cuenta.CuentaMensajeriaID}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Plantilla de comunicación */}
          <View style={styles.field}>
            <Text style={styles.label}>Plantilla de comunicación *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.PlantillaComunicacionID}
                onValueChange={handlePlantillaChange}
                style={styles.picker}
                enabled={formData.CuentaMensajeriaID !== null}
              >
                <Picker.Item label="Seleccione una plantilla..." value={null} />
                {plantillas.map((plantilla) => (
                  <Picker.Item
                    key={plantilla.PlantillaComunicacionID}
                    label={plantilla.Nombre}
                    value={plantilla.PlantillaComunicacionID}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Variables de la plantilla */}
          {formData.Variables.map((variable, index) => (
            <View key={index} style={styles.field}>
              <Text style={styles.label}>{variable.Nombre.replace('@[', '').replace(']', '')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={`Ingrese ${variable.Nombre.replace('@[', '').replace(']', '').toLowerCase()}`}
                value={variable.Valor || ''}
                onChangeText={(text) => handleVariableChange(index, text)}
                maxLength={100}
              />
            </View>
          ))}

          {/* Vista previa del mensaje */}
          {formData.MensajeEnvio && (
            <View style={styles.field}>
              <Text style={styles.label}>Mensaje a enviar</Text>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>{formData.MensajeEnvio}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setCurrentView('contacts');
              setSelectedContact(null);
              setFormData({
                CuentaMensajeriaID: null,
                PlantillaComunicacionID: null,
                MensajeEnvio: '',
                Variables: [],
              });
              setPlantillas([]);
              setPlantillaSeleccionada(null);
            }}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Iniciar Chat</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#337ab7',
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
  manualInputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelManual: {
    backgroundColor: '#6c757d',
  },
  cancelManualText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  addManual: {
    backgroundColor: '#337ab7',
  },
  addManualText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactAccount: {
    fontSize: 12,
    color: '#337ab7',
    fontWeight: '500',
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
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  messagePreview: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#337ab7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NewChat;