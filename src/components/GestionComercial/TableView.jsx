import React, { useState, useEffect, useCallback } from "react";
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
import { useGlobal } from "../../core/global";
import ContactItem from "./ContactItem";

const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;

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

    const loadContacts = async (pageNum = 1, isRefresh = false) => {
      if (loading && !isRefresh) return;

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

        // Remove OrigenPreContactoID if it's null to allow loading all contacts
        if (filters.OrigenPreContactoID === null) {
          delete filters.OrigenPreContactoID;
        }

        const response = await GestionComercialService.consultarPreContactos(
          filters
        );
        const newContacts = response.rows || [];
        const total = response.total || 0;

        if (pageNum === 1) {
          setContacts(newContacts);
          setHasMore(newContacts.length < total);
        } else {
          setContacts((prev) => {
            // Prevent duplicates using a Set of current IDs
            const existingIds = new Set(prev.map((c) => c.ProcesoID));
            const uniqueNewContacts = newContacts.filter(
              (c) => !existingIds.has(c.ProcesoID)
            );
            const combined = [...prev, ...uniqueNewContacts];
            setHasMore(combined.length < total);
            return combined;
          });
        }

        setPage(pageNum);
      } catch (error) {
        console.error("Error loading contacts:", error);
        Alert.alert("Error", "No se pudieron cargar los contactos");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      loadContacts(1, true);
    }, [searchFilters, refreshTrigger]);

    useFocusEffect(
      useCallback(() => {
        loadContacts(1, true);
      }, [searchFilters, refreshTrigger])
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
      if (!loading || refreshing || !hasMore) return null;
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#337ab7" />
          <Text style={styles.loadingText}>Cargando más...</Text>
        </View>
      );
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
