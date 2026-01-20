import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useGlobal = create((set, get) => ({
    initialized: false,
    authenticated: false,
    user: {},
    usuarioID: null,
    rolID: null,
    empresa: null,
    sucursal: null,
    asesorID: null,
    accesos: [],
    permisos: {}, // Special CRM permissions
    menuOptions: [],
    signalrConnected: false,
    cdnEndPoint: null,
    cdnLlavePublica: null,
    cdnLlavePrivada: null,

    init: async () => {
        const useChatStore = require('../features/chat/store/chatStore').default;
        const ChatApiService = require('../features/chat/services/chatService').default;
        const { loginUser, getOauthToken, getSessionData } = require('../features/auth/services/authService');

        useChatStore.getState().init();
        // Fire-and-forget cache maintenance (non-blocking)
        ChatApiService.manageCache();

        try {
            // Attempt auto-login
            const credentialsStr = await SecureStore.getItemAsync('auth_credentials');
            const selectionStr = await SecureStore.getItemAsync('auth_selection');

            if (credentialsStr && selectionStr) {
                const { email, password } = JSON.parse(credentialsStr);
                const { empresa, sucursal } = JSON.parse(selectionStr);

                if (email && password && empresa && sucursal) {
                    const result = await loginUser(email, password);
                    const oauthData = await getOauthToken(
                        result.token,
                        empresa.BaseDatosID,
                        empresa.EmpresaID,
                        sucursal.SucursalID
                    );

                    const sessionData = await getSessionData(oauthData.accessToken);
                    const usuarioID = sessionData.Session?.Usuario?.UsuarioID;
                    const rolID = sessionData.Session?.Usuario?.RolID;
                    const user = sessionData.Session?.Usuario || {};
                    const accesos = sessionData.Session?.Accesos || [];

                    get().login({
                        user: {
                            email: email,
                            ...user,
                        },
                        usuarioID,
                        rolID,
                        empresa,
                        sucursal,
                        accesos,
                    });
                }
            }
        } catch (error) {
            console.error("Auto-login failed:", error);
            // If auto-login fails, clear stored credentials to force manual login
            await SecureStore.deleteItemAsync('auth_credentials');
            await SecureStore.deleteItemAsync('auth_selection');
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('erpToken');
            await SecureStore.deleteItemAsync('usuarioID');
            await SecureStore.deleteItemAsync('rolID');
        } finally {
            set({ initialized: true });
        }
    },
    setInitialized: (status) => set({ initialized: status }),
    setSignalRConnected: (status) => set({ signalrConnected: status }),

    login: (data) => set({
        authenticated: true,
        user: data.user || {},
        usuarioID: data.usuarioID,
        rolID: data.rolID,
        empresa: data.empresa,
        sucursal: data.sucursal,
        asesorID: data.user?.AsesorID || null,
        accesos: data.accesos || [],
        menuOptions: data.menuOptions || [],
        cdnEndPoint: data.user?.CDNEndPoint || null,
        cdnLlavePublica: data.user?.CDNLlavePublica || null,
        cdnLlavePrivada: data.user?.CDNLlavePrivada || null
    }),
    setPermisos: (permisos) => set((state) => ({ 
        permisos: { ...state.permisos, ...permisos },
        // Also sync to user object for components using user.Permiso
        user: { ...state.user, ...permisos } 
    })),
    setMenuOptions: (menuOptions) => set({ menuOptions }),
    logout: async () => {
        // Clear secure storage
        await SecureStore.deleteItemAsync('auth_credentials');
        await SecureStore.deleteItemAsync('auth_selection');
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('erpToken');
        await SecureStore.deleteItemAsync('usuarioID');
        await SecureStore.deleteItemAsync('rolID');

        // Clear chat storage
        const ChatStorageService = require('../features/chat/services/chatStorageService').default;
        ChatStorageService.clearAll();
        // Clear media cache
        const ChatApiService = require('../features/chat/services/chatService').default;
        ChatApiService.clearCache();
        // Reset chat store
        const useChatStore = require('../features/chat/store/chatStore').default;
        useChatStore.getState().reset();

        set({
            authenticated: false,
            user: {},
            usuarioID: null,
            rolID: null,
            empresa: null,
            sucursal: null,
            asesorID: null,
            accesos: [],
            permisos: {},
            menuOptions: [],
            signalrConnected: false,
            cdnEndPoint: null,
            cdnLlavePublica: null,
            cdnLlavePrivada: null
        });
    },

}));

export default useGlobal;

