import React, { useEffect, useRef, useCallback, useReducer } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Vibration,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { useChatStore } from "../store/chatStore";
import ChatApiService from "../services/chatService";
import ChatStorageService from "../services/chatStorageService";
import { useGlobal } from "../../../core/global";
import { useChatMessages } from "../hooks/useChatMessages";
import { getTipoMensaje } from "../../../utils/chatUtils";

import ChatMessageList from "../components/ChatMessageList";
import ChatInputBar from "../components/ChatInputBar";
import AudioRecorder from "../components/AudioRecorder";
import ChatImageViewer from "../components/ChatImageViewer";
import ChatVideoViewer from "../components/ChatVideoViewer";

const UI_ACTIONS = {
  SET_IMAGE_VIEWER: "SET_IMAGE_VIEWER",
  SET_VIDEO_VIEWER: "SET_VIDEO_VIEWER",
  SET_AUDIO_RECORDER: "SET_AUDIO_RECORDER",
  SET_KEYBOARD_OFFSET: "SET_KEYBOARD_OFFSET",
  SET_SEND_TIMEOUT: "SET_SEND_TIMEOUT",
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTIONS.SET_IMAGE_VIEWER:
      return {
        ...state,
        imageViewerVisible: action.visible,
        currentImage: action.imageUri || null,
      };
    case UI_ACTIONS.SET_VIDEO_VIEWER:
      return {
        ...state,
        videoViewerVisible: action.visible,
        currentVideo: action.videoUri || null,
      };
    case UI_ACTIONS.SET_AUDIO_RECORDER:
      return { ...state, showAudioRecorder: action.show };
    case UI_ACTIONS.SET_KEYBOARD_OFFSET:
      return { ...state, keyboardOffset: action.offset };
    case UI_ACTIONS.SET_SEND_TIMEOUT:
      return { ...state, sendTimeout: action.timeout };
    default:
      return state;
  }
};

const initialState = {
  imageViewerVisible: false,
  currentImage: null,
  videoViewerVisible: false,
  currentVideo: null,
  showAudioRecorder: false,
  keyboardOffset: 0,
  sendTimeout: null,
};

const ChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { contact } = route.params;
  const { user, cdnEndPoint, cdnLlavePublica, cdnLlavePrivada } = useGlobal();

  const {
    setMessages,
    sendingMessage,
    setSendingMessage,
    clearAttachments,
    setSelectedContact,
  } = useChatStore();

  const [uiState, dispatch] = useReducer(uiReducer, initialState);

  const {
    messages,
    messagesLoading,
    refreshing,
    loadingMore,
    loadMessages,
    loadMoreMessages,
    handleMediaDownload,
    confirmarLecturaMensajes,
  } = useChatMessages(contact, user);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("ContactInfo", { contact })}
        >
          <Text style={{ color: "#337ab7", fontSize: 18, fontWeight: "bold" }}>
            {contact.Nombre}
          </Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#337ab7" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("NewLeadScreen", { contact })}
          >
            <Ionicons name="add" size={24} color="#337ab7" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (contact.Telefono) {
                Linking.openURL(`tel:${contact.Telefono}`);
              } else {
                Alert.alert("Error", "No hay número de celular disponible");
              }
            }}
          >
            <Ionicons name="call" size={24} color="#337ab7" />
          </TouchableOpacity>
        </View>
      ),
    });

    setSelectedContact(contact);

    if (global.currentRecording) {
      global.currentRecording.stopAndUnloadAsync().catch((e) => {});
      global.currentRecording = null;
    }

    return () => {
      setSelectedContact(null);
      clearAttachments();
    };
  }, [navigation, contact, setSelectedContact, clearAttachments]);

  useEffect(() => {
    loadMessages();
    confirmarLecturaMensajes();
  }, [loadMessages, confirmarLecturaMensajes]);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      if (Platform.OS === "android") {
        dispatch({
          type: UI_ACTIONS.SET_KEYBOARD_OFFSET,
          offset: insets.bottom,
        });
      }
    });
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      if (Platform.OS === "android") {
        dispatch({ type: UI_ACTIONS.SET_KEYBOARD_OFFSET, offset: 0 });
      }
    });

    const beforeRemoveListener = navigation.addListener("beforeRemove", (e) => {
      if (uiState.showAudioRecorder) {
        handleCancelRecording();
      }
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
      beforeRemoveListener();
    };
  }, [
    insets.bottom,
    navigation,
    uiState.showAudioRecorder,
    handleCancelRecording,
  ]);

  const onRefresh = () => {
    loadMessages(true);
  };

  const handleSend = async (text) => {
    if (uiState.sendTimeout) return;

    const timeout = setTimeout(
      () => dispatch({ type: UI_ACTIONS.SET_SEND_TIMEOUT, timeout: null }),
      500,
    );
    dispatch({ type: UI_ACTIONS.SET_SEND_TIMEOUT, timeout });

    setSendingMessage(true);

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      text: text,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: user?.NombreCompleto,
      },
      status: "pending",
      pending: true,
      sent: false,
      delivered: false,
      read: false,
      isIncoming: false,
    };

    const updatedMessages = [optimisticMessage, ...messages];
    setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

    try {
      await ChatApiService.enviarMensaje({
        CuentaMensajeriaID: contact.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Mensaje: text,
        Files: [],
        TipoMensaje: "text",
        Token: user?.Token,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImagePress = useCallback((imageUri) => {
    dispatch({ type: UI_ACTIONS.SET_IMAGE_VIEWER, visible: true, imageUri });
  }, []);

  const handleVideoPress = useCallback((videoUri) => {
    dispatch({ type: UI_ACTIONS.SET_VIDEO_VIEWER, visible: true, videoUri });
  }, []);

  const handleStartRecording = useCallback(() => {
    dispatch({ type: UI_ACTIONS.SET_AUDIO_RECORDER, show: true });
    Vibration.vibrate(50);
  }, []);

  const handleCancelRecording = useCallback(() => {
    dispatch({ type: UI_ACTIONS.SET_AUDIO_RECORDER, show: false });
  }, []);

  const handleSendAudio = async (audioUri, duration) => {
    dispatch({ type: UI_ACTIONS.SET_AUDIO_RECORDER, show: false });

    const optimisticMessage = {
      _id: `temp-audio-${Date.now()}`,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: user?.NombreCompleto,
      },
      status: "pending",
      pending: true,
      sent: false,
      delivered: false,
      read: false,
      isIncoming: false,
      pendingMedia: {
        type: "audio",
        localUri: audioUri,
        duration: duration,
      },
    };

    const updatedMessages = [optimisticMessage, ...messages];
    setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

    try {
      const uploadResult = await ChatApiService.subirArchivoAlCDN({
        uri: audioUri,
        type: "audio/mp4",
        name: `audio_${Date.now()}.m4a`,
      });

      const codigoUnico = uploadResult.data[0].CodigoUnico;

      const file = {
        TipoMensaje: "audio",
        FileURL: "cdn://" + codigoUnico,
        FileName: `audio_${Date.now()}.m4a`,
        FileMime: "audio/mp4",
        HttpUrl: `${cdnEndPoint}/api/Files/GetFile?PublicKey=${cdnLlavePublica}&UniqueID=${codigoUnico}&Disposition=Inline`,
      };

      await ChatApiService.enviarMensaje({
        CuentaMensajeriaID: contact.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Mensaje: null,
        Files: [file],
        TipoMensaje: "audio",
        Token: user?.Token,
      });
    } catch (error) {
      console.error("Error sending audio:", error);
      Alert.alert("Error", "No se pudo enviar el audio");
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (result.canceled) return;

      for (const file of result.assets) {
        const optimisticMessage = {
          _id: `temp-file-${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          user: {
            _id: 1,
            name: user?.NombreCompleto,
          },
          status: "pending",
          pending: true,
          sent: false,
          delivered: false,
          read: false,
          isIncoming: false,
          pendingMedia: {
            type: "file",
            localUri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
          },
        };

        const updatedMessages = [optimisticMessage, ...messages];
        setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

        try {
          const uploadResult = await ChatApiService.subirArchivoAlCDN({
            uri: file.uri,
            type: file.mimeType,
            name: file.name,
          });

          const codigoUnico = uploadResult.data[0].CodigoUnico;
          const tipoMensaje = getTipoMensaje(file.mimeType);

          const fileObj = {
            TipoMensaje: tipoMensaje,
            FileURL: "cdn://" + codigoUnico,
            FileName: file.name,
            FileMime: file.mimeType,
            HttpUrl: `${cdnEndPoint}/api/Files/GetFile?PublicKey=${cdnLlavePublica}&UniqueID=${codigoUnico}&Disposition=Inline`,
          };

          await ChatApiService.enviarMensaje({
            CuentaMensajeriaID: contact.CuentaMensajeriaID,
            CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
            Mensaje: null,
            Files: [fileObj],
            TipoMensaje: tipoMensaje,
            Token: user?.Token,
          });
        } catch (error) {
          console.error("Error sending file:", error);
          Alert.alert("Error", "No se pudo enviar el archivo");
          const filteredMessages = messages.filter(
            (m) => m._id !== optimisticMessage._id,
          );
          setMessages(contact.CuentaMensajeriaContactoID, filteredMessages);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  if (messagesLoading && messages.length === 0) {
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 90 : uiState.keyboardOffset
          }
        >
          <ChatMessageList
            messages={messages}
            currentUserId={1}
            onImagePress={handleImagePress}
            onVideoPress={handleVideoPress}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onMediaDownload={handleMediaDownload}
            onEndReached={loadMoreMessages}
            loadingMore={loadingMore}
          />

          {uiState.showAudioRecorder ? (
            <AudioRecorder
              onSend={handleSendAudio}
              onCancel={handleCancelRecording}
            />
          ) : (
            <ChatInputBar
              onSend={handleSend}
              onStartRecording={handleStartRecording}
              onAttachFile={handleAttachFile}
              placeholder="Escribe un mensaje..."
            />
          )}
        </KeyboardAvoidingView>

        {sendingMessage && (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator size="small" color="#337ab7" />
            <Text style={styles.sendingText}>Enviando...</Text>
          </View>
        )}
      </SafeAreaView>

      <ChatImageViewer
        visible={uiState.imageViewerVisible}
        imageUri={uiState.currentImage}
        onClose={() =>
          dispatch({ type: UI_ACTIONS.SET_IMAGE_VIEWER, visible: false })
        }
      />

      <ChatVideoViewer
        visible={uiState.videoViewerVisible}
        videoUri={uiState.currentVideo}
        onClose={() =>
          dispatch({ type: UI_ACTIONS.SET_VIDEO_VIEWER, visible: false })
        }
      />
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
});

export default ChatScreen;
