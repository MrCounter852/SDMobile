import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import DraggableContactItem from "./DraggableContactItem";

const TimelineColumn = ({
  linea,
  columnId,
  onContactPress,
  refreshing,
  onRefresh,
  onLoadMore,
  hasMore,
  loadingMore,
  // Drag-and-drop props - now using shared values
  isDraggingShared,
  sourceColumnIdShared,
  targetColumnIdShared,
  draggedContactId,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  // Derived value for drop target status - computed on the UI thread
  const isTarget = useDerivedValue(() => {
    return (
      isDraggingShared?.value &&
      targetColumnIdShared?.value === columnId &&
      sourceColumnIdShared?.value !== columnId
    );
  }, [columnId]);

  // Animated style for the column container highlighting
  const colAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isTarget.value ? "#F0F7FF" : "#FFFFFF", {
        duration: 200,
      }),
    };
  });

  // Animated style for the header highlight
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isTarget.value ? "#E1EFFF" : "#FFFFFF", {
        duration: 200,
      }),
    };
  });
  const formatCurrency = React.useCallback((value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  }, []);

  const renderContact = React.useCallback(
    ({ item }) => (
      <DraggableContactItem
        item={item}
        columnId={columnId}
        onPress={() => onContactPress && onContactPress(item)}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        draggedContactIdShared={draggedContactId}
      />
    ),
    [
      columnId,
      onContactPress,
      onDragStart,
      onDragMove,
      onDragEnd,
      draggedContactId,
    ]
  );

  const renderFooter = React.useCallback(() => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loadingMoreFooter}>
        <ActivityIndicator size="small" color="#337ab7" />
      </View>
    );
  }, [loadingMore]);

  return (
    <Animated.View style={[styles.container, colAnimatedStyle]}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {linea.Nombre}
          </Text>
          <Animated.View
            style={[
              styles.countBadge,
              useAnimatedStyle(() => ({
                backgroundColor: withTiming(
                  isTarget.value ? "#337ab7" : "#E5E5EA",
                  { duration: 200 }
                ),
              })),
            ]}
          >
            <Animated.Text
              style={[
                styles.countText,
                useAnimatedStyle(() => ({
                  color: withTiming(isTarget.value ? "#fff" : "#8E8E93", {
                    duration: 200,
                  }),
                })),
              ]}
            >
              {linea.TotalProcesos || 0}
            </Animated.Text>
          </Animated.View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={linea.Procesos || []}
        renderItem={renderContact}
        keyExtractor={(item, index) =>
          item.ProcesoID?.toString() || index.toString()
        }
        style={styles.scrollContainer}
        contentContainerStyle={styles.contactsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            colors={["#337ab7"]}
          />
        }
        onEndReached={() => {
          if (
            hasMore &&
            (linea.Procesos?.length || 0) < (linea.TotalProcesos || 0)
          ) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Animated.View
              style={[
                styles.emptyIconCircle,
                useAnimatedStyle(() => ({
                  backgroundColor: withTiming(
                    isTarget.value ? "#E1EFFF" : "#F2F2F7",
                    { duration: 200 }
                  ),
                })),
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#AEAEB2"
              />
            </Animated.View>
            <Animated.Text
              style={[
                styles.emptyText,
                useAnimatedStyle(() => ({
                  color: withTiming(isTarget.value ? "#337ab7" : "#AEAEB2", {
                    duration: 200,
                  }),
                })),
              ]}
            >
              Lista vacía
            </Animated.Text>
          </View>
        }
      />

      <Animated.View
        style={[
          styles.footer,
          useAnimatedStyle(() => ({
            backgroundColor: withTiming(
              isTarget.value ? "#E5F1FF" : "#FFFFFF",
              { duration: 200 }
            ),
          })),
        ]}
      >
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Total Negocio</Text>
          <Text style={styles.footerValue}>
            {formatCurrency(linea.TotalValorNegocio)}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 24,
    marginHorizontal: 12,
    marginVertical: 4,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  // Drop target styles
  dropTargetContainer: {
    borderColor: "red",
    borderWidth: 2,
    shadowColor: "#337ab7",
    shadowOpacity: 0.3,
    elevation: 6,
  },
  dropTargetHeader: {
    backgroundColor: "#E5F1FF",
  },
  dropTargetBadge: {
    backgroundColor: "#337ab7",
  },
  dropTargetCountText: {
    color: "#fff",
  },
  dropTargetEmptyCircle: {
    backgroundColor: "#E5F1FF",
  },
  dropTargetEmptyText: {
    color: "#337ab7",
    fontWeight: "600",
  },
  dropTargetFooter: {
    backgroundColor: "#E5F1FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 8,
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contactsContainer: {
    padding: 10,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#AEAEB2",
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  footerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  footerValue: {
    fontSize: 14,
    color: "#1C1C1E",
    fontWeight: "700",
  },
  loadingMoreFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default TimelineColumn;
