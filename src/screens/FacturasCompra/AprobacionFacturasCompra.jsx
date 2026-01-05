import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import facturasCompraService from "../../services/facturasCompra/facturasCompraService";
import FacturaItem from "../../components/FacturasCompra/FacturaItem";
import FacturaFiltersModal from "../../components/FacturasCompra/FacturaFiltersModal";
import FacturaDetailModal from "../../components/FacturasCompra/FacturaDetailModal";

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

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#337ab7" />
        <Text style={styles.loadingText}>Cargando más...</Text>
      </View>
    );
  };

  const hasActiveFilters =
    filters.FullSearch !== "" || filters.TerceroID !== null;

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Facturas de compra</Text>
          <Text style={styles.title}>Aprobación</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              hasActiveFilters && styles.headerButtonActive,
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name={hasActiveFilters ? "filter" : "filter-outline"}
              size={22}
              color={hasActiveFilters ? "#337ab7" : "#3A3A3C"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh}>
            <LinearGradient
              colors={["#337ab7", "#00ACC4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
            colors={["#337ab7"]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay facturas pendientes de aprobación
              </Text>
            </View>
          )
        }
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#337ab7",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "#E5F1FF",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#337ab7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  loadingFooter: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEAEB2",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});

export default AprobacionFacturasCompra;
