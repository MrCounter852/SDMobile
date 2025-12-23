import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import Login from './src/screens/Login/Login';
import SplashScreen from './src/screens/SplashScreen/SplashScreen';
import Home from './src/screens/Home/Home';
import useGlobal from './src/core/global';
import { ChatScreen, NewChat } from './src/screens/Chat';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import NewLeadScreen from './src/assets/common/NewLeadScreen';
import ContactInfoScreen from './src/screens/ContactInfo/ContactInfoScreen';
import GestionComercial from './src/screens/GestionComercial/GestionComercial';
import ContactDetail from './src/screens/GestionComercial/ContactDetail';
import ActivityFollowupScreen from './src/screens/GestionComercial/ActivityFollowupScreen';
import { navigationRef, navigate } from './src/core/navigationRef';
import { registerForPushNotificationsAsync } from './src/core/notificationConfig';
import * as Notifications from 'expo-notifications';
import signalrService from './src/core/signalrService';

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
      const useChatStore = require('./src/core/chatStore').default;
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
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Navegar a la pantalla de notificaciones
      // React Navigation manejará el cambio de Tab automáticamente si 'Notificaciones' está en un Tab
      navigate('Notificaciones');
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
                options={{ headerShown: true, title: 'Nuevo Chat' }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: true, title: 'Configuración' }}
              />
              <Stack.Screen
                name="ContactInfo"
                component={ContactInfoScreen}
                options={{ headerShown: true, title: 'Información del contacto' }}
              />
              <Stack.Screen
                name="NewLeadScreen"
                component={NewLeadScreen}
                options={{ headerShown: true, title: 'Nuevo Lead' }}
              />
              <Stack.Screen
                name="ContactDetail"
                component={ContactDetail}
                options={{ headerShown: true, title: 'Detalle del contacto' }}
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
    backgroundColor: '#fff',
  },
});
