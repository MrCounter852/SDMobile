import { useGlobal } from '../../core/global';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import getEnvironmentConfig from '../../config/environments';

const API_BASE_COM = `${getEnvironmentConfig().BASE_URL_NS}/API_COM/api`;

const API_BASE_CRM = `${getEnvironmentConfig().BASE_URL_NS}/API_CRM/api`;

const API_BASE_SIS = `${getEnvironmentConfig().BASE_URL_NS}/API_SIS/api`;

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
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async makeRequest(endpoint, options = {}, useCRM = false, useSIS = false) {
    const baseUrl = useSIS ? API_BASE_SIS : (useCRM ? API_BASE_CRM : API_BASE_COM);
    const url = `${baseUrl}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      headers,
      ...options,
    };


    try {
      const response = await fetch(url, config);

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
        EstadosGestionContacto: filtros?.EstadosGestionContacto || [],
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

  // Consultar usuarios
  async consultarUsuarios(filtros) {
    const endpoint = '/Usuarios/UsuariosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        UsuarioID: filtros?.UsuarioID || null,
        SucursalID: filtros?.SucursalID || this.global.user?.SucursalID,
        FullSearch: filtros?.FullSearch || null,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
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

  // Marcar mensajes como leídos/no leídos
  async marcacionMensajes(contacto) {
    const endpoint = '/CuentasMensajeriaContactos/MarcacionMensajes';
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

    // Leer archivo como base64
    const base64 = await FileSystem.readAsStringAsync(fileData.uri, { encoding: FileSystem.EncodingType.Base64 });

    // Convertir base64 a byte array
    const byteArray = this.base64ToByteArray(base64);

    const payload = {
      Files: [{
        FileContent: Array.from(byteArray),
        FileName: fileData.name
      }],
      PrivateKey: this.global.user?.CDNLlavePrivada || ''
    };

    const response = await fetch(cdnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('CDN upload success:', result);
    return result;
  }

  // Convertir base64 a byte array
  base64ToByteArray(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Commit archivo en CDN
  async commitArchivoCDN(archivos) {
    const cdnUrl = `${this.global.user?.CDNEndPoint || ''}/api/Files/CommitFile/`;
    const response = await fetch(cdnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Files: archivos,
        PrivateKey: this.global.user?.CDNLlavePrivada,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Commit failed with body:', errorText);
      throw new Error(`Commit failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Eliminar archivo del CDN
  async eliminarArchivoCDN(archivos) {
    const cdnUrl = `${this.global.user?.CDNEndPoint || ''}/api/Files/DeleteFile/`;
    const response = await fetch(cdnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Files: archivos,
        PrivateKey: this.global.user?.CDNLlavePrivada,
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return response.json();
  }

  // Constants for Cache Manager
  CACHE_DIR = FileSystem.documentDirectory + 'sedi_media/';
  MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500 MB
  MAX_FILE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 Days

  /**
   * Clear all cached media files
   */
  async clearCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
        console.log('[Cache Manager] Cache cleared');
      }
    } catch (error) {
      console.error('[Cache Manager] Error clearing cache:', error);
    }
  }

  /**
   * Initialize and Clean Cache
   * Should be called on App Startup
   */
  async manageCache() {
    try {
      // 1. Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
        return; // New directory, nothing to clean
      }

      // 2. Read all files
      const files = await FileSystem.readDirectoryAsync(this.CACHE_DIR);
      if (files.length === 0) return;

      const fileStats = [];
      let totalSize = 0;
      const now = Date.now();

      // 3. Gather stats for all files
      for (const file of files) {
        const fileUri = this.CACHE_DIR + file;
        const info = await FileSystem.getInfoAsync(fileUri);

        if (info.exists) {
          // Delete if expired (Age check)
          if (now - info.modificationTime * 1000 > this.MAX_FILE_AGE) {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            console.log(`[Cache Manager] Deleted expired file: ${file}`);
          } else {
            totalSize += info.size;
            fileStats.push({
              uri: fileUri,
              size: info.size,
              time: info.modificationTime
            });
          }
        }
      }

      // 4. Delete if Total Size exceeded (Size check)
      if (totalSize > this.MAX_CACHE_SIZE) {
        // Sort by oldest first
        fileStats.sort((a, b) => a.time - b.time);

        for (const file of fileStats) {
          if (totalSize <= this.MAX_CACHE_SIZE) break;

          await FileSystem.deleteAsync(file.uri, { idempotent: true });
          totalSize -= file.size;
          console.log(`[Cache Manager] Deleted for space: ${file.uri}`);
        }
      }

      console.log(`[Cache Manager] Maintenance complete. Current size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      console.error('[Cache Manager] Error:', error);
    }
  }

  /**
   * Verifica si un archivo ya existe en el cache y retorna su URI
   * @param {string} fileName 
   * @returns {Promise<string|null>} URI si existe, null si no
   */
  async checkMediaCache(fileName) {
    try {
      const fileUri = `${this.CACHE_DIR}${fileName}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) return fileUri;
      return null;
    } catch (error) {
      console.log("Error checking cache:", error);
      return null;
    }
  }

  // Obtener media desde WhatsApp (Managed Cache)
  async obtenerMediaWhatsApp(mediaData) {
    const endpoint = '/WhatsApp/ObtenerMediaFile';
    const headers = await this.getHeaders();

    try {
      // Ensure cache dir exists
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }

      // Crear nombre de archivo único
      const fileExtension = mediaData.FileMime?.split('/')[1] || 'jpg';
      const fileName = `${mediaData.MediaID}.${fileExtension}`;
      const fileUri = `${this.CACHE_DIR}${fileName}`;

      // Verificar si el archivo ya existe en caché (Persistente)
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log('Media found in persistent cache:', fileName);
        return fileUri;
      }

      const response = await fetch(`${API_BASE_COM}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          MediaID: mediaData.MediaID,
          AccessToken: mediaData.AccessToken
        })
      });

      if (!response.ok) {
        console.error('obtenerMediaWhatsApp error:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      // Guardar el archivo usando FileSystem (Persistente)
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      // Retornar la URI local del archivo
      return fileUri;
    } catch (error) {
      console.error('Error obtaining media from WhatsApp:', error);
      throw error;
    }
  }

  // Convertir blob a base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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