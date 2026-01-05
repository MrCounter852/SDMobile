import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import {
  LocaleConfig,
  Timeline,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import { useGlobal } from "../../core/global";
const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;

// Configure Spanish locale
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

/**
 * Helper to get YYYY-MM-DD string for local today
 */
const getLocalTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * ISO Week number calculator
 */
const getWeekNumber = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};

/**
 * Helper to format date as DD/MM/YYYY
 */
const formatDateDMY = (date) => {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

/**
 * Get range (Monday to Sunday) for the week of a given date,
 * plus one additional week back (14-15 days total).
 */
const getWeekRange = (dateStr) => {
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday of current week
  const monday = new Date(new Date(date).setDate(diff));

  const startRange = new Date(monday);
  startRange.setDate(startRange.getDate() - 7); // One additional week back

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6); // End of current week

  return {
    start: formatDateDMY(startRange),
    end: formatDateDMY(sunday),
  };
};

/**
 * Commercial Management Calendar Component
 * Simplified to show permanent Week/Timeline view.
 */
const GestionComercialCalendar = ({
  navigation,
  searchFilters = {},
  refreshTrigger,
}) => {
  const { user } = useGlobal();
  const todayStr = useMemo(() => getLocalTodayStr(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCalendarData = async (isRefresh = false) => {
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

      console.log(
        "[Calendar] Loading data with filters:",
        JSON.stringify(filters)
      );
      const response = await GestionComercialService.consultarMiCalendarioTabla(
        filters
      );
      console.log(
        "[Calendar] Raw response (rows count):",
        response?.rows?.length || 0
      );

      // Handle the { total, rows, result } structure
      const rowData =
        response?.rows || (Array.isArray(response) ? response : []);
      setEvents(rowData);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [searchFilters, refreshTrigger, selectedDate]);

  // Status color mapping
  const getStatusColors = (statusID) => {
    switch (statusID) {
      case 1:
        return { primary: "#2e6da4", secondary: "#e3effa" }; // Finalizadas
      case 2:
        return { primary: "#006400", secondary: "#e6ffe6" }; // Vigentes
      case 3:
        return { primary: "#ad2121", secondary: "#fae3e3" }; // Vencidas
      default:
        return { primary: "#e3bc08", secondary: "#fdf1ba" }; // Pendientes
    }
  };

  // Pre-process events to clean titles and extract date parts
  const activities = useMemo(() => {
    return events
      .map((event) => {
        if (!event.FechaInicio || !event.FechaVencimiento) return null;

        // Robust parsing for "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
        const startRaw = event.FechaInicio.trim();
        const endRaw = event.FechaVencimiento.trim();

        const startParts = startRaw.split(/[T ]/);
        const endParts = endRaw.split(/[T ]/);

        const startStr = startParts[0];
        const endStr = endParts[0];

        // Ensure time is at least HH:mm:ss
        const startTimeStr = startParts[1]?.substring(0, 8) || "00:00:00";
        const endTimeStr = endParts[1]?.substring(0, 8) || "23:59:59";

        const statusColors = getStatusColors(event.EstadoActividadID);

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
          startParts: startStr.split("-").map(Number),
          endParts: endStr.split("-").map(Number),
        };
      })
      .filter(Boolean);
  }, [events]);

  // Generate multi-dot markers for the calendar
  const baseMarks = useMemo(() => {
    const marks = {};
    activities.forEach((event) => {
      const start = new Date(
        event.startParts[0],
        event.startParts[1] - 1,
        event.startParts[2]
      );
      const end = new Date(
        event.endParts[0],
        event.endParts[1] - 1,
        event.endParts[2]
      );
      const curr = new Date(start);

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
    return marks;
  }, [activities]);

  // Add selection highlights to markers
  const markedDates = useMemo(() => {
    const marks = { ...baseMarks };
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: "#337ab7",
    };
    return marks;
  }, [baseMarks, selectedDate]);

  // Filter events for the currently selected day timeline
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
          startFormatted: `${formatDateDMY(new Date(event.startDateStr))} ${event.startTimeStr.substring(0, 5)}`,
          endFormatted: `${formatDateDMY(new Date(event.endDateStr))} ${event.endTimeStr.substring(0, 5)}`,
          summary: "",
          color: "transparent",
          primaryColor: event.statusColors?.primary,
          secondaryColor: event.statusColors?.secondary,
        };
      });
    console.log(`[Calendar] Timeline events for ${selDate}:`, res.length);
    return res;
  }, [activities, selectedDate]);
  const handleEventPress = useCallback(
    (event) => {
      const original = activities.find((e) =>
        e.cleanTitle.includes(event.title)
      );
      if (original)
        navigation.navigate("ActivityDetail", { activity: original });
    },
    [activities, navigation]
  );

  // Custom event renderer for better appearance
  const renderEvent = useCallback((event) => {
    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: event.secondaryColor,
            borderLeftColor: event.primaryColor,
            height: "100%", // Forzar a ocupar todo el alto dado por el Timeline
          },
        ]}
      >
        <View style={styles.eventContent}>
          <Text style={styles.eventTitleText}>{event.title}</Text>

          {event.descripcion && (
            <Text style={styles.eventDescriptionText} numberOfLines={3}>
              {event.descripcion}
            </Text>
          )}

          <View style={styles.detailsContainer}>
            {event.cliente && (
              <Text style={styles.eventDetailLabel}>🏢 {event.cliente}</Text>
            )}

            {event.contact && (
              <Text style={styles.eventContactText}>👤 {event.contact}</Text>
            )}

            {event.visitante && (
              <Text style={styles.eventExtraText}>
                👋 Vis: {event.visitante}
              </Text>
            )}

            {event.celular && (
              <Text style={styles.eventExtraText}>📞 {event.celular}</Text>
            )}

            {event.email && (
              <Text style={styles.eventExtraText}>✉️ {event.email}</Text>
            )}

            {event.direccion && (
              <Text style={styles.eventExtraText}>📍 {event.direccion}</Text>
            )}

            {event.complejo && (
              <Text style={styles.eventExtraText}>🏗️ {event.complejo}</Text>
            )}

            {event.inmueble && (
              <Text style={styles.eventInmuebleText}>🏠 {event.inmueble}</Text>
            )}

            {event.proceso && (
              <Text style={styles.eventBadgeText}>
                #️⃣ Proceso: {event.proceso}
              </Text>
            )}

            {event.cierre && (
              <Text style={styles.eventClosureText}>🏁 {event.cierre}</Text>
            )}
          </View>

          <Text style={[styles.eventTimeText, { color: event.primaryColor }]}>
            Inicio: {event.startFormatted} - Fin: {event.endFormatted}
          </Text>
        </View>
      </View>
    );
  }, []);

  const getYearMonthTitle = useMemo(() => {
    if (!selectedDate) return "";
    const [year, month] = selectedDate.split("-");
    const monthIndex = parseInt(month) - 1;
    const monthName = LocaleConfig.locales["es"].monthNames[monthIndex];
    return `${monthName} ${year}`;
  }, [selectedDate]);

  // Constant theme to avoid re-renders
  const calendarThemeObj = useMemo(
    () => ({
      todayTextColor: "#337ab7",
      selectedDayBackgroundColor: "#337ab7",
      dotColor: "#337ab7",
      selectedDotColor: "#fff",
      arrowColor: "#337ab7",
    }),
    []
  );

  return (
    <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
      <View style={styles.container}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>{getYearMonthTitle}</Text>
        </View>
        <View style={styles.flex1}>
          <WeekCalendar
            firstDay={1}
            markedDates={markedDates}
            theme={calendarThemeObj}
          />
          <Timeline
            key={`timeline-${selectedDate}`}
            date={selectedDate}
            events={timelineEvents}
            format24h={false}
            start={0}
            end={24}
            onEventPress={handleEventPress}
            renderEvent={renderEvent}
            showNowIndicator={selectedDate === todayStr}
            scrollToNow={selectedDate === todayStr && !initialScrollDone}
            onScroll={() => !initialScrollDone && setInitialScrollDone(true)}
            initialTime={{ hour: new Date().getHours(), minute: 0 }}
            onRefresh={() => loadCalendarData(true)}
            refreshing={loading}
            styles={timelineStyles}
          />
        </View>
        {/* Loader shifted to be absolute and not interfere with calendar height calculation */}
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color="#337ab7"
          />
        )}
      </View>
    </CalendarProvider>
  );
};

