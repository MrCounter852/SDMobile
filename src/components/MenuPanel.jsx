import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import useGlobal from "../core/global";
import { ScrollView } from "react-native-gesture-handler";

const ICON_MAP = {
  "fal fa-cogs": "settings-sharp",
  "fal fa-cog": "cog-sharp",
  "fal fa-sliders-v": "options-sharp",
  "fal fa-wrench": "construct-sharp",
  "fal fa-server": "server-sharp",
  "fal fa-user-alt": "person-sharp",
  "fal fa-user-circle": "person-circle-sharp",
  "fal fa-key": "key-sharp",
  "fal fa-lock-alt": "lock-closed-sharp",
  "fal fa-map-marker-alt": "location-sharp",
  "fal fa-map-pin": "pin-sharp",
  "fal fa-globe": "globe-sharp",
  "fal fa-plane": "airplane-sharp",
  "fal fa-language": "language-sharp",
  "fal fa-sun": "sunny-sharp",
  "fal fa-handshake": "handshake",
  "fal fa-envelope": "mail-sharp",
  "fal fa-chart-pie": "pie-chart-sharp",
  "fal fa-chart-line": "trending-up-sharp",
  "fal fa-warehouse": "cube-sharp",
  "fal fa-home": "home-sharp",
  "fal fa-archive": "archive-sharp",
  "fal fa-shopping-cart": "cart-sharp",
  "fal fa-credit-card": "card-sharp",
  "fal fa-money-bill": "cash-sharp",
  "fas fa-money-bill-alt": "card-sharp",
  "fal fa-industry": "business-sharp",
  "fal fa-cubes": "cube-sharp",
  "fal fa-hand-holding-box": "cube-sharp",
  "far fa-list-alt": "list-sharp",
  "far fa-hands": "people-sharp",
  "fal fa-id-card": "id-card-sharp",
  "fal fa-comments": "chatbubble-ellipses-sharp",
  "fal fa-tv": "tv-sharp",
  "fal fa-th": "grid-sharp",
  "fas fa-pallet-alt": "cube-sharp",
  "fal fa-file-edit": "document-text-sharp",
  "fal fa-hand-holding-usd": "cash-sharp",
  "fal fa-watch": "time-sharp",
  "fas fa-calendar-alt": "calendar-sharp",
  "fal fa-child": "child",
};

const FONT_AWESOME_ICONS = new Set(["handshake", "child"]);

// --- HELPERS (Sin cambios) ---
const getIconName = (icon) => {
  const clean = icon.replace(/fa[lrs] fa-/g, "").trim();
  return ICON_MAP[icon] || clean;
};

const findMenuById = (menuList, id) => {
  if (!id || !menuList) return null;
  for (const item of menuList) {
    if (item.OpcionMenuID === id) return item;
    if (item.__children__) {
      const found = findMenuById(item.__children__, id);
      if (found) return found;
    }
  }
  return null;
};

const IconRenderer = ({ name, size, color }) => {
  if (FONT_AWESOME_ICONS.has(name)) {
    return <FontAwesome5 name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
};

const MainMenuItem = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.gridItem}
    activeOpacity={0.75}
    onPress={() => onPress(item.OpcionMenuID)}
  >
    <IconRenderer name={item.Icon} size={40} color="#337ab7" />
    <Text style={styles.gridItemText} numberOfLines={2}>
      {item.Nombre}
    </Text>
  </TouchableOpacity>
);

const heightCalculate =(NumberItems) =>{
  let result = ((1-1/(NumberItems*2))*100).toFixed(3)
  return `${result}%`;

}


