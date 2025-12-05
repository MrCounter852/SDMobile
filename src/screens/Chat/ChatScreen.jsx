import React, { useEffect, useState, useRef } from "react";
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
import { Video, ResizeMode } from "expo-av";
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
  const [videoViewerVisible, setVideoViewerVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const videoRef = useRef(null);
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
      const formattedMessages = formatMessagesForChat(response.data || []);
      setMessages(formattedMessages);
      loadPendingMedia(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  const formatMessagesForChat = (apiMessages) => {
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

      if (msg.TipoMensaje === "document") {
        if (msg.HttpUrl) {
          formattedMsg.file = { name: msg.FileName, url: msg.HttpUrl };
          console.log("Document found:", {
            id: msg.CuentaMensajeriaMensajeID,
            isReceived: msg.Recepcion,
            name: msg.FileName,
            url: msg.HttpUrl
          });
        } else if (msg.FileID) {
          formattedMsg.pendingMedia = {
            type: 'file',
            params: {
              MediaID: msg.FileID,
              AccessToken: contact.AccessToken,
              FileMime: msg.FileMime
            },
            name: msg.FileName
          };
        }
      } else if (msg.FileID && (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker")) {
        formattedMsg.pendingMedia = {
          type: 'image',
          params: {
            MediaID: msg.FileID,
            AccessToken: contact.AccessToken,
            FileMime: msg.FileMime
          }
        };
      } else if (msg.HttpUrl && (msg.TipoMensaje === "image" || msg.TipoMensaje === "sticker")) {
        formattedMsg.image = msg.HttpUrl;
        console.log("Image found:", {
          id: msg.CuentaMensajeriaMensajeID,
          isReceived: msg.Recepcion,
          type: msg.TipoMensaje,
          url: msg.HttpUrl
        });
      }
      // Handle video messages
      if (msg.TipoMensaje === "video") {
        if (msg.FileID) {
          formattedMsg.pendingMedia = {
            type: 'video',
            params: {
              MediaID: msg.FileID,
              AccessToken: contact.AccessToken,
              FileMime: msg.FileMime
            }
          };
        } else if (msg.HttpUrl) {
          formattedMsg.video = msg.HttpUrl;
        }
      }
      // Handle audio messages
      if (msg.TipoMensaje === "audio") {
        if (msg.FileID) {
          formattedMsg.pendingMedia = {
            type: 'audio',
            params: {
              MediaID: msg.FileID,
              AccessToken: contact.AccessToken,
              FileMime: msg.FileMime
            }
          };
        } else if (msg.HttpUrl) {
          formattedMsg.audio = msg.HttpUrl;
        }
      }

      formattedMessages.push(formattedMsg);
    }
    return formattedMessages;
  };

  const loadPendingMedia = async (messages) => {
    const mediaPromises = messages
      .filter(msg => msg.pendingMedia)
      .map(async (msg) => {
        try {
          const uri = await ChatApiService.obtenerMediaWhatsApp(msg.pendingMedia.params);
          return { id: msg._id, type: msg.pendingMedia.type, uri, name: msg.pendingMedia.name };
        } catch (error) {
          console.error("Media load error:", error);
          return { id: msg._id, type: msg.pendingMedia.type, error: true };
        }
      });

    const results = await Promise.all(mediaPromises);

    const updatedMessages = messages.map(msg => {
      const result = results.find(r => r.id === msg._id);
      if (result) {
        const updatedMsg = { ...msg };
        delete updatedMsg.pendingMedia;
        if (result.error) {
          updatedMsg.mediaExpired = true;
        } else {
          if (result.type === 'image') {
            updatedMsg.image = result.uri;
          } else if (result.type === 'audio') {
            updatedMsg.audio = result.uri;
          } else if (result.type === 'file') {
            updatedMsg.file = { name: result.name, url: result.uri };
          } else if (result.type === 'video') {
            updatedMsg.video = result.uri;
          }
        }
        return updatedMsg;
      }
      return msg;
    });

    setMessages(updatedMessages);
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

  const handleVideoPress = (videoUri) => {
    setCurrentVideo(videoUri);
    setVideoViewerVisible(true);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <ChatMessageList
          messages={messages}
          currentUserId={1}
          onImagePress={handleImagePress}
          onVideoPress={handleVideoPress}
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
      <Modal
        visible={videoViewerVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          if (videoRef.current) {
            videoRef.current.pauseAsync();
          }
          setVideoViewerVisible(false);
        }}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (videoRef.current) {
                videoRef.current.pauseAsync();
              }
              setVideoViewerVisible(false);
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>

          <View style={styles.modalVideoContainer}>
            {currentVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: currentVideo }}
                style={styles.fullScreenVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onError={(error) => console.error('Video error:', error)}
              />
            ) : (
              <View style={styles.noVideoContainer}>
                <Text style={styles.noVideoText}>No se pudo cargar el video</Text>
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
  modalVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  fullScreenVideo: {
    width: "100%",
    height: "100%",
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: "white",
    fontSize: 16,
  },
});

export default ChatScreen;