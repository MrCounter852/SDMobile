import io from 'socket.io-client';
import { useChatStore } from './chatStore';
import { useGlobal } from './global';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo
    this.pingInterval = null;
  }

  connect() {
    if (this.socket?.connected) return;

    const { user } = useGlobal.getState();

    // Configuración de URLs basada en el ERP SignalR
    const SIGNALR_CONFIG = {
      development: {
        url: 'http://dev.sedisolutions.co:81/API_SIS/signalr/',
        protocol: 'http'
      },
      production: {
        url: 'wss://admin.sedierp.com/API_SIS/signalr/',
        protocol: 'wss'
      }
    };

    const config = __DEV__ ? SIGNALR_CONFIG.development : SIGNALR_CONFIG.production;
    const serverUrl = config.url;

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        query: {
          token: user?.Token,
          usuarioID: user?.UsuarioID,
          EmpresaUniqueID: user?.EmpresaUniqueID?.toLowerCase(),
          UsuarioUniqueID: user?.UniqueID?.toLowerCase(),
          SucursalUniqueID: user?.SucursalUniqueID?.toLowerCase(),
          OpcionMenu: 'CentroContacto'
        },
        auth: {
          token: user?.Token,
        },
      });

      this.setupEventListeners();
      this.startPingInterval();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.handleReconnect();
    }
  }

  disconnect() {
    this.stopPingInterval();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      useChatStore.getState().setConnected(false);
      this.reconnectAttempts = 0;
    }
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, 30000); // Ping cada 30 segundos
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
      useChatStore.getState().setConnected(false);
    }
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      useChatStore.getState().setConnected(true);

      // Re-unirse a salas después de reconectar
      this.rejoinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      this.isConnected = false;
      useChatStore.getState().setConnected(false);

      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Desconexión intencional, no reconectar automáticamente
      } else {
        // Desconexión accidental, intentar reconectar
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      useChatStore.getState().setConnected(true);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      useChatStore.getState().setConnected(false);
    });

    // Eventos de chat basados en el ERP SignalR
    this.socket.on('SincronizarOpcionMenuEmpresa', (data) => {
      console.log('Sincronización de chat:', data);
      this.handleChatSync(data);
    });

    this.socket.on('NotificacionPush', (data, IfPush) => {
      console.log('Notificación push:', data);
      this.handlePushNotification(data, IfPush);
    });

    this.socket.on('SyncNotificacionPush', (data) => {
      console.log('Sincronización de notificaciones:', data);
      this.handleSyncNotifications(data);
    });

    this.socket.on('CerrarSession', () => {
      console.log('Sesión cerrada por el servidor');
      this.handleSessionClosed();
    });

    this.socket.on('SincronizarAccesos', (data) => {
      console.log('Accesos sincronizados:', data);
      this.handleAccessSync(data);
    });

    this.socket.on('pong', () => {
      // Respuesta al ping, conexión está viva
      console.log('Pong received');
    });

    this.socket.on('Error', (error) => {
      console.error('Server error:', error);
      // Mostrar notificación de error al usuario si es necesario
    });
  }

  handleChatSync(data) {
    console.log('Procesando sincronización de chat:', data);

    // Procesar contactos actualizados
    if (data.Contactos && data.Contactos.length > 0) {
      data.Contactos.forEach(contacto => {
        this.handleContactUpdate(contacto);
      });
    }

    // Procesar mensajes nuevos/actualizados
    if (data.Mensajes && data.Mensajes.length > 0) {
      data.Mensajes.forEach(mensaje => {
        this.handleNewMessage(mensaje);
      });
    }
  }

  handleNewMessage(data) {
    const { selectedContact, addMessage } = useChatStore.getState();

    // Formatear mensaje para GiftedChat
    const formattedMessage = {
      _id: data.CuentaMensajeriaMensajeID,
      text: data.Texto || '',
      createdAt: new Date(data.Fecha),
      user: {
        _id: data.Recepcion ? 2 : 1, // 1 = usuario actual, 2 = contacto
        name: data.Recepcion ? (selectedContact?.Nombre || 'Contacto') : 'Yo',
        avatar: null,
      },
      // Para archivos adjuntos
      ...(data.FileID && {
        image: data.HttpUrl,
        file: {
          name: data.FileName,
          type: data.FileMime,
          url: data.HttpUrl,
        },
      }),
      sent: !data.Recepcion,
      received: data.Recepcion,
      pending: false,
      Status: data.Status,
      StatusMensaje: data.StatusMensaje,
    };

    // Solo agregar si es del contacto actual o es un mensaje nuevo
    if (!selectedContact || data.CuentaMensajeriaContactoID === selectedContact.CuentaMensajeriaContactoID) {
      addMessage(formattedMessage);
    }

    // Actualizar lista de contactos si es necesario
    this.updateContactInList(data.CuentaMensajeriaContactoID, {
      Texto: data.Texto,
      Fecha: data.Fecha,
      CantidadMensajesSinLeer: data.CantidadMensajesSinLeer || 0,
    });
  }

  handleMessageUpdate(data) {
    const { updateMessage } = useChatStore.getState();
    updateMessage(data.CuentaMensajeriaMensajeID, {
      Status: data.Status,
      StatusMensaje: data.StatusMensaje,
      sent: data.Status === 'sent' || data.Status === 'delivered' || data.Status === 'read',
    });
  }

  handleContactUpdate(data) {
    const { contacts, setContacts, selectedContact, setSelectedContact } = useChatStore.getState();
    const updatedContacts = contacts.map(contact =>
      contact.CuentaMensajeriaContactoID === data.CuentaMensajeriaContactoID
        ? { ...contact, ...data }
        : contact
    );
    setContacts(updatedContacts);

    // Si el contacto actualizado es el seleccionado, actualizar también el estado
    if (selectedContact && selectedContact.CuentaMensajeriaContactoID === data.CuentaMensajeriaContactoID) {
      setSelectedContact({ ...selectedContact, ...data });
    }
  }

  handlePushNotification(data, IfPush) {
    console.log('Procesando notificación push:', data, IfPush);

    // Si IfPush es true, mostrar notificación nativa
    if (IfPush) {
      // Aquí puedes integrar con una librería de notificaciones push
      // Por ejemplo: react-native-push-notification o similar
      console.log('Mostrar notificación push:', data.Titulo, data.Texto);
    }

    // Procesar la notificación en el store
    const { addNotification } = useChatStore.getState();
    addNotification({
      id: data.NotificacionID,
      title: data.Titulo,
      message: data.Texto,
      url: data.Url,
      date: new Date(data.Fecha),
      read: data.Visto || false,
    });
  }

  handleSyncNotifications(data) {
    console.log('Sincronizando notificaciones:', data);
    const { setNotifications } = useChatStore.getState();
    setNotifications(data);
  }

  handleSessionClosed() {
    console.log('Sesión cerrada por el servidor');
    // Cerrar conexión y redirigir a login
    this.disconnect();
    const { logout } = useGlobal.getState();
    logout();
  }

  handleAccessSync(data) {
    console.log('Sincronizando accesos:', data);
    // Aquí puedes actualizar permisos o módulos si es necesario
    // const { updatePermissions } = useGlobal.getState();
    // updatePermissions(data);
  }

  updateContactInList(contactId, updates) {
    const { contacts, setContacts } = useChatStore.getState();
    const updatedContacts = contacts.map(contact =>
      contact.CuentaMensajeriaContactoID === contactId
        ? { ...contact, ...updates }
        : contact
    );
    setContacts(updatedContacts);
  }

  rejoinRooms() {
    const { selectedContact } = useChatStore.getState();
    if (selectedContact) {
      this.joinContactRoom(selectedContact.CuentaMensajeriaContactoID);
    }
  }

  // Enviar mensaje (compatible con API del ERP)
  sendMessage(messageData) {
    if (this.socket?.connected) {
      // Formatear datos según la API del ERP
      const formattedData = {
        CuentaMensajeriaID: messageData.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: messageData.CuentaMensajeriaContactoID,
        Mensaje: messageData.Mensaje,
        Files: messageData.Files || [],
        Token: useGlobal.getState().user?.Token
      };
      this.socket.emit('EnviarMensaje', formattedData);
    } else {
      console.warn('Socket not connected, cannot send message');
      throw new Error('No hay conexión con el servidor de chat');
    }
  }

  // Unirse a sala de contacto
  joinContactRoom(contactId) {
    if (this.socket?.connected) {
      this.socket.emit('UnirseSalaContacto', { contactId });
    }
  }

  // Salir de sala de contacto
  leaveContactRoom(contactId) {
    if (this.socket?.connected) {
      this.socket.emit('SalirSalaContacto', { contactId });
    }
  }

  // Confirmar lectura de mensajes (compatible con ERP)
  markAsRead(contactData) {
    if (this.socket?.connected) {
      const formattedData = {
        CuentaMensajeriaContactoID: contactData.CuentaMensajeriaContactoID,
        UsuarioID: useGlobal.getState().user?.UsuarioID,
        Token: useGlobal.getState().user?.Token
      };
      this.socket.emit('ConfirmarLectura', formattedData);
    }
  }

  // Actualizar estado de contacto (compatible con ERP)
  updateContactStatus(contactId, status) {
    if (this.socket?.connected) {
      const formattedData = {
        CuentaMensajeriaContactoID: contactId,
        EstadoGestionContactoID: status,
        Token: useGlobal.getState().user?.Token
      };
      this.socket.emit('ActualizarEstadoContacto', formattedData);
    }
  }

  // Asignar chat a usuario (compatible con ERP)
  assignChat(contactData) {
    if (this.socket?.connected) {
      const formattedData = {
        CuentaMensajeriaContactoID: contactData.CuentaMensajeriaContactoID,
        NuevoUsuarioID: contactData.NuevoUsuarioID,
        Token: useGlobal.getState().user?.Token
      };
      this.socket.emit('AsociarUsuario', formattedData);
    }
  }

  // Iniciar nuevo chat (compatible con ERP)
  startNewChat(chatData) {
    if (this.socket?.connected) {
      const formattedData = {
        ...chatData,
        Token: useGlobal.getState().user?.Token
      };
      this.socket.emit('NuevoChat', formattedData);
    }
  }

  // Ping para mantener conexión viva
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  // Verificar estado de conexión
  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

export default new ChatSocketService();