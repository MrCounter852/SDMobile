import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedProps,
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
  isDraggingShared,
  sourceColumnIdShared,
  targetColumnIdShared,
  draggedContactId,
  isAutoScrollingShared,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const isTargetValue = useDerivedValue(() => {
    const isDragging = isDraggingShared?.value ?? false;
    const isAutoScrolling = isAutoScrollingShared?.value ?? false;
    const isTarget = targetColumnIdShared?.value === columnId;
    const isSource = sourceColumnIdShared?.value === columnId;
    if (isAutoScrolling) return 0;

    return isDragging && isTarget && !isSource ? 1 : 0;
  }, [columnId]);

  const highlightOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: isTargetValue.value,
    };
  });

  const flatListAnimatedProps = useAnimatedProps(() => ({
    scrollEnabled: !(isDraggingShared?.value ?? false),
  }));

  const formatCurrency = React.useCallback((value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  }, []);

  const handleContactPress = React.useCallback(
    (item) => {
      if (onContactPress) {
        onContactPress(item);
      }
    },
    [onContactPress],
  );

  const handleEndReached = () => {
    if (hasMore && (linea.Procesos?.length || 0) < (linea.TotalProcesos || 0)) {
      onLoadMore();
    }
  };

  const renderContact = React.useCallback(
    ({ item }) => (
      <DraggableContactItem
        item={item}
        columnId={columnId}
        onPress={handleContactPress}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        draggedContactIdShared={draggedContactId}
      />
    ),
    [
      columnId,
      handleContactPress,
      onDragStart,
      onDragMove,
      onDragEnd,
      draggedContactId,
    ],
  );

  const renderFooter = React.useCallback(() => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loadingMoreFooter}>
        <ActivityIndicator size="small" color="#337ab7" />
      </View>
    );
  }, [loadingMore]);

  const renderEmptyComponent = React.useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="document-text-outline" size={32} color="#AEAEB2" />
        </View>
        <Text style={styles.emptyText}>Lista vacía</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = React.useCallback(
    (item, index) => item.ProcesoID?.toString() || index.toString(),
    [],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing || false}
        onRefresh={onRefresh}
        colors={["#337ab7"]}
      />
    ),
    [refreshing, onRefresh],
  );

  const formattedTotal = useMemo(
    () => formatCurrency(linea.TotalValorNegocio),
    [linea.TotalValorNegocio, formatCurrency],
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.highlightOverlay, highlightOverlayStyle]}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {linea.Nombre}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{linea.TotalProcesos || 0}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={linea.Procesos || []}
        renderItem={renderContact}
        keyExtractor={keyExtractor}
        style={styles.scrollContainer}
        contentContainerStyle={styles.contactsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        animatedProps={flatListAnimatedProps}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={5}
      />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Total Negocio</Text>
          <Text style={styles.footerValue}>{formattedTotal}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 10,
    marginVertical: 4,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
  },
  highlightOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#337ab7",
    zIndex: 10,
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
    backgroundColor: "#F2F2F7",
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

export default React.memo(TimelineColumn);
