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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ChatApiService from '../../core/chatApi';
import { useGlobal } from '../../core/global';

const NewChat = ({ navigation }) => {
  const { user } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    CuentaMensajeriaID: null,
    Celular: '',
    PlantillaComunicacionID: null,
    MensajeEnvio: '',
    Variables: [],
  });

  useEffect(() => {
    loadCuentasMensajeria();
  }, []);

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

        setPlantillaSeleccionada(detalle.data);
        setFormData(prev => ({
          ...prev,
          PlantillaComunicacionID: plantillaID,
          MensajeEnvio: detalle.data?.Mensaje || '',
          Variables: detalle.data?.Variables || [],
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
    if (!plantillaSeleccionada?.Mensaje) return;

    let mensaje = plantillaSeleccionada.Mensaje;
    variables.forEach((variable, index) => {
      const placeholder = `{${index + 1}}`;
      mensaje = mensaje.replace(new RegExp(placeholder, 'g'), variable.Valor || placeholder);
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

    if (!formData.Celular || formData.Celular.trim() === '') {
      Alert.alert('Error', 'El número de celular es obligatorio');
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
        ...formData,
        Token: user?.Token,
      };

      const response = await ChatApiService.iniciarNuevoChat(chatData);

      if (response.success) {
        Alert.alert('Éxito', 'Chat iniciado correctamente', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(response.message || 'Error al iniciar el chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', error.message || 'No se pudo iniciar el chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo Chat</Text>
      </View>

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

        {/* Número de celular */}
        <View style={styles.field}>
          <Text style={styles.label}>Número de celular *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 3001234567"
            value={formData.Celular}
            onChangeText={(text) => setFormData(prev => ({ ...prev, Celular: text }))}
            keyboardType="phone-pad"
            maxLength={20}
          />
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
            <Text style={styles.label}>{variable.Nombre} *</Text>
            <TextInput
              style={styles.input}
              placeholder={`Ingrese ${variable.Nombre.toLowerCase()}`}
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
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NewChat;