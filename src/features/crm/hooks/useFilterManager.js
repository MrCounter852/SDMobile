import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGlobal } from '../../../core/global';
import { FILTER_OPTIONS } from '../components/FilterConstants';
import crmService from '../services/crmService';

/**
 * Custom hook for managing CRM filters
 * 
 * Encapsulates all filter-related logic:
 * - Filter state management
 * - Active filter tags generation
 * - Filter application/clearing
 * - Filter data loading (lazy)
 * 
 * Features:
 * - Optimized memoization
 * - Lazy loading of filter data
 * - Automatic mode detection
 * - Clean filter tag generation
 * 
 * @param {string} mode - Current view mode ('table', 'timeline', 'calendar')
 * @returns {object} Filter state and methods
 */
const useFilterManager = (mode = 'table') => {
  const { user } = useGlobal();

  // Filter state
  const [searchFilters, setSearchFilters] = useState({
    OrigenPreContactoID: null,
    EstadoProcesoID: "1,4",
    FechaInicial: null,
    FechaFinal: null,
    FullSearch: "",
    EstadoGeneral: null,
    EstadoActividadID: "3,4",
    TipoCalendarioActividadID: null,
    AsesorID: user?.AsesorID || null,
    NombreCompleto: "",
    FormaContactoID: null,
    FechaInicialCierre: null,
    FechaFinalCierre: null,
    ClienteNombreCompleto: "",
    Documento: "",
    Telefono: "",
    Celular: "",
    Email: "",
    SucursalID: user?.SucursalID || null,
    FechaInicialPosibleServicio: null,
    FechaFinalPosibleServicio: null,
  });

  // Filter dropdown data
  const [filterData, setFilterData] = useState({
    origenes: [],
    tiposCalendarioActividades: [],
    asesores: [],
    sucursales: [],
    formasContacto: [],
    estadosProcesos: [],
    loading: false,
    loaded: false,
  });

  // Has active filters (excluding defaults)
  const [hasFilters, setHasFilters] = useState(false);

  /**
   * Sync filter defaults with user data
   */
  useEffect(() => {
    if (user?.SucursalID || user?.AsesorID) {
      setSearchFilters((prev) => ({
        ...prev,
        AsesorID: prev.AsesorID || user?.AsesorID || null,
        SucursalID: prev.SucursalID || user?.SucursalID || null,
      }));
    }
  }, [user?.SucursalID, user?.AsesorID]);

  /**
   * Load filter dropdown data (lazy - only when needed)
   */
  const loadFilterData = useCallback(async () => {
    if (filterData.loaded || filterData.loading) return;

    if (!user?.SucursalID) return;

    setFilterData(prev => ({ ...prev, loading: true }));

    try {
      const [
        origenesResponse,
        tiposResponse,
        asesoresResponse,
        sucursalesResponse,
        formasResponse,
        estadosProcesosResponse,
      ] = await Promise.all([
        crmService.consultarOrigenesPreContactosSucursales({
          SucursalID: user?.SucursalID,
        }),
        crmService.consultarTiposCalendarioActividades(),
        crmService.consultarAsesores({
          SucursalID: user?.SucursalID,
          Rows: 0,
        }),
        crmService.consultarSucursalesUsuarios({
          UsuarioID: user?.UsuarioID,
        }),
        crmService.consultarFormasContacto({
          SucursalID: user?.SucursalID,
          Rows: 0,
        }),
        crmService.consultarEstadosProcesos(),
      ]);

      setFilterData({
        origenes: origenesResponse.rows || [],
        tiposCalendarioActividades: tiposResponse.rows || [],
        asesores: asesoresResponse.rows || [],
        sucursales: sucursalesResponse.rows || [],
        formasContacto: formasResponse.rows || [],
        estadosProcesos: estadosProcesosResponse.rows || estadosProcesosResponse || [],
        loading: false,
        loaded: true,
      });
    } catch (error) {
      console.error('Error loading filter data:', error);
      setFilterData(prev => ({ ...prev, loading: false }));
    }
  }, [user?.SucursalID, user?.UsuarioID, filterData.loaded, filterData.loading]);

  /**
   * Search asesores (for remote search in filter modal)
   */
  const searchAsesores = useCallback(
    async (text) => {
      try {
        const response = await crmService.consultarAsesores({
          NombreCompleto: text,
          Rows: 20,
          SucursalID: searchFilters.SucursalID || user?.SucursalID,
        });
        return response.rows || response || [];
      } catch (error) {
        console.error('useFilterManager:searchAsesores', error);
        return [];
      }
    },
    [searchFilters.SucursalID, user?.SucursalID]
  );

  /**
   * Apply filters
   */
  const applyFilters = useCallback((filters) => {
    setSearchFilters(filters);

    // Determine default values based on mode
    const defaultValues = {};
    if (mode === 'table' || mode === 'timeline') {
      defaultValues.EstadoProcesoID = "1,4";
    } else if (mode === 'calendar') {
      defaultValues.EstadoActividadID = "3,4";
    }

    // Check if has non-default filters
    const hasActive = Object.keys(filters).some(
      (key) =>
        filters[key] !== null &&
        filters[key] !== "" &&
        filters[key] !== defaultValues[key]
    );
    setHasFilters(hasActive);
  }, [mode]);

  /**
   * Clear specific filter
   */
  const clearFilter = useCallback((key) => {
    const newFilters = { ...searchFilters };

    if (key === "Dates") {
      newFilters.FechaInicial = null;
      newFilters.FechaFinal = null;
    } else if (key === "DatesCierre") {
      newFilters.FechaInicialCierre = null;
      newFilters.FechaFinalCierre = null;
    } else if (key === "DatesServicio") {
      newFilters.FechaInicialPosibleServicio = null;
      newFilters.FechaFinalPosibleServicio = null;
    } else if (key === "Phones") {
      newFilters.Telefono = "";
      newFilters.Celular = "";
    } else if (key === "EstadoProcesoID") {
      newFilters.EstadoProcesoID = "1,4";
    } else if (key === "EstadoActividadID") {
      newFilters.EstadoActividadID = "3,4";
    } else if (key === "FullSearch") {
      newFilters.FullSearch = "";
    } else if (
      key === "NombreCompleto" ||
      key === "ClienteNombreCompleto" ||
      key === "Documento" ||
      key === "Email"
    ) {
      newFilters[key] = "";
    } else {
      newFilters[key] = null;
    }

    applyFilters(newFilters);
  }, [searchFilters, applyFilters]);

  /**
   * Generate active filter tags
   * OPTIMIZED: Memoized to prevent recalculation on every render
   */
  const activeFilterTags = useMemo(() => {
    if (filterData.loading || !filterData.loaded) return [];

    const tags = [];
    const {
      origenes,
      tiposCalendarioActividades,
      asesores,
      sucursales,
      formasContacto,
    } = filterData;

    // Full search
    if (searchFilters.FullSearch) {
      tags.push({ key: "FullSearch", label: `"${searchFilters.FullSearch}"` });
    }

    // Origen
    if (searchFilters.OrigenPreContactoID) {
      const origen = origenes.find(
        (o) => o.OrigenPreContactoID === searchFilters.OrigenPreContactoID
      );
      if (origen) {
        tags.push({ key: "OrigenPreContactoID", label: origen.Nombre });
      }
    }

    // Tipo calendario actividad
    if (searchFilters.TipoCalendarioActividadID) {
      const tipo = tiposCalendarioActividades.find(
        (t) =>
          t.TipoCalendarioActividadID ===
          searchFilters.TipoCalendarioActividadID
      );
      if (tipo) {
        tags.push({ key: "TipoCalendarioActividadID", label: tipo.Nombre });
      }
    }

    // Asesor
    if (searchFilters.AsesorID) {
      const asesor = asesores.find(
        (a) => a.AsesorID === searchFilters.AsesorID
      );
      if (asesor) {
        tags.push({
          key: "AsesorID",
          label: `Asesor: ${asesor.NombreCompleto}`,
        });
      }
    }

    // Sucursal
    if (searchFilters.SucursalID) {
      const sucursal = sucursales.find(
        (s) => s.SucursalID === searchFilters.SucursalID
      );
      if (sucursal) {
        tags.push({ key: "SucursalID", label: `Sucursal: ${sucursal.Nombre}` });
      }
    }

    // Forma contacto
    if (searchFilters.FormaContactoID) {
      const forma = formasContacto.find(
        (f) => f.FormaContactoID === searchFilters.FormaContactoID
      );
      if (forma) {
        tags.push({ key: "FormaContactoID", label: forma.Nombre });
      }
    }

    // Text filters
    if (searchFilters.NombreCompleto) {
      tags.push({
        key: "NombreCompleto",
        label: `Contacto: ${searchFilters.NombreCompleto}`,
      });
    }

    if (searchFilters.ClienteNombreCompleto) {
      tags.push({
        key: "ClienteNombreCompleto",
        label: `Cliente: ${searchFilters.ClienteNombreCompleto}`,
      });
    }

    if (searchFilters.Documento) {
      tags.push({ key: "Documento", label: `Doc: ${searchFilters.Documento}` });
    }

    if (searchFilters.Telefono || searchFilters.Celular) {
      tags.push({
        key: "Phones",
        label: `Tel: ${searchFilters.Celular || searchFilters.Telefono}`,
      });
    }

    if (searchFilters.Email) {
      tags.push({ key: "Email", label: searchFilters.Email });
    }

    // Date ranges
    if (searchFilters.FechaInicial || searchFilters.FechaFinal) {
      const start = searchFilters.FechaInicial
        ? searchFilters.FechaInicial.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinal
        ? searchFilters.FechaFinal.split(" ")[0]
        : "...";
      tags.push({ key: "Dates", label: `Fecha: ${start} a ${end}` });
    }

    if (searchFilters.FechaInicialCierre || searchFilters.FechaFinalCierre) {
      const start = searchFilters.FechaInicialCierre
        ? searchFilters.FechaInicialCierre.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinalCierre
        ? searchFilters.FechaFinalCierre.split(" ")[0]
        : "...";
      tags.push({ key: "DatesCierre", label: `Cierre: ${start} a ${end}` });
    }

    if (
      searchFilters.FechaInicialPosibleServicio ||
      searchFilters.FechaFinalPosibleServicio
    ) {
      const start = searchFilters.FechaInicialPosibleServicio
        ? searchFilters.FechaInicialPosibleServicio.split(" ")[0]
        : "...";
      const end = searchFilters.FechaFinalPosibleServicio
        ? searchFilters.FechaFinalPosibleServicio.split(" ")[0]
        : "...";
      tags.push({ key: "DatesServicio", label: `Servicio: ${start} a ${end}` });
    }

    // Estado filters (mode-specific)
    if (mode === "table" || mode === "timeline") {
      if (
        searchFilters.EstadoProcesoID &&
        searchFilters.EstadoProcesoID !== "1,4"
      ) {
        const estado = FILTER_OPTIONS.estados.find(
          (e) => e.ID === searchFilters.EstadoProcesoID
        );
        tags.push({
          key: "EstadoProcesoID",
          label: estado ? estado.Nombre : "Estados",
        });
      }

      if (searchFilters.EstadoGeneral) {
        const estadoG = FILTER_OPTIONS.estadosGenerales.find(
          (e) => e.ID === searchFilters.EstadoGeneral
        );
        tags.push({
          key: "EstadoGeneral",
          label: estadoG ? estadoG.Nombre : searchFilters.EstadoGeneral,
        });
      }
    } else if (mode === "calendar") {
      if (
        searchFilters.EstadoActividadID &&
        searchFilters.EstadoActividadID !== "3,4"
      ) {
        const estadoA = FILTER_OPTIONS.estadosActividades.find(
          (e) => e.ID === searchFilters.EstadoActividadID
        );
        tags.push({
          key: "EstadoActividadID",
          label: estadoA ? estadoA.Nombre : "Estados Act.",
        });
      }
    }

    return tags;
  }, [
    searchFilters,
    filterData,
    mode,
  ]);

  return {
    // State
    searchFilters,
    hasFilters,
    
    // Filter data
    filterData,
    
    // Methods
    applyFilters,
    clearFilter,
    loadFilterData,
    searchAsesores,
    
    // Computed
    activeFilterTags,
  };
};

export default useFilterManager;
