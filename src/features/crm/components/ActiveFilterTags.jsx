import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Component to display active filters as discardable tags
 */
const ActiveFilterTags = ({ tags = [], onClear }) => {
  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag.key}
            style={styles.tagItem}
            onPress={() => tag.removable !== false && onClear(tag.key)}
            disabled={tag.removable === false}
            activeOpacity={tag.removable === false ? 1 : 0.7}
          >
            <Text style={styles.tagLabel}>{tag.label}</Text>
            {tag.removable !== false && (
              <Ionicons
                name="close-circle"
                size={16}
                color="#337ab7"
                style={styles.closeIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#337ab720",
  },
  tagLabel: {
    fontSize: 13,
    color: "#337ab7",
    fontWeight: "600",
  },
  closeIcon: {
    marginLeft: 4,
  },
});

export default ActiveFilterTags;
