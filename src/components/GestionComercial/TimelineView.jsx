import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobal } from "../../core/global";
import TimelineColumn from "./TimelineColumn";

const GestionComercialService =
  require("../../services/GestionComercial/gestionComercialService").default;

const TimelineView = React.memo(
  ({ navigation, searchFilters, refreshTrigger, onSelectContact }) => {
    const { user } = useGlobal();
    const [timelineData, setTimelineData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadTimeline = async (isRefresh = false) => {
      if (!searchFilters.OrigenPreContactoID) {
        setTimelineData([]);
        return;
      }
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const filters = {
          ...searchFilters,
          SucursalID: user?.SucursalID,
        };

        const response = await GestionComercialService.consultarLineasTiempo(
          filters
        );
        setTimelineData(response.data || []);
      } catch (error) {
        console.error("Error loading timeline:", error);
        setTimelineData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      loadTimeline();
    }, [searchFilters, refreshTrigger]);

    useFocusEffect(
      useCallback(() => {
        loadTimeline(true);
      }, [searchFilters, refreshTrigger])
    );

    const handleRefresh = () => {
      loadTimeline(true);
    };

    const handleContactPress = (contact) => {
      navigation.navigate("ContactDetail", { contact });
    };

    const handleMoveContact = async (contact, direction) => {
      Alert.alert(
        "Mover contacto",
        `¿Mover "${contact.NombreCompleto}" ${
          direction === "left" ? "a la izquierda" : "a la derecha"
        }?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Mover",
            onPress: async () => {
              try {
                const currentIndex = timelineData.findIndex((linea) =>
                  linea.Procesos?.some((p) => p.ProcesoID === contact.ProcesoID)
                );

                if (currentIndex === -1) return;

                const targetIndex =
                  direction === "left"
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(timelineData.length - 1, currentIndex + 1);

                if (targetIndex === currentIndex) return;

                await GestionComercialService.moverLineaTiempo({
                  ProcesoID: contact.ProcesoID,
                  ProcesoLineaTiempoID:
                    timelineData[targetIndex].ProcesoLineaTiempoID,
                });

                loadTimeline(true);
              } catch (error) {
                console.error("Error moving contact:", error);
                Alert.alert("Error", "No se pudo mover el contacto");
              }
            },
          },
        ]
      );
    };

    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#337ab7" />
          <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {searchFilters.tags && searchFilters.tags.length > 0 && (
          <View style={styles.tagsOuterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {searchFilters.tags.map((tag) => (
                <TouchableOpacity
                  key={tag.key}
                  style={styles.tagItem}
                  onPress={() => searchFilters.onClear(tag.key)}
                >
                  <Text style={styles.tagLabel}>{tag.label}</Text>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color="#337ab7"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineContainer}
        >
          {timelineData.map((linea) => (
            <TimelineColumn
              key={linea.ProcesoLineaTiempoID}
              linea={linea}
              onContactPress={handleContactPress}
              onMoveContact={handleMoveContact}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          ))}

          {timelineData.length === 0 && (
            <View style={styles.emptyTimeline}>
              <Ionicons name="git-branch-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay línea de tiempo configurada
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "500",
  },
  tagsOuterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  tagsScrollContent: {
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
  timelineContainer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  emptyTimeline: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEAEB2",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});

export default TimelineView;
