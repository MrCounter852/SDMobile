import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import facturasCompraService from "../../services/facturasCompra/facturasCompraService";

const FacturaFiltersModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [terceros, setTerceros] = useState([]);
  const [loadingTerceros, setLoadingTerceros] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      loadTerceros("");
    }
  }, [visible, initialFilters]);

  const loadTerceros = async (term) => {
    setLoadingTerceros(true);
    try {
      const response = await facturasCompraService.consultarTerceros(term);
      setTerceros(response.rows || []);
    } catch (error) {
      console.error("Error loading terceros:", error);
    } finally {
      setLoadingTerceros(false);
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      FullSearch: "",
      TerceroID: null,
      TerceroNombre: "",
    };
    setFilters(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filtrar facturas</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#3A3A3C" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Búsqueda general</Text>
                <View style={styles.searchContainer}>
                  <Ionicons name="search-outline" size={20} color="#8E8E93" />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de factura, emisor..."
                    value={filters.FullSearch}
                    onChangeText={(text) =>
                      setFilters({ ...filters, FullSearch: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emisor (Tercero)</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar emisor..."
                    onChangeText={(text) => {
                      setSearchTerm(text);
                      loadTerceros(text);
                    }}
                  />
                  {loadingTerceros && (
                    <ActivityIndicator size="small" color="#337ab7" />
                  )}
                </View>
                <View style={styles.tercerosList}>
                  <TouchableOpacity
                    style={[
                      styles.terceroSearched,
                      filters.TerceroID === null && styles.terceroSelected,
                    ]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        TerceroID: null,
                        TerceroNombre: "Todos",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.terceroText,
                        filters.TerceroID === null &&
                          styles.terceroTextSelected,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {terceros.map((tercero) => (
                    <TouchableOpacity
                      key={tercero.TerceroID}
                      style={[
                        styles.terceroSearched,
                        filters.TerceroID === tercero.TerceroID &&
                          styles.terceroSelected,
                      ]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          TerceroID: tercero.TerceroID,
                          TerceroNombre: tercero.NombreCompleto,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.terceroText,
                          filters.TerceroID === tercero.TerceroID &&
                            styles.terceroTextSelected,
                        ]}
                      >
                        {tercero.NombreCompleto}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View
              style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            >
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1C1C1E",
  },
  tercerosList: {
    marginTop: 12,
    gap: 8,
  },
  terceroSearched: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8F8FA",
  },
  terceroSelected: {
    backgroundColor: "#337ab7",
  },
  terceroText: {
    fontSize: 15,
    color: "#3A3A3C",
  },
  terceroTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  clearButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  applyButton: {
    flex: 2,
    height: 50,
    backgroundColor: "#337ab7",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default FacturaFiltersModal;
