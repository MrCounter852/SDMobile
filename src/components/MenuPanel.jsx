				  import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import useGlobal from "../core/global";
import { ScrollView } from "react-native-gesture-handler";

const iconMap = {
  // Sistema / Configuración
  "fal fa-cogs": "settings-sharp",
  "fal fa-cog": "cog-sharp",
  "fal fa-sliders-v": "options-sharp",
  "fal fa-wrench": "construct-sharp",
  "fal fa-server": "server-sharp",

  // Usuarios y seguridad
  "fal fa-user-alt": "person-sharp",
  "fal fa-user-circle": "person-circle-sharp",
  "fal fa-key": "key-sharp",
  "fal fa-lock-alt": "lock-closed-sharp",

  // Ubicación y entorno
  "fal fa-map-marker-alt": "location-sharp",
  "fal fa-map-pin": "pin-sharp",
  "fal fa-globe": "globe-sharp",
  "fal fa-plane": "airplane-sharp",
  "fal fa-language": "language-sharp",
  "fal fa-sun": "sunny-sharp",

  // Negocios / ERP General
  "fal fa-handshake": "handshake", // FontAwesome
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

  // Gestión de personas
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
  "fal fa-child": "child", // FontAwesome
};

const isFontAwesome = (icon) => {
  const faIcons = ["handshake", "child"];
  return faIcons.includes(icon);
};

const findMenuById = (menuList, id) => {
  for (const item of menuList) {
    if (item.OpcionMenuID == id) return item;
    if (item.__children__) {
      const found = findMenuById(item.__children__, id);
      if (found) return found;
    }
  }
  return null;
};


const getIconName = (icon) => {
  const clean = icon
    .replace("fal fa-", "")
    .replace("fas fa-", "")
    .replace("far fa-", "");
  return iconMap[icon] || clean;
};
const MenuPanel = ({ scrollRef, scrollY }) => {
  const viewProgress = useSharedValue(0);
  const [isSliderView, setIsSliderView] = React.useState(false);
  const [selectedMenuOption, setSelectedMenuOption] = useState(null);
  const { menuOptions } = useGlobal();

  console.log(
    "MenuPanel menuOptions:",
    JSON.stringify(menuOptions[0], null, 2)
  );
  menuOptions.map((item) => {
    item.Icon = getIconName(item.Icon);
  });

  const gridStyle = useAnimatedStyle(() => {
    const p = viewProgress.value;
    return {
      opacity: interpolate(p, [0, 1], [1, 0]),
      transform: [
        { scale: interpolate(p, [0, 1], [1, 0.97]) },
        { translateY: interpolate(p, [0, 1], [0, 10]) },
      ],
    };
  });

  return (
    <View style={styles.body}>
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollY.value = y;
        }}
      >
        {!selectedMenuOption ? (
          <Animated.View
            style={[styles.grid, gridStyle]}
            pointerEvents={isSliderView ? "none" : "auto"}
          >
            {menuOptions.map((item) => (
              <TouchableOpacity
                key={item.OpcionMenuID}
                style={styles.gridItem}
                activeOpacity={0.75}
                onPress={() => setSelectedMenuOption(item.OpcionMenuID)}
              >
                {isFontAwesome(item.Icon) ? (
                  <FontAwesome5 name={item.Icon} size={40} color="#337ab7" />
                ) : (
                  <Ionicons name={item.Icon} size={40} color="#337ab7" />
                )}
                <Text style={styles.gridItemText}>{item.Nombre}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          <Animated.View
            style={[styles.grid, gridStyle]}
            pointerEvents={isSliderView ? "none" : "auto"}
          >
            <View style={styles.subMenuContainer}>
              <View style={styles.verticalMenuContainer}>
                {menuOptions.map((item) => (
                  <TouchableOpacity
                    key={item.OpcionMenuID}
                    style={
                      item.OpcionMenuID == selectedMenuOption
                        ? styles.verticalGridItemSelected
                        : styles.verticalGridItem
                    }
                    activeOpacity={0.75}
                  >
                    {isFontAwesome(item.Icon) ? (
                      <FontAwesome5 name={item.Icon} size={20} color="white" />
                    ) : (
                      <Ionicons name={item.Icon} size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.SubMenuOptionsContainer}>

              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: "#f0f3f3", padding: 30 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
    padding: 5,
  },
  gridItemText: {
    fontSize: 14,
    color: "#337ab7",
    textAlign: "center",
  },
  subMenuContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "red",
  },
  SubMenuOptionsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  verticalMenuContainer: {
    width: "20%",
    backgroundColor: "blue",
  },
  verticalGridItem: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#337ab7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
    padding: 5,
  },
  verticalGridItemSelected: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
    padding: 5,
  },
});

export default MenuPanel;
