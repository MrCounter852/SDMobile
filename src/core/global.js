import { create } from 'zustand';

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
    menuOptions: [],
    signalrConnected: false,
    cdnEndPoint: null,
    cdnLlavePublica: null,
    cdnLlavePrivada: null,

    init: () => {
        const useChatStore = require('../features/chat/store/chatStore').default;
        const ChatApiService = require('../features/chat/services/chatService').default;

        useChatStore.getState().init();
        // Fire-and-forget cache maintenance (non-blocking)
        ChatApiService.manageCache();

        set({ initialized: true });
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
    setMenuOptions: (menuOptions) => set({ menuOptions }),
    logout: () => {
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
            menuOptions: [],
            signalrConnected: false,
            cdnEndPoint: null,
            cdnLlavePublica: null,
            cdnLlavePrivada: null
        });
    },

}));

export default useGlobal;

