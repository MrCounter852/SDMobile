import { create } from "zustand";

export const useChatStore = create((set, get) => ({
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
  hasMoreNotifications: true,
  notificationFilters: {
    Page: 1,
    Rows: 20,
    UsuarioID: null,
    Visto: null,
    FullSearch: null,
  },
  setContacts: (contacts) => set({ contacts }),
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  setContactsLoading: (loading) => set({ contactsLoading: loading }),

  resetUnreadCount: (contactId) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.CuentaMensajeriaContactoID === contactId
          ? { ...c, CantidadMensajesSinLeer: 0 }
          : c
      )
    })),

  init: async () => {
    const ChatStorageService = require('../services/chatStorageService').default;
    const chats = await ChatStorageService.getAllChats();
    set({ chats });
  },

  getMessages: (contactId) => get().chats[contactId] || [],

  setMessages: (contactId, messages) =>
    set((state) => ({
      chats: { ...state.chats, [contactId]: messages }
    })),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

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

  setSendingMessage: (sending) => set({ sendingMessage: sending }),
  setMessageInput: (text) => set({ messageInput: text }),

  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, attachment],
    })),
  removeAttachment: (index) =>
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
    })),
  clearAttachments: () => set({ attachments: [] }),

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
  fetchNotifications: async (usuarioID, page = 1, append = false, vistoFilter = null) => {
    const state = get();
    if (state.notificationsLoading) return;

    set({ notificationsLoading: true });

    try {
      const ChatApiService = require('../services/chatService').default;
      const filters = {
        Page: page,
        Rows: 20,
        UsuarioID: usuarioID,
        Visto: null,
        FullSearch: null,
      };

      const response = await ChatApiService.consultarNotificacionesPush(filters);

      if (response.result === 1) {
        const uniqueRows = response.rows.filter((item, index, self) =>
          index === self.findIndex(i => i.NotificacionUsuarioID === item.NotificacionUsuarioID)
        );

        if (append && page > 1) {
          const currentNotifications = state.notifications;
          const newUnique = uniqueRows.filter(newItem =>
            !currentNotifications.some(existing => existing.NotificacionUsuarioID === newItem.NotificacionUsuarioID)
          );
          set({ notifications: [...currentNotifications, ...newUnique] });
        } else {
          set({ notifications: uniqueRows });
        }

        if (uniqueRows.length < filters.Rows) {
          set({ hasMoreNotifications: false });
        } else {
          set({ hasMoreNotifications: true });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      set({ notificationsLoading: false });
    }
  },
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

  handleSignalRUpdate: async (data) => {
    const { Contactos, Mensajes } = data;
    const state = get();
    let newContacts = [...state.contacts];
    let newChats = { ...state.chats };
    let updatedSelectedContact = state.selectedContact;

    if (Contactos && Contactos.length > 0) {
      Contactos.forEach((updatedContact) => {
        const index = newContacts.findIndex(
          (c) =>
            c.CuentaMensajeriaContactoID ===
            updatedContact.CuentaMensajeriaContactoID
        );

        if (index !== -1) {
          const existingContact = newContacts[index];
          newContacts.splice(index, 1);
          newContacts.unshift({ ...existingContact, ...updatedContact });
        } else {
          newContacts.unshift(updatedContact);
        }

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

    if (Mensajes && Mensajes.length > 0) {
      const messagesByContact = Mensajes.reduce((acc, msg) => {
        const contactId = msg.CuentaMensajeriaContactoID;
        if (!acc[contactId]) acc[contactId] = [];
        acc[contactId].push(msg);
        return acc;
      }, {});

      const ChatApiService = require('../services/chatService').default;

      for (const [contactId, contactMessages] of Object.entries(messagesByContact)) {
        const currentMessages = newChats[contactId] || [];
        const formattedNewMessages = await Promise.all(
          contactMessages.map(async (msg) => {
            const formattedMsg = {
              _id: msg.CuentaMensajeriaMensajeID,
              text: msg.Texto || "",
              createdAt: new Date(msg.Fecha),
              user: {
                _id: msg.Recepcion ? 2 : 1,
                name: msg.Recepcion ? "Contacto" : "Yo",
              },
              status: msg.Status,
              pending: msg.Status === "accepted" || msg.Status === "pending",
              sent: msg.Status === "sent",
              delivered: msg.Status === "delivered",
              read: msg.Status === "read",
              isIncoming: msg.Recepcion,
            };

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

        formattedNewMessages.forEach((newMsg) => {
          const existingIndex = updatedContactMessages.findIndex(
            (m) => m._id === newMsg._id
          );

          if (existingIndex !== -1) {
            updatedContactMessages[existingIndex] = {
              ...updatedContactMessages[existingIndex],
              ...newMsg,
            };
          } else {
            if (!newMsg.isIncoming) {
              const pendingIndex = updatedContactMessages.findIndex(
                (m) => m.pending === true
              );
              if (pendingIndex !== -1) {
                updatedContactMessages[pendingIndex] = newMsg;
              } else {
                updatedContactMessages = [newMsg, ...updatedContactMessages];
              }
            } else {
              updatedContactMessages = [newMsg, ...updatedContactMessages];
            }
          }
        });

        newChats[contactId] = updatedContactMessages;

        if (updatedSelectedContact &&
          updatedSelectedContact.CuentaMensajeriaContactoID == contactId &&
          formattedNewMessages.some(msg => msg.isIncoming && !msg.read)) {
          const ChatApiService = require('../services/chatService').default;

          setTimeout(async () => {
            try {
              await ChatApiService.confirmarLectura({
                CuentaMensajeriaContactoID: contactId,
                CuentaMensajeriaID: updatedSelectedContact.CuentaMensajeriaID,
                Token: state.user?.Token
              });
            } catch (error) {
              console.error('Error confirmando lectura automática:', error);
            }
          }, 100);
        }
      }
    }

    set({
      contacts: newContacts,
      chats: newChats,
      selectedContact: updatedSelectedContact,
    });
  },

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
