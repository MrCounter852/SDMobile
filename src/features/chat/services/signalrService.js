import '../../../core/signalr-shim.js';
import { hubConnection } from 'signalr-no-jquery';
import useGlobal from '../../../core/global';
import getEnvironmentConfig from '../../../config/environments.js';
import * as Notifications from 'expo-notifications';
import { getCurrentRouteName } from '../../../core/navigationRef';
class SignalRService {
    constructor() {
        this.connection = null;
        this.hubProxy = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectInterval = null;
    }

    async connect() {
        if (this.isConnected || this.isConnecting) return;

        this.isConnecting = true;
        const state = useGlobal.getState();

        // Construir query string con datos de la sesión (MATCHING WEB CLIENT FORMAT)
        // La web usa PascalCase en las LLAVES, pero minúsculas en los VALORES.
        // NOTA: 'UniqueID' viene del login como el UUID del usuario.
        const qs = {
            EmpresaUniqueID: (state.empresa?.EmpresaUniqueID || state.user?.EmpresaUniqueID || state.empresa?.EmpresaID || '').toLowerCase(),
            UsuarioUniqueID: (state.user?.UsuarioUniqueID || state.user?.UniqueID || state.usuarioID || '').toLowerCase(),
            SucursalUniqueID: (state.sucursal?.SucursalUniqueID || state.user?.SucursalUniqueID || state.sucursal?.SucursalID || '').toLowerCase(),
            OpcionMenu: 'CRM/CentroContacto/Principal'
        };

        const baseUrl = `${getEnvironmentConfig().SIGNALR_URL}`;

        this.connection = hubConnection(baseUrl, {
            useDefaultPath: false,
            qs: qs,
            logging: __DEV__
        });

        this.hubProxy = this.connection.createHubProxy('hubnotificaciones');

        this.setupListeners();

        // Validar IDs para debugging
        if (!qs.EmpresaUniqueID || !qs.UsuarioUniqueID) {
            console.warn('[SignalR] WARNING: EmpresaUniqueID or UsuarioUniqueID is missing. Notifications may not work.');
        } else if (qs.EmpresaUniqueID.toString().length < 30) {
            console.warn('[SignalR] WARNING: EmpresaUniqueID seems to be short (not a UUID?). Server expects UUIDs.');
        }

        try {
            await this.connection.start();
            this.isConnected = true;
            this.isConnecting = false;

            // Actualizar estado global
            state.setSignalRConnected(true);
            state.setInitialized(true); // Ocultar splash screen si estaba visible

            // Limpiar intervalo de reconexión si existe
            if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }

        } catch (err) {
            console.error('[SignalR] Connection failed:', err);
            this.isConnecting = false;
            this.handleDisconnect();
        }
    }

    setupListeners() {
        if (!this.hubProxy) return;

        // Notificaciones push
        // Notificaciones push
        // Firma exacta web: function (Notificaciones, IfPush)
        this.hubProxy.on('NotificacionPush', async (data, IfPush) => {
            const chatStore = require('../store/chatStore').default;
            if (data && Array.isArray(data)) {

                // NOTA: La web hace un filtro complejo para unificar filas y actualizar "TotalRows".
                // Por ahora mantenemos la lógica simple de agregar al store, pero la web hace:
                // 1. Si IfPush es true -> Lanza la notificación visual (Banner).
                // 2. Hace un merge de listas.

                const currentNotifications = chatStore.getState().notifications;
                // Filtrar notificaciones nuevas para evitar duplicados
                const newNotifications = data.filter(newNotif =>
                    !currentNotifications.some(existing => existing.NotificacionUsuarioID === newNotif.NotificacionUsuarioID)
                );
                const updatedNotifications = [...newNotifications, ...currentNotifications];
                chatStore.getState().setNotifications(updatedNotifications);

                // --- Lógica de Notificación Local ---
                const currentRoute = getCurrentRouteName();
                const notifData = data[0]; // Tomamos la primera para análisis

                const shouldNotify = (notifData?.Visto === false) && currentRoute !== 'Notificaciones';

                if (shouldNotify) {
                    if (notifData) {
                        const title = notifData.Titulo || 'Nueva Notificación';
                        const bodyRaw = notifData.Texto || 'Tienes una nueva notificación en Sedi';
                        const body = bodyRaw.replace(/<[^>]*>?/gm, '');
                        Notifications.scheduleNotificationAsync({
                            content: {
                                title: title,
                                body: body,
                                sound: true,
                                channelId: 'default',
                                priority: Notifications.AndroidNotificationPriority.HIGH,
                                largeIcon: '../../assets/icon.png',
                                data: { data: notifData, url: notifData.Url },
                            },
                            trigger: null,
                        });
                    }
                }
            }
        });

        // Sincronización de opción de menú
        this.hubProxy.on('SincronizarOpcionMenuEmpresa', (data) => {
            const chatStore = require('../store/chatStore').default;
            chatStore.getState().handleSignalRUpdate(data);
        });

        // Sincronización
        this.hubProxy.on('SyncNotificacionPush', (data) => {
        });

        // Eventos de conexión
        this.connection.stateChanged((change) => {
            const states = { 0: 'connecting', 1: 'connected', 2: 'reconnecting', 4: 'disconnected' };
        });

        this.connection.disconnected(() => {
            this.handleDisconnect();
        });

        this.connection.error((error) => {
            console.error('[SignalR] Error:', error);
        });
    }

    handleDisconnect() {
        this.isConnected = false;
        const state = useGlobal.getState();

        // Solo intentar reconectar si el usuario sigue autenticado
        if (state.authenticated) {
            console.log('[SignalR] Connection lost. Showing splash and attempting reconnect...');
            state.setSignalRConnected(false);
            state.setInitialized(false); // Mostrar splash screen

            // Iniciar reconexión si no está ya en proceso
            if (!this.reconnectInterval) {
                this.reconnectInterval = setInterval(() => {
                    console.log('[SignalR] Attempting to reconnect...');
                    this.connect();
                }, 5000); // Intentar cada 5 segundos
            }
        } else {
            // Si no está autenticado, no intentar reconectar
            this.stop();
        }
    }

    stop() {
        if (this.connection) {
            this.connection.stop();
        }
        this.isConnected = false;
        this.isConnecting = false;
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        const state = useGlobal.getState();
        state.setSignalRConnected(false);
    }
}

export default new SignalRService();
