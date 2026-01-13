import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ChatDaySeparator = ({ date }) => {
  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);

    const isToday = today.toDateString() === messageDate.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === messageDate.toDateString();

    if (isToday) return "Hoy";
    if (isYesterday) return "Ayer";

    return messageDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.separator}>
        <Text style={styles.text}>{formatDate(date)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  separator: {
    backgroundColor: "#337ab7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default ChatDaySeparator;
