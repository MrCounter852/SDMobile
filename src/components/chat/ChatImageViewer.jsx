import React from "react";
import { Modal, View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ZoomableImage from "../../assets/common/ZoomableImage";

const ChatImageViewer = ({ visible, imageUri, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="close-circle" size={36} color="white" />
        </TouchableOpacity>

        <View style={styles.container}>
          {imageUri ? (
            <ZoomableImage
              source={{ uri: imageUri }}
              style={styles.fullScreenImage}
              onClose={onClose}
            />
          ) : (
            <View style={styles.noContentContainer}>
              <Text style={styles.noContentText}>
                No se pudo cargar la imagen
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "black",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  noContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noContentText: {
    color: "white",
    fontSize: 16,
  },
});

export default ChatImageViewer;