const SubMenuItem = ({ item, onAction, level = 0 }) => {
  const hasChildren = item.__children__ && item.__children__.length > 0;
  const isClickable = !hasChildren;

  const containerStyle = isClickable
    ? styles.subGridButton
    : styles.subGridItem;
  const indentationStyle = { marginLeft: level * 25 };

  const handlePress = () => {
    if (isClickable && onAction) {
      onAction(item);
    }
  };

  return (
    <View>
      
      <TouchableOpacity
        style={[containerStyle, indentationStyle]}
        activeOpacity={isClickable ? 0.7 : 1.0}
        onPress={handlePress}
        disabled={!isClickable}
      >
        <IconRenderer name={item.Icon} size={20} color="#337ab7" />
        <Text style={styles.subGridText}>{item.Nombre}</Text>
      </TouchableOpacity>
      {level > 0 && (
        <View
          style={[
            styles.horizontalLine,
            {
              left: 8 + (level - 1) * 25,
              width: 15,
              top: 21
            },
          ]}
        />
      )}
      {hasChildren && (
        <View style={{ position: "relative" }}>
          <View style={[styles.verticalLine, { left: 8 + level * 25, height: heightCalculate(item.__children__.length)}]} />
          
          <View>
            {item.__children__.map((child) => (
              <SubMenuItem
                key={child.OpcionMenuID}
                item={child}
                onAction={onAction}
                level={level + 1}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const VerticalMenuItem = ({ item, isSelected, onPress }) => {
  const iconColor = isSelected ? "#337ab7" : "white";
  return (
    <TouchableOpacity
      style={[
        styles.verticalGridItem,
        isSelected && styles.verticalGridItemSelected,
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(item.OpcionMenuID)}
    >
      <IconRenderer name={item.Icon} size={25} color={iconColor} />
    </TouchableOpacity>
  );
};

const MainMenuGrid = ({ menuOptions, onSelect, scrollRef, scrollY }) => (
  <ScrollView
    ref={scrollRef}
    scrollEventThrottle={16}
    nestedScrollEnabled={true}
    showsVerticalScrollIndicator={false}
    onScroll={(e) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    }}
    contentContainerStyle={{ padding: 10 }}
  >
    <Animated.View style={styles.grid}>
      {menuOptions.map((item) => (
        <MainMenuItem key={item.OpcionMenuID} item={item} onPress={onSelect} />
      ))}
    </Animated.View>
  </ScrollView>
);

const SubMenuView = ({
  allOptions,
  selectedOption,
  onSelect,
  onAction,
  scrollRef,
  scrollY,
}) => {
  const subMenuItems = selectedOption?.__children__ || [];
  return (
    <View style={styles.subMenuContainer}>
      {/* Menú Vertical (Izquierda) */}
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.verticalMenuScrollView}
      >
        <TouchableOpacity
          onPress={() => onSelect(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-circle" size={32} color="#337ab7" />
        </TouchableOpacity>
        {allOptions.map((item) => (
          <VerticalMenuItem
            key={item.OpcionMenuID}
            item={item}
            isSelected={item.OpcionMenuID === selectedOption.OpcionMenuID}
            onPress={onSelect}
          />
        ))}
      </ScrollView>

      {/* Grid de Sub-opciones (Derecha) */}
      <ScrollView
        style={styles.subMenuGridScrollView}
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subGrid}>
          <View style={styles.subMenuTitleContainer}>
            <IconRenderer
              name={selectedOption.Icon}
              size={20}
              color="#337ab7"
            />
            <Text style={styles.subMenuTitleText}>{selectedOption.Nombre}</Text>
          </View>
          {subMenuItems.length > 0 ? (
            subMenuItems.map((item) => (
              <SubMenuItem
                key={item.OpcionMenuID}
                item={item}
                onAction={onAction}
              />
            ))
          ) : (
            <Text style={styles.noSubMenuText}>No hay sub-opciones.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const MenuPanel = ({ scrollRef, scrollY }) => {
  const { menuOptions } = useGlobal();
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  const processedMenuOptions = useMemo(() => {
    const processItems = (items) => {
      return items.map((item) => ({
        ...item,
        Icon: getIconName(item.Icon),
        __children__: item.__children__ ? processItems(item.__children__) : [],
      }));
    };
    return processItems(menuOptions || []);
  }, [menuOptions]);

  const selectedOption = useMemo(
    () => findMenuById(processedMenuOptions, selectedMenuId),
    [processedMenuOptions, selectedMenuId]
  );

  const handleMenuAction = (item) => {
    Alert.alert("Acción", `${item.Nombre}`);
  };

  return (
    <View style={styles.body}>
      {!selectedOption ? (
        <MainMenuGrid
          menuOptions={processedMenuOptions}
          onSelect={setSelectedMenuId}
          scrollRef={scrollRef}
          scrollY={scrollY}
        />
      ) : (
        <SubMenuView
          allOptions={processedMenuOptions}
          selectedOption={selectedOption}
          onSelect={setSelectedMenuId}
          onAction={handleMenuAction}
          scrollRef={scrollRef}
          scrollY={scrollY}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: "#f0f3f3", paddingBottom: 50 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  subGrid: {
    padding: 10,
  },

  subGridButton: {
    flexDirection: "row",
    backgroundColor: "white",
    marginBottom: 5,
    marginTop: 5,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },

  subGridItem: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "center",
  },
  gridItem: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
    padding: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  subGridText: {
    fontSize: 14,
    color: "#337ab7",
    fontWeight: "600",
    marginLeft: 8,
  },
  gridItemText: {
    fontSize: 14,
    color: "#337ab7",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  subMenuContainer: { flex: 1, flexDirection: "row" },
  verticalMenuScrollView: {
    width: "22%",
    backgroundColor: "#e9ecef",
    paddingTop: 10,
  },
  subMenuGridScrollView: { width: "78%" },
  backButton: { alignItems: "center", marginBottom: 10 },
  verticalGridItem: {
    width: 55,
    height: 55,
    backgroundColor: "#337ab7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 10,
    alignSelf: "center",
  },
  verticalGridItemSelected: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#337ab7",
  },
  noSubMenuText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    width: "100%",
  },
  subMenuTitleText: {
    fontSize: 15,
    color: "#337ab7",
    fontWeight: "bold",
    marginLeft: 5,
  },
  subMenuTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  verticalLine: {
    position: "absolute",
    width: 2,
    backgroundColor: "#337ab7",
  },

  horizontalLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "#337ab7",
  },
});

export default MenuPanel;
