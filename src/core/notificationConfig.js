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
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Obtener el token (Falla sin FCM configurado en Android, pero no bloquea notificaciones locales)
        try {
            // Nota: Esto fallará en Android si no tienes google-services.json configurado en EAS.
            // Para notificaciones locales (SignalR en foreground), NO necesitamos este token estrictamente.
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);
        } catch (e) {
            console.log('Warning: Could not get Push Token (Remote notifications won\'t work, but Local ones will).', e.message);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
