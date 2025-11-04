import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Estado de conexión
  isConnected: false,

  // Estado de notificaciones
  notifications: [],

  // Acciones para contactos
  setContacts: (contacts) => set({ contacts }),
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  setContactsLoading: (loading) => set({ contactsLoading: loading }),

  // Acciones para mensajes
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.CuentaMensajeriaMensajeID === messageId ? { ...msg, ...updates } : msg
    )
  })),
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

  // Acciones para conexión
  setConnected: (connected) => set({ isConnected: connected }),

  // Acciones para notificaciones
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications]
  })),
  markNotificationAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    )
  })),
  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter(notif => notif.id !== notificationId)
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Acciones complejas
  loadContactsFromStorage: async () => {
    try {
      const storedContacts = await AsyncStorage.getItem('chat_contacts');
      if (storedContacts) {
        set({ contacts: JSON.parse(storedContacts) });
      }
    } catch (error) {
      console.error('Error loading contacts from storage:', error);
    }
  },

  saveContactsToStorage: async () => {
    try {
      const { contacts } = get();
      await AsyncStorage.setItem('chat_contacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving contacts to storage:', error);
    }
  },

  loadMessagesFromStorage: async (contactId) => {
    try {
      const storedMessages = await AsyncStorage.getItem(`chat_messages_${contactId}`);
      if (storedMessages) {
        set({ messages: JSON.parse(storedMessages) });
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
  },

  saveMessagesToStorage: async (contactId) => {
    try {
      const { messages } = get();
      await AsyncStorage.setItem(`chat_messages_${contactId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to storage:', error);
    }
  },

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
    isConnected: false,
    notifications: [],
  }),
}));

export default useChatStore;