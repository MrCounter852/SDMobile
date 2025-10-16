import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  BackHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import useGlobal from "../core/global";
import { ScrollView } from 'react-native-gesture-handler';

const iconMap = {
  // Sistema / Configuración
  "fal fa-cogs": "settings-outline",
  "fal fa-cog": "cog-outline",
  "fal fa-sliders-v": "options-outline",
  "fal fa-wrench": "construct-outline",
  "fal fa-server": "server-outline",

  // Usuarios y seguridad
  "fal fa-user-alt": "person-outline",
  "fal fa-user-circle": "person-circle-outline",
  "fal fa-key": "key-outline",
  "fal fa-lock-alt": "lock-closed-outline",

  // Ubicación y entorno
  "fal fa-map-marker-alt": "location-outline",
  "fal fa-map-pin": "pin-outline",
  "fal fa-globe": "globe-outline",
  "fal fa-plane": "airplane-outline",
  "fal fa-language": "language-outline",
  "fal fa-sun": "sunny-outline",

  // Negocios / ERP General
  "fal fa-handshake": "handshake-outline", // CRM
  "fal fa-envelope": "mail-outline", // Servicio al Cliente
  "fal fa-chart-pie": "pie-chart-outline", // Analítica
  "fal fa-chart-line": "trending-up-outline", // Financiero
  "fal fa-warehouse": "cube-outline", // Bodega / Almacén
  "fal fa-home": "home-outline", // Inmobiliaria
  "fal fa-archive": "archive-outline", // Inventarios / SGD
  "fal fa-shopping-cart": "cart-outline", // Facturación
  "fal fa-credit-card": "card-outline", // Cartera
  "fal fa-money-bill": "cash-outline", // Pagos
  "fas fa-money-bill-alt": "card-outline",
  "fal fa-industry": "business-outline", // Producción
  "fal fa-cubes": "cube-outline", // Producción
  "fal fa-hand-holding-box": "cube-outline", // Logística o Almacenamiento

  // Gestión de personas
  "far fa-list-alt": "list-outline", // Selección de Personal
  "far fa-hands": "people-outline", // Nómina
  "fal fa-id-card": "id-card-outline", // Identificación / Empleado
  "fal fa-comments": "chatbubble-ellipses-outline", // Comunicaciones
  "fal fa-tv": "tv-outline",
  "fal fa-th": "grid-outline",
  "fas fa-pallet-alt": "cube-outline",
  "fal fa-file-edit": "document-text-outline",
  "fal fa-hand-holding-usd": "cash-outline",
  "fal fa-watch": "time-outline",
  "fas fa-calendar-alt": "calendar-outline",
};
const getIconName = (icon) => {
  return iconMap[icon];
};
const MenuPanel = ({ scrollRef }) => {
  const viewProgress = useSharedValue(0);
  const [isSliderView, setIsSliderView] = React.useState(false);
  const { menuOptions } = useGlobal();
  const menuItems = menuOptions.map((opt) => ({
    id: opt.OpcionMenuID,
    title: opt.Nombre,
    icon: getIconName(opt.Icono),
  }));

  const gridStyle = useAnimatedStyle(() => {
    const p = viewProgress.value;
    return {
      opacity: interpolate(p, [0, 1], [1, 0], Extrapolate.CLAMP),
      transform: [
        { scale: interpolate(p, [0, 1], [1, 0.97], Extrapolate.CLAMP) },
        { translateY: interpolate(p, [0, 1], [0, 10], Extrapolate.CLAMP) },
      ],
      // bloquea touches cuando el slider está visible
      // notación: pointerEvents no puede venir desde animated style en RN, así que controlamos desde state
    };
  });

  return (
    <View style={styles.body}>
      <Text style={styles.panelText}>Menu de sedi</Text>
      
          <ScrollView
          ref={scrollRef}
            contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      <Animated.View
        style={[styles.grid, gridStyle]}
        pointerEvents={isSliderView ? "none" : "auto"}
      >
      
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            onPress={() => handleItemPress(idx)}
            activeOpacity={0.75}
          >
            <Text style={styles.gridItemText}>{item.title}</Text>
            <Ionicons name={item.icon} size={40} color="#2b8cff" />
          </TouchableOpacity>
        ))}
      </Animated.View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panelText: { color: "white", fontSize: 18 },
  body: { flex: 1, backgroundColor: "#fff", padding: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#f6f6f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
  },
  gridItemText: {
    fontSize: 14,
  },
  scrollContainer: {
    height: 400,
  },
});

export default MenuPanel;
