import { useGlobal } from './global';
import * as SecureStore from 'expo-secure-store';

const API_BASE_COM = 'https://ns2.sedierp.com/API_COM/api';

const API_BASE_CRM = 'https://ns2.sedierp.com/API_CRM/api';

class ChatApiService {
  constructor() {
    this.global = useGlobal.getState();
    // Suscribirse a cambios en el estado global
    useGlobal.subscribe((state) => {
      this.global = state;
    });
  }

  // Método para obtener el token correcto del ERP de SecureStore
  async getStoredToken() {
    try {
      // El erpToken ahora es el token de OauthToken que funciona para las APIs
      const erpToken = await SecureStore.getItemAsync('erpToken');
      if (erpToken) {
        console.log('Using erpToken from SecureStore');
        return erpToken;
      }
      // Fallback al accessToken si no hay erpToken
      const accessToken = await SecureStore.getItemAsync('accessToken');
      console.log('Using accessToken as fallback');
      return accessToken || '';
    } catch (error) {
      console.error('Error getting stored token:', error);
      return '';
    }
  }

  async getHeaders() {
    // Para las APIs del chat, siempre usar el token JWT de OauthToken almacenado como erpToken
    const token = await this.getStoredToken();

    console.log('ChatApi - Headers Debug:', {
      token: token ? 'present' : 'empty',
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'no token',
      authenticated: this.global.authenticated
    });

    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async makeRequest(endpoint, options = {}, useCRM = false) {
    const baseUrl = API_BASE_COM;
    const url = `${baseUrl}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      headers,
      ...options,
    };

    console.log('ChatApi - Request:', {
      url,
      method: config.method || 'GET',
      useCRM,
      hasAuth: !!config.headers.Authorization,
      endpoint
    });

    try {
      const response = await fetch(url, config);
      console.log('ChatApi - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ChatApi - Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ChatApi - Success response:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Consultar contactos de mensajería
  async consultarContactos(filtros) {
    const endpoint = '/CuentasMensajeriaContactos/CuentasMensajeriaContactosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        EstadoGestionContactoID: filtros?.EstadoGestionContactoID || 1,
        ContactosUsuarioID: filtros?.ContactosUsuarioID || null,
        CuentaMensajeriaID: filtros?.CuentaMensajeriaID || null,
        TodasCuentas: filtros?.TodasCuentas !== false,
        FullSearch: filtros?.FullSearch || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Consultar mensajes de un contacto
  async consultarMensajes(filtros) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 50,
        CuentaMensajeriaContactoID: filtros?.CuentaMensajeriaContactoID,
        FechaInicio: filtros?.FechaInicio || null,
        FechaFin: filtros?.FechaFin || null,
        TipoMensaje: filtros?.TipoMensaje || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Enviar mensaje
  async enviarMensaje(mensaje) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        CuentaMensajeriaID: mensaje.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: mensaje.CuentaMensajeriaContactoID,
        Mensaje: mensaje.Mensaje,
        Files: mensaje.Files || [],
        TipoMensaje: mensaje.TipoMensaje || 'text',
        Token: this.global.user?.Token,
      }),
    });
  }

  // Iniciar nuevo chat
  async iniciarNuevoChat(chatData) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesNuevoChat';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        CuentaMensajeriaID: chatData.CuentaMensajeriaID,
        Telefono: chatData.Telefono,
        Nombre: chatData.Nombre,
        PlantillaComunicacionID: chatData.PlantillaComunicacionID,
        Mensaje: chatData.Mensaje,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Consultar cuentas de mensajería disponibles
  async consultarCuentasMensajeria() {
    const endpoint = '/CuentasMensajeria/CuentasMensajeriaConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: 0,
        Rows: 0,
        Sistema: false,
        Activo: true,
        UsuarioID: this.global.user?.UsuarioID,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Consultar plantillas de comunicación
  async consultarPlantillasComunicacion(cuentaMensajeriaID) {
    const endpoint = '/PlantillasComunicaciones/PlantillasComunicacionesComboConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: 0,
        Rows: 0,
        CanalComunicacionID: 2, // WhatsApp
        CuentaMensajeriaID: cuentaMensajeriaID,
        Activo: true,
        Token: this.global.user?.Token,
      }),
    }, true); // Usar API_CRM
  }

  // Consultar detalle de plantilla
  async consultarPlantillaDetalle(plantilla) {
    const endpoint = '/PlantillasComunicaciones/PlantillasComunicacionesDetalladoConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...plantilla,
        Token: this.global.user?.Token,
      }),
    }, true); // Usar API_CRM
  }

  // Asignar usuario a contacto
  async asignarUsuario(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/AsociarUsuario';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Actualizar estado de contacto
  async actualizarEstadoContacto(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/CuentasMensajeriaContactosActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Confirmar lectura de mensajes
  async confirmarLectura(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/ConfirmarLecturas';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Consultar relaciones del contacto (procesos, contratos, etc.)
  async consultarRelacionesContacto(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/ConsultaRelacionesDelContacto';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Subir archivo al CDN
  async subirArchivoAlCDN(fileData) {
    const cdnUrl = `${this.global.user?.CDNEndPoint || ''}/api/Files/UploadFile/`;
    const formData = new FormData();

    // Configurar FormData según la estructura esperada
    formData.append('file', {
      uri: fileData.uri,
      type: fileData.type,
      name: fileData.name,
    });

    const response = await fetch(cdnUrl, {
      method: 'POST',
      headers: {
        'PrivateKey': this.global.user?.CDNLlavePrivada || '',
        'PublicKey': this.global.user?.CDNLlavePublica || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Commit archivo en CDN
  async commitArchivoCDN(archivos) {
    const cdnUrl = `${this.global.user?.CDNEndPoint || ''}/api/Files/CommitFile/`;
    return this.makeRequest(cdnUrl, {
      method: 'POST',
      body: JSON.stringify({
        Files: archivos,
        PrivateKey: this.global.user?.CDNLlavePrivada,
      }),
    });
  }

  // Eliminar archivo del CDN
  async eliminarArchivoCDN(archivos) {
    const cdnUrl = `${this.global.user?.CDNEndPoint || ''}/api/Files/DeleteFile/`;
    return this.makeRequest(cdnUrl, {
      method: 'POST',
      body: JSON.stringify({
        Files: archivos,
        PrivateKey: this.global.user?.CDNLlavePrivada,
      }),
    });
  }

  // Obtener media desde WhatsApp
  async obtenerMediaWhatsApp(mediaData) {
    const endpoint = '/WhatsApp/ObtenerMediaFile';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...mediaData,
        Token: this.global.user?.Token,
      }),
    }, true); // Usar API_CRM
  }

  // === NOTIFICACIONES PUSH ===

  // Consultar notificaciones push
  async consultarNotificacionesPush(filtros) {
    const endpoint = '/NotificacionesPush/NotificacionesPushConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        UsuarioID: filtros?.UsuarioID || this.global.usuarioID,
        Visto: filtros?.Visto,
        FullSearch: filtros?.FullSearch || null,
        SortColumn: filtros?.SortColumn || null,
        SortDirection: filtros?.SortDirection || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Actualizar notificación (marcar como visto/no visto)
  async actualizarNotificacionPush(notificacion) {
    const endpoint = '/NotificacionesPush/NotificacionesPushActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Visto: notificacion.Visto,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Eliminar notificación específica
  async eliminarNotificacionPush(notificacion) {
    const endpoint = '/NotificacionesPush/NotificacionesPushEliminar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        NotificacionUsuarioID: notificacion.NotificacionUsuarioID,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Eliminar todas las notificaciones del usuario
  async eliminarTodasNotificacionesPush() {
    const endpoint = '/NotificacionesPush/NotificacionesUsuariosPushEliminar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        UsuarioID: this.global.usuarioID,
        Token: this.global.user?.Token,
      }),
    });
  }
}

export default new ChatApiService();