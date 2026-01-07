import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SearchableModal from "../../components/SearchableModal";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#337ab7",
  secondary: "#0086C8",
  accent: "#00ACC4",
  success: "#00CDA7",
  dark: "#1E293B",
  gray: "#64748B",
  lightGray: "#94A3B8",
  background: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
};

const ExpandableDropdown = ({
  title,
  items,
  selectedItem,
  onSelect,
  hasSearch = false,
  onSearch,
  placeholder = "Buscar...",
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  const getItemLabel = (item) => {
    if (!item) return "";
    return (
      item.Empresa ||
      item.Sucursal ||
      item.Nombre ||
      item.NombreCompleto ||
      "Item"
    );
  };

  const renderItem = (item, selectedId) => {
    // Determine unique ID for selection comparison
    const itemId = item.EmpresaID || item.SucursalID || item.id || item.ID;
    const selectedIdMatch = selectedItem
      ? selectedItem.EmpresaID ||
        selectedItem.SucursalID ||
        selectedItem.id ||
        selectedItem.ID
      : null;
    const isSelected = selectedIdMatch === itemId;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          {item.Logo ? (
            <View style={styles.logoContainer}>
              <Image source={{ uri: item.Logo }} style={styles.itemLogo} />
            </View>
          ) : (
            <View style={styles.placeholderLogo}>
              <Ionicons
                name={item.Sucursal ? "location-outline" : "business-outline"}
                size={20}
                color={COLORS.primary}
              />
            </View>
          )}
          <View style={styles.itemTextContainer}>
            <Text
              style={[styles.itemText, isSelected && styles.itemTextSelected]}
              numberOfLines={2}
            >
              {getItemLabel(item)}
            </Text>
            {item.NombreSucursal && (
              <Text style={styles.itemSubtext}>{item.NombreSucursal}</Text>
            )}
          </View>
          {isSelected && (
            <View style={styles.checkIcon}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.success}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          <Text
            style={[
              styles.triggerText,
              selectedItem && styles.triggerTextSelected,
            ]}
            numberOfLines={1}
          >
            {selectedItem ? getItemLabel(selectedItem) : title}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={selectedItem ? COLORS.primary : COLORS.gray}
          />
        </View>
      </TouchableOpacity>

      <SearchableModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={title}
        searchPlaceholder={hasSearch ? placeholder : null}
        data={items}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onSelect={handleSelect}
        renderItem={renderItem}
        selectedItemId={
          selectedItem
            ? selectedItem.EmpresaID ||
              selectedItem.SucursalID ||
              selectedItem.id ||
              selectedItem.ID
            : null
        }
        emptyText="No se encontraron resultados"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  triggerButton: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  triggerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  triggerTextSelected: {
    color: COLORS.dark,
    fontWeight: "600",
  },

  // Item Card Styles
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF", // Light blue background for selected
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    padding: 4,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  placeholderLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  itemTextSelected: {
    color: COLORS.primary,
  },
  itemSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default ExpandableDropdown;
