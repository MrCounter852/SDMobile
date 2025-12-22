import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
const GestionComercialService = require('../../services/GestionComercial/gestionComercialService').default;
import { useGlobal } from '../../core/global';

const FilterModal = ({ visible, onClose, onApplyFilters, initialFilters = {} }) => {
  const { user } = useGlobal();
  const [filters, setFilters] = useState({
    OrigenPreContactoID: null,
    EstadoProcesoID: "1,4",
    AsesorID: null,
    FechaInicial: null,
    FechaFinal: null,
    FullSearch: '',
    EstadoGeneral: null,
    ...initialFilters,
  });

  const [origenes, setOrigenes] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFilterData();
    }
  }, [visible]);

  const loadFilterData = async () => {
    setLoading(true);
    try {
      // Load origenes
      const origenesResponse = await GestionComercialService.consultarOrigenesPreContactosSucursales({
        SucursalID: user?.SucursalID,
      });
      setOrigenes(origenesResponse.rows || []);

      // Load asesores
      const asesoresResponse = await GestionComercialService.consultarAsesores({
        SucursalID: user?.SucursalID,
        Activo: true,
      });
      setAsesores(asesoresResponse.rows || []);
    } catch (error) {
      console.error('Error loading filter data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de filtros');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleResetFilters = () => {
    setFilters({
      OrigenPreContactoID: null,
      EstadoProcesoID: "1,4",
      AsesorID: null,
      FechaInicial: null,
      FechaFinal: null,
      FullSearch: '',
      EstadoGeneral: null,
    });
  };

  const estados = [
    { ID: null, Nombre: "Todos" },
    { ID: "1,4", Nombre: "Vigentes" },
    { ID: "2", Nombre: "Finalizados" },
    { ID: "3", Nombre: "Inviables" },
  ];

  const estadosGenerales = [
    { ID: null, Nombre: "Todos" },
    { ID: "V", Nombre: "Vigentes" },
    { ID: "A", Nombre: "Próximas a vencer" },
    { ID: "R", Nombre: "Vencidas" },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Origen */}
            <View style={styles.filterSection}>
              <Text style={styles.label}>Tipo de contacto</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.OrigenPreContactoID}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, OrigenPreContactoID: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Todos" value={null} />
                  {origenes.map((origen) => (
                    <Picker.Item
                      key={origen.OrigenPreContactoID}
                      label={origen.Nombre}
                      value={origen.OrigenPreContactoID}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Estado Proceso */}
            <View style={styles.filterSection}>
              <Text style={styles.label}>Estado del proceso</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.EstadoProcesoID}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, EstadoProcesoID: value }))}
                  style={styles.picker}
                >
                  {estados.map((estado) => (
                    <Picker.Item
                      key={estado.ID}
                      label={estado.Nombre}
                      value={estado.ID}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Asesor */}
            <View style={styles.filterSection}>
              <Text style={styles.label}>Asesor</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.AsesorID}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, AsesorID: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Todos" value={null} />
                  {asesores.map((asesor) => (
                    <Picker.Item
                      key={asesor.AsesorID}
                      label={asesor.NombreCompleto}
                      value={asesor.AsesorID}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Estado General */}
            <View style={styles.filterSection}>
              <Text style={styles.label}>Estado general</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.EstadoGeneral}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, EstadoGeneral: value }))}
                  style={styles.picker}
                >
                  {estadosGenerales.map((estado) => (
                    <Picker.Item
                      key={estado.ID}
                      label={estado.Nombre}
                      value={estado.ID}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Búsqueda */}
            <View style={styles.filterSection}>
              <Text style={styles.label}>Búsqueda</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Buscar por nombre, email, celular..."
                value={filters.FullSearch}
                onChangeText={(text) => setFilters(prev => ({ ...prev, FullSearch: text }))}
                maxLength={100}
              />
            </View>

            {/* Fechas - Para versión futura si se necesita */}
            {/* <View style={styles.filterSection}>
              <Text style={styles.label}>Fecha inicial</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                value={filters.FechaInicial || ''}
                onChangeText={(text) => setFilters(prev => ({ ...prev, FechaInicial: text }))}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.label}>Fecha final</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                value={filters.FechaFinal || ''}
                onChangeText={(text) => setFilters(prev => ({ ...prev, FechaFinal: text }))}
              />
            </View> */}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleResetFilters}
            >
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  applyButton: {
    backgroundColor: '#337ab7',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default FilterModal;