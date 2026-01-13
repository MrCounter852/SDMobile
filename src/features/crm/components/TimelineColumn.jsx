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
  // Drag-and-drop props
  isDropTarget,
  draggedContactId,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderContact = ({ item }) => (
    <DraggableContactItem
      item={item}
      columnId={columnId}
      onPress={() => onContactPress && onContactPress(item)}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      isDraggedItem={draggedContactId === item.ProcesoID}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loadingMoreFooter}>
        <ActivityIndicator size="small" color="#337ab7" />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, isDropTarget && styles.dropTargetContainer]}
    >
      <View style={[styles.header, isDropTarget && styles.dropTargetHeader]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {linea.Nombre}
          </Text>
          <View
            style={[styles.countBadge, isDropTarget && styles.dropTargetBadge]}
          >
            <Text
              style={[
                styles.countText,
                isDropTarget && styles.dropTargetCountText,
              ]}
            >
              {linea.TotalProcesos || 0}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

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
            <View
              style={[
                styles.emptyIconCircle,
                isDropTarget && styles.dropTargetEmptyCircle,
              ]}
            >
              <Ionicons
                name={
                  isDropTarget
                    ? "arrow-down-circle-outline"
                    : "document-text-outline"
                }
                size={32}
                color={isDropTarget ? "#337ab7" : "#AEAEB2"}
              />
            </View>
            <Text
              style={[
                styles.emptyText,
                isDropTarget && styles.dropTargetEmptyText,
              ]}
            >
              {isDropTarget ? "Soltar aquí" : "Lista vacía"}
            </Text>
          </View>
        }
      />

      <View style={[styles.footer, isDropTarget && styles.dropTargetFooter]}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Total Negocio</Text>
          <Text style={styles.footerValue}>
            {formatCurrency(linea.TotalValorNegocio)}
          </Text>
        </View>
      </View>
    </View>
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
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  // Drop target styles
  dropTargetContainer: {
    borderColor: "#337ab7",
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
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
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
