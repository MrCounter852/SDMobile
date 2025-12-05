import { create } from "zustand";

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
  messageInput: "",

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
    }),

  // Manejo de actualizaciones en tiempo real (SignalR)
  handleSignalRUpdate: async (data) => {
    const { Contactos, Mensajes } = data;
    const state = get();
    let newContacts = [...state.contacts];
    let newMessages = [...state.messages];
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

    // 2. Actualizar Mensajes (solo si hay un chat abierto y coinciden)
    if (Mensajes && Mensajes.length > 0 && updatedSelectedContact) {
      const relevantMessages = Mensajes.filter(
        (m) =>
          m.CuentaMensajeriaContactoID ===
          updatedSelectedContact.CuentaMensajeriaContactoID
      );

      if (relevantMessages.length > 0) {
        // Importar dinámicamente para evitar ciclos
        const ChatApiService = require('../services/chat/chatService').default;

        // Formatear mensajes para GiftedChat con descarga de media
        const formattedNewMessages = await Promise.all(
          relevantMessages.map(async (msg) => {
            const formattedMsg = {
              _id: msg.CuentaMensajeriaMensajeID,
              text: msg.Texto || "",
              createdAt: new Date(msg.Fecha),
              user: {
                _id: msg.Recepcion ? 2 : 1,
                name: msg.Recepcion ? updatedSelectedContact.Nombre : "Yo",
              },
              status: msg.Status,
              pending: msg.Status === "accepted" || msg.Status === "pending",
              sent: msg.Status === "sent",
              delivered: msg.Status === "delivered",
              read: msg.Status === "read",
              isIncoming: msg.Recepcion,
            };

            // Descargar media si es un mensaje recibido con FileID
            if (msg.FileID && msg.Recepcion) {
              try {
                const localUri = await ChatApiService.obtenerMediaWhatsApp({
                  MediaID: msg.FileID,
                  AccessToken: updatedSelectedContact.AccessToken,
                  FileMime: msg.FileMime
                });

                // Manejar diferentes tipos de archivos
                if (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker") {
                  formattedMsg.image = localUri;
                } else if (msg.TipoMensaje === "document") {
                  formattedMsg.document = {
                    uri: localUri,
                    fileName: msg.FileName || 'documento',
                    mimeType: msg.FileMime
                  };
                } else if (msg.TipoMensaje === "video") {
                  formattedMsg.video = localUri;
                } else if (msg.TipoMensaje === "audio") {
                  formattedMsg.audio = localUri;
                }

                console.log('[SignalR] Media downloaded:', {
                  id: msg.CuentaMensajeriaMensajeID,
                  type: msg.TipoMensaje
                });
              } catch (error) {
                console.error('[SignalR] Media download failed:', error);
                formattedMsg.mediaExpired = true;
              }
            } else if (msg.HttpUrl && !msg.Recepcion) {
              // Mensajes enviados usan HttpUrl directamente
              if (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker") {
                formattedMsg.image = msg.HttpUrl;
              } else if (msg.TipoMensaje === "document") {
                formattedMsg.document = {
                  uri: msg.HttpUrl,
                  fileName: msg.FileName || 'documento',
                  mimeType: msg.FileMime
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

        // Actualizar mensajes existentes o agregar nuevos
        formattedNewMessages.forEach((newMsg) => {
          const existingIndex = newMessages.findIndex(
            (m) => m._id === newMsg._id
          );

          if (existingIndex !== -1) {
            // Actualizar mensaje existente
            newMessages[existingIndex] = {
              ...newMessages[existingIndex],
              ...newMsg,
            };
          } else {
            // Agregar mensaje nuevo al principio
            newMessages = [newMsg, ...newMessages];
          }
        });
      }
    }

    set({
      contacts: newContacts,
      messages: newMessages,
      selectedContact: updatedSelectedContact,
    });
  },

  // Reset completo del store
  reset: () =>
    set({
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
