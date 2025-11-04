import { useGlobal } from './global';

const API_BASE_COM = 'https://tu-api-crm.com/api/COM'; // Reemplaza con tu URL real
const API_BASE_CRM = 'https://tu-api-crm.com/api/CRM'; // Reemplaza con tu URL real

class ChatApiService {
  constructor() {
    this.global = useGlobal.getState();
  }

  getHeaders() {
    const { user } = this.global;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user?.Token || ''}`,
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_COM}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      body: JSON.stringify(filtros),
    });
  }

  // Consultar mensajes de un contacto
  async consultarMensajes(filtros) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(filtros),
    });
  }

  // Enviar mensaje
  async enviarMensaje(mensaje) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(mensaje),
    });
  }

  // Iniciar nuevo chat
  async iniciarNuevoChat(chatData) {
    const endpoint = '/CuentasMensajeriaMensajes/CuentasMensajeriaMensajesNuevoChat';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(chatData),
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
        UsuarioID: this.global.usuarioID,
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
      }),
    });
  }

  // Consultar detalle de plantilla
  async consultarPlantillaDetalle(plantilla) {
    const endpoint = '/PlantillasComunicaciones/PlantillasComunicacionesDetalladoConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(plantilla),
    });
  }

  // Asignar usuario a contacto
  async asignarUsuario(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/AsociarUsuario';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(contacto),
    });
  }

  // Actualizar estado de contacto
  async actualizarEstadoContacto(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/CuentasMensajeriaContactosActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(contacto),
    });
  }

  // Confirmar lectura de mensajes
  async confirmarLectura(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/ConfirmarLecturas';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(contacto),
    });
  }

  // Consultar relaciones del contacto (procesos, contratos, etc.)
  async consultarRelacionesContacto(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/ConsultaRelacionesDelContacto';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(contacto),
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
      body: JSON.stringify(mediaData),
    });
  }
}

export default new ChatApiService();