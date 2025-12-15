import './signalr-shim.js';
import { hubConnection } from 'signalr-no-jquery';
import useGlobal from './global';
import getEnvironmentConfig from '../config/environments.js';
import * as Notifications from 'expo-notifications';
import { getCurrentRouteName } from './navigationRef';
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

        // DEBUG: Imprimir estado actual para verificar que los datos existen
        console.log('[SignalR] Debug State:', {
            EmpresaID: state.empresa?.EmpresaID,
            EmpresaUniqueID: state.empresa?.EmpresaUniqueID,
            UsuarioID: state.user?.UsuarioUniqueID || state.usuarioID,
            SucursalID: state.sucursal?.SucursalID,
            SucursalUniqueID: state.sucursal?.SucursalUniqueID
        });

        // Construir query string con datos de la sesión (MATCHING WEB CLIENT FORMAT)
        // La web usa PascalCase en las LLAVES, pero minúsculas en los VALORES.
        // NOTA: 'UniqueID' viene del login como el UUID del usuario.
        const qs = {
            EmpresaUniqueID: (state.empresa?.EmpresaUniqueID || state.user?.EmpresaUniqueID || state.empresa?.EmpresaID || '').toLowerCase(),
            UsuarioUniqueID: (state.user?.UsuarioUniqueID || state.user?.UniqueID || state.usuarioID || '').toLowerCase(),
            SucursalUniqueID: (state.sucursal?.SucursalUniqueID || state.user?.SucursalUniqueID || state.sucursal?.SucursalID || '').toLowerCase(),
            OpcionMenu: 'CRM/CentroContacto/Principal'
        };

        console.log('[SignalR] Connecting with final params:', qs);

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
            console.log('[SignalR] Connected! ID:', this.connection.id);
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
            console.log('[SignalR] NotificacionPush received:', { dataLength: data?.length, IfPush });

            // Actualizar store de notificaciones en tiempo real
            const chatStore = require('./chatStore').default;
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

                // Decisión de notificar:
                // El servidor no siempre manda IfPush=true.
                // La regla confiable es: Si el mensaje no ha sido visto (Visto === false), notificamos.
                const shouldNotify = (notifData?.Visto === false) && currentRoute !== 'Notificaciones';

                if (shouldNotify) {
                    if (notifData) {
                        const title = notifData.Titulo || 'Nueva Notificación';
                        // La web usa jQuery .text() para quitar HTML del body. Aquí hacemos algo simple:
                        const bodyRaw = notifData.Texto || 'Tienes una nueva notificación en Sedi';
                        const body = bodyRaw.replace(/<[^>]*>?/gm, ''); // Strip basic HTML tags

                        // No esperamos el ID para no bloquear ejecución
                        Notifications.scheduleNotificationAsync({
                            content: {
                                title: title,
                                body: body,
                                sound: true,
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
            console.log('[SignalR] SincronizarOpcionMenuEmpresa received:', data);
            // Actualizar store de chat
            const chatStore = require('./chatStore').default; // Lazy load para evitar ciclos si los hubiera
            chatStore.getState().handleSignalRUpdate(data);
        });

        // Sincronización
        this.hubProxy.on('SyncNotificacionPush', (data) => {
            console.log('[SignalR] SyncNotificacionPush received:', data);
        });

        // Eventos de conexión
        this.connection.stateChanged((change) => {
            const states = { 0: 'connecting', 1: 'connected', 2: 'reconnecting', 4: 'disconnected' };
            console.log(`[SignalR] State changed: ${states[change.oldState]} -> ${states[change.newState]}`);
        });

        this.connection.disconnected(() => {
            console.log('[SignalR] Disconnected event');
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
