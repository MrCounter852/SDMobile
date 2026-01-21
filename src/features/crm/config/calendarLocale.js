import { LocaleConfig } from "react-native-calendars";

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

export const calendarTheme = {
  todayTextColor: "#337ab7",
  selectedDayBackgroundColor: "#337ab7",
  dotColor: "#337ab7",
  selectedDotColor: "#fff",
  arrowColor: "#337ab7",
};

export const timelineStyles = {
  container: { backgroundColor: "transparent" },
  line: { backgroundColor: "#eee", height: 1 },
  timeLabel: { backgroundColor: "#fff", zIndex: 10 },
  nowIndicatorLine: { backgroundColor: "#88E782", height: 2, zIndex: 20 },
  nowIndicatorKnob: {
    backgroundColor: "#88E782",
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 20,
  },
};
