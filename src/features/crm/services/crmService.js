import { useGlobal } from '../../../core/global';
import * as SecureStore from 'expo-secure-store';
import getEnvironmentConfig from '../../../config/environments';

const API_BASE_CRM = `${getEnvironmentConfig().BASE_URL_NS}/API_CRM/api`;
const API_BASE_SIS = `${getEnvironmentConfig().BASE_URL_NS}/API_SIS/api`;
const API_BASE_GBI = `${getEnvironmentConfig().BASE_URL_NS}/API_GBI/api`;
const API_BASE_STRG = `${getEnvironmentConfig().BASE_URL_NS}/API_STRG/api`;

class GestionComercialService {
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
      const erpToken = await SecureStore.getItemAsync('erpToken');
      if (erpToken) {
        return erpToken;
      }
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
    console.log(`[Service] Request to: ${url}`, options.body);
    try {
      const response = await fetch(url, config);
      console.log(`[Service] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GestionComercial API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        // Try to parse error message from API response
        let errorMessage = `Error del servidor (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.Message) {
            // Extract clean message, remove "Error de modelo:" prefix if present
            errorMessage = errorJson.Message.replace(/^Error de modelo:\s*|^Error:\s*/i, '').trim();
          }
        } catch (e) {
          // If parsing fails, use raw text
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Consultar pre-contactos por origen
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
      Token: this.global.user?.Token,
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(response => {
      // Ensure Color is set from API response
      if (response.rows && Array.isArray(response.rows)) {
        response.rows = response.rows.map(contact => ({
          ...contact,
          Color: contact.Color || contact.color || null
        }));
      }
      return response;
    });
  }

  // Consultar líneas de tiempo
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
      Token: this.global.user?.Token,
    };
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(response => {
      return response;
    });
  }

  // Consultar actividades del calendario
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
    }); // useSIS
  }

  // Consultar mi calendario
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


  // Consultar mi calendario tabla
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

  // Insertar pre-contacto
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

  // Actualizar pre-contacto
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

  // Consultar detalle de pre-contacto
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

  // Consultar estados de procesos
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

  // Consultar líneas de tiempos procesos
  async consultarProcesosLineasTiempos(filtros) {
    const endpoint = '/ProcesosLineasTiempos/ProcesosLineasTiemposEstadosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        OrigenPreContactoID: filtros?.OrigenPreContactoID,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Cambiar estado del proceso
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

  // Inviabilizar pre-contacto
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

  // Habilitar proceso (viabilizar)
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

  // Eliminar pre-contacto
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

  // Duplicar proceso comercial
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

  // Cambiar color del proceso
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

  // Mover línea de tiempo
  async moverLineaTiempo(data) {
    const endpoint = '/PreContactos/MoverLineaTiempo';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        DirIP: '0.0.0.0', // Required field (mobile doesn't have real IP)
        Usuario: this.global.user?.UsuarioID,
        Token: this.global.user?.Token,
      }),
    });
  }

  // Líneas de tiempos automáticas
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

  // Consultar combos de origen
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

  // Consultar origenes pre-contactos sucursales
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

  // Consultar asesores
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

  // Consultar formas de contacto
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

  // Consultar formas de como nos conocieron
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

  // Consultar detalles de formas de como nos conocieron
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

  // Consultar tipos de ofertas
  async consultarTiposOfertas(filtros) {
    const endpoint = '/TiposOfertas/TiposOfertasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true); // useGBI
  }

  // Consultar condiciones inmuebles
  async consultarCondicionesInmuebles() {
    const endpoint = '/CondicionesInmuebles/CondicionesInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Token: this.global.user?.Token,
      }),
    }, false, false, true); // useGBI
  }

  // Consultar tipos inmuebles
  async consultarTiposInmuebles(filtros) {
    const endpoint = '/TiposInmuebles/TiposInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true); // useGBI
  }

  // Consultar tipos avaluos
  async consultarTiposAvaluos(filtros) {
    const endpoint = '/TiposAvaluos/TiposAvaluosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, true); // useGBI
  }

  // Consultar localidades
  async consultarLocalidades(filtros) {
    const endpoint = '/Localidades/LocalidadesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        CiudadID: filtros?.CiudadID || 1204, // Bogotá
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar antiguedades inmuebles
  async consultarAntiguedadesInmuebles() {
    const endpoint = '/AntiguedadesInmuebles/AntiguedadesInmueblesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Token: this.global.user?.Token,
      }),
    }, false, false, true); // useGBI
  }

  // Consultar tipos productos (servicios)
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
    }, false, true); // useSIS
  }

  // Consultar causales inviabilidad
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

  // Consultar tipos calendario actividades
  async consultarTiposCalendarioActividades(filtros) {
    const endpoint = '/TiposCalendariosActividades/TiposCalendariosActividadesConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Insertar actividad calendario
  async insertarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesInsertar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Actualizar actividad calendario
  async actualizarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesActualizar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Cerrar actividad calendario
  async cerrarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesCerrar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Eliminar actividad calendario
  async eliminarActividadCalendario(actividad) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesEliminar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...actividad,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar actividades por fecha
  async consultarActividadesPorFecha(filtros) {
    const endpoint = '/CalendariosActividades/CalendariosActividadesConsultarPorFecha';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        UsuarioID: filtros?.UsuarioID,
        Fecha: filtros?.Fecha,
        Completada: filtros?.Completada || false,
      }),
    }, false, true); // useSIS
  }

  // Consultar cierres detalles actividades
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
    }, false, true); // useSIS
  }

  // Consultar inmuebles disponibles
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

  // Consultar complejos
  async consultarComplejos(filtros) {
    const endpoint = '/Complejos/ComplejosConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, false, false, true); // useSTRG
  }

  // Consultar ciudades combo
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
    }, false, true); // useSIS
  }

  // Consultar tipos documentos
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
    }, false, true); // useSIS
  }

  // Consultar tipos personas
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
    }, false, true); // useSIS
  }

  // Consultar responsabilidades tributarias
  async consultarResponsabilidadesTributarias(filtros) {
    const endpoint = '/ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        Page: filtros?.Page || 0,
        Rows: filtros?.Rows || 0,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar terceros detallado
  async consultarTerceroDetallado(filtros) {
    const endpoint = '/Terceros/TerceroDetalladoConsultar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        TipoDocumentoID: filtros?.TipoDocumentoID,
        Documento: filtros?.Documento,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar campos especiales pre-contactos
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

  // Consultar pre-contactos existentes
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

  // Consultar seguimientos
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
    }, false, true); // useSIS
  }

  // --- MÉTODOS ADICIONALES PARA SUB-VISTAS ---

  // Consultar cotizaciones (SIS)
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
    }, false, true); // useSIS
  }

  // Consultar cotizaciones bodegaje (STRG)
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
    }, false, false, false, true); // useSTRG
  }

  // Consultar órdenes de servicio (STRG)
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
    }, false, false, false, true); // useSTRG
  }

  // Consultar cupones de pago / pre-facturas (FAC)
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
    }, false, false, false, false, true); // useFAC
  }

  // Insertar seguimiento
  async insertarSeguimiento(seguimiento) {
    const endpoint = '/Seguimientos/SeguimientosInsertar';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...seguimiento,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar usuarios sucursales
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
    }, false, true); // useSIS
  }

  // Consultar permisos especiales usuario
  async consultarPermisosEspecialesUsuario(filtros) {
    const endpoint = '/UsuariosPermisosEspeciales/PermisoEspecialAcceso';
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        UsuarioID: filtros?.UsuarioID,
        Ruta: filtros?.Ruta,
        ModuloID: filtros?.ModuloID,
        Token: this.global.user?.Token,
      }),
    }, false, true); // useSIS
  }

  // Consultar estados de procesos
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