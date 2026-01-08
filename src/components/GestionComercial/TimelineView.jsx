import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobal } from "../../core/global";
import TimelineColumn from "./TimelineColumn";

const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;

const TimelineView = React.memo(
  ({ navigation, searchFilters, refreshTrigger, onSelectContact }) => {
    const { user } = useGlobal();
    const [timelineData, setTimelineData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadTimeline = async (pageNum = 1, isRefresh = false) => {
      if (!searchFilters.OrigenPreContactoID) {
        setTimelineData([]);
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
          Rows: 20,
          SucursalID: user?.SucursalID,
        };

        const response = await GestionComercialService.consultarLineasTiempo(
          filters
        );

        // El SP devuelve directamente el array de columnas o un objeto con el array
        const newColumns = Array.isArray(response)
          ? response
          : response.data || response.rows || [];

        if (pageNum === 1) {
          setTimelineData(newColumns);
          // Verificar si alguna columna tiene más datos
          const stillHasMore = newColumns.some(
            (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
          );
          setHasMore(stillHasMore);
        } else {
          setTimelineData((prevData) => {
            const merged = prevData.map((existingCol) => {
              const incomingCol = newColumns.find(
                (nc) =>
                  nc.ProcesoLineaTiempoID === existingCol.ProcesoLineaTiempoID
              );
              if (
                incomingCol &&
                incomingCol.Procesos &&
                incomingCol.Procesos.length > 0
              ) {
                // Evitar duplicados por ProcesoID
                const existingIds = new Set(
                  existingCol.Procesos.map((p) => p.ProcesoID)
                );
                const uniqueNewProcesos = incomingCol.Procesos.filter(
                  (p) => !existingIds.has(p.ProcesoID)
                );

                return {
                  ...existingCol,
                  Procesos: [...existingCol.Procesos, ...uniqueNewProcesos],
                  // Actualizar totales si el API los devuelve actualizados
                  TotalProcesos:
                    incomingCol.TotalProcesos ?? existingCol.TotalProcesos,
                  TotalValorNegocio:
                    incomingCol.TotalValorNegocio ??
                    existingCol.TotalValorNegocio,
                };
              }
              return existingCol;
            });

            const stillHasMore = merged.some(
              (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
            );
            setHasMore(stillHasMore);
            return merged;
          });
        }
        setPage(pageNum);
      } catch (error) {
        console.error("Error loading timeline:", error);
        setTimelineData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      loadTimeline(1, true);
    }, [searchFilters, refreshTrigger]);

    useFocusEffect(
      useCallback(() => {
        loadTimeline(1, true);
      }, [searchFilters, refreshTrigger])
    );

    const handleRefresh = () => {
      loadTimeline(1, true);
    };

    const handleLoadMore = () => {
      if (hasMore && !loading && !refreshing) {
        loadTimeline(page + 1);
      }
    };

    const handleContactPress = (contact) => {
      navigation.navigate("ContactDetail", { contact });
    };

    const handleMoveContact = async (contact, direction) => {
      Alert.alert(
        "Mover contacto",
        `¿Mover "${contact.NombreCompleto}" ${
          direction === "left" ? "a la izquierda" : "a la derecha"
        }?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Mover",
            onPress: async () => {
              try {
                const currentIndex = timelineData.findIndex((linea) =>
                  linea.Procesos?.some((p) => p.ProcesoID === contact.ProcesoID)
                );

                if (currentIndex === -1) return;

                const targetIndex =
                  direction === "left"
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(timelineData.length - 1, currentIndex + 1);

                if (targetIndex === currentIndex) return;

                await GestionComercialService.moverLineaTiempo({
                  ProcesoID: contact.ProcesoID,
                  ProcesoLineaTiempoID:
                    timelineData[targetIndex].ProcesoLineaTiempoID,
                });

                loadTimeline(true);
              } catch (error) {
                console.error("Error moving contact:", error);
                Alert.alert("Error", "No se pudo mover el contacto");
              }
            },
          },
        ]
      );
    };

    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337ab7" />
          <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineContainer}
        >
          {timelineData.map((linea) => (
            <TimelineColumn
              key={linea.ProcesoLineaTiempoID}
              linea={linea}
              onContactPress={handleContactPress}
              onMoveContact={handleMoveContact}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loadingMore={loading && page > 1}
            />
          ))}

          {timelineData.length === 0 && (
            <View style={styles.emptyTimeline}>
              <Ionicons name="git-branch-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay línea de tiempo configurada
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 14,
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
  timelineContainer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  emptyTimeline: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEAEB2",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});

export default TimelineView;
