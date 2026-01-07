import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import facturasCompraService from "../../services/facturasCompra/facturasCompraService";
import FacturaItem from "../../components/FacturasCompra/FacturaItem";
import FacturaFiltersModal from "../../components/FacturasCompra/FacturaFiltersModal";
import FacturaDetailModal from "../../components/FacturasCompra/FacturaDetailModal";
import FocusAwareStatusBar from "../../components/FocusAwareStatusBar";

const { width } = Dimensions.get("window");

// Paleta de colores de la marca
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

const AprobacionFacturasCompra = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    FullSearch: "",
    TerceroID: null,
    TerceroNombre: "",
    EstadoAprobacionFacturaCompraID: 1,
  });

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadInvoices = async (pageNum = 1, isRefresh = false) => {
    if (loading && !isRefresh) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await facturasCompraService.consultarFacturasPendientes({
        ...filters,
        Page: pageNum,
        Rows: 20,
      });

      const newInvoices = response.rows || [];
      if (pageNum === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices((prev) => [...prev, ...newInvoices]);
      }

      setHasMore(newInvoices.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading invoices:", error);
      Alert.alert("Error", "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices(1, true);
  }, [filters]);

  const handleRefresh = () => {
    loadInvoices(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadInvoices(page + 1);
    }
  };

  const handleInvoicePress = (item) => {
    setSelectedInvoice(item);
    setDetailModalVisible(true);
  };

  const handleActionSuccess = () => {
    loadInvoices(1, true);
  };

  const hasActiveFilters =
    filters.FullSearch !== "" || filters.TerceroID !== null;

  const activeFiltersCount = [
    filters.FullSearch !== "",
    filters.TerceroID !== null,
  ].filter(Boolean).length;

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.headerPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle}>Facturas de compra</Text>
            <Text style={styles.headerTitle}>Aprobación</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                hasActiveFilters && styles.headerButtonActive,
              ]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasActiveFilters ? "filter" : "filter-outline"}
                size={20}
                color="#FFF"
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando más facturas...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="document-text-outline"
          size={64}
          color={COLORS.lightGray}
        />
      </View>
      <Text style={styles.emptyTitle}>Sin facturas pendientes</Text>
      <Text style={styles.emptyText}>
        No hay facturas pendientes de aprobación con los filtros seleccionados
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() =>
            setFilters({
              FullSearch: "",
              TerceroID: null,
              TerceroNombre: "",
              EstadoAprobacionFacturaCompraID: 1,
            })
          }
          activeOpacity={0.8}
        >
          <Feather name="x-circle" size={18} color={COLORS.primary} />
          <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {renderHeader()}

      <FlatList
        data={invoices}
        renderItem={({ item }) => (
          <FacturaItem item={item} onPress={handleInvoicePress} />
        )}
        keyExtractor={(item) =>
          item.FacturaCompraID?.toString() || Math.random().toString()
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary, COLORS.accent]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading && renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FacturaFiltersModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={filters}
        onApply={(newFilters) =>
          setFilters((prev) => ({ ...prev, ...newFilters }))
        }
      />

      <FacturaDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        item={selectedInvoice}
        onActionSuccess={handleActionSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -50,
  },
  patternCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(136,231,130,0.12)",
    bottom: -40,
    left: -30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.highlight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  filterBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
  },

  // List
  listContainer: {
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },

  // Loading footer
  loadingFooter: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: "500",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default AprobacionFacturasCompra;
