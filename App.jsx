import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import Login from "./src/features/auth/screens/Login";
import SplashScreen from "./src/features/auth/screens/SplashScreen";
import Home from "./src/features/home/screens/Home";
import useGlobal from "./src/core/global";
import { ChatScreen, NewChat } from "./src/features/chat/screens";
import SettingsScreen from "./src/features/settings/screens/SettingsScreen";
import NewLeadScreen from "./src/features/crm/screens/NewLeadScreen";
import ContactInfoScreen from "./src/features/crm/screens/ContactInfoScreen";
import GestionComercial from "./src/features/crm/screens/GestionComercial";
import ContactDetail from "./src/features/crm/screens/ContactDetail";
import ActivityFollowupScreen from "./src/features/crm/screens/ActivityFollowupScreen";
import { navigationRef, navigate } from "./src/core/navigationRef";
import { registerForPushNotificationsAsync } from "./src/features/notifications/services/notificationConfig";
import * as Notifications from "expo-notifications";
import signalrService from "./src/features/chat/services/signalrService";

const Stack = createNativeStackNavigator();

export default function App() {
  const initialized = useGlobal((state) => state.initialized);
  const authenticated = useGlobal((state) => state.authenticated);
  const init = useGlobal((state) => state.init);

  useEffect(() => {
    init();
  }, []);

  // Gestionar conexión SignalR y Permisos de Notificación
  useEffect(() => {
    if (authenticated) {
      signalrService.connect();
      // Pedir permisos solo al estar autenticado
      registerForPushNotificationsAsync();

      // Cargar notificaciones al iniciar sesión
      const useChatStore =
        require("./src/features/chat/store/chatStore").default;
      const usuarioID = useGlobal.getState().usuarioID;
      if (usuarioID) {
        useChatStore.getState().fetchNotifications(usuarioID);
      }
    } else {
      signalrService.stop();
    }
  }, [authenticated]);

  // Setup Notifications Listener
  useEffect(() => {
    // Nota: La solicitud de permisos se movió al efecto de autenticación
    // registerForPushNotificationsAsync();

    // Listener para cuando el usuario toca la notificación
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Navegar a la pantalla de notificaciones
        // React Navigation manejará el cambio de Tab automáticamente si 'Notificaciones' está en un Tab
        navigate("Notificaciones");
      });

    return () => {
      if (responseListener && responseListener.remove) {
        responseListener.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Stack.Navigator>
          {!initialized ? (
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
          ) : !authenticated ? (
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="Home"
                component={Home}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatScreen"
                component={ChatScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="NewChat"
                component={NewChat}
                options={{ headerShown: true, title: "Nuevo Chat" }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: true, title: "Configuración" }}
              />
              <Stack.Screen
                name="ContactInfo"
                component={ContactInfoScreen}
                options={{
                  headerShown: true,
                  title: "Información del contacto",
                }}
              />
              <Stack.Screen
                name="NewLeadScreen"
                component={NewLeadScreen}
                options={{ headerShown: true, title: "Nuevo Lead" }}
              />
              <Stack.Screen
                name="ContactDetail"
                component={ContactDetail}
                options={{ headerShown: true, title: "Detalle del contacto" }}
              />
              <Stack.Screen
                name="ActivityFollowupScreen"
                component={ActivityFollowupScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="GestionComercial"
                component={GestionComercial}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
