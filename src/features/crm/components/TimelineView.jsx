import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobal } from "../../../core/global";
import TimelineColumn from "./TimelineColumn";
import DragOverlay from "./DragOverlay";
import CancelDropZone from "./CancelDropZone";
import useDragAndDrop from "../hooks/useDragAndDrop";

const GestionComercialService = require("../services/crmService").default;

const COLUMN_WIDTH = 324; // 300 width + 24 margin

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
    const scrollViewRef = useAnimatedRef();
    const containerRef = useRef(null);
    const [containerOffsetY, setContainerOffsetY] = useState(0);

    // Refs to keep callback dependencies stable
    const loadStateRef = useRef({
      hasMore,
      loading,
      refreshing,
      loadingMore,
      page,
    });
    loadStateRef.current = { hasMore, loading, refreshing, loadingMore, page };

    // Debug: Log mount/unmount
    React.useEffect(() => {
      console.log("[TimelineView] MOUNTED");
      return () => {
        console.log("[TimelineView] UNMOUNTED");
      };
    }, []);

    const ROWS_PER_PAGE = 15;

    // Handle moving contact to a new column via drag-and-drop
    const handleMoveToColumn = useCallback(async (contact, targetColumnId) => {
      try {
        await GestionComercialService.moverLineaTiempo({
          ProcesoID: contact.ProcesoID,
          ProcesoLineaTiempoID: targetColumnId,
        });
        // Refresh after successful move
        loadTimeline(1, true);
      } catch (error) {
        console.error("[TimelineView] Error moving contact:", error);
        Alert.alert(
          "Error",
          error.message ||
            "No se pudo mover el contacto. El backend rechazó la operación."
        );
        throw error; // Re-throw so the hook knows it failed
      }
    }, []);

    // Extract column IDs for the drag hook
    const columnIds = useMemo(
      () => timelineData.map((col) => col.ProcesoLineaTiempoID),
      [timelineData]
    );

    // Initialize drag-and-drop hook with new interface
    const {
      draggedContactRef,
      sourceColumnIdRef,
      dragX,
      dragY,
      dragScale,
      dragOpacity,
      cancelZoneHover,
      isDraggingShared,
      draggedContactIdShared,
      sourceColumnIdShared,
      targetColumnIdShared,
      timelineScale,
      scrollOffset,
      overlayNombre,
      overlayCelular,
      overlayEstado,
      overlayColor,
      startDrag,
      updateDrag,
      endDrag,
      cancelDrag,
      isAutoScrolling,
      updateScrollOffset,
      updateContainerHeight,
    } = useDragAndDrop(
      columnIds,
      COLUMN_WIDTH,
      handleMoveToColumn,
      scrollViewRef
    );

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

        console.log(
          `[TimelineView] Page ${pageNum} - Received ${newColumns.length} columns`
        );

        const totalProcessesReceived = newColumns.reduce(
          (acc, col) => acc + (col.Procesos?.length || 0),
          0
        );
        console.log(
          `[TimelineView] Page ${pageNum} - Total processes received: ${totalProcessesReceived}`
        );

        if (pageNum === 1) {
          console.log(`[TimelineView] Page 1 - Setting initial data`);
          setTimelineData(newColumns);
          setPage(1);
          lastPageLoaded.current = 1;

          const anyHasMore = newColumns.some(
            (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
          );
          setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);
          console.log(
            `[TimelineView] Page 1 - hasMore: ${
              anyHasMore || totalProcessesReceived === ROWS_PER_PAGE
            }`
          );
        } else {
          console.log(
            `[TimelineView] Page ${pageNum} - Merging with existing data`
          );
          setTimelineData((prevData) => {
            console.log(
              `[TimelineView] Page ${pageNum} - Previous data has ${prevData.length} columns`
            );
            if (prevData.length === 0) {
              console.error(
                `[TimelineView] ERROR: Previous data is empty when loading page ${pageNum}!`
              );
            }

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
                console.log(
                  `[TimelineView] Column ${nc.ProcesoLineaTiempoID} - Adding ${uniqueNewProcesos.length} new processes`
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
                console.log(
                  `[TimelineView] Column ${nc.ProcesoLineaTiempoID} - New column, adding to list`
                );
                nextData.push(nc);
              }
            });

            console.log(
              `[TimelineView] Page ${pageNum} - Final data has ${nextData.length} columns`
            );

            // Re-check hasMore based on the newly merged data
            const anyHasMore = nextData.some(
              (col) => (col.Procesos?.length || 0) < (col.TotalProcesos || 0)
            );
            setHasMore(anyHasMore || totalProcessesReceived === ROWS_PER_PAGE);
            console.log(
              `[TimelineView] Page ${pageNum} - hasMore after merge: ${
                anyHasMore || totalProcessesReceived === ROWS_PER_PAGE
              }`
            );

            return nextData;
          });
          setPage(pageNum);
          lastPageLoaded.current = pageNum;
        }
      } catch (error) {
        console.error("[TimelineView] Error loading timeline:", error);
        if (pageNum === 1) setTimelineData([]);
      } finally {
        console.log(`[TimelineView] Page ${pageNum} - Load complete`);
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

    const handleRefresh = useCallback(() => {
      loadTimeline(1, true);
    }, []);

    const handleLoadMore = useCallback(() => {
      const { hasMore, loading, refreshing, loadingMore, page } =
        loadStateRef.current;
      console.log(
        `[TimelineView] handleLoadMore called - hasMore: ${hasMore}, loading: ${loading}, refreshing: ${refreshing}, loadingMore: ${loadingMore}, page: ${page}`
      );
      if (hasMore && !loading && !refreshing && !loadingMore) {
        console.log(`[TimelineView] handleLoadMore - Loading page ${page + 1}`);
        loadTimeline(page + 1);
      } else {
        console.log(
          `[TimelineView] handleLoadMore - Skipped (conditions not met)`
        );
      }
    }, []);

    const handleContactPress = useCallback(
      (contact) => {
        navigation.navigate("ContactDetail", { contact });
      },
      [navigation]
    );

    // Animated style for the whole timeline zoom-out effect
    const timelineAnimatedStyle = useAnimatedStyle(() => {
      const scale = timelineScale.value;
      const invScale = 1 / scale;
      return {
        width: `${invScale * 100}%`,
        height: `${invScale * 100}%`,
        marginLeft: `${(1 - invScale) * 50}%`,
        marginTop: `${(1 - invScale) * 50}%`,
        transform: [{ scale: scale }],
      };
    });

    // Handle scroll to track offset - runs on UI thread
    const handleScroll = useAnimatedScrollHandler({
      onScroll: (event) => {
        updateScrollOffset(event.contentOffset.x);
      },
    });

    // Drag event handlers
    const handleDragStart = useCallback(
      (contact, columnId, position) => {
        startDrag(contact, columnId, position);
      },
      [startDrag]
    );

    const handleDragMove = useCallback(
      (absoluteX, absoluteY) => {
        "worklet";
        updateDrag(absoluteX, absoluteY);
      },
      [updateDrag]
    );

    const handleDragEnd = useCallback(
      (absoluteX, absoluteY) => {
        endDrag(absoluteX, absoluteY);
      },
      [endDrag]
    );

    // Measure container position on screen for accurate overlay positioning
    // IMPORTANT: This must be defined before any early returns to maintain hooks order
    const handleContainerLayout = useCallback(() => {
      if (containerRef.current) {
        containerRef.current.measure((x, y, width, height, pageX, pageY) => {
          setContainerOffsetY(pageY);
        });
      }
    }, []);

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          ref={containerRef}
          style={{ flex: 1 }}
          onLayout={handleContainerLayout}
        >
          <Animated.View style={[{ flex: 1 }, timelineAnimatedStyle]}>
            <Animated.ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.timelineContent}>
                {timelineData.map((linea) => (
                  <TimelineColumn
                    key={linea.ProcesoLineaTiempoID}
                    linea={linea}
                    columnId={linea.ProcesoLineaTiempoID}
                    onContactPress={handleContactPress}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    // Drag-and-drop props - using shared values to avoid re-renders
                    isDraggingShared={isDraggingShared}
                    sourceColumnIdShared={sourceColumnIdShared}
                    targetColumnIdShared={targetColumnIdShared}
                    draggedContactId={draggedContactIdShared}
                    isAutoScrollingShared={isAutoScrolling}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </View>

              {timelineData.length === 0 && (
                <View style={styles.emptyTimeline}>
                  <Ionicons name="git-branch-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No hay línea de tiempo configurada
                  </Text>
                </View>
              )}
            </Animated.ScrollView>
          </Animated.View>

          {/* Floating drag overlay */}
          <DragOverlay
            overlayNombre={overlayNombre}
            overlayCelular={overlayCelular}
            overlayEstado={overlayEstado}
            overlayColor={overlayColor}
            dragX={dragX}
            dragY={dragY}
            dragScale={dragScale}
            dragOpacity={dragOpacity}
            isDraggingShared={isDraggingShared}
            cancelZoneHover={cancelZoneHover}
            containerOffsetY={containerOffsetY}
          />

          {/* Cancel drop zone at bottom */}
          <CancelDropZone
            isDraggingShared={isDraggingShared}
            isHovering={cancelZoneHover}
          />
        </View>
      </GestureHandlerRootView>
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
  timelineContainer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "stretch",
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
