import { create } from 'zustand';

export const useGlobal = create((set, get) => ({
    initialized: false,
    authenticated: false,
    user: {},
    usuarioID: null,
    rolID: null,
    empresa: null,
    sucursal: null,
    accesos: [],
    menuOptions: [],
    signalrConnected: false,

    init: () => {
        const useChatStore = require('./chatStore').default;
        const ChatApiService = require('../services/chat/chatService').default;

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
        accesos: data.accesos || [],
        menuOptions: data.menuOptions || []
    }),
    setMenuOptions: (menuOptions) => set({ menuOptions }),
    logout: () => set({
        authenticated: false,
        user: {},
        usuarioID: null,
        rolID: null,
        empresa: null,
        sucursal: null,
        accesos: [],
        menuOptions: [],
        signalrConnected: false
    }),

}));

export default useGlobal;

