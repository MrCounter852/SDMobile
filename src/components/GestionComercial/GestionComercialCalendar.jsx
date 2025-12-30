import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import {
  LocaleConfig,
  Timeline,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import { useGlobal } from "../../core/global";

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
 * Commercial Management Calendar Component
 * Simplified to show permanent Week/Timeline view.
 */
const GestionComercialCalendar = ({
  navigation,
  externalEvents = [],
  externalLoading = false,
  onRefresh,
}) => {
  const todayStr = useMemo(() => getLocalTodayStr(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Pre-process events to clean titles and extract date parts
  const activities = useMemo(() => {
    return externalEvents
      .map((event) => {
        if (!event.startsAt || !event.endsAt) return null;

        const [startStr, startTimeStr] = event.startsAt.split("T");
        const [endStr, endTimeStr] = event.endsAt.split("T");

        return {
          ...event,
          startDateStr: startStr,
          endDateStr: endStr,
          startTimeStr,
          endTimeStr,
          cleanTitle: (event.title || "").replace(/<[^>]*>?/gm, ""),
          startParts: startStr.split("-").map(Number),
          endParts: endStr.split("-").map(Number),
        };
      })
      .filter(Boolean);
  }, [externalEvents]);

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
            color: event.color?.primary || "#337ab7",
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
    return activities
      .filter(
        (event) =>
          selectedDate >= event.startDateStr && selectedDate <= event.endDateStr
      )
      .map((event) => ({
        start: `${selectedDate} ${event.startTimeStr}`,
        end: `${selectedDate} ${event.endTimeStr}`,
        title: event.cleanTitle,
        summary: "",
        color: event.color?.secondary || "#fae3e3",
      }));
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
      <View style={[styles.eventContainer, { backgroundColor: event.color }]}>
        <Text style={styles.eventTitle}>{event.title}</Text>
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
            key="calendar-timeline"
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
            onRefresh={onRefresh}
            refreshing={externalLoading}
            styles={timelineStyles}
          />
        </View>
        {/* Loader shifted to be absolute and not interfere with calendar height calculation */}
        {externalLoading && (
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
  container: { backgroundColor: "#fff" },
  line: { backgroundColor: "#eee", height: 1 },
  nowIndicatorLine: { backgroundColor: "#88E782", height: 2 },
  nowIndicatorKnob: {
    backgroundColor: "#88E782",
    width: 10,
    height: 10,
    borderRadius: 5,
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
  eventContainer: {
    padding: 2,
    flex: 1,
    borderRadius: 4,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});

export default GestionComercialCalendar;
