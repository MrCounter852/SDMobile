import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import {
  LocaleConfig,
  Timeline,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobal } from "../../../core/global";
import { COLORS } from "../../../core/theme";

const GestionComercialService = require("../services/crmService").default;

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
 * Get range for the whole month of a given date
 */
const getMonthRange = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);

  return {
    start: formatDateDMY(firstDay),
    end: formatDateDMY(lastDay),
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
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' or 'list'
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCalendarData = async (isRefresh = false) => {
    if (!user?.UsuarioID) return;
    if (loading && !isRefresh) return;

    setLoading(true);
    try {
      // Use different range based on view mode
      const range =
        viewMode === "list"
          ? getMonthRange(selectedDate)
          : getWeekRange(selectedDate);

      const filters = {
        ...searchFilters,
        // Map AsesorID to UsuarioID and allow null for "Todos"
        UsuarioID: Object.prototype.hasOwnProperty.call(
          searchFilters,
          "AsesorID"
        )
          ? searchFilters.AsesorID
          : user?.UsuarioID,
        // Prioritize SucursalID from filters
        SucursalID: Object.prototype.hasOwnProperty.call(
          searchFilters,
          "SucursalID"
        )
          ? searchFilters.SucursalID
          : user?.SucursalID,
        // Priority to manually selected dates from FilterModal (which can be null),
        // fallback to current view range only if property is missing
        FechaInicial: Object.prototype.hasOwnProperty.call(
          searchFilters,
          "FechaInicial"
        )
          ? searchFilters.FechaInicial
          : range.start,
        FechaFinal: Object.prototype.hasOwnProperty.call(
          searchFilters,
          "FechaFinal"
        )
          ? searchFilters.FechaFinal
          : range.end,
        Token: user?.Token,
      };

      const response = await GestionComercialService.consultarMiCalendarioTabla(
        filters
      );

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
            color: event.statusColors?.primary || COLORS.primary,
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
      selectedColor: COLORS.primary,
    };
    return marks;
  }, [baseMarks, selectedDate]);

  // Data for the timeline (just selected day)
  const dayEvents = useMemo(() => {
    const selDate = selectedDate.trim();
    return activities
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
          startFormatted: `${formatDateDMY(
            new Date(event.startDateStr + "T12:00:00")
          )} ${event.startTimeStr.substring(0, 5)}`,
          endFormatted: `${formatDateDMY(
            new Date(event.endDateStr + "T12:00:00")
          )} ${event.endTimeStr.substring(0, 5)}`,
          summary: "",
          color: "transparent",
          primaryColor: event.statusColors?.primary,
          secondaryColor: event.statusColors?.secondary,
          original: event,
        };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [activities, selectedDate]);

  // Data for the scrolling list (grouped by date)
  const listData = useMemo(() => {
    if (viewMode !== "list") return [];

    const grouped = activities.reduce((acc, event) => {
      const date = event.startDateStr;
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        ...event,
        id: String(event.CalendarioActividadID),
        startFormatted: `${formatDateDMY(
          new Date(event.startDateStr + "T12:00:00")
        )} ${event.startTimeStr.substring(0, 5)}`,
        endFormatted: `${formatDateDMY(
          new Date(event.endDateStr + "T12:00:00")
        )} ${event.endTimeStr.substring(0, 5)}`,
        primaryColor: event.statusColors?.primary,
        secondaryColor: event.statusColors?.secondary,
        title: event.cleanTitle,
        contact: event.Contacto,
      });
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort()
      .map((date) => ({
        date,
        dayName:
          LocaleConfig.locales["es"].dayNames[
            new Date(date + "T12:00:00").getDay()
          ],
        dayNumber: date.split("-")[2],
        data: grouped[date].sort((a, b) =>
          a.startTimeStr.localeCompare(b.startTimeStr)
        ),
      }));
  }, [activities, viewMode]);

  const handleEventPress = useCallback(
    (event) => {
      const original = dayEvents.find((e) => e.id === event.id)?.original;
      if (original)
        navigation.navigate("ActivityDetail", { activity: original });
    },
    [dayEvents, navigation]
  );

  const handleGoToToday = () => {
    setSelectedDate(todayStr);
    setInitialScrollDone(false);
  };

  // Custom activity card renderer (used in both views)
  const renderActivityCard = useCallback((event, isListMode = false) => {
    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: event.secondaryColor,
            borderLeftColor: event.primaryColor,
          },
          isListMode && styles.listEventCard,
        ]}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitleText} numberOfLines={2}>
              {event.title}
            </Text>
            {isListMode && (
              <Text
                style={[styles.eventTimeTag, { color: event.primaryColor }]}
              >
                {event.startTimeStr.substring(0, 5)}
              </Text>
            )}
          </View>

          {event.descripcion && (
            <Text style={styles.eventDescriptionText} numberOfLines={2}>
              {event.descripcion}
            </Text>
          )}

          <View style={styles.detailsGrid}>
            {event.cliente && (
              <View style={styles.detailItem}>
                <Ionicons name="business" size={12} color={COLORS.secondary} />
                <Text style={styles.detailItemText} numberOfLines={1}>
                  {event.cliente}
                </Text>
              </View>
            )}

            {event.contact && (
              <View style={styles.detailItem}>
                <Ionicons name="person" size={12} color={COLORS.secondary} />
                <Text style={styles.detailItemText} numberOfLines={1}>
                  {event.contact}
                </Text>
              </View>
            )}

            {event.visitante && (
              <View style={styles.detailItem}>
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={COLORS.secondary}
                />
                <Text style={styles.detailItemText} numberOfLines={1}>
                  Vis: {event.visitante}
                </Text>
              </View>
            )}

            {event.direccion && (
              <View style={styles.detailItem}>
                <Ionicons name="location" size={12} color={COLORS.secondary} />
                <Text style={styles.detailItemText} numberOfLines={1}>
                  {event.direccion}
                </Text>
              </View>
            )}

            {event.inmueble && (
              <View style={styles.detailItem}>
                <Ionicons name="home" size={12} color={COLORS.secondary} />
                <Text style={styles.detailItemText} numberOfLines={1}>
                  {event.inmueble}
                </Text>
              </View>
            )}

            {event.cierre && (
              <View style={styles.detailItem}>
                <Ionicons name="flag" size={12} color="#d9534f" />
                <Text style={[styles.detailItemText, { color: "#d9534f" }]}>
                  {event.cierre}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerTimeText}>
              {event.startFormatted.split(" ")[1]} -{" "}
              {event.endFormatted.split(" ")[1]}
            </Text>
            {event.proceso && (
              <Text style={styles.procesoBadge}>#{event.proceso}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }, []);

  const getYearMonthTitle = useMemo(() => {
    if (!selectedDate) return "";
    const [year, month] = selectedDate.split("-");
    const monthIndex = parseInt(month) - 1;
    const monthName = LocaleConfig.locales["es"].monthNames[monthIndex];
    return `${monthName}, ${year}`;
  }, [selectedDate]);

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={(date) => {
        setSelectedDate(date);
        setInitialScrollDone(false);
      }}
    >
      <View style={styles.container}>
        {/* Header with Month and Actions */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleGoToToday}
            style={styles.todayButton}
          >
            <Ionicons name="today-outline" size={18} color={COLORS.primary} />
            <Text style={styles.todayButtonText}>Hoy</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>{getYearMonthTitle}</Text>
          </View>

          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              onPress={() => setViewMode("timeline")}
              style={[
                styles.toggleButton,
                viewMode === "timeline" && styles.toggleButtonActive,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={viewMode === "timeline" ? "#fff" : COLORS.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={[
                styles.toggleButton,
                viewMode === "list" && styles.toggleButtonActive,
              ]}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={viewMode === "list" ? "#fff" : COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === "timeline" && (
          <View style={styles.calendarContainer}>
            <WeekCalendar
              firstDay={1}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: COLORS.primary,
                todayTextColor: COLORS.primary,
                dotColor: COLORS.primary,
                selectedDotColor: "#fff",
                daySelectionAnimation: { type: "fade", duration: 200 },
              }}
            />
          </View>
        )}

        <View style={styles.contentContainer}>
          {viewMode === "timeline" ? (
            <Timeline
              key={`timeline-${selectedDate}`}
              date={selectedDate}
              events={dayEvents}
              format24h={false}
              start={0}
              end={24}
              onEventPress={handleEventPress}
              renderEvent={(e) => renderActivityCard(e, false)}
              showNowIndicator={selectedDate === todayStr}
              scrollToNow={selectedDate === todayStr && !initialScrollDone}
              onScroll={() => !initialScrollDone && setInitialScrollDone(true)}
              initialTime={{ hour: new Date().getHours(), minute: 0 }}
              styles={timelineStyles}
            />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.date}
              renderItem={({ item }) => (
                <View style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>
                      {item.dayName}, {item.dayNumber}
                    </Text>
                  </View>
                  {item.data.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      activeOpacity={0.7}
                      onPress={() => handleEventPress(event)}
                    >
                      {renderActivityCard(event, true)}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={64}
                    color={COLORS.lightGray}
                  />
                  <Text style={styles.emptyText}>No hay actividades</Text>
                  <Text style={styles.emptySubText}>
                    No hay compromisos registrados para este periodo.
                  </Text>
                </View>
              }
              onRefresh={() => loadCalendarData(true)}
              refreshing={loading}
            />
          )}
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>
    </CalendarProvider>
  );
};

const timelineStyles = {
  container: { backgroundColor: COLORS.background },
  line: { backgroundColor: "#E2E8F0", height: 1 },
  timeLabel: { fontSize: 10, color: COLORS.gray, fontWeight: "500" },
  nowIndicatorLine: { backgroundColor: COLORS.success, height: 2, zIndex: 20 },
  nowIndicatorKnob: {
    backgroundColor: COLORS.success,
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 20,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    textTransform: "capitalize",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  calendarContainer: {
    backgroundColor: "#fff",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Base Card Styles
  eventCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
    marginLeft: 40,
    overflow: "hidden",
  },
  listEventCard: {
    marginLeft: 0,
    marginBottom: 16,
    borderLeftWidth: 6,
  },
  eventContent: {
    padding: 12,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  eventTitleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    lineHeight: 18,
  },
  eventTimeTag: {
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  eventDescriptionText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },
  // Details Grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
    paddingTop: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: "100%",
  },
  detailItemText: {
    fontSize: 11,
    color: COLORS.dark,
    fontWeight: "500",
  },
  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  footerTimeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.lightGray,
    textTransform: "uppercase",
  },
  procesoBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Utilities
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 250, 252, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  // List View specific
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "capitalize",
    paddingLeft: 4,
  },
});

export default GestionComercialCalendar;
