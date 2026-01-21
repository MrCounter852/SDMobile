import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGlobal } from '../../../core/global';
import crmService from '../services/crmService';


const useCalendarData = (searchFilters, refreshTrigger, selectedDate) => {
  const { user } = useGlobal();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);


  const getWeekRange = useCallback((dateStr) => {
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date(date).setDate(diff));

    const startRange = new Date(monday);
    startRange.setDate(startRange.getDate() - 7);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const formatDateDMY = (d) => {
      return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    };

    return {
      start: formatDateDMY(startRange),
      end: formatDateDMY(sunday),
    };
  }, []);

  const statusColorsMap = useMemo(() => ({
    1: { primary: "#2e6da4", secondary: "#e3effa" },
    2: { primary: "#006400", secondary: "#e6ffe6" },
    3: { primary: "#ad2121", secondary: "#fae3e3" },
    default: { primary: "#e3bc08", secondary: "#fdf1ba" },
  }), []);

  const getStatusColors = useCallback((statusID) => {
    return statusColorsMap[statusID] || statusColorsMap.default;
  }, [statusColorsMap]);


  const loadCalendarData = useCallback(async (isRefresh = false) => {
    if (!user?.UsuarioID) return;
    if (loading && !isRefresh) return;

    setLoading(true);
    try {
      const range = getWeekRange(selectedDate);
      const filters = {
        ...searchFilters,
        UsuarioID: user?.UsuarioID,
        SucursalID: user?.SucursalID,
        FechaInicial: range.start,
        FechaFinal: range.end,
        Token: user?.Token,
      };
      
      const response = await crmService.consultarMiCalendarioTabla(filters);
      const rowData =
        response?.rows || (Array.isArray(response) ? response : []);
      setEvents(rowData);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, searchFilters, loading, getWeekRange]);


  const refresh = useCallback(() => {
    loadCalendarData(true);
  }, [loadCalendarData]);


  useEffect(() => {
    loadCalendarData();
  }, [searchFilters, refreshTrigger, selectedDate]);

  const activities = useMemo(() => {
    const formatDateDMY = (date) => {
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    };

    return events
      .map((event) => {
        if (!event.FechaInicio || !event.FechaVencimiento) return null;

        const startRaw = event.FechaInicio.trim();
        const endRaw = event.FechaVencimiento.trim();

        const startParts = startRaw.split(/[T ]/);
        const endParts = endRaw.split(/[T ]/);

        const startStr = startParts[0];
        const endStr = endParts[0];

        const startTimeStr = startParts[1]?.substring(0, 8) || "00:00:00";
        const endTimeStr = endParts[1]?.substring(0, 8) || "23:59:59";

        const statusColors = getStatusColors(event.EstadoActividadID);

        const startParsed = startStr.split("-").map(Number);
        const endParsed = endStr.split("-").map(Number);

        const startDate = new Date(startParsed[0], startParsed[1] - 1, startParsed[2]);
        const endDate = new Date(endParsed[0], endParsed[1] - 1, endParsed[2]);

        return {
          ...event,
          CalendarioActividadID: event.CalendarioActividadID,
          startsAt: startRaw,
          endsAt: endRaw,
          startDateStr: startStr,
          endDateStr: endStr,
          startTimeStr,
          endTimeStr,
          cleanTitle: event.Asunto || "",
          descripcion: event.Descripcion,
          direccion: event.Direccion,
          cliente: event.Cliente,
          visitante: event.VisitanteNombreCompleto,
          complejo: event.ComplejoNombre,
          cierre: event.CalendarioActividadCierreDetalleNombre,
          proceso: event.ProcesoID,
          statusColors,
          startParts: startParsed,
          endParts: endParsed,
          startDate,
          endDate,
          startFormatted: `${formatDateDMY(startDate)} ${startTimeStr.substring(0, 5)}`,
          endFormatted: `${formatDateDMY(endDate)} ${endTimeStr.substring(0, 5)}`,
        };
      })
      .filter(Boolean);
  }, [events, getStatusColors]);

  const calendarMarkers = useMemo(() => {
    const marks = {};

    activities.forEach((event) => {
      const curr = new Date(event.startDate);
      const end = event.endDate;

      while (curr <= end) {
        const dateKey = `${curr.getFullYear()}-${String(
          curr.getMonth() + 1
        ).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`;

        if (!marks[dateKey]) {
          marks[dateKey] = { marked: true, dots: [] };
        }

        if (
          !marks[dateKey].dots.some(
            (d) => d.key === String(event.CalendarioActividadID)
          )
        ) {
          marks[dateKey].dots.push({
            key: String(event.CalendarioActividadID),
            color: event.statusColors?.primary || "#337ab7",
            selectedDotColor: "#fff",
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: "#337ab7",
      };
    }

    return marks;
  }, [activities, selectedDate]);

  const timelineEvents = useMemo(() => {
    const selDate = selectedDate.trim();
    
    const res = activities
      .filter((event) => {
        const start = event.startDateStr.trim();
        const end = event.endDateStr.trim();
        return selDate >= start && selDate <= end;
      })
      .map((event) => {
        const startStr = event.startDateStr.trim();
        const endStr = event.endDateStr.trim();

        const isStartingToday = startStr === selDate;
        const isEndingToday = endStr === selDate;

        const displayStart = isStartingToday ? event.startTimeStr : "00:00:00";
        const displayEnd = isEndingToday ? event.endTimeStr : "23:59:59";

        return {
          id: String(event.CalendarioActividadID),
          start: `${selDate} ${displayStart}`,
          end: `${selDate} ${displayEnd}`,
          title: event.cleanTitle,
          contact: event.Contacto,
          celular: event.Celular,
          email: event.Email,
          inmueble: event.InmuebleDescripcion,
          descripcion: event.descripcion,
          direccion: event.direccion,
          cliente: event.cliente,
          visitante: event.visitante,
          complejo: event.complejo,
          cierre: event.cierre,
          proceso: event.proceso,
          startFormatted: event.startFormatted,
          endFormatted: event.endFormatted,
          summary: "",
          color: "transparent",
          primaryColor: event.statusColors?.primary,
          secondaryColor: event.statusColors?.secondary,
        };
      });
    
    return res;
  }, [activities, selectedDate]);

  return {
    events,
    loading,
    activities,
    calendarMarkers,
    timelineEvents,
    refresh,
    loadCalendarData,
    getStatusColors,
  };
};

export default useCalendarData;

