import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Linking,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import facturasCompraService from "../services/invoiceService";

// Paleta de colores de la marca (según DESIGN_PATTERNS.md)
const COLORS = {
  primary: "#337ab7",
  secondary: "#0086C8",
  accent: "#00ACC4",
  success: "#00CDA7",
  highlight: "#88E782",
  dark: "#1E293B",
  gray: "#64748B",
  lightGray: "#94A3B8",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const FacturaDetailModal = ({ visible, onClose, item, onActionSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [observacion, setObservacion] = useState("");

  // New states for added features
  const [seguimientos, setSeguimientos] = useState([]);
  const [newSeguimiento, setNewSeguimiento] = useState("");
  const [centrosCostos, setCentrosCostos] = useState([]);
  const [searchCC, setSearchCC] = useState("");
  const [loadingCC, setLoadingCC] = useState(false);

  const [selectedRefs, setSelectedRefs] = useState([]);

  const insets = useSafeAreaInsets();
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      if (Platform.OS === "android") {
        setKeyboardOffset(0);
      }
    });
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      if (Platform.OS === "android") {
        setKeyboardOffset(-30);
      }
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    if (visible && item) {
      setDetail(null);
      setSeguimientos([]);
      setSelectedRefs([]);
      setObservacion("");
      setActiveTab("info");
      loadDetail();
      loadSeguimientos();
    }
  }, [visible, item]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await facturasCompraService.consultarFacturaDetalle(
        item.FacturaCompraID,
        item.FacturaCompraAprobacionJerarquiaID,
      );
      setDetail(response);

      const invoiceData =
        response.FacturaCompra ||
        (response.data && response.data[0]) ||
        (response.rows && response.rows[0]) ||
        response;
      setSelectedRefs(invoiceData.FacturasCompraReferencias || []);
    } catch (error) {
      console.error("Error loading invoice detail:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la factura");
    } finally {
      setLoading(false);
    }
  };

  const loadSeguimientos = async () => {
    if (!item?.FacturaCompraID) return;
    try {
      const response = await facturasCompraService.consultarSeguimientos(
        item.FacturaCompraID,
      );
      setSeguimientos(response.rows || []);
    } catch (error) {
      console.error("Error loading follow-ups:", error);
    }
  };

  const handleInsertSeguimiento = async () => {
    if (!newSeguimiento.trim()) return;
    setLoading(true);
    try {
      await facturasCompraService.insertarSeguimiento(
        item.FacturaCompraID,
        newSeguimiento,
      );
      setNewSeguimiento("");
      loadSeguimientos();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el seguimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCC = async (term) => {
    setSearchCC(term);
    setLoadingCC(true);
    try {
      const response = await facturasCompraService.consultarCentrosCostos(term);
      const rows = response.rows || [];
      // Filter out maestro (parent) cost centers as they are usually not transacting
      setCentrosCostos(rows.filter((cc) => !cc.Maestro));
    } catch (error) {
      console.error("Error searching CC:", error);
    } finally {
      setLoadingCC(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reasignar" && centrosCostos.length === 0) {
      handleSearchCC("");
    }
  }, [activeTab]);

  const handleAsignarCC = async (cc) => {
    Alert.alert(
      "Confirmar",
      `¿Desea asignar el centro de costo ${cc.CodigoNombre} a esta factura?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Asignar",
          onPress: async () => {
            setLoading(true);
            try {
              await facturasCompraService.asignarCentroCosto({
                FacturaCompraID: item.FacturaCompraID,
                CentroCostoID: cc.CentroCostoID,
              });
              Alert.alert("Éxito", "Centro de costo asignado correctamente");
              loadDetail();
            } catch (error) {
              Alert.alert("Error", "No se pudo asignar el centro de costo");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleViewAttachment = async (adj) => {
    try {
      const url = facturasCompraService.getAttachmentUrl(
        adj.FacturaCompraAdjuntoID,
      );
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Error", "No se pudo abrir el archivo adjunto");
    }
  };

  const handleAction = async (aprobar) => {
    if (!observacion.trim()) {
      Alert.alert(
        "Observación requerida",
        `Debe ingresar una observación para ${
          aprobar ? "aprobar" : "rechazar"
        }.`,
      );
      return;
    }

    const invoiceData =
      detail.FacturaCompra ||
      (detail.data && detail.data[0]) ||
      (detail.rows && detail.rows[0]) ||
      detail;

    if (
      invoiceData.CC_APR_FAC_COMPRA &&
      invoiceData.CentroCostoDirecto &&
      invoiceData.CountAprobaciones === 0 &&
      selectedRefs.length === 0 &&
      aprobar
    ) {
      Alert.alert(
        "Referencia requerida",
        "Debe ingresar al menos una referencia para esta factura.",
      );
      return;
    }

    setLoading(true);
    try {
      await facturasCompraService.aprobarFactura({
        ...item,
        ...invoiceData,
        EstadoAprobacionFacturaCompraID: aprobar ? 2 : 3,
        Observaciones: observacion,
        FacturasCompraReferencias: selectedRefs,
      });
      Alert.alert(
        "Éxito",
        `Factura ${aprobar ? "aprobada" : "rechazada"} correctamente`,
      );
      onActionSuccess();
      onClose();
    } catch (error) {
      console.error("Error processing action:", error);
      Alert.alert("Error", "No se pudo procesar la acción");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderTabContent = () => {
    if (!detail) return null;

    const invoiceData =
      detail.FacturaCompra ||
      (detail.data && detail.data[0]) ||
      (detail.rows && detail.rows[0]) ||
      detail;

    switch (activeTab) {
      case "info":
        return (
          <View style={styles.tabContent}>
            <Section
              title="Información General"
              icon="information-circle-outline"
            >
              <DetailRow
                label="Proveedor"
                value={
                  invoiceData.NombreCompleto ||
                  invoiceData.NombreCompletoTercero
                }
                icon="business"
              />
              <DetailRow
                label="Factura #"
                value={invoiceData.NumeroDocumento}
                icon="document-text"
              />
              <DetailRow
                label="Fecha"
                value={
                  invoiceData.FechaRegistro || invoiceData.FechaRegistroStr
                }
                icon="calendar"
              />
              <DetailRow
                label="Vencimiento"
                value={
                  invoiceData.FechaVencimiento ||
                  invoiceData.FechaVencimientoStr
                }
                icon="time"
              />
              <DetailRow
                label="Tipo Pago"
                value={invoiceData.TipoPagoNombre}
                icon="card"
              />
              <DetailRow
                label="C. Costo Actual"
                value={invoiceData.CentroCostoCodigoNombre}
                icon="grid"
              />
              {invoiceData.Observaciones && (
                <DetailRow
                  label="Observaciones"
                  value={invoiceData.Observaciones}
                  icon="chatbubble"
                />
              )}
              <DetailRow
                label="Tipo Documento"
                value={invoiceData.TipoDocumentoNombre}
                icon="id-card"
              />
              <DetailRow
                label="Tipo Factura"
                value={invoiceData.TipoFacturaCompraNombre}
                icon="receipt"
              />
            </Section>

            <Section title="Totales" icon="cash-outline">
              <DetailRow
                label="Total"
                value={formatCurrency(invoiceData.ValorTotal)}
                highlight
              />
            </Section>

            <Section title="Flujo de Aprobación" icon="git-branch-outline">
              {(invoiceData.FacturasCompraAprobacionesJerarquias || []).map(
                (step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepDot,
                        step.EstadoAprobacionFacturaCompraID === 2 &&
                          styles.stepDotActive,
                      ]}
                    />
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepUser}>
                        {step.UsuarioNombreCompleto || "Usuario pendiente"}
                      </Text>
                      <Text style={styles.stepStatus}>
                        {step.EstadoAprobacionFacturaCompraNombre}
                      </Text>
                      {step.Observaciones && (
                        <Text style={styles.stepObs}>{step.Observaciones}</Text>
                      )}
                    </View>
                  </View>
                ),
              )}
            </Section>

            <Section title="Adjuntos" icon="attach-outline">
              {(invoiceData.FacturasCompraAdjuntos || []).length > 0 ? (
                invoiceData.FacturasCompraAdjuntos.map((adj, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.attachmentRow}
                    onPress={() => handleViewAttachment(adj)}
                  >
                    <View style={styles.attachmentIconContainer}>
                      <Ionicons
                        name="attach"
                        size={20}
                        color={COLORS.secondary}
                      />
                    </View>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {adj.Nombre || adj.NombreOriginal}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.lightGray}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay archivos adjuntos</Text>
              )}
            </Section>
          </View>
        );

      case "reasignar":
        return (
          <View style={styles.tabContent}>
            <Section
              title="Reasignar Centro de Costo"
              icon="swap-horizontal-outline"
            >
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={COLORS.lightGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar centro de costo..."
                  placeholderTextColor={COLORS.lightGray}
                  value={searchCC}
                  onChangeText={handleSearchCC}
                />
                {loadingCC && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
              </View>
              {centrosCostos.map((cc) => (
                <TouchableOpacity
                  key={cc.CentroCostoID}
                  style={styles.ccItem}
                  onPress={() => handleAsignarCC(cc)}
                >
                  <Text style={styles.ccName}>{cc.CodigoNombre}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.lightGray}
                  />
                </TouchableOpacity>
              ))}
              {searchCC.length >= 2 &&
                centrosCostos.length === 0 &&
                !loadingCC && (
                  <Text style={styles.emptyText}>
                    No se encontraron resultados
                  </Text>
                )}
            </Section>
          </View>
        );

      case "referencias":
        return (
          <View style={styles.tabContent}>
            <Section title="Referencias Asignadas" icon="link-outline">
              {selectedRefs.length > 0 ? (
                selectedRefs.map((ref, idx) => (
                  <View key={`assigned-${idx}`} style={styles.refItem}>
                    <View style={styles.refIconContainer}>
                      <Ionicons
                        name="link"
                        size={18}
                        color={COLORS.secondary}
                      />
                    </View>
                    <View style={styles.refContent}>
                      <Text style={styles.refText}>{ref.Referencia}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedRefs((prev) =>
                          prev.filter((_, i) => i !== idx),
                        );
                      }}
                      style={styles.removeRefBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay referencias asignadas
                </Text>
              )}
            </Section>

            <Section title="Referencias Disponibles" icon="add-circle-outline">
              {(invoiceData?.CentrosCostosReferencias || []).length > 0 ? (
                invoiceData.CentrosCostosReferencias.filter(
                  (available) =>
                    !selectedRefs.some(
                      (selected) =>
                        selected.Referencia === available.Referencia,
                    ),
                ).map((ref, idx) => (
                  <TouchableOpacity
                    key={`available-${idx}`}
                    style={styles.refItemAvailable}
                    onPress={() => {
                      setSelectedRefs((prev) => [
                        ...prev,
                        { Referencia: ref.Referencia },
                      ]);
                    }}
                  >
                    <View style={styles.refIconContainerSuccess}>
                      <Ionicons name="add" size={18} color={COLORS.success} />
                    </View>
                    <View style={styles.refContent}>
                      <Text style={styles.refText}>{ref.Referencia}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay referencias disponibles para este centro de costo
                </Text>
              )}
            </Section>
          </View>
        );

      case "seguimientos":
        return (
          <View style={styles.tabContent}>
            <Section title="Nuevo Seguimiento" icon="create-outline">
              <View style={styles.addSeguimientoBox}>
                <TextInput
                  style={styles.newSegInput}
                  placeholder="Escriba un seguimiento..."
                  placeholderTextColor={COLORS.lightGray}
                  value={newSeguimiento}
                  onChangeText={setNewSeguimiento}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.addSegButton,
                    !newSeguimiento.trim() && styles.disabledButton,
                  ]}
                  onPress={handleInsertSeguimiento}
                  disabled={!newSeguimiento.trim() || loading}
                >
                  <LinearGradient
                    colors={
                      newSeguimiento.trim()
                        ? [COLORS.primary, COLORS.accent]
                        : [COLORS.lightGray, COLORS.lightGray]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addSegButtonGradient}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Section>

            <Section title="Historial de Seguimientos" icon="time-outline">
              {seguimientos.length > 0 ? (
                seguimientos.map((seg, idx) => (
                  <View key={idx} style={styles.segItem}>
                    <View style={styles.segHeader}>
                      <Text style={styles.segUser}>{seg.NombreCompleto}</Text>
                      <Text style={styles.segDate}>
                        {seg.FechaRegistroAmigable}
                      </Text>
                    </View>
                    <Text style={styles.segComment}>{seg.Comentario}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay seguimientos registrados
                </Text>
              )}
            </Section>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : keyboardOffset}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconContainer}>
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.headerTitle}>Detalle de Factura</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {loading && !detail ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando detalle...</Text>
              </View>
            ) : (
              <>
                <View style={styles.tabsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScrollContent}
                  >
                    <Tab
                      label="Información"
                      icon="information-circle-outline"
                      active={activeTab === "info"}
                      onPress={() => setActiveTab("info")}
                    />
                    <Tab
                      label="Reasignar"
                      icon="swap-horizontal-outline"
                      active={activeTab === "reasignar"}
                      onPress={() => setActiveTab("reasignar")}
                    />
                    <Tab
                      label="Referencias"
                      icon="link-outline"
                      active={activeTab === "referencias"}
                      onPress={() => setActiveTab("referencias")}
                    />
                    <Tab
                      label="Seguimientos"
                      icon="chatbubbles-outline"
                      active={activeTab === "seguimientos"}
                      onPress={() => setActiveTab("seguimientos")}
                    />
                  </ScrollView>
                </View>

                <ScrollView
                  style={styles.body}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {renderTabContent()}

                  {activeTab === "info" && (
                    <View style={styles.observacionSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="chatbox-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Text style={styles.sectionTitle}>
                          Acción de Aprobación
                        </Text>
                      </View>
                      <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={4}
                        placeholder="Ingrese un comentario para aprobar/rechazar..."
                        placeholderTextColor={COLORS.lightGray}
                        value={observacion}
                        onChangeText={setObservacion}
                      />
                    </View>
                  )}

                  <View style={{ height: 20 }} />
                </ScrollView>

                {activeTab === "info" && (
                  <View
                    style={[
                      styles.footer,
                      { paddingBottom: Math.max(24, insets.bottom) },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleAction(false)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={18} color={COLORS.primary} />
                      <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButtonContainer}
                      onPress={() => handleAction(true)}
                      disabled={loading}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.approveButton}
                      >
                        <Text style={styles.approveButtonText}>Aprobar</Text>
                        <Feather name="check" size={18} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const DetailRow = ({ label, value, icon, highlight }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      {icon && (
        <View style={styles.rowIconContainer}>
          <Ionicons
            name={`${icon}-outline`}
            size={16}
            color={COLORS.secondary}
          />
        </View>
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, highlight && styles.highlightValue]}>
      {value || "N/A"}
    </Text>
  </View>
);

const Tab = ({ label, icon, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={16}
      color={active ? COLORS.primary : COLORS.gray}
      style={styles.tabIcon}
    />
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

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
    height: "92%",
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
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "rgba(51,122,183,0.1)",
    borderColor: COLORS.primary,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingTop: 8,
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
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  highlightValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
    marginRight: 12,
  },
  stepDotActive: {
    backgroundColor: COLORS.success,
  },
  stepInfo: {
    flex: 1,
  },
  stepUser: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
  },
  stepStatus: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  stepObs: {
    fontSize: 13,
    color: COLORS.gray,
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 12,
    fontWeight: "500",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.dark,
  },
  ccItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  ccName: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
    fontWeight: "500",
  },
  refItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refItemAvailable: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,205,167,0.05)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,205,167,0.2)",
  },
  refIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  refIconContainerSuccess: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,205,167,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  refContent: {
    flex: 1,
    marginLeft: 12,
  },
  refText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
  },
  removeRefBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  addSeguimientoBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  newSegInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 52,
    maxHeight: 100,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlignVertical: "top",
  },
  addSegButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
  },
  addSegButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  segItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  segHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  segUser: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  segDate: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  segComment: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  observacionSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  rejectButton: {
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
  rejectButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  approveButtonContainer: {
    flex: 2,
  },
  approveButton: {
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
  approveButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.lightGray,
    padding: 20,
    fontSize: 14,
  },
});

export default FacturaDetailModal;
