import { useGlobal } from '../../../core/global';
import getEnvironmentConfig from '../../../config/environments';
import tokenService from '../../../core/tokenService';

const env = getEnvironmentConfig();

const BASE_HOST = env.BASE_URL_NS;

const API_BASES = {
  COM: `${BASE_HOST}/API_COM/api`,
  CRM: `${BASE_HOST}/API_CRM/api`,
  SIS: `${BASE_HOST}/API_SIS/api`,
  GBI: `${BASE_HOST}/API_GBI/api`,
};
class LeadService {
  constructor() {
    this.global = useGlobal.getState();
    useGlobal.subscribe((state) => {
      this.global = state;
    });
  }

  async getStoredToken() {
    try {
      return await tokenService.getValidToken();
    } catch (error) {
      console.error('LeadService:getStoredToken', error);
      return '';
    }
  }

  async getHeaders() {
    const token = await this.getStoredToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async makeRequest(endpoint, { body = {}, method = 'POST', api = 'CRM' } = {}) {
    const baseUrl = API_BASES[api.toUpperCase()] || API_BASES.CRM;
    const headers = await this.getHeaders();
    const config = {
      method,
      headers,
    };

    if (method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('LeadService:makeRequest error', {
          status: response.status,
          endpoint: url,
          errorText,
        });

        if (response.status === 401 || response.status === 403) {
          const shouldRetry = await tokenService.handleApiError(null, response.status);
          if (shouldRetry) {
            const newHeaders = await this.getHeaders();
            config.headers = newHeaders;
            const retryResponse = await fetch(url, config);
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        }

        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('LeadService:makeRequest exception', error);
      
      const SignalRService = require('../../chat/services/signalrService').default;
      const isConnected = await SignalRService.ping();
      if (!isConnected) {
        await tokenService.triggerConnectionRecovery();
      }
      
      throw error;
    }
  }

  withToken(payload = {}) {
    return {
      ...payload,
      Token: this.global.user?.Token,
    };
  }

  normalizeList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.rows)) return response.rows;
    if (Array.isArray(response.data)) return response.data;
    return [];
  }

  async consultarOrigenesPreContactos() {
    const response = await this.makeRequest('/OrigenesPreContactosSucursales/OrigenesPreContactosSucursalesConsultar', {
      body: this.withToken({
        SucursalID: this.global.user?.SucursalID,
        Page: 0,
        Rows: 0,
      }),
      api: 'CRM',
    });
    return this.normalizeList(response);
  }

  async consultarFormasContacto(nombre = '') {
    const response = await this.makeRequest('/FormasFormasContactos/FormasContactosConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: nombre,
        Activo: true,
        SucursalID: this.global.user?.SucursalID,
      }),
      api: 'CRM',
    });
    return this.normalizeList(response);
  }

  async consultarFormasComoNosConocio(term = '') {
    const response = await this.makeRequest('/FormasComoNosConocio/FormasComoNosConocioConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Activo: true,
        Descripcion: term,
        SucursalID: this.global.user?.SucursalID,
      }),
      api: 'CRM',
    });
    return this.normalizeList(response);
  }

  async consultarFormasComoNosConocioDetalles(formId, term = '') {
    if (!formId) {
      return [];
    }
    const response = await this.makeRequest('/FormasComoNosConocioDetalles/FormasComoNosConocioDetallesConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Activo: true,
        FormaComoNosConocioID: formId,
        Nombre: term,
      }),
      api: 'CRM',
    });
    return this.normalizeList(response);
  }

  async consultarAsesores(options = '') {
    const isObject = typeof options === 'object' && options !== null;
    const nombreCompleto = isObject ? (options.NombreCompleto ?? '') : options;
    const rows = isObject ? (options.Rows ?? 20) : 20;
    const sucursalID = isObject ? (options.SucursalID ?? this.global.user?.SucursalID) : this.global.user?.SucursalID;

    const response = await this.makeRequest('/Asesores/AsesoresConsultar', {
      body: this.withToken({
        Rows: rows,
        Page: 1,
        Activo: true,
        NombreCompleto: nombreCompleto,
        SucursalID: sucursalID,
      }),
      api: 'CRM',
    });
    return this.normalizeList(response);
  }

  async consultarInmueblesDisponibles(filters = {}) {
    const response = await this.makeRequest('/Inmuebles/InmueblesDisponiblesConsultar', {
      body: this.withToken({
        Rows: filters.Rows || 0,
        Page: filters.Page || 0,
        TipoOfertaID: filters.TipoOfertaID ?? null,
        InmuebleID: filters.InmuebleID ?? null,
        SucursalID: filters.SucursalID || this.global.user?.SucursalID,
        FullSearch: filters.FullSearch || null,
      }),
      api: 'CRM',
    });
    const mapDescripcion = (item) => {
      const parts = [];
      if (item.Consecutivo != null) parts.push(`Inmueble Nro. ${item.Consecutivo}`);
      if (item.TipoInmuebleNombre) parts.push(item.TipoInmuebleNombre);
      if (item.Direccion) parts.push(item.Direccion.trim());
      if (item.EstadoInmuebleNombre) parts.push(item.EstadoInmuebleNombre);
      const valorCanon = Number(item.ValorCanon || 0);
      const valorVenta = Number(item.ValorVenta || 0);
      if (valorCanon) parts.push(`Canon $${valorCanon.toLocaleString('es-CO')}`);
      if (!valorCanon && valorVenta) parts.push(`Venta $${valorVenta.toLocaleString('es-CO')}`);
      return {
        ...item,
        Descripcion: parts.join(' • ') || `Inmueble Nro. ${item.Consecutivo ?? item.InmuebleID}`,
      };
    };
    return this.normalizeList(response).map(mapDescripcion);
  }

  async consultarTiposOfertas(term = '') {
    const response = await this.makeRequest('/TiposOfertas/TiposOfertasConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'GBI',
    });
    return this.normalizeList(response);
  }

  async consultarCondicionesInmueble(term = '') {
    const response = await this.makeRequest('/CondicionesInmuebles/CondicionesInmueblesConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'GBI',
    });
    return this.normalizeList(response);
  }

  async consultarTiposInmueble(term = '') {
    const response = await this.makeRequest('/TiposInmuebles/TiposInmueblesConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'GBI',
    });
    return this.normalizeList(response);
  }

  async consultarAntiguedadesInmueble(term = '') {
    const response = await this.makeRequest('/AntiguedadesInmuebles/AntiguedadesInmueblesConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'GBI',
    });
    return this.normalizeList(response);
  }

  async consultarTiposAvaluos(term = '') {
    const response = await this.makeRequest('/TiposAvaluos/TiposAvaluosConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'GBI',
    });
    return this.normalizeList(response);
  }

  async consultarLocalidades({ ciudadId = 1204, term = '' } = {}) {
    const response = await this.makeRequest('/Localidades/LocalidadesConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        CiudadID: ciudadId,
        Nombre: term,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async consultarCiudades(term = '') {
    const response = await this.makeRequest('/Ciudades/CiudadesComboConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async consultarTiposProductos(term = '') {
    const response = await this.makeRequest('/TiposProductos/TiposProductosConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
        SucursalID: this.global.user?.SucursalID,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async consultarTiposDocumentos(term = '') {
    const response = await this.makeRequest('/TipoDocumentos/TipoDocumentosConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
        Activo: true,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async consultarTiposPersonas() {
    const response = await this.makeRequest('/TipoPersonas/TipoPersonasConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Activo: true,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async consultarResponsabilidadesTributarias(term = '') {
    const response = await this.makeRequest('/ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar', {
      body: this.withToken({
        Rows: 0,
        Page: 0,
        Nombre: term,
      }),
      api: 'SIS',
    });
    return this.normalizeList(response);
  }

  async buscarTercero({ tipoDocumentoId, documento }) {
    if (!tipoDocumentoId || !documento) {
      throw new Error('Tipo de documento y documento son obligatorios');
    }
    const response = await this.makeRequest('/Terceros/TerceroDetalladoConsultar', {
      body: this.withToken({
        TipoDocumentoID: tipoDocumentoId,
        Documento: documento,
      }),
      api: 'SIS',
    });
    return response?.data || response;
  }

  async crearPreContacto(precontacto) {
    const response = await this.makeRequest('/PreContactos/PreContactosInsertar', {
      body: this.withToken(precontacto),
      api: 'CRM',
    });
    return response;
  }

  async actualizarPreContacto(precontacto) {
    const response = await this.makeRequest('/PreContactos/PreContactosActualizar', {
      body: this.withToken(precontacto),
      api: 'CRM',
    });
    return response;
  }

  async consultarRelacionesContacto(contacto) {
    const response = await this.makeRequest('/CuentasMensajeriaContactos/ConsultaRelacionesDelContacto', {
      body: this.withToken(contacto),
      api: 'COM',
    });
    return response?.data || response;
  }

  async consultarCombosOrigenes(origenID) {
    const response = await this.makeRequest('/CamposPreContactos/ConfiguracionCamposPrecontactosConsultar', {
      body: this.withToken({
        OrigenPreContactoID: origenID,
      }),
      api: 'CRM',
    });

    return this.normalizeList(response);
  }
}

export default new LeadService();
