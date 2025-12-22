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
  Modal,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from '@react-native-picker/picker'; // Keep for now if needed, but we might replace usage
import { Ionicons } from '@expo/vector-icons';
import ChatApiService from '../../services/chat/chatService';
import { useGlobal } from '../../core/global';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const NewChat = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useGlobal();
  const [currentView, setCurrentView] = useState('contacts'); // 'contacts' or 'template'

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPhone, setManualPhone] = useState('');

  // Template/Chat State
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  // UI State for Template View 
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false); // New state

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
    if (contact.CuentaMensajeriaID) {
      loadPlantillas(contact.CuentaMensajeriaID);
    }
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
      CuentaMensajeriaID: null,
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

  const handlePlantillaSelect = async (plantilla) => {
    setTemplateModalVisible(false);
    setLoadingTemplate(true); // Start loading

    const plantillaID = plantilla.PlantillaComunicacionID;

    try {
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

    } catch (error) {
      console.error('Error loading plantilla detalle:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la plantilla');
    } finally {
      setLoadingTemplate(false); // Stop loading regardless of success/error
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

      await ChatApiService.iniciarNuevoChat(chatData);

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

  // --- RENDER FUNCTIONS --- //

  // 1. Template Selection Modal
  const renderTemplateModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={templateModalVisible}
      onRequestClose={() => setTemplateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Plantilla</Text>
            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={plantillas}
            keyExtractor={(item) => item.PlantillaComunicacionID?.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateItem}
                onPress={() => handlePlantillaSelect(item)}
              >
                <View style={styles.templateIcon}>
                  <Ionicons name="document-text-outline" size={24} color="#337ab7" />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{item.Nombre}</Text>
                  {/* If there is a preview text available in item, show it, otherwise show generic */}
                  <Text style={styles.templatePreview} numberOfLines={1}>Toque para seleccionar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay plantillas disponibles para esta cuenta.</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );

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
      <SafeAreaView style={[styles.container, { marginBottom: insets.bottom }]}>
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
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contactos..."
            placeholderTextColor="#999"
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
                <Text style={styles.manualButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualButton, styles.addManual]}
                onPress={handleManualPhoneSubmit}
              >
                <Text style={styles.manualButtonTextAdd}>Agregar</Text>
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
            contentContainerStyle={{ paddingBottom: 20 }}
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

  // --- TEMPLATE VIEW (Modernized) ---
  return (
    <SafeAreaView style={[styles.chatContainer]}>
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
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
            <Ionicons name="arrow-back" size={24} color="#337ab7" style={[{ marginLeft: 16 }]} />
          </TouchableOpacity>
          <View>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {selectedContact?.Nombre || 'Nuevo contacto'}
            </Text>
            <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
              {selectedContact?.Telefono}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View
          style={styles.chatBackground}
        >
          <ScrollView contentContainerStyle={styles.chatContent}>

            {/* 1. Account Selection */}
            <View style={styles.selectionCard}>
              <Text style={styles.sectionLabel}>Cuenta de envío</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.CuentaMensajeriaID}
                  onValueChange={handleCuentaChange}
                  style={styles.pickerStyled}
                  dropdownIconColor="#666"
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

            {/* 2. Template Selection */}
            <View style={styles.selectionCard}>
              <Text style={styles.sectionLabel}>Plantilla</Text>
              <TouchableOpacity
                style={[
                  styles.templateSelectorButton,
                  !formData.CuentaMensajeriaID && styles.disabledButton // Removed local styles dependency for now, trusting existing ones
                ]}
                onPress={() => formData.CuentaMensajeriaID && !loadingTemplate && setTemplateModalVisible(true)}
                disabled={!formData.CuentaMensajeriaID || loadingTemplate}
              >
                {loadingTemplate ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#337ab7" style={{ marginRight: 8 }} />
                    <Text style={styles.templateSelectorText}>Cargando plantilla...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[
                      styles.templateSelectorText,
                      !plantillaSeleccionada && styles.placeholderText
                    ]}>
                      {plantillaSeleccionada ? plantillaSeleccionada.Nombre : 'Seleccionar plantilla...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 3. Message Preview (Chat Bubble) */}
            {formData.MensajeEnvio ? (
              <View style={styles.messageBubbleContainer}>
                <View style={styles.messageBubble}>
                  <Text style={styles.messageText}>{formData.MensajeEnvio}</Text>
                  <View style={styles.messageMetadata}>
                    <Text style={styles.messageTime}>Ahora</Text>
                    <Ionicons name="checkmark-done" size={16} color="#337ab7" />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderBubble}>
                <Text style={styles.placeholderTextCenter}>
                  Selecciona una plantilla para ver la vista previa del mensaje.
                </Text>
              </View>
            )}

            {/* 4. Variables Form */}
            {formData.Variables.length > 0 && (
              <View style={styles.variablesContainer}>
                <Text style={styles.variablesTitle}>Completar Variables</Text>
                {formData.Variables.map((variable, index) => (
                  <View key={index} style={styles.variableRow}>
                    <Text style={styles.variableLabel}>{variable.Nombre.replace(/[@\[\]]/g, '')}:</Text>
                    <TextInput
                      style={styles.variableInput}
                      placeholder={`Escribe aquí...`}
                      value={variable.Valor}
                      onChangeText={(text) => handleVariableChange(index, text)}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Spacer for FAB */}
            <View style={{ height: 80 }} />

          </ScrollView>
        </View>

        {/* 5. Floating Send Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !formData.MensajeEnvio}
            activeOpacity={0.8}
            style={[
              styles.fabButtonShadow,
              (loading || !formData.MensajeEnvio) && styles.fabDisabled
            ]}
          >
            <LinearGradient
              colors={(loading || !formData.MensajeEnvio) ? ['#999', '#999'] : ["#337ab7", "#88E782"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {renderTemplateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- Common ---
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff', // App Primary Blue
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#337ab7',
  },
  headerButton: {
    padding: 8,
  },

  // --- Search ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 24,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  // --- Contacts List ---
  contactsList: {
    paddingHorizontal: 16,

  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#337ab7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactAccount: {
    fontSize: 12,
    color: '#337ab7',
    marginTop: 2,
  },

  // --- Manual Input ---
  manualInputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelManual: {
    backgroundColor: '#f1f1f1',
  },
  addManual: {
    backgroundColor: '#337ab7',
  },
  manualButtonTextAdd: {
    fontWeight: '600',
    color: '#fff',
  },
  manualButtonTextCancel: {
    fontWeight: '600',
    color: '#333',
  },
  addManual: {
    backgroundColor: '#337ab7'
  },
  cancelManual: {
    backgroundColor: '#eee'
  },

  // --- Chat View Styles ---
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    elevation: 4,
    height: 60,
    backgroundColor: '#fff',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 8,
  },
  headerAvatarText: {
    color: '#337ab7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatHeaderTitle: {
    marginLeft: 16,
    color: '#337ab7',
    fontSize: 18,
    fontWeight: '700',
  },
  chatHeaderSubtitle: {
    marginLeft: 16,
    color: '#666',
    fontSize: 13,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chatContent: {
    padding: 16,
  },

  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  pickerStyled: {
    height: 50,
    width: '100%',
  },
  templateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  templateSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },

  // Message Bubble
  messageBubbleContainer: {
    alignItems: 'flex-end',
    marginVertical: 12,
  },
  messageBubble: {
    backgroundColor: '#88E782', // WhatsApp outgoing green
    borderRadius: 12,
    borderTopRightRadius: 2,
    padding: 12,
    paddingBottom: 24, // Space for time
    maxWidth: '85%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    position: 'relative',
  },
  placeholderBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    marginBottom: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#bbb',
  },
  placeholderTextCenter: {
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  messageMetadata: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.45)',
    marginRight: 4,
  },

  // Variables Form
  variablesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    elevation: 1,
  },
  variablesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#337ab7',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  variableRow: {
    marginBottom: 16,
  },
  variableLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 6,
  },
  variableInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabButtonShadow: {
    width: 50,
    height: 50,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    backgroundColor: 'transparent',
    backgroundColor: '#fff',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30, // Match container
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fabDisabled: {
    opacity: 0.7,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',

  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templatePreview: {
    fontSize: 13,
    color: '#888',
  },
  emptyText: {
    padding: 32,
    textAlign: 'center',
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default NewChat;