import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatStore } from "../../core/chatStore";
import ChatApiService from "../../services/chat/chatService";
import { useGlobal } from "../../core/global";
import ZoomableImage from "../../assets/common/ZoomableImage";
import ChatMessageList from "../../components/chat/ChatMessageList";
import ChatInputBar from "../../components/chat/ChatInputBar";

const ChatScreen = ({ route, navigation }) => {
  const { contact } = route.params;

  const {
    messages,
    messagesLoading,
    setMessages,
    setMessagesLoading,
    sendingMessage,
    setSendingMessage,
    clearAttachments,
    setSelectedContact,
  } = useChatStore();

  const { user } = useGlobal();

  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: contact.Nombre,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("ContactInfo", { contact })}
        >
          <Text style={styles.headerButtonText}>Info</Text>
        </TouchableOpacity>
      ),
    });

    setSelectedContact(contact);
    loadMessages();

    return () => {
      clearAttachments();
      setSelectedContact(null);
    };
  }, []);

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const filtros = {
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: 1,
        Rows: 50,
        UsuarioID: null,
        Token: user?.Token,
      };
      const response = await ChatApiService.consultarMensajes(filtros);
      const formattedMessages = await formatMessagesForChat(response.data || []);
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  const formatMessagesForChat = async (apiMessages) => {
    const formattedMessages = [];
    for (const msg of apiMessages) {
      const formattedMsg = {
        _id: msg.CuentaMensajeriaMensajeID,
        text: msg.Texto || "",
        createdAt: new Date(msg.Fecha),
        user: {
          _id: msg.Recepcion ? 2 : 1,
          name: msg.Recepcion ? contact?.Nombre : user?.NombreCompleto,
        },
        sent: msg.Status === "sent",
        delivered: msg.Status === "delivered",
        read: msg.Status === "read",
      };

      if (msg.HttpUrl && (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker")) {
        formattedMsg.image = msg.HttpUrl;
        console.log("Image found:", {
          id: msg.CuentaMensajeriaMensajeID,
          isReceived: msg.Recepcion,
          type: msg.TipoMensaje,
          url: msg.HttpUrl
        });
      }

      formattedMessages.push(formattedMsg);
    }
    return formattedMessages;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleSend = async (text) => {
    setSendingMessage(true);
    setTimeout(() => {
      setSendingMessage(false);
    }, 1000);
  };

  const handleImagePress = (imageUri) => {
    setCurrentImage(imageUri);
    setImageViewerVisible(true);
  };

  if (messagesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#337ab7" />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ChatMessageList
          messages={messages}
          currentUserId={1}
          onImagePress={handleImagePress}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />

        <ChatInputBar onSend={handleSend} placeholder="Escribe un mensaje..." />

        {sendingMessage && (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator size="small" color="#337ab7" />
            <Text style={styles.sendingText}>Enviando...</Text>
          </View>
        )}
      </SafeAreaView>

      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageViewerVisible(false)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>

          <View style={styles.modalImageContainer}>
            {currentImage ? (
              <ZoomableImage
                source={{ uri: currentImage }}
                style={styles.fullScreenImage}
                onClose={() => setImageViewerVisible(false)}
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No se pudo cargar la imagen</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  safeArea: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: "#337ab7",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  sendingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  sendingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  modalBackground: {
    flex: 1,
    margin: 0,
    backgroundColor: "black",
    padding: 0,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "white",
    fontSize: 16,
  },
});

export default ChatScreen;