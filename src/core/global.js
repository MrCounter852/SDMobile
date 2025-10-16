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

    init: () => set({ initialized: true }),
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
        menuOptions: []
    }),

}));

export default useGlobal;

