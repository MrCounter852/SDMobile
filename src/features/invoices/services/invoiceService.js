import { useGlobal } from '../../../core/global';
import * as SecureStore from 'expo-secure-store';
import getEnvironmentConfig from '../../../config/environments';

const API_BASE_FAC = `${getEnvironmentConfig().BASE_URL_NS}/API_FAC/api`;
const API_BASE_FIN = `${getEnvironmentConfig().BASE_URL_NS}/API_FIN/api`;
const API_BASE_SIS = `${getEnvironmentConfig().BASE_URL_NS}/API_SIS/api`;

class FacturasCompraService {
  constructor() {
    this.global = useGlobal.getState();
    useGlobal.subscribe((state) => {
      this.global = state;
    });
  }

  async getStoredToken() {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      return accessToken || '';
    } catch (error) {
      console.error('Error getting stored token:', error);
      return '';
    }
  }

  async getHeaders() {
    const token = await this.getStoredToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  }

  async makeRequest(endpoint, options = {}, useFIN = false, useSIS = false) {
    let baseUrl = API_BASE_FAC;
    if (useFIN) baseUrl = API_BASE_FIN;
    else if (useSIS) baseUrl = API_BASE_SIS;

    const url = `${baseUrl}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      headers,
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (e) {
          errorBody = "Could not read error body";
        }
        


        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async consultarFacturasPendientes(filtros) {
    const body = {
      Page: filtros.Page || 1,
      Rows: filtros.Rows || 15,
      Token: this.global.user?.Token,
      FullSearch: filtros.FullSearch || undefined,
      EstadoAprobacionFacturaCompraID: filtros.EstadoAprobacionFacturaCompraID || 1,
      UsuarioID: this.global.user?.UsuarioID,
      TerceroID: filtros.TerceroID || null,
      SortColumn: filtros.SortColumn || "FechaRegistro",
      SortDirection: filtros.SortDirection || "DESC"
    };

    return this.makeRequest('/FacturasCompra/FacturasCompraPendientesAprobarConsultar', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async consultarFacturaDetalle(facturaCompraID, facturaCompraAprobacionJerarquiaID) {
    const body = {
      FacturaCompraID: facturaCompraID,
      FacturaCompraAprobacionJerarquiaID: facturaCompraAprobacionJerarquiaID,
      UsuarioID: this.global.user?.UsuarioID,
      Token: this.global.user?.Token
    };

    return this.makeRequest('/FacturasCompra/FacturaCompraAprobacionInternaConsultar', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async aprobarFactura(facturaData) {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const payload = {
      ...facturaData,
      Usuario: this.global.user?.UsuarioID,
      UsuarioID: this.global.user?.UsuarioID,
      Token: this.global.user?.Token,
      Fecha: formattedDate,
      FacturasCompraReferencias: facturaData.FacturasCompraReferencias || [],
      FacturasCompraAdjuntos: facturaData.FacturasCompraAdjuntos || [],
    };



    return this.makeRequest('/FacturasCompra/FacturasCompraAprobar', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async consultarTerceros(term) {
    const body = {
      Page: 1,
      Rows: 20,
      Search: term,
      Token: this.global.user?.Token,
      Financiero: true
    };

    return this.makeRequest('/Terceros/ComboTercerosConsultar', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true);
  }

  async consultarCentrosCostos(term, page = 1) {
    const body = {
      Page: page,
      Rows: 20,
      CodigoNombre: term || null,
      CentroCostoID: null,
      Token: this.global.user?.Token
    };

    return this.makeRequest('/CentrosCostos/CentrosCostosPlanoConsultar', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true);
  }

  async asignarCentroCosto(data) {
    return this.makeRequest('/FacturasCompra/AsignacionCentroCostoFacturasCompra', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        Token: this.global.user?.Token,
        UsuarioID: this.global.user?.UsuarioID
      }),
    });
  }

  async consultarSeguimientos(facturaCompraID) {
    const body = {
      Page: 1,
      Rows: 50,
      OrigenID: facturaCompraID,
      OrigenSeguimientoID: "FAC-COM",
      Token: this.global.user?.Token
    };

    return this.makeRequest('/Seguimientos/SeguimientosConsultar', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false, true); // useSIS
  }

  async insertarSeguimiento(facturaCompraID, comentario) {
    const body = {
      OrigenID: facturaCompraID,
      OrigenSeguimientoID: "FAC-COM",
      Comentario: comentario,
      Token: this.global.user?.Token,
      UsuarioID: this.global.user?.UsuarioID
    };

    return this.makeRequest('/Seguimientos/SeguimientosInsertar', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false, true); // useSIS
  }

  getAttachmentUrl(adjuntoID) {
    const baseUrl = getEnvironmentConfig().BASE_URL_NS;
    const token = this.global.user?.Token;
    return `${baseUrl}/API_FAC/api/FacturasCompra/FacturaCompraAdjuntoDescargar?Token=${token}&FacturaCompraAdjuntoID=${adjuntoID}`;
  }

}

export default new FacturasCompraService();
