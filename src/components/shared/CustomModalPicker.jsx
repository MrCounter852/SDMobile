import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SearchableModal from "../../components/SearchableModal";

const COLORS = {
  primary: "#337ab7",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F9FAFB",
};

const resolveItemValue = (item) =>
  item?.id ??
  item?.ID ??
  item?.value ??
  item?.key ??
  item?.InmuebleID ??
  item?.OrigenPreContactoID ??
  item?.AsesorID ??
  item?.TipoOfertaID ??
  item?.CondicionInmuebleID ??
  item?.TipoInmuebleID ??
  item?.AntiguedadInmuebleID ??
  item?.TipoAvaluoID ??
  item?.LocalidadID ??
  item?.FormaContactoID ??
  item?.FormaComoNosConocioID ??
  item?.FormaComoNosConocioDetalleID ??
  item?.TipoDocumentoID ??
  item?.TipoPersonaID ??
  item?.ResponsabilidadTributariaID ??
  item?.TipoProductoID ??
  item;

const CustomModalPicker = ({
  label,
  required,
  selectedValue,
  displayValue, // NEW: Pre-loaded display text for edit mode
  onValueChange,
  items = [],
  onLoadData,
  placeholder,
  hasSearch = true,
  searchPlaceholder = "Buscar...",
  renderItem,
  loading = false,
  onSearch,
  error,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteItems, setRemoteItems] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const searchTimeout = useRef(null);
  const hasRemoteSearch = typeof onSearch === "function";
  const hasLoadData = typeof onLoadData === "function";

  const activeItems = hasRemoteSearch || hasLoadData ? remoteItems : items;

  const selectedItem = useMemo(() => {
    const pools = [];
    if (hasRemoteSearch || hasLoadData) {
      pools.push(remoteItems);
    }
    pools.push(items);
    for (const pool of pools) {
      if (!Array.isArray(pool)) continue;
      const found = pool.find(
        (item) => resolveItemValue(item) === selectedValue,
      );
      if (found) {
        return found;
      }
    }
    return undefined;
  }, [selectedValue, remoteItems, items, hasRemoteSearch, hasLoadData]);

  const displayItems = useMemo(() => {
    if (!hasSearch || !searchTerm.trim() || hasRemoteSearch) {
      return activeItems;
    }
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return activeItems.filter((item) => {
      const label =
        item.label ||
        item.Nombre ||
        item.NombreCompleto ||
        item.Descripcion ||
        (typeof item === "string" ? item : "");
      return label?.toLowerCase().includes(normalizedSearch);
    });
  }, [activeItems, hasSearch, searchTerm, hasRemoteSearch]);

  const fetchRemoteItems = useCallback(
    async (text = "") => {
      if (!hasRemoteSearch) return;
      setRemoteLoading(true);
      try {
        const response = await onSearch(text);
        if (Array.isArray(response)) {
          setRemoteItems(response);
        }
      } catch (error) {
        console.error("CustomModalPicker:onSearch", error);
      } finally {
        setRemoteLoading(false);
      }
    },
    [onSearch, hasRemoteSearch],
  );

  const loadData = useCallback(async () => {
    if (!hasLoadData) return;
    setRemoteLoading(true);
    try {
      const response = await onLoadData();
      if (Array.isArray(response)) {
        setRemoteItems(response);
      }
    } catch (error) {
      console.error("CustomModalPicker:onLoadData", error);
      Alert.alert("Error", "No se pudo cargar la información.");
    } finally {
      setRemoteLoading(false);
    }
  }, [onLoadData, hasLoadData]);

  useEffect(() => {
    if (!hasRemoteSearch && !hasLoadData) {
      setRemoteItems([]);
    }
  }, [hasRemoteSearch, hasLoadData, items]);

  const handleSelect = (item) => {
    const value = resolveItemValue(item);
    onValueChange(value);
    setShowModal(false);
    setSearchTerm("");
  };

  const handleSearchChange = (text) => {
    setSearchTerm(text);
    if (!hasRemoteSearch) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchRemoteItems(text);
    }, 500);
  };

  useEffect(() => {
    if (showModal) {
      setSearchTerm("");
      if (hasRemoteSearch) {
        fetchRemoteItems("");
      } else if (hasLoadData) {
        loadData();
      }
    }
  }, [showModal, hasRemoteSearch, hasLoadData, fetchRemoteItems, loadData]);

  const defaultRenderItem = (item, selectedId) => {
    const itemValue = resolveItemValue(item);
    const isSelected = selectedId === itemValue;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleSelect(item)}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {item.label ||
            item.Nombre ||
            item.NombreCompleto ||
            item.Descripcion ||
            item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity
        style={[styles.selectBox, error && styles.selectBoxError]}
        onPress={() => setShowModal(true)}
      >
        <Text
          style={[
            styles.selectBoxText,
            !selectedValue && styles.selectBoxPlaceholder,
          ]}
        >
          {selectedItem
            ? selectedItem.label ||
              selectedItem.Nombre ||
              selectedItem.NombreCompleto ||
              selectedItem.Descripcion ||
              selectedItem
            : displayValue || placeholder || "Seleccione"}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={error ? COLORS.danger : COLORS.text}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <SearchableModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={label}
        searchPlaceholder={hasSearch ? searchPlaceholder : null}
        data={displayItems}
        loading={loading || remoteLoading}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSelect={handleSelect}
        renderItem={renderItem || defaultRenderItem}
        selectedItemId={selectedValue}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  required: {
    color: "#DC2626",
    marginLeft: 2,
    fontSize: 13,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectBoxError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  selectBoxText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  selectBoxPlaceholder: {
    color: COLORS.textSecondary,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedItem: {
    backgroundColor: "#EFF6FF",
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  selectedItemText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default CustomModalPicker;
