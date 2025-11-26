import './signalr-shim.js';
import { hubConnection } from 'signalr-no-jquery';
import useGlobal from './global';

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

        // Construir query string con datos de la sesión
        // Nota: Se usan los IDs disponibles. Si el backend requiere UUIDs específicos que no están aquí,
        // la conexión podría fallar o no recibir mensajes correctos.
        const qs = {
            EmpresaUniqueID: state.empresa?.EmpresaUniqueID || state.empresa?.EmpresaID,
            UsuarioUniqueID: state.user?.UsuarioUniqueID || state.usuarioID,
            SucursalUniqueID: state.sucursal?.SucursalUniqueID || state.sucursal?.SucursalID,
            OpcionMenu: 'CRM/CentroContacto/Principal'
        };

        console.log('[SignalR] Connecting with params:', qs);

        const baseUrl = 'https://admin.sedierp.com/API_SIS/signalr';

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
        // Server sends: Clients.Client(...).NotificacionPush(data, boolean)
        this.hubProxy.on('NotificacionPush', (data, isNew) => {
            console.log('[SignalR] NotificacionPush received:', { data, isNew });
            // Aquí se podría disparar una notificación local o actualizar un store de notificaciones
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
