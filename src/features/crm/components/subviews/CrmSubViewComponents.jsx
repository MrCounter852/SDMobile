import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../../core/theme";
export { COLORS };

export const InfoSection = ({ title, icon, onAdd, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContent}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onAdd && (
        <TouchableOpacity style={styles.sectionAddBtn} onPress={onAdd}>
          <Ionicons name="plus" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

export const DataItem = ({ label, value, fullWidth, isCurrency }) => (
  <View style={[styles.dataItem, fullWidth && styles.fullWidth]}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={[styles.dataValue, isCurrency && styles.currencyValue]}>
      {value || "N/A"}
    </Text>
  </View>
);

export const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(51, 122, 183, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
  },
  sectionAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(51, 122, 183, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  dataItem: {
    width: "47%",
  },
  fullWidth: {
    width: "100%",
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.lightGray,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  currencyValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  observationBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  observationText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  propertyStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabelSmall: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.lightGray,
    marginTop: 4,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
    marginTop: 2,
  },
  txGroup: {
    marginBottom: 16,
  },
  txGroupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    gap: 10,
  },
  txText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "600",
  },
  txValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
