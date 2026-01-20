import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Verifica el estado actual de los permisos sin solicitarlos.
 * @returns {Promise<string>} Estado de los permisos ('granted', 'denied', 'undetermined')
 */
export async function checkPermissionsAsync() {
    if (!Device.isDevice) return 'granted'; // Simulador
    const { status } = await Notifications.getPermissionsAsync();
    return status;
}

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;



        if (existingStatus !== 'granted') {

            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;

        }

        if (finalStatus !== 'granted') {

            alert('No se otorgaron permisos para notificaciones. Por favor actívalos en la configuración de la app.');
            return;
        }

        // Obtener el token (Puede fallar sin Firebase, pero no bloquea lo anterior)
        try {
            token = (await Notifications.getExpoPushTokenAsync()).data;

        } catch (e) {

        }
    } else {

    }

    return token;
}
