import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CalendarEventCard = React.memo(
  ({ event }) => {
    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: event.secondaryColor,
            borderLeftColor: event.primaryColor,
            height: "100%",
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
  },
  (prevProps, nextProps) => {
    return prevProps.event.id === nextProps.event.id;
  },
);

CalendarEventCard.displayName = "CalendarEventCard";

const styles = StyleSheet.create({
  eventCard: {
    borderRadius: 6,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 40,
    overflow: "hidden",
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

export default CalendarEventCard;
