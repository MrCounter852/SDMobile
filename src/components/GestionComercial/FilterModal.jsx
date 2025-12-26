import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;
import { useGlobal } from "../../core/global";

const FilterModal = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
  mode = 'table', // 'table', 'timeline', 'calendar'
  origenes = [],
  tiposCalendarioActividades = [],
  loading = false,
}) => {
  const { user } = useGlobal();
  const [filters, setFilters] = useState({
    OrigenPreContactoID: null,
    EstadoProcesoID: "1,4",
    FechaInicial: null,
    FechaFinal: null,
    FullSearch: "",
    EstadoGeneral: null,
    EstadoActividadID: "3,4",
    TipoCalendarioActividadID: null,
    ...initialFilters,
  });

  useEffect(() => {
    if (visible && initialFilters) {
      setFilters({
        ...initialFilters,
      });
    }
  }, [visible, initialFilters]);

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      OrigenPreContactoID: null,
      EstadoProcesoID: "1,4",
      FechaInicial: null,
      FechaFinal: null,
      FullSearch: "",
      EstadoGeneral: null,
      EstadoActividadID: "3,4",
      TipoCalendarioActividadID: null,
    };
    setFilters(defaultFilters);
  };

  const estados = useMemo(() => [
    { ID: null, Nombre: "Todos" },
    { ID: "1,4", Nombre: "Vigentes" },
    { ID: "2", Nombre: "Finalizados" },
    { ID: "3", Nombre: "Inviables" },
  ], []);

  const estadosGenerales = useMemo(() => [
    { ID: null, Nombre: "Todos" },
    { ID: "V", Nombre: "Vigentes" },
    { ID: "A", Nombre: "Próximas a vencer" },
    { ID: "R", Nombre: "Vencidas" },
  ], []);

  const estadosActividades = useMemo(() => [
    { ID: null, Nombre: "Todas" },
    { ID: "1", Nombre: "Finalizadas" },
    { ID: "2", Nombre: "Vigentes" },
    { ID: "3", Nombre: "Vencidas" },
    { ID: "4", Nombre: "Pendientes o próximas a vencer" },
    { ID: "3,4", Nombre: "Vencidas y Pendientes" },
  ], []);

  const origenesItems = useMemo(() =>
    origenes.map((origen) => (
      <Picker.Item
        key={origen.OrigenPreContactoID}
        label={origen.Nombre}
        value={origen.OrigenPreContactoID}
      />
    )), [origenes]);

  const tiposCalendarioItems = useMemo(() =>
    tiposCalendarioActividades.map((tipo) => (
      <Picker.Item
        key={tipo.TipoCalendarioActividadID}
        label={tipo.Nombre}
        value={tipo.TipoCalendarioActividadID}
      />
    )), [tiposCalendarioActividades]);

  const estadosItems = useMemo(() => estados.map((estado) => (
    <Picker.Item key={estado.ID} label={estado.Nombre} value={estado.ID} />
  )), [estados]);

  const estadosGeneralesItems = useMemo(() => estadosGenerales.map((estado) => (
    <Picker.Item key={estado.ID} label={estado.Nombre} value={estado.ID} />
  )), [estadosGenerales]);

  const estadosActividadesItems = useMemo(() => estadosActividades.map((estado) => (
    <Picker.Item key={estado.ID} label={estado.Nombre} value={estado.ID} />
  )), [estadosActividades]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#337ab7" />
                  <Text style={styles.loadingText}>Cargando filtros...</Text>
                </View>
              )}
              {(mode === 'table' || mode === 'timeline') && (
                <>
                  {/* Origen */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Tipo de contacto</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.OrigenPreContactoID}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            OrigenPreContactoID: value,
                          }))
                        }
                        style={styles.picker}
                      >
                        <Picker.Item label="Todos" value={null} />
                        {origenesItems}
                      </Picker>
                    </View>
                  </View>

                  {/* Estado Proceso */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Estado del proceso</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.EstadoProcesoID}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            EstadoProcesoID: value,
                          }))
                        }
                        style={styles.picker}
                      >
                        {estadosItems}
                      </Picker>
                    </View>
                  </View>

                  {/* Estado General */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Estado general</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.EstadoGeneral}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, EstadoGeneral: value }))
                        }
                        style={styles.picker}
                      >
                        {estadosGeneralesItems}
                      </Picker>
                    </View>
                  </View>
                </>
              )}

              {mode === 'calendar' && (
                <>
                  {/* Estados Actividad */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Estados</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.EstadoActividadID}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, EstadoActividadID: value }))
                        }
                        style={styles.picker}
                      >
                        {estadosActividadesItems}
                      </Picker>
                    </View>
                  </View>

                  {/* Fecha Inicial */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Fecha inicial</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="DD/MM/YYYY"
                      value={filters.FechaInicial || ''}
                      onChangeText={(text) =>
                        setFilters((prev) => ({ ...prev, FechaInicial: text }))
                      }
                    />
                  </View>

                  {/* Fecha Final */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Fecha final</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="DD/MM/YYYY"
                      value={filters.FechaFinal || ''}
                      onChangeText={(text) =>
                        setFilters((prev) => ({ ...prev, FechaFinal: text }))
                      }
                    />
                  </View>

                  {/* Tipos Actividades */}
                  <View style={styles.filterSection}>
                    <Text style={styles.label}>Tipos actividades</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.TipoCalendarioActividadID}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, TipoCalendarioActividadID: value }))
                        }
                        style={styles.picker}
                      >
                        <Picker.Item label="Todos" value={null} />
                        {tiposCalendarioItems}
                      </Picker>
                    </View>
                  </View>
                </>
              )}



              {/* Búsqueda - común */}
              <View style={styles.filterSection}>
                <Text style={styles.label}>Búsqueda</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={mode === 'calendar' ? "Buscar por asunto, contacto..." : "Buscar por nombre, email, celular..."}
                  value={filters.FullSearch}
                  onChangeText={(text) =>
                    setFilters((prev) => ({ ...prev, FullSearch: text }))
                  }
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
              <TouchableOpacity onPress={handleApplyFilters}>
                <LinearGradient
                  colors={["#337ab7", "#00ACC4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.button, styles.applyButton]}
                >
                  <Text style={styles.applyButtonText}>Aplicar filtros</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "90%",
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "700",
    color: "#3A3A3C",
    marginBottom: 10,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#1C1C1E",
  },
  textInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
  },
  applyButton: {
    elevation: 4,
    shadowColor: "#337ab7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "700",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#AEAEB2',
  },
});

export default FilterModal;
