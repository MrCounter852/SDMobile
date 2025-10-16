import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Menu from '../Menu/Menu';
import Inicio from '../Inicio/Inicio';
import Perfil from '../Perfil/Perfil';
import Notificaciones from '../Notificaciones/Notificaciones';
import Favoritos from '../Favoritos/Favoritos';
import useGlobal from '../../core/global';

const Tab = createBottomTabNavigator();

const Home = () => {
  const { rolID, setMenuOptions } = useGlobal();
  const { height } = useWindowDimensions();


  const PANEL_HEIGHT = height * 0.6;
  const translateY = useSharedValue(PANEL_HEIGHT); 
  const context = useSharedValue({ y: 0 });
  const panelVisible = useRef(false);


  useEffect(() => {
    const fetchMenuOptions = async () => {
      if (rolID == null) return;
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (!token) return;
        const response = await fetch('https://ns2.sedierp.com//API_SIS/api/OpcionesMenu/OpcionesMenuConsultar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ RolID: parseInt(rolID, 10) }),
        });
        const data = await response.json();
        if (response.ok && data.result === 1) {
          setMenuOptions(data.data?.Menus || []);
        }
      } catch (error) {
        console.error('Error fetching menu options:', error);
      }
    };
    fetchMenuOptions();
  }, [rolID, setMenuOptions]);

  // ---- Gesto manual (drag) ----
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.min(
        Math.max(context.value.y + event.translationY, 0),
        PANEL_HEIGHT
      );
    })
    .onEnd(() => {
      if (translateY.value > PANEL_HEIGHT / 2) {
        translateY.value = withSpring(PANEL_HEIGHT, { damping: 90 });
        panelVisible.current = false;
      } else {
        translateY.value = withSpring(0, { damping: 90 });
        panelVisible.current = true;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));


  const AppTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Inicio: 'home',
            Favoritos: 'heart',
            Menu: 'menu',
            Notificaciones: 'notifications',
            Perfil: 'person',
          };
          const iconName = icons[route.name] || 'circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2b8cff',
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
            if (panelVisible.current) {
              translateY.value = withSpring(PANEL_HEIGHT, { damping: 90 });
              panelVisible.current = false;
            } else {
              translateY.value = withSpring(0, { damping: 90 });
              panelVisible.current = true;
            }
          },
        }}
      />
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
            { position: 'absolute', bottom: 0, zIndex: 10, elevation: 10 },
          ]}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.panelContent}>
            <Text style={styles.panelText}>Menu de sedi</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bottomSheetContainer: {
    width: '100%',
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  dragHandleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3 },
  panelContent: {
    flex: 1,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelText: { color: 'white', fontSize: 18 },
});

export default Home;
