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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import facturasCompraService from "../../services/facturasCompra/facturasCompraService";

const FacturaDetailModal = ({ visible, onClose, item, onActionSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [observacion, setObservacion] = useState("");

  useEffect(() => {
    if (visible && item) {
      loadDetail();
      setObservacion("");
      setActiveTab("general");
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
    } catch (error) {
      console.error("Error loading invoice detail:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la factura");
    } finally {
      setLoading(false);
    }
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
        Aprobada: aprobar,
        Observacion: observacion,
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

    switch (activeTab) {
      case "general":
        return (
          <View style={styles.tabContent}>
            <Section title="Información General">
              <DetailRow
                label="Proveedor"
                value={detail.FacturaCompra?.NombreCompletoTercero}
                icon="business"
              />
              <DetailRow
                label="Factura #"
                value={detail.FacturaCompra?.NumeroDocumento}
                icon="document-text"
              />
              <DetailRow
                label="Fecha"
                value={detail.FacturaCompra?.FechaRegistroStr}
                icon="calendar"
              />
              <DetailRow
                label="Vencimiento"
                value={detail.FacturaCompra?.FechaVencimientoStr}
                icon="time"
              />
              <DetailRow
                label="Tipo Pago"
                value={detail.FacturaCompra?.TipoPagoNombre}
                icon="card"
              />
            </Section>

            <Section title="Totales">
              <DetailRow
                label="Subtotal"
                value={formatCurrency(detail.FacturaCompra?.ValorSubtotal)}
              />
              <DetailRow
                label="IVA"
                value={formatCurrency(detail.FacturaCompra?.ValorIVA)}
              />
              <DetailRow
                label="Total"
                value={formatCurrency(detail.FacturaCompra?.ValorTotal)}
                highlight
              />
            </Section>
          </View>
        );
      case "hierarchy":
        return (
          <View style={styles.tabContent}>
            <Section title="Flujo de Aprobación">
              {(detail.FacturaCompraAprobacionesJerarquias || []).map(
                (step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepDot,
                        step.Aprobada && styles.stepDotActive,
                      ]}
                    />
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepUser}>
                        {step.NombreCompletoUsuario}
                      </Text>
                      <Text style={styles.stepStatus}>
                        {step.Aprobada
                          ? "Aprobó"
                          : step.Aprobada === false
                          ? "Rechazó"
                          : "Pendiente"}
                      </Text>
                      {step.Observacion && (
                        <Text style={styles.stepObs}>{step.Observacion}</Text>
                      )}
                    </View>
                  </View>
                )
              )}
            </Section>
          </View>
        );
      case "attachments":
        return (
          <View style={styles.tabContent}>
            <Section title="Adjuntos">
              {(detail.FacturasCompraAdjuntos || []).length > 0 ? (
                detail.FacturasCompraAdjuntos.map((adj, idx) => (
                  <TouchableOpacity key={idx} style={styles.attachmentRow}>
                    <Ionicons name="attach" size={20} color="#337ab7" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {adj.NombreOriginal}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay archivos adjuntos</Text>
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
              <View style={styles.tabs}>
                <Tab
                  label="General"
                  active={activeTab === "general"}
                  onPress={() => setActiveTab("general")}
                />
                <Tab
                  label="Flujo"
                  active={activeTab === "hierarchy"}
                  onPress={() => setActiveTab("hierarchy")}
                />
                <Tab
                  label="Adjuntos"
                  active={activeTab === "attachments"}
                  onPress={() => setActiveTab("attachments")}
                />
              </View>

              <ScrollView style={styles.body}>
                {renderTabContent()}

                <View style={styles.observacionSection}>
                  <Text style={styles.sectionTitle}>Observaciones</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Ingrese un comentario aquí..."
                    value={observacion}
                    onChangeText={setObservacion}
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleAction(false)}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleAction(true)}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Aprobar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
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
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
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
    backgroundColor: "#FF3B30",
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
