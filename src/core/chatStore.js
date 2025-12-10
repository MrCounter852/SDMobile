import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  // Estado de contactos
  contacts: [],
  selectedContact: null,
  contactsLoading: false,

  // Estado de mensajes
  chats: {},
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
  messageInput: "",

  // Estado de archivos adjuntos
  attachments: [],

  // Estado de notificaciones
  notifications: [],
  notificationsLoading: false,
  hasMoreNotifications: true,
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
  init: async () => {
    const ChatStorageService = require('../services/chat/chatStorageService').default;
    const chats = await ChatStorageService.getAllChats();
    set({ chats });
  },

  getMessages: (contactId) => get().chats[contactId] || [],

  setMessages: (contactId, messages) =>
    set((state) => ({
      chats: { ...state.chats, [contactId]: messages }
    })),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

  // Acciones para filtros
  updateSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),
  resetSearchFilters: () =>
    set({
      searchFilters: {
        Page: 1,
        Rows: 15,
        EstadoID: 1,
        ContactosUsuarioID: null,
        CuentaMensajeriaID: null,
        TodasCuentas: true,
        FullSearch: null,
      },
    }),

  // Acciones para envío de mensajes
  setSendingMessage: (sending) => set({ sendingMessage: sending }),
  setMessageInput: (text) => set({ messageInput: text }),

  // Acciones para archivos adjuntos
  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, attachment],
    })),
  removeAttachment: (index) =>
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
    })),
  clearAttachments: () => set({ attachments: [] }),

  // Acciones para notificaciones
  setNotifications: (notifications) => set({ notifications }),
  setNotificationsLoading: (loading) => set({ notificationsLoading: loading }),
  updateNotification: (notificationId, updates) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.NotificacionUsuarioID === notificationId
          ? { ...notif, ...updates }
          : notif
      ),
    })),
  removeNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notif) => notif.NotificacionUsuarioID !== notificationId
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  updateNotificationFilters: (filters) =>
    set((state) => ({
      notificationFilters: { ...state.notificationFilters, ...filters },
    })),
  resetNotificationFilters: () =>
    set({
      notificationFilters: {
        Page: 1,
        Rows: 20,
        UsuarioID: null,
        Visto: null,
        FullSearch: null,
      },
      hasMoreNotifications: true,
    }),

  // Manejo de actualizaciones en tiempo real (SignalR)
  handleSignalRUpdate: async (data) => {
    const { Contactos, Mensajes } = data;
    const state = get();
    let newContacts = [...state.contacts];
    let newChats = { ...state.chats };
    let updatedSelectedContact = state.selectedContact;

    // 1. Actualizar Contactos
    if (Contactos && Contactos.length > 0) {
      Contactos.forEach((updatedContact) => {
        const index = newContacts.findIndex(
          (c) =>
            c.CuentaMensajeriaContactoID ===
            updatedContact.CuentaMensajeriaContactoID
        );

        if (index !== -1) {
          // Actualizar existente y mover al inicio
          const existingContact = newContacts[index];
          newContacts.splice(index, 1);
          newContacts.unshift({ ...existingContact, ...updatedContact });
        } else {
          // Agregar nuevo al inicio
          newContacts.unshift(updatedContact);
        }

        // Actualizar contacto seleccionado si coincide
        if (
          updatedSelectedContact &&
          updatedSelectedContact.CuentaMensajeriaContactoID ===
          updatedContact.CuentaMensajeriaContactoID
        ) {
          updatedSelectedContact = {
            ...updatedSelectedContact,
            ...updatedContact,
          };
        }
      });
    }

    // 2. Actualizar Mensajes
    if (Mensajes && Mensajes.length > 0) {
      // Agrupar mensajes por contacto
      const messagesByContact = Mensajes.reduce((acc, msg) => {
        const contactId = msg.CuentaMensajeriaContactoID;
        if (!acc[contactId]) acc[contactId] = [];
        acc[contactId].push(msg);
        return acc;
      }, {});

      // Importar dinámicamente para evitar ciclos
      const ChatApiService = require('../services/chat/chatService').default;

      // Procesar cada grupo de mensajes
      for (const [contactId, contactMessages] of Object.entries(messagesByContact)) {
        const currentMessages = newChats[contactId] || [];

        // Formatear mensajes para GiftedChat con descarga de media
        const formattedNewMessages = await Promise.all(
          contactMessages.map(async (msg) => {
            const formattedMsg = {
              _id: msg.CuentaMensajeriaMensajeID,
              text: msg.Texto || "",
              createdAt: new Date(msg.Fecha),
              user: {
                _id: msg.Recepcion ? 2 : 1, // 2: Contacto, 1: Usuario
                name: msg.Recepcion ? "Contacto" : "Yo", // Simplificado, el nombre real se muestra en UI
              },
              status: msg.Status,
              pending: msg.Status === "accepted" || msg.Status === "pending",
              sent: msg.Status === "sent",
              delivered: msg.Status === "delivered",
              read: msg.Status === "read",
              isIncoming: msg.Recepcion,
            };

            // Marcar media como pendiente para descarga on-demand (evita bloqueo en SignalR)
            if (msg.FileID && msg.Recepcion) {
              const contact = newContacts.find(c => c.CuentaMensajeriaContactoID == contactId);
              const accessToken = contact?.AccessToken;

              if (accessToken) {
                formattedMsg.pendingMedia = {
                  type: msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker" ? "image" :
                        msg.TipoMensaje === "video" ? "video" :
                        msg.TipoMensaje === "audio" ? "audio" : "file",
                  params: {
                    MediaID: msg.FileID,
                    AccessToken: accessToken,
                    FileMime: msg.FileMime
                  },
                  name: msg.FileName
                };
              }
            } else if (msg.HttpUrl && !msg.Recepcion) {
              // Mensajes enviados usan HttpUrl directamente
              if (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker") {
                formattedMsg.image = msg.HttpUrl;
              } else if (msg.TipoMensaje === "document") {
                formattedMsg.file = {
                  name: msg.FileName || 'documento',
                  url: msg.HttpUrl
                };
              } else if (msg.TipoMensaje === "video") {
                formattedMsg.video = msg.HttpUrl;
              } else if (msg.TipoMensaje === "audio") {
                formattedMsg.audio = msg.HttpUrl;
              }
            }

            return formattedMsg;
          })
        );

        let updatedContactMessages = [...currentMessages];

        // Actualizar mensajes existentes o agregar nuevos
        formattedNewMessages.forEach((newMsg) => {
          const existingIndex = updatedContactMessages.findIndex(
            (m) => m._id === newMsg._id
          );

          if (existingIndex !== -1) {
            // Actualizar mensaje existente
            updatedContactMessages[existingIndex] = {
              ...updatedContactMessages[existingIndex],
              ...newMsg,
            };
          } else {
            // Para mensajes enviados (no incoming), reemplazar el mensaje pendiente si existe
            if (!newMsg.isIncoming) {
              const pendingIndex = updatedContactMessages.findIndex(
                (m) => m.pending === true
              );
              if (pendingIndex !== -1) {
                // Reemplazar el mensaje pendiente con el mensaje real
                updatedContactMessages[pendingIndex] = newMsg;
              } else {
                // Agregar mensaje nuevo al principio
                updatedContactMessages = [newMsg, ...updatedContactMessages];
              }
            } else {
              // Agregar mensaje nuevo al principio
              updatedContactMessages = [newMsg, ...updatedContactMessages];
            }
          }
        });

        newChats[contactId] = updatedContactMessages;
      }
    }

    set({
      contacts: newContacts,
      chats: newChats,
      selectedContact: updatedSelectedContact,
    });
  },

  // Reset completo del store
  reset: () =>
    set({
      contacts: [],
      selectedContact: null,
      contactsLoading: false,
      chats: {},
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
      messageInput: "",
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
