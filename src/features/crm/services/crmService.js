import { useGlobal } from '../../../core/global';
import getEnvironmentConfig from '../../../config/environments';
import tokenService from '../../../core/tokenService';

const API_BASE_CRM = `${getEnvironmentConfig().BASE_URL_NS}/API_CRM/api`;
const API_BASE_SIS = `${getEnvironmentConfig().BASE_URL_NS}/API_SIS/api`;
const API_BASE_GBI = `${getEnvironmentConfig().BASE_URL_NS}/API_GBI/api`;
const API_BASE_STRG = `${getEnvironmentConfig().BASE_URL_NS}/API_STRG/api`;

class GestionComercialService {
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
      console.error('Error getting token:', error);
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

  cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }

  async makeRequest(endpoint, options = {}, useCRM = true, useSIS = false, useGBI = false, useSTRG = false, useFAC = false) {
    const API_BASE_FAC = `${getEnvironmentConfig().BASE_URL_NS}/API_FAC/api`;
    let baseUrl = API_BASE_CRM;
    if (useSIS) baseUrl = API_BASE_SIS;
    else if (useGBI) baseUrl = API_BASE_GBI;
    else if (useSTRG) baseUrl = API_BASE_STRG;
    else if (useFAC) baseUrl = API_BASE_FAC;

    const url = `${baseUrl}${endpoint}`;
    const headers = await this.getHeaders();
    const config = {
      headers,
      ...options,
    };

    if (config.body) {
      try {
        const bodyObj = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        config.body = JSON.stringify(this.cleanObject(bodyObj));
      } catch (e) {
      }
    }


    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GestionComercial API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
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

        let errorMessage = `Error del servidor (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.Message) {
            errorMessage = errorJson.Message.replace(/^Error de modelo:\s*|^Error:\s*/i, '').trim();
          }
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      const SignalRService = require('../../chat/services/signalrService').default;
      const isConnected = await SignalRService.ping();
      if (!isConnected) {
        await tokenService.triggerConnectionRecovery();
      }
      
      throw error;
    }
  }

  async consultarPreContactos(filtros) {
    let endpoint = '/PreContactos/PreContactosPorOrigenConsultar';
    if (filtros.OrigenPreContactoID == 2) {
      endpoint = '/Inmuebles/ProcesosPropietariosConsultar/';
    } else if (filtros.OrigenPreContactoID == 4) {
      endpoint = '/Inmuebles/ProcesosArrendatariosConsultar';
    } else if (filtros.OrigenPreContactoID == 5) {
      endpoint = '/Inmuebles/ProcesosVentasGBIConsultar/';
    } else if (filtros.OrigenPreContactoID == 7) {
      endpoint = '/PreContactos/PreContactosAvaluosConsultar/';
    }
    const estadoProcesoID = filtros && 'EstadoProcesoID' in filtros ? filtros.EstadoProcesoID : "1,4";
    const estadoProcesoNombre = estadoProcesoID === "1,4" ? "Nuevo y En gestión" : (estadoProcesoID || "Todos");
    const body = {
      Page: filtros?.Page ?? 1,
      Rows: filtros?.Rows ?? 30,
      OrigenPreContactoID: filtros?.OrigenPreContactoID ?? null,
      EstadoGeneral: filtros?.EstadoGeneral ?? null,
      TipoAvaluoID: filtros?.TipoAvaluoID ?? null,
      AsesorID: filtros && 'AsesorID' in filtros ? filtros.AsesorID : (this.global.asesorID ?? null),
      Asesor: filtros && 'Asesor' in filtros ? filtros.Asesor : (this.global.user?.NombreCompleto ?? null),
      EstadoProcesoID: estadoProcesoID,
      EstadoProcesoNombre: estadoProcesoNombre,
      SucursalID: filtros && 'SucursalID' in filtros ? filtros.SucursalID : (this.global.user?.SucursalID ?? null),
      SucursalNombre: filtros && 'SucursalNombre' in filtros ? filtros.SucursalNombre : (this.global.user?.NombreSucursal ?? null),
      Color: filtros?.Color ?? "null",
      FechaInicial: filtros?.FechaInicial ?? null,
      FechaFinal: filtros?.FechaFinal ?? null,
      FullSearch: filtros?.FullSearch ?? null,
      SortColumn: filtros?.SortColumn ?? null,
      SortDirection: filtros?.SortDirection ?? null,
      NombreCompleto: filtros?.NombreCompleto ?? null,
      Documento: filtros?.Documento ?? null,
      Telefono: filtros?.Telefono ?? null,
      Celular: filtros?.Celular ?? null,
      Email: filtros?.Email ?? null,
      ClienteNombreCompleto: filtros?.ClienteNombreCompleto ?? null,
      FormaContactoID: filtros?.FormaContactoID ?? null,
      FechaInicialCierre: filtros?.FechaInicialCierre ?? null,
      FechaFinalCierre: filtros?.FechaFinalCierre ?? null,
      FechaInicialPosibleServicio: filtros?.FechaInicialPosibleServicio ?? null,
      FechaFinalPosibleServicio: filtros?.FechaFinalPosibleServicio ?? null,
      Token: this.global.user?.Token,
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(response => {
      if (response.rows && Array.isArray(response.rows)) {
        response.rows = response.rows.map(contact => ({
          ...contact,
          Color: contact.Color || contact.color || null
        }));
      }
      return response;
    });
  }

  async consultarLineasTiempo(filtros) {
    const estadoProcesoID = filtros && 'EstadoProcesoID' in filtros ? filtros.EstadoProcesoID : "1,4";
    const estadoProcesoNombre = estadoProcesoID === "1,4" ? "Nuevo y En gestión" : (estadoProcesoID || "");
    const endpoint = '/PreContactos/LineasTiemposConsultar';
    const body = {
      Page: filtros?.Page ?? 1,
      Rows: filtros?.Rows ?? 15,
      OrigenPreContactoID: filtros?.OrigenPreContactoID ?? null,
      EstadoProcesoID: estadoProcesoID,
      EstadoProcesoNombre: estadoProcesoNombre,
      AsesorID: filtros && 'AsesorID' in filtros ? filtros.AsesorID : (this.global.asesorID ?? null),
      SucursalID: filtros?.SucursalID ?? null,
      FechaInicial: filtros?.FechaInicial ?? null,
      FechaFinal: filtros?.FechaFinal ?? null,
      FullSearch: filtros?.FullSearch ?? null,
      ProcesoLineaTiempoID: filtros?.ProcesoLineaTiempoID ?? null,
      EstadoGeneral: filtros?.EstadoGeneral ?? null,
      NombreCompleto: filtros?.NombreCompleto ?? null,
      Documento: filtros?.Documento ?? null,
      Telefono: filtros?.Telefono ?? null,
      Celular: filtros?.Celular ?? null,
      Email: filtros?.Email ?? null,
      ClienteNombreCompleto: filtros?.ClienteNombreCompleto ?? null,
      FormaContactoID: filtros?.FormaContactoID ?? null,
      FechaInicialCierre: filtros?.FechaInicialCierre ?? null,
      FechaFinalCierre: filtros?.FechaFinalCierre ?? null,
      FechaInicialPosibleServicio: filtros?.FechaInicialPosibleServicio ?? null,
      FechaFinalPosibleServicio: filtros?.FechaFinalPosibleServicio ?? null,
      Token: this.global.user?.Token,
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(response => {
      return response;
    });
  }

  async consultarActividadesCalendario(filtros) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesConsultar';
    const body = {
      Page: filtros?.Page || 0,
      Rows: filtros?.Rows || 0,
      CalendarioActividadOrigenID: filtros?.CalendarioActividadOrigenID || 2,
      CodigoOrigen: filtros?.CodigoOrigen || null,
      Completada: filtros?.Completada || null,
      Token: this.global.user?.Token,
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, false, true).then(response => {
      return response;
    });
  }

  async consultarMiCalendario(filtros) {
    const endpoint = '/CalendariosActividades/MiCalendarioConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        EstadoActividadID: filtros && 'EstadoActividadID' in filtros ? filtros.EstadoActividadID : "3,4",
        SucursalID: filtros?.SucursalID ?? null,
        TipoCalendarioActividadID: filtros?.TipoCalendarioActividadID ?? null,
        UsuarioID: filtros?.UsuarioID ?? null,
        Usuario: this.global.user?.NombreCompleto ?? null,
        EmpresaID: filtros?.EmpresaID ?? (this.global.empresa?.EmpresaID || this.global.user?.EmpresaID || null),
        AnoCalendario: filtros?.AnoCalendario ?? null,
        MesCalendario: filtros?.MesCalendario ?? null,
        SemanaCalendario: filtros?.SemanaCalendario ?? null,
        DiaCalendario: filtros?.DiaCalendario ?? null,
        ModoCalendar: filtros?.ModoCalendar ?? null,
        Token: this.global.user?.Token,
      }),
    }, true, false);
  }


  async consultarMiCalendarioTabla(filtros) {
    const endpoint = '/CalendariosActividades/MiCalendarioTablaConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page ?? 1,
        Rows: filtros?.Rows ?? 100,
        EstadoActividadID: filtros && 'EstadoActividadID' in filtros ? filtros.EstadoActividadID : "3,4",
        SucursalID: filtros && 'SucursalID' in filtros ? filtros.SucursalID : (this.global.user?.SucursalID ?? null),
        TipoCalendarioActividadID: filtros?.TipoCalendarioActividadID ?? null,
        UsuarioID: filtros?.UsuarioID ?? null,
        Usuario: filtros?.Usuario ?? (this.global.user?.NombreCompleto ?? null),
        EmpresaID: null,
        FechaInicial: filtros?.FechaInicial ?? null,
        FechaFinal: filtros?.FechaFinal ?? null,
        Fecha: filtros?.Fecha ?? null,
        FullSearch: filtros?.FullSearch ?? null,
        SortColumn: filtros?.SortColumn ?? null,
        SortDirection: filtros?.SortDirection ?? null,
        Token: this.global.user?.Token,
      }),
    });
  }

  async insertarPreContacto(contacto) {
    const endpoint = '/PreContactos/PreContactosInsertar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async actualizarPreContacto(contacto) {
    const endpoint = '/PreContactos/PreContactosActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarPreContactoDetallado(filtros) {
    const endpoint = '/PreContactos/PreContatoDetalladoConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ProcesoID: filtros?.ProcesoID,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarEstadosProcesos(filtros) {
    const endpoint = '/PreContactos/EstadosProcesosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        EstadoProcesoID: filtros?.EstadoProcesoID || null,
        Nombre: filtros?.Nombre || null,
        Token: this.global.user?.Token,
      }),
    }).then(response => {
      return response;
    });
  }

  async consultarProcesosLineasTiempos(filtros) {
    const endpoint = '/ProcesosLineasTiempos/ProcesosLineasTiemposEstadosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        OrigenPreContactoID: filtros?.OrigenPreContactoID,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async cambiarEstadoProceso(proceso) {
    const endpoint = '/PreContactos/CambiarEstadoDelProceso';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...proceso,
        Token: this.global.user?.Token,
      }),
    });
  }

  async inviabilizarPreContacto(contacto) {
    const endpoint = '/PreContactos/PreContactosInviabilizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async habilitarProceso(contacto) {
    const endpoint = '/PreContactos/HabilitarProceso';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async eliminarPreContacto(contacto) {
    const endpoint = '/PreContactos/PreContactosEliminar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async duplicarProcesoComercial(contacto) {
    const endpoint = '/PreContactos/DuplicarProcesoComercial';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async cambiarColorProceso(contacto) {
    const endpoint = '/PreContactos/CambiarColorProceso';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...contacto,
        Token: this.global.user?.Token,
      }),
    });
  }

  async moverLineaTiempo(data) {
    const endpoint = '/PreContactos/MoverLineaTiempo';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        DirIP: '0.0.0.0',
        Usuario: this.global.user?.UsuarioID,
        Token: this.global.user?.Token,
      }),
    });
  }

  async lineasTiemposAutomaticas(data) {
    const endpoint = '/PreContactos/LineasTiemposAutomaticas';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarCombosOrigenes(origenID) {
    const endpoint = '/CamposPreContactos/ConfiguracionCamposPrecontactosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        OrigenPreContactoID: origenID,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarOrigenesPreContactosSucursales(filtros) {
    const endpoint = '/OrigenesPreContactosSucursales/OrigenesPreContactosSucursalesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        SucursalID: filtros?.SucursalID,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarAsesores(filtros) {
    const endpoint = '/Asesores/AsesoresConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        AsesorID: filtros?.AsesorID || null,
        SucursalID: filtros?.SucursalID || null,
        NombreCompleto: filtros?.NombreCompleto || null,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarFormasContacto(filtros) {
    const endpoint = '/FormasFormasContactos/FormasContactosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        FormaContactoID: filtros?.FormaContactoID || null,
        SucursalID: filtros?.SucursalID || null,
        Nombre: filtros?.Nombre || null,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarFormasComoNosConocio(filtros) {
    const endpoint = '/FormasComoNosConocio/FormasComoNosConocioConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        FormaComoNosConocioID: filtros?.FormaComoNosConocioID || null,
        SucursalID: filtros?.SucursalID || null,
        Descripcion: filtros?.Descripcion || null,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarFormasComoNosConocioDetalles(filtros) {
    const endpoint = '/FormasComoNosConocioDetalles/FormasComoNosConocioDetallesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        FormaComoNosConocioDetalleID: filtros?.FormaComoNosConocioDetalleID || null,
        FormaComoNosConocioID: filtros?.FormaComoNosConocioID || null,
        Nombre: filtros?.Nombre || null,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarTiposOfertas(filtros) {
    const endpoint = '/TiposOfertas/TiposOfertasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true);
  }

  async consultarCondicionesInmuebles() {
    const endpoint = '/CondicionesInmuebles/CondicionesInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Token: this.global.user?.Token,
      }),
    }, false, false, true);
  }

  async consultarTiposInmuebles(filtros) {
    const endpoint = '/TiposInmuebles/TiposInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true);
  }

  async consultarTiposAvaluos(filtros) {
    const endpoint = '/TiposAvaluos/TiposAvaluosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true);
  }

  async consultarLocalidades(filtros) {
    const endpoint = '/Localidades/LocalidadesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        CiudadID: filtros?.CiudadID || 1204,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarAntiguedadesInmuebles() {
    const endpoint = '/AntiguedadesInmuebles/AntiguedadesInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Token: this.global.user?.Token,
      }),
    }, false, false, true);
  }

  async consultarTiposProductos(filtros) {
    const endpoint = '/TiposProductos/TiposProductosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        SucursalID: filtros?.SucursalID || null,
        Nombre: filtros?.Nombre || null,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarCausalesInviabilidad(filtros) {
    const endpoint = '/CausalesInviabilidad/CausalesInviabilidadConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        Nombre: filtros?.Nombre || null,
        Activo: filtros?.Activo !== false,
        SucursalID: filtros?.SucursalID || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarTiposCalendarioActividades(filtros) {
    const endpoint = '/TiposCalendariosActividades/TiposCalendariosActividadesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async insertarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesInsertar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async actualizarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async cerrarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesCerrar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async eliminarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesEliminar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarActividadesPorFecha(filtros) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesConsultarPorFecha';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        UsuarioID: filtros?.UsuarioID,
        Fecha: filtros?.Fecha,
        Completada: filtros?.Completada || false,
      }),
    }, false, true);
  }

  async consultarCalendariosActividadesCierresDetalles(filtros) {
    const endpoint = '/CalendariosActividadesCierresDetalles/CalendariosActividadesCierresDetallesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        CalendarioActividadCierreDetalleID: filtros?.CalendarioActividadCierreDetalleID || null,
        Nombre: filtros?.Nombre || null,
        SucursalID: filtros?.SucursalID || null,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarInmueblesDisponibles(filtros) {
    const endpoint = '/Inmuebles/InmueblesDisponiblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        TipoOfertaID: filtros?.TipoOfertaID || null,
        InmuebleID: filtros?.InmuebleID || null,
        SucursalID: filtros?.SucursalID || null,
        FullSearch: filtros?.FullSearch || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarComplejos(filtros) {
    const endpoint = '/Complejos/ComplejosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, false, true);
  }

  async consultarCiudadesCombo(filtros) {
    const endpoint = '/Ciudades/CiudadesComboConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        CiudadID: filtros?.CiudadID || null,
        Nombre: filtros?.Nombre || null,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarTiposDocumentos(filtros) {
    const endpoint = '/TipoDocumentos/TipoDocumentosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarTiposPersonas(filtros) {
    const endpoint = '/TipoPersonas/TipoPersonasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarResponsabilidadesTributarias(filtros) {
    const endpoint = '/ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarTerceroDetallado(filtros) {
    const endpoint = '/Terceros/TerceroDetalladoConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        TipoDocumentoID: filtros?.TipoDocumentoID,
        Documento: filtros?.Documento,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarCamposEspecialesPreContactos(filtros) {
    const endpoint = '/CamposPreContactos/CamposEspecialesPreContactosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        ID: filtros?.ID || null,
        CampoPreContactoID: filtros?.CampoPreContactoID || null,
        FullSearch: filtros?.FullSearch || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarPreContactosExistentes(filtros) {
    const endpoint = '/PreContactos/PreContactosExistentesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Nombres: filtros?.Nombres || null,
        Apellidos: filtros?.Apellidos || null,
        Email: filtros?.Email || null,
        Celular: filtros?.Celular || null,
        SucursalID: filtros?.SucursalID || null,
        Token: this.global.user?.Token,
      }),
    });
  }

  async consultarSeguimientos(filtros) {
    const endpoint = '/Seguimientos/SeguimientosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 20,
        OrigenID: filtros?.OrigenID || null,
        OrigenSeguimientoID: filtros?.OrigenSeguimientoID || null,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarCotizaciones(filtros) {
    const endpoint = '/Cotizaciones/CotizacionesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 30,
        ...filtros,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarCotizacionesBodegaje(filtros) {
    const endpoint = '/CotizacionesBodegaje/CotizacionesBodegajeConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 30,
        ...filtros,
        Token: this.global.user?.Token,
      }),
    }, false, false, false, true); 
  }

  async consultarOrdenesServicio(filtros) {
    const endpoint = '/OrdenesServiciosBodegaje/OrdenesServiciosBodegajeConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 30,
        ...filtros,
        Token: this.global.user?.Token,
      }),
    }, false, false, false, true);
  }

  async consultarCuponesPago(filtros) {
    const endpoint = '/PreFacturas/PreFacturasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 1,
        Rows: filtros?.Rows || 30,
        ...filtros,
        Token: this.global.user?.Token,
      }),
    }, false, false, false, false, true);
  }

  async insertarSeguimiento(seguimiento) {
    const endpoint = '/Seguimientos/SeguimientosInsertar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...seguimiento,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarSucursalesUsuarios(filtros) {
    const endpoint = '/Usuarios/SucursalesUsuariosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        SucursalID: filtros?.SucursalID || null,
        UsuarioID: filtros?.UsuarioID || null,
        Nombre: filtros?.Nombre || null,
        Activo: filtros?.Activo !== false,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async consultarPermisosEspecialesUsuario(filtros) {
    const endpoint = '/UsuariosPermisosEspeciales/PermisoEspecialAcceso';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        UsuarioID: filtros?.UsuarioID || this.global.user?.UsuarioID,
        Ruta: filtros?.Ruta || '/CRM/PreContactos/Gestion',
        ModuloID: filtros?.ModuloID || 8,
        Token: this.global.user?.Token,
      }),
    }, false, true);
  }

  async loadCrmPermissions() {
    try {
      const response = await this.consultarPermisosEspecialesUsuario();
      if (response && response.rows) {
        const mapping = {
          1: 'FiltroSucursal',
          2: 'FiltroAsesor',
          3: 'Asignable',
          4: 'PermiteEdicionInmueble',
          5: 'PermiteEliminarActividades',
          6: 'PermitePublicacionPortales',
          7: 'EliminacionLeads',
          8: 'EliminacionInmuebles',
          9: 'PermiteEdicionActividades',
          10: 'EdicionEstadoProceso',
          11: 'EdicionLineaTiempo',
          // 12 no implementado en sedi aún
          13: 'PermiteQuitarFirmaActa',
          14: 'PermiteQuitarInventario',
          15: 'PermiteCargarInventario',
          16: 'PermiteEditarOrdenServicio',
        };

        const mappedPermissions = {};
        response.rows.forEach(item => {
          const key = mapping[item.PermisoEspecialMenuID];
          if (key) {
            mappedPermissions[key] = item.Acceso === true;
          }
        });


        this.global.setPermisos(mappedPermissions);
        return mappedPermissions;
      }
      return {};
    } catch (error) {
      console.error('[CRM Service] Error loading permissions:', error);
      return {};
    }
  }

  async consultarEstadosProcesos(filtros = {}) {
    const endpoint = '/PreContactos/EstadosProcesosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Token: this.global.user?.Token,
        ...filtros
      }),
    });
  }
}

export default new GestionComercialService();