import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobal } from "../../../core/global";
import ContactItem from "./ContactItem";

const GestionComercialService = require("../services/crmService").default;

const TableView = React.memo(
  ({
    navigation,
    searchFilters,
    refreshTrigger,
    selectedContact,
    onSelectContact,
    onDeselectContact,
  }) => {
    const { user } = useGlobal();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const lastFetchParams = useRef({ filters: null, refreshTrigger: null });

    const loadContacts = async (pageNum = 1, isRefresh = false) => {
      if (loading && !isRefresh) return;

      // Evitar cargar la misma página si no es un refresh
      if (!isRefresh && pageNum <= page && pageNum !== 1) {
        console.log(
          `[TableView] Intentando cargar página ${pageNum} pero ya estamos en ${page}. Cancelando.`
        );
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const filters = {
          ...searchFilters,
          Page: pageNum,
          Rows: 30,
          SucursalID: user?.SucursalID,
        };

        if (filters.OrigenPreContactoID === null) {
          delete filters.OrigenPreContactoID;
        }

        console.log(
          `[TableView] Requesting Page ${pageNum}:`,
          JSON.stringify(filters, null, 2)
        );

        const response = await GestionComercialService.consultarPreContactos(
          filters
        );

        const newContacts = response.rows || [];
        const total = parseInt(response.total || 0, 10);
        const rowsCount = newContacts.length;

        console.log(`[TableView] Success Page ${pageNum}:`, {
          totalRecibido: total,
          itemsNuevos: rowsCount,
          ultimaPagina: page,
        });

        if (pageNum === 1) {
          setContacts(newContacts);
          setHasMore(rowsCount >= 30 || rowsCount < total);
          setPage(1);
        } else {
          setContacts((prev) => {
            const existingIds = new Set(prev.map((c) => c.ProcesoID));
            const uniqueNewContacts = newContacts.filter(
              (c) => !existingIds.has(c.ProcesoID)
            );
            const combined = [...prev, ...uniqueNewContacts];

            // Decidir si hay más:
            // 1. Si recibimos exactamente 30, probablemente hay más.
            // 2. Si el total nos dice que hay más de lo que tenemos acumulado.
            const stillHasMore = rowsCount === 30 || combined.length < total;
            setHasMore(stillHasMore);

            console.log(
              `[TableView] Update: totalAcumulado=${combined.length}, totalDB=${total}, hasMore=${stillHasMore}`
            );
            return combined;
          });
          setPage(pageNum);
        }
      } catch (error) {
        console.error("[TableView] Error:", error);
        Alert.alert("Error", "No se pudieron cargar los contactos");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useFocusEffect(
      useCallback(() => {
        if (!user?.SucursalID) return;

        const filtersChanged =
          JSON.stringify(lastFetchParams.current.filters) !==
          JSON.stringify(searchFilters);
        const triggerChanged =
          lastFetchParams.current.refreshTrigger !== refreshTrigger;

        if (filtersChanged || triggerChanged) {
          loadContacts(1, true);
          lastFetchParams.current = {
            filters: JSON.parse(JSON.stringify(searchFilters)),
            refreshTrigger,
          };
        }
      }, [searchFilters, refreshTrigger, user?.SucursalID])
    );

    const handleRefresh = () => {
      loadContacts(1, true);
    };

    const handleLoadMore = () => {
      if (hasMore && !loading && !refreshing) {
        loadContacts(page + 1);
      }
    };

    const handleContactPress = (contact) => {
      navigation.navigate("ContactDetail", { contact });
    };

    const renderContact = ({ item }) => {
      const isSelected = selectedContact?.ProcesoID === item.ProcesoID;
      return (
        <ContactItem
          item={item}
          onPress={handleContactPress}
          onLongPress={(contact) => onSelectContact(contact)}
          isSelected={isSelected}
        />
      );
    };

    const renderFooter = () => {
      if (!loading || refreshing) return null; // No mostrar si estamos refrescando o no cargando
      if (!hasMore && contacts.length > 0) {
        return (
          <View style={styles.loadingFooter}>
            <Text style={styles.loadingText}>Fin de la lista</Text>
          </View>
        );
      }
      if (hasMore) {
        return (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color="#337ab7" />
            <Text style={styles.loadingText}>Cargando más...</Text>
          </View>
        );
      }
      return null;
    };

    return (
      <View style={styles.container}>
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) =>
            item.ProcesoID?.toString() || Math.random().toString()
          }
          key={refreshTrigger}
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
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  No hay contactos disponibles
                </Text>
              </View>
            )
          }
          contentContainerStyle={
            contacts.length === 0 ? styles.emptyList : null
          }
          // Performance Optimizations
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingFooter: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEAEB2",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  tagsOuterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#337ab720",
  },
  tagLabel: {
    fontSize: 13,
    color: "#337ab7",
    fontWeight: "600",
  },
});

export default TableView;
