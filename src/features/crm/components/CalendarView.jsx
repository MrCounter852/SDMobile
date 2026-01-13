import React from "react";
import GestionComercialCalendar from "./GestionComercialCalendar";

const CalendarView = React.memo(
  ({ navigation, searchFilters, refreshTrigger }) => {
    return (
      <GestionComercialCalendar
        navigation={navigation}
        searchFilters={searchFilters}
        refreshTrigger={refreshTrigger}
      />
    );
  }
);

export default CalendarView;
