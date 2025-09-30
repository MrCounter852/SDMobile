import { create } from 'zustand';

export const useGlobal = create((set, get) => ({
    initialized: false,
    authenticated: false,
    user: {},

    init: () => set({ initialized: true }),
    login: (user) => set({ authenticated: true, user }),
    logout: () => set({ authenticated: false, user: {} }),

}));3

export default useGlobal;