const calendarTheme = {
  todayTextColor: "#337ab7",
  selectedDayBackgroundColor: "#337ab7",
};

const timelineStyles = {
  container: { backgroundColor: "transparent" },
  line: { backgroundColor: "#eee", height: 1 },
  timeLabel: { backgroundColor: "#fff", zIndex: 10 },
  nowIndicatorLine: { backgroundColor: "#88E782", height: 2, zIndex: 20 },
  nowIndicatorKnob: {
    backgroundColor: "#88E782",
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 20
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex1: { flex: 1 },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
    zIndex: 10,
  },
  headerTitleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#337ab7",
    textTransform: "capitalize",
  },
  eventCard: {
    borderRadius: 6,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 40,
    overflow: "hidden", // Para que el fondo no se salga de los bordes redondeados
  },
  eventContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eventTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1C1E",
    lineHeight: 18,
    marginBottom: 4,
  },
  eventDescriptionText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
    lineHeight: 16,
    fontStyle: "italic",
  },
  detailsContainer: {
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#f0f0f0",
    paddingTop: 4,
  },
  eventDetailLabel: {
    fontSize: 11,
    color: "#2e6da4",
    fontWeight: "700",
    marginBottom: 2,
  },
  eventContactText: {
    fontSize: 11,
    color: "#4a4a4a",
    marginTop: 2,
    fontWeight: "700",
  },
  eventExtraText: {
    fontSize: 11,
    color: "#6e6e6e",
    marginTop: 2,
    fontWeight: "500",
  },
  eventInmuebleText: {
    fontSize: 10,
    color: "#337ab7",
    marginTop: 4,
    fontWeight: "600",
  },
  eventBadgeText: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 4,
    fontWeight: "500",
  },
  eventClosureText: {
    fontSize: 10,
    color: "#d9534f",
    marginTop: 4,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  eventTimeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 8,
    alignSelf: "flex-end",
  },
});

export default GestionComercialCalendar;

