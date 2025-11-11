import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // Estado de contactos
  contacts: [],
  selectedContact: null,
  contactsLoading: false,

  // Estado de mensajes
  messages: [],
  messagesLoading: false,

  // Estado de filtros
  searchFilters: {
    Page: 1,
    Rows: 15,
    EstadoID: 1,
    ContactosUsuarioID: null,
    CuentaMensajeriaID: null,
    TodasCuentas: true,
    FullSearch: null,
  },

  // Estado de envío de mensajes
  sendingMessage: false,
  messageInput: '',

  // Estado de archivos adjuntos
  attachments: [],

  // Estado de notificaciones
  notifications: [],
  notificationsLoading: false,
  notificationFilters: {
    Page: 1,
    Rows: 20,
    UsuarioID: null,
    Visto: null,
    FullSearch: null,
  },

  // Acciones para contactos
  setContacts: (contacts) => set({ contacts }),
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  setContactsLoading: (loading) => set({ contactsLoading: loading }),

  // Acciones para mensajes
  setMessages: (messages) => set({ messages }),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

  // Acciones para filtros
  updateSearchFilters: (filters) => set((state) => ({
    searchFilters: { ...state.searchFilters, ...filters }
  })),
  resetSearchFilters: () => set({
    searchFilters: {
      Page: 1,
      Rows: 15,
      EstadoID: 1,
      ContactosUsuarioID: null,
      CuentaMensajeriaID: null,
      TodasCuentas: true,
      FullSearch: null,
    }
  }),

  // Acciones para envío de mensajes
  setSendingMessage: (sending) => set({ sendingMessage: sending }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Acciones para archivos adjuntos
  addAttachment: (attachment) => set((state) => ({
    attachments: [...state.attachments, attachment]
  })),
  removeAttachment: (index) => set((state) => ({
    attachments: state.attachments.filter((_, i) => i !== index)
  })),
  clearAttachments: () => set({ attachments: [] }),


  // Acciones para notificaciones
  setNotifications: (notifications) => set({ notifications }),
  setNotificationsLoading: (loading) => set({ notificationsLoading: loading }),
  updateNotification: (notificationId, updates) => set((state) => ({
    notifications: state.notifications.map(notif =>
      notif.NotificacionUsuarioID === notificationId ? { ...notif, ...updates } : notif
    )
  })),
  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter(notif => notif.NotificacionUsuarioID !== notificationId)
  })),
  clearNotifications: () => set({ notifications: [] }),
  updateNotificationFilters: (filters) => set((state) => ({
    notificationFilters: { ...state.notificationFilters, ...filters }
  })),
  resetNotificationFilters: () => set({
    notificationFilters: {
      Page: 1,
      Rows: 20,
      UsuarioID: null,
      Visto: null,
      FullSearch: null,
    }
  }),

  // Reset completo del store
  reset: () => set({
    contacts: [],
    selectedContact: null,
    contactsLoading: false,
    messages: [],
    messagesLoading: false,
    searchFilters: {
      Page: 1,
      Rows: 15,
      EstadoID: 1,
      ContactosUsuarioID: null,
      CuentaMensajeriaID: null,
      TodasCuentas: true,
      FullSearch: null,
    },
    sendingMessage: false,
    messageInput: '',
    attachments: [],
    notifications: [],
    notificationsLoading: false,
    notificationFilters: {
      Page: 1,
      Rows: 20,
      UsuarioID: null,
      Visto: null,
      FullSearch: null,
    },
  }),
}));

export default useChatStore;