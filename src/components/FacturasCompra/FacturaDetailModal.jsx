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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import facturasCompraService from "../../services/facturasCompra/facturasCompraService";

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
        item.FacturaCompraAprobacionJerarquiaID
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
        item.FacturaCompraID
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
        newSeguimiento
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
      ]
    );
  };

  const handleAction = async (aprobar) => {
    if (!observacion && !aprobar) {
      Alert.alert(
        "Observación requerida",
        "Debe ingresar una observación para rechazar."
      );
      return;
    }

    setLoading(true);
    try {
      await facturasCompraService.aprobarFactura({
        FacturaCompraID: item.FacturaCompraID,
        FacturaCompraAprobacionJerarquiaID:
          item.FacturaCompraAprobacionJerarquiaID,
        EstadoAprobacionFacturaCompraID: aprobar ? 2 : 3,
        Observaciones: observacion,
        FacturasCompraReferencias: JSON.stringify(selectedRefs),
        EmpresaID: item.EmpresaID,
      });
      Alert.alert(
        "Éxito",
        `Factura ${aprobar ? "aprobada" : "rechazada"} correctamente`
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
            <Section title="Información General">
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

            <Section title="Totales">
              <DetailRow
                label="Total"
                value={formatCurrency(invoiceData.ValorTotal)}
                highlight
              />
            </Section>

            <Section title="Flujo de Aprobación">
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
                )
              )}
            </Section>

            <Section title="Adjuntos">
              {(invoiceData.FacturasCompraAdjuntos || []).length > 0 ? (
                invoiceData.FacturasCompraAdjuntos.map((adj, idx) => (
                  <TouchableOpacity key={idx} style={styles.attachmentRow}>
                    <Ionicons name="attach" size={20} color="#337ab7" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {adj.Nombre || adj.NombreOriginal}
                    </Text>
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
            <Section title="Reasignar Centro de Costo">
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar centro de costo..."
                  value={searchCC}
                  onChangeText={handleSearchCC}
                />
                {loadingCC && (
                  <ActivityIndicator size="small" color="#337ab7" />
                )}
              </View>
              {centrosCostos.map((cc) => (
                <TouchableOpacity
                  key={cc.CentroCostoID}
                  style={styles.ccItem}
                  onPress={() => handleAsignarCC(cc)}
                >
                  <Text style={styles.ccName}>{cc.CodigoNombre}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#AEAEB2" />
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
            <Section title="Referencias Asignadas">
              {selectedRefs.length > 0 ? (
                selectedRefs.map((ref, idx) => (
                  <View key={`assigned-${idx}`} style={styles.refItem}>
                    <Ionicons name="link" size={20} color="#337ab7" />
                    <View style={styles.refContent}>
                      <Text style={styles.refText}>{ref.Referencia}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedRefs((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                      }}
                      style={styles.removeRefBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF3B30"
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

            <Section title="Referencias Disponibles (Centro de Costo)">
              {(invoiceData?.CentrosCostosReferencias || []).length > 0 ? (
                invoiceData.CentrosCostosReferencias.filter(
                  (available) =>
                    !selectedRefs.some(
                      (selected) => selected.Referencia === available.Referencia
                    )
                ).map((ref, idx) => (
                  <TouchableOpacity
                    key={`available-${idx}`}
                    style={styles.refItem}
                    onPress={() => {
                      setSelectedRefs((prev) => [
                        ...prev,
                        { Referencia: ref.Referencia },
                      ]);
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#4CAF50"
                    />
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
            <Section title="Nuevo Seguimiento">
              <View style={styles.addSeguimientoBox}>
                <TextInput
                  style={styles.newSegInput}
                  placeholder="Escriba un seguimiento..."
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
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </Section>

            <Section title="Historial de Seguimientos">
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
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Detalle de Factura</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#3A3A3C" />
              </TouchableOpacity>
            </View>

            {loading && !detail ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#337ab7" />
              </View>
            ) : (
              <>
                <View style={styles.tabsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.tabs}>
                      <Tab
                        label="Información"
                        active={activeTab === "info"}
                        onPress={() => setActiveTab("info")}
                      />
                      <Tab
                        label="Reasignar"
                        active={activeTab === "reasignar"}
                        onPress={() => setActiveTab("reasignar")}
                      />
                      <Tab
                        label="Referencias"
                        active={activeTab === "referencias"}
                        onPress={() => setActiveTab("referencias")}
                      />
                      <Tab
                        label="Seguimientos"
                        active={activeTab === "seguimientos"}
                        onPress={() => setActiveTab("seguimientos")}
                      />
                    </View>
                  </ScrollView>
                </View>

                <ScrollView
                  style={styles.body}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderTabContent()}

                  {activeTab === "info" && (
                    <View style={styles.observacionSection}>
                      <Text style={styles.sectionTitle}>
                        Acción de Aprobación
                      </Text>
                      <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={4}
                        placeholder="Ingrese un comentario para aprobar/rechazar..."
                        value={observacion}
                        onChangeText={setObservacion}
                      />
                    </View>
                  )}
                </ScrollView>

                {activeTab === "info" && (
                  <View
                    style={[
                      styles.footer,
                      { paddingBottom: insets.bottom + 16 },
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleAction(false)}
                      disabled={loading}
                    >
                      <Text style={styles.actionButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <LinearGradient
                      colors={["#337ab7", "#00ACC4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <TouchableOpacity
                        onPress={() => handleAction(true)}
                        disabled={loading}
                      >
                        <Text style={styles.actionButtonText}>Aprobar</Text>
                      </TouchableOpacity>
                    </LinearGradient>
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

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const DetailRow = ({ label, value, icon, highlight }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      {icon && (
        <Ionicons
          name={`${icon}-outline`}
          size={16}
          color="#8E8E93"
          style={styles.rowIcon}
        />
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, highlight && styles.highlightValue]}>
      {value || "N/A"}
    </Text>
  </View>
);

const Tab = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#337ab7",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#337ab7",
  },
  body: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
    marginHorizontal: 4,
    textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  highlightValue: {
    color: "#337ab7",
    fontSize: 16,
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
    backgroundColor: "#E5E5EA",
    marginTop: 4,
    marginRight: 12,
  },
  stepDotActive: {
    backgroundColor: "#337ab7",
  },
  stepInfo: {
    flex: 1,
  },
  stepUser: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  stepStatus: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  stepObs: {
    fontSize: 13,
    color: "#3A3A3C",
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#F8F8FA",
    padding: 8,
    borderRadius: 6,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F8FA",
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: "#337ab7",
    marginLeft: 8,
    fontWeight: "500",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1C1C1E",
  },
  ccItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  ccName: {
    fontSize: 14,
    color: "#3A3A3C",
    flex: 1,
  },
  refItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  refContent: {
    flex: 1,
    marginLeft: 12,
  },
  refText: {
    fontSize: 15,
    color: "#3A3A3C",
    fontWeight: "500",
  },
  removeRefBtn: {
    padding: 8,
  },
  addSeguimientoBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  newSegInput: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 100,
    color: "#1C1C1E",
  },
  addSegButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#337ab7",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#AEAEB2",
  },
  segItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  segHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  segUser: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  segDate: {
    fontSize: 12,
    color: "#8E8E93",
  },
  segComment: {
    fontSize: 14,
    color: "#3A3A3C",
    lineHeight: 20,
  },
  observacionSection: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  textArea: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#1C1C1E",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 34,
    backgroundColor: "#fff",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  actionButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  approveButton: {
    backgroundColor: "#337ab7",
  },
  rejectButton: {
    backgroundColor: "gray",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#AEAEB2",
    padding: 20,
  },
});

export default FacturaDetailModal;
