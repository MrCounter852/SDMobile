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
import { LinearGradient } from 'expo-linear-gradient';
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
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#1C1C1E" />
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
              onPress={handleApplyFilters}
            >
              <LinearGradient
                colors={['#337ab7', '#00ACC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, styles.applyButton]}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </LinearGradient>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 0,
    paddingHorizontal: 24,
  },
  filterSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 10,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1C1C1E',
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  applyButton: {
    elevation: 4,
    shadowColor: '#337ab7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '700',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});

export default FilterModal;