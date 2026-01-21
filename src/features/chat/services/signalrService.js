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

    async ping() {
        if (this.isConnected && this.connection) {
            console.log('[SignalR] Ping: Connection is alive');
            return true;
        }

        console.log('[SignalR] Ping: Connection is down, attempting reconnect...');
        
        if (!this.isConnecting) {
            try {
                await this.connect();
                return this.isConnected;
            } catch (error) {
                console.error('[SignalR] Ping: Reconnection failed:', error);
                return false;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.isConnected;
    }

    async connect() {
        if (this.isConnected || this.isConnecting) return;

        this.isConnecting = true;
        const state = useGlobal.getState();

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

        if (!qs.EmpresaUniqueID || !qs.UsuarioUniqueID) {
            console.warn('[SignalR] WARNING: EmpresaUniqueID or UsuarioUniqueID is missing. Notifications may not work.');
        } else if (qs.EmpresaUniqueID.toString().length < 30) {
            console.warn('[SignalR] WARNING: EmpresaUniqueID seems to be short (not a UUID?). Server expects UUIDs.');
        }

        try {
            await this.connection.start();
            this.isConnected = true;
            this.isConnecting = false;

            state.setSignalRConnected(true);
            state.setInitialized(true); 

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

        this.hubProxy.on('NotificacionPush', async (data, IfPush) => {
            const chatStore = require('../store/chatStore').default;
            if (data && Array.isArray(data)) {

                const currentNotifications = chatStore.getState().notifications;
                const newNotifications = data.filter(newNotif =>
                    !currentNotifications.some(existing => existing.NotificacionUsuarioID === newNotif.NotificacionUsuarioID)
                );
                const updatedNotifications = [...newNotifications, ...currentNotifications];
                chatStore.getState().setNotifications(updatedNotifications);

                const currentRoute = getCurrentRouteName();
                const notifData = data[0];

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
                                data: { data: notifData, url: notifData.Url },
                            },
                            trigger: null,
                        });
                    }
                }
            }
        });

        this.hubProxy.on('SincronizarOpcionMenuEmpresa', (data) => {
            const chatStore = require('../store/chatStore').default;
            chatStore.getState().handleSignalRUpdate(data);
        });
        this.hubProxy.on('SyncNotificacionPush', (data) => {
        });

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

        if (state.authenticated) {
            state.setSignalRConnected(false);
            state.setInitialized(false); 

            if (!this.reconnectInterval) {
                this.reconnectInterval = setInterval(() => {
                    this.connect();
                }, 5000); 
            }
        } else {
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
