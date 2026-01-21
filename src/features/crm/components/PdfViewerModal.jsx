import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import LeadService from "../services/leadService";

const PdfViewerModal = ({ visible, onClose, url, title }) => {
  const [localUri, setLocalUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && url) {
      downloadPdf();
    } else {
      setLocalUri(null);
      setError(null);
      setLoading(true);
    }
  }, [visible, url]);

  const downloadPdf = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await LeadService.getStoredToken();
      const fileName = url.split("?")[0].split("/").pop() || "document.pdf";
      const fileUri = `${FileSystem.cacheDirectory}${Date.now()}_${fileName}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadRes.status !== 200) {
        throw new Error(
          `Error descargando el PDF (Status: ${downloadRes.status})`,
        );
      }

      setLocalUri(downloadRes.uri);
    } catch (err) {
      console.error("PdfViewerModal:downloadPdf", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (localUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle: title || "Compartir PDF",
      });
    } else {
      Alert.alert(
        "Error",
        "El intercambio de archivos no está disponible en este dispositivo.",
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="close-outline" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title || "Documento PDF"}
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            disabled={!localUri}
          >
            <Ionicons
              name="share-outline"
              size={24}
              color={localUri ? "#337ab7" : "#CBD5E1"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#337ab7" />
              <Text style={styles.loadingText}>Preparando documento...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={downloadPdf}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                source={{ uri: localUri }}
                style={styles.webview}
                originWhitelist={["*"]}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
              />
              {Platform.OS === "android" && (
                <View style={styles.androidWarning}>
                  <Text style={styles.androidWarningText}>
                    Si el documento no se visualiza, usa el botón de compartir
                    arriba.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingTop: Platform.OS === "ios" ? 10 : 0,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginHorizontal: 10,
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#337ab7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  androidWarning: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    padding: 10,
    borderRadius: 8,
  },
  androidWarningText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
});

export default PdfViewerModal;
