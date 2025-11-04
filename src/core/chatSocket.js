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
    // Para desarrollo local, usar HTTP. En producción cambiar a HTTPS/WSS
    const serverUrl = __DEV__
      ? 'http://localhost:3001' // Cambiar al puerto de tu servidor SignalR
      : 'wss://tu-signalr-server.com/chat';

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        query: {
          token: user?.Token,
          usuarioID: useGlobal.getState().usuarioID,
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

    // Eventos de chat
    this.socket.on('NuevoMensaje', (data) => {
      console.log('Nuevo mensaje recibido:', data);
      this.handleNewMessage(data);
    });

    this.socket.on('MensajeActualizado', (data) => {
      console.log('Mensaje actualizado:', data);
      this.handleMessageUpdate(data);
    });

    this.socket.on('ContactoActualizado', (data) => {
      console.log('Contacto actualizado:', data);
      this.handleContactUpdate(data);
    });

    this.socket.on('EstadoConexion', (data) => {
      console.log('Estado de conexión:', data);
      // Manejar estados de conexión específicos
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
    const { contacts, setContacts } = useChatStore.getState();
    const updatedContacts = contacts.map(contact =>
      contact.CuentaMensajeriaContactoID === data.CuentaMensajeriaContactoID
        ? { ...contact, ...data }
        : contact
    );
    setContacts(updatedContacts);
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

  // Enviar mensaje
  sendMessage(messageData) {
    if (this.socket?.connected) {
      this.socket.emit('EnviarMensaje', messageData);
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

  // Confirmar lectura de mensajes
  markAsRead(contactId) {
    if (this.socket?.connected) {
      this.socket.emit('ConfirmarLectura', { contactId });
    }
  }

  // Actualizar estado de contacto
  updateContactStatus(contactId, status) {
    if (this.socket?.connected) {
      this.socket.emit('ActualizarEstadoContacto', { contactId, status });
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