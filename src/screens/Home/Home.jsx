import React, { useEffect, useRef } from "react";
import { View, StyleSheet, useWindowDimensions, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Menu from "../Menu/Menu";
import Inicio from "../Inicio/Inicio";
import Perfil from "../Perfil/Perfil";
import Notificaciones from "../Notificaciones/Notificaciones";
import Favoritos from "../Favoritos/Favoritos";
import useGlobal from "../../core/global";
import MenuPanel from "../../components/MenuPanel";
import { ContactList } from "../Chat";
const Tab = createBottomTabNavigator();

const Home = () => {
  const { rolID, setMenuOptions } = useGlobal();
  const { height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const PANEL_HEIGHT = height * 0.6;
  const translateY = useSharedValue(PANEL_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const panelVisible = useSharedValue(false);
  const opacity = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollAllowed = useSharedValue(false);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    const fetchMenuOptions = async () => {
      if (rolID == null) return;
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) return;
        const response = await fetch(
          "https://ns2.sedierp.com//API_SIS/api/OpcionesMenu/OpcionesMenuConsultar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ RolID: parseInt(rolID, 10) }),
          }
        );
        const data = await response.json();
        if (response.ok && data.result === 1) {
          setMenuOptions(data.data?.Menus || []);
        }
      } catch (error) {
        console.error("Error fetching menu options:", error);
      }
    };
    fetchMenuOptions();
  }, [rolID, setMenuOptions]);

  // ---- Gesto manual (drag) ----
 const gesture = Gesture.Pan()
 .simultaneousWithExternalGesture(scrollRef)
   .onStart(() => {
     context.value = { y: translateY.value };
   })
   .onUpdate((event) => {
     if (scrollY.value > 0) {
       return;
     }
     translateY.value = Math.min(
       Math.max(context.value.y + event.translationY, 0),
       PANEL_HEIGHT
     );
   })
   .onEnd(() => {
     if (translateY.value > PANEL_HEIGHT / 2) {
       translateY.value = withSpring(PANEL_HEIGHT, { damping: 90 });
       opacity.value = withTiming(0);
       panelVisible.value = false;
     } else {
       translateY.value = withSpring(0, { damping: 90 });
       opacity.value = withTiming(1);
       panelVisible.value = true;
     }
   });


const animatedStyle = useAnimatedStyle(() => {
  const currentOpacity = 1 - (translateY.value / PANEL_HEIGHT);

  return {
    transform: [{ translateY: translateY.value }],
    opacity: currentOpacity,
  };
});


  const AppTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Inicio: "home",
            Favoritos: "heart",
            Menu: "menu",
            Notificaciones: "notifications",
            Perfil: "person",
            Chat: "chatbubble-ellipses",
          };
          const iconName = icons[route.name] || "circle";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#337ab7",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={Inicio} />
      <Tab.Screen name="Favoritos" component={Favoritos} />
      <Tab.Screen
        name="Menu"
        component={Menu}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (panelVisible.value) {
              translateY.value = withSpring(PANEL_HEIGHT, { damping: 90 });
              opacity.value = withTiming(0);
              panelVisible.value = false;
            } else {
              translateY.value = withSpring(0, { damping: 90 });
              opacity.value = withTiming(1);
              panelVisible.value = true;
            }
          },
        }}
      />
      <Tab.Screen name="Chat" component={ContactList} />
      <Tab.Screen name="Notificaciones" component={Notificaciones} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppTabs />

      {/* Panel flotante */}
      <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.bottomSheetContainer,
          animatedStyle,
          { position: "absolute", bottom: 0, zIndex: 10, elevation: 10 },
        ]}
      >

          {panelVisible ? (
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
          ) : null}

        <View style={styles.panelContent}>
          <View style={{ flex: 1, overflow: "hidden" }}>
            <MenuPanel scrollRef={scrollRef} scrollY={scrollY} />
          </View>
        </View>
      </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  bottomSheetContainer: {
    width: "100%",
    height: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
  },
  dragHandleContainer: {
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "white",
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
  },
  panelContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panelText: { color: "white", fontSize: 18 },
});

export default Home;
