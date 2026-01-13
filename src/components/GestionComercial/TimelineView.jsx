import React, { useState, useEffect, useCallback, useRef } from "react";
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
    const [loadingMore, setLoadingMore] = useState(false);
    const lastPageLoaded = useRef(0);

    const ROWS_PER_PAGE = 15;

    const loadTimeline = async (pageNum = 1, isRefresh = false) => {
      if (!searchFilters.OrigenPreContactoID) {
        setTimelineData([]);
        return;
      }

      if (loadingMore && !isRefresh) return;
      if (pageNum <= lastPageLoaded.current && !isRefresh && pageNum !== 1)
        return;

      try {
        if (isRefresh || pageNum === 1) {
          setRefreshing(isRefresh);
          if (!isRefresh) setLoading(true);
          lastPageLoaded.current = 0;
        } else if (pageNum > 1) {
          setLoadingMore(true);
        }

        const filters = {
          ...searchFilters,
          EstadoProcesoID: null, // Critical: Web version clears this for timeline
          Page: pageNum,
          Rows: ROWS_PER_PAGE,
          SucursalID: user?.SucursalID,
        };

        console.log(
          `[TimelineView] Request Filters (Page ${pageNum}):`,
          JSON.stringify(filters, null, 2)
        );

        const response = await GestionComercialService.consultarLineasTiempo(
          filters
        );

        const newColumns = Array.isArray(response)
          ? response
          : response.data || response.rows || [];

        const totalProcessesReceived = newColumns.reduce(
          (acc, col) => acc + (col.Procesos?.length || 0),
          0
        );

        if (pageNum === 1) {
          setTimelineData(newColumns);
          setPage(1);
          lastPageLoaded.current = 1;

          const anyHasMore = newColumns.some(
            (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
          );
          setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);
        } else {
          setTimelineData((prevData) => {
            const nextData = [...prevData];
            newColumns.forEach((nc) => {
              const existingIndex = nextData.findIndex(
                (oc) => oc.ProcesoLineaTiempoID === nc.ProcesoLineaTiempoID
              );
              if (existingIndex > -1) {
                const existingIds = new Set(
                  nextData[existingIndex].Procesos?.map((p) => p.ProcesoID) ||
                    []
                );
                const uniqueNewProcesos = (nc.Procesos || []).filter(
                  (p) => !existingIds.has(p.ProcesoID)
                );
                nextData[existingIndex] = {
                  ...nextData[existingIndex],
                  Procesos: [
                    ...(nextData[existingIndex].Procesos || []),
                    ...uniqueNewProcesos,
                  ],
                  TotalProcesos:
                    nc.TotalProcesos ?? nextData[existingIndex].TotalProcesos,
                  TotalValorNegocio:
                    nc.TotalValorNegocio ??
                    nextData[existingIndex].TotalValorNegocio,
                };
              } else {
                nextData.push(nc);
              }
            });

            // Re-check hasMore based on the newly merged data
            const anyHasMore = nextData.some(
              (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
            );
            setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);

            return nextData;
          });
          setPage(pageNum);
          lastPageLoaded.current = pageNum;
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
        if (pageNum === 1) setTimelineData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    };

    const lastFetchParams = useRef({ filters: null, refreshTrigger: null });

    useFocusEffect(
      useCallback(() => {
        if (!user?.SucursalID) return;

        const filtersChanged =
          JSON.stringify(lastFetchParams.current.filters) !==
          JSON.stringify(searchFilters);
        const triggerChanged =
          lastFetchParams.current.refreshTrigger !== refreshTrigger;

        if (filtersChanged || triggerChanged) {
          loadTimeline(1, true);
          lastFetchParams.current = {
            filters: JSON.parse(JSON.stringify(searchFilters)),
            refreshTrigger,
          };
        }
      }, [searchFilters, refreshTrigger, user?.SucursalID])
    );

    const handleRefresh = () => {
      loadTimeline(1, true);
    };

    const handleLoadMore = () => {
      if (hasMore && !loading && !refreshing && !loadingMore) {
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

                loadTimeline(1, true);
              } catch (error) {
                console.error("Error moving contact:", error);
                Alert.alert("Error", "No se pudo mover el contacto");
              }
            },
          },
        ]
      );
    };

    const isInitialLoading =
      (loading || refreshing) && timelineData.length === 0;

    if (isInitialLoading) {
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
              loadingMore={loadingMore}
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
