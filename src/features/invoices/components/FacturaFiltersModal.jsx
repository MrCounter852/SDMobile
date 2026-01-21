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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import facturasCompraService from "../services/invoiceService";
import { COLORS } from "../../../core/theme";

const FilterSection = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

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
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconContainer}>
                  <Ionicons
                    name="filter-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.headerTitle}>Filtrar Facturas</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <FilterSection title="Búsqueda rápida" icon="search-outline">
                <View style={styles.inputWithIcon}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={COLORS.lightGray}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.flexInput}
                    placeholder="Número de factura, emisor..."
                    placeholderTextColor={COLORS.lightGray}
                    value={filters.FullSearch}
                    onChangeText={(text) =>
                      setFilters({ ...filters, FullSearch: text })
                    }
                  />
                </View>
              </FilterSection>

              <FilterSection title="Emisor (Tercero)" icon="business-outline">
                <View style={styles.inputWithIcon}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.lightGray}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.flexInput}
                    placeholder="Buscar emisor..."
                    placeholderTextColor={COLORS.lightGray}
                    value={searchTerm}
                    onChangeText={(text) => {
                      setSearchTerm(text);
                      loadTerceros(text);
                    }}
                  />
                  {loadingTerceros && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </View>

                {filters.TerceroID && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.success}
                    />
                    <Text style={styles.selectedIndicatorText}>
                      Seleccionado: {filters.TerceroNombre}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFilters({
                          ...filters,
                          TerceroID: null,
                          TerceroNombre: "",
                        })
                      }
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={COLORS.lightGray}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.tercerosList}>
                  <TouchableOpacity
                    style={[
                      styles.terceroItem,
                      filters.TerceroID === null && styles.terceroItemSelected,
                    ]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        TerceroID: null,
                        TerceroNombre: "Todos",
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.terceroContent}>
                      <View
                        style={[
                          styles.terceroIconContainer,
                          filters.TerceroID === null &&
                            styles.terceroIconContainerSelected,
                        ]}
                      >
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={
                            filters.TerceroID === null
                              ? COLORS.white
                              : COLORS.secondary
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.terceroText,
                          filters.TerceroID === null &&
                            styles.terceroTextSelected,
                        ]}
                      >
                        Todos los emisores
                      </Text>
                    </View>
                    {filters.TerceroID === null && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.white}
                      />
                    )}
                  </TouchableOpacity>

                  {terceros.map((tercero) => (
                    <TouchableOpacity
                      key={tercero.TerceroID}
                      style={[
                        styles.terceroItem,
                        filters.TerceroID === tercero.TerceroID &&
                          styles.terceroItemSelected,
                      ]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          TerceroID: tercero.TerceroID,
                          TerceroNombre: tercero.NombreCompleto,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.terceroContent}>
                        <View
                          style={[
                            styles.terceroIconContainer,
                            filters.TerceroID === tercero.TerceroID &&
                              styles.terceroIconContainerSelected,
                          ]}
                        >
                          <Ionicons
                            name="business-outline"
                            size={18}
                            color={
                              filters.TerceroID === tercero.TerceroID
                                ? COLORS.white
                                : COLORS.secondary
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.terceroText,
                            filters.TerceroID === tercero.TerceroID &&
                              styles.terceroTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {tercero.NombreCompleto}
                        </Text>
                      </View>
                      {filters.TerceroID === tercero.TerceroID && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  ))}

                  {searchTerm.length >= 2 &&
                    terceros.length === 0 &&
                    !loadingTerceros && (
                      <View style={styles.emptyState}>
                        <Ionicons
                          name="search-outline"
                          size={32}
                          color={COLORS.lightGray}
                        />
                        <Text style={styles.emptyStateText}>
                          No se encontraron emisores
                        </Text>
                      </View>
                    )}
                </View>
              </FilterSection>

              <View style={{ height: 40 }} />
            </ScrollView>

            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(24, insets.bottom) },
              ]}
            >
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color={COLORS.primary} />
                <Text style={styles.resetButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButtonContainer}
                onPress={handleApply}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                  <Feather name="check" size={18} color="#FFF" />
                </LinearGradient>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(51,122,183,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingLeft: 4,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  flexInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    height: "100%",
    paddingVertical: 0,
  },
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,205,167,0.1)",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  selectedIndicatorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "500",
  },
  tercerosList: {
    marginTop: 16,
    gap: 8,
  },
  terceroItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  terceroItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  terceroContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  terceroIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  terceroIconContainerSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  terceroText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
    flex: 1,
  },
  terceroTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  resetButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  applyButtonContainer: {
    flex: 2,
  },
  applyButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
});

export default FacturaFiltersModal;
