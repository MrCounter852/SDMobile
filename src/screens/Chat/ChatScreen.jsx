import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatStore } from "../../core/chatStore";
import ChatApiService from "../../services/chat/chatService";
import ChatStorageService from "../../services/chat/chatStorageService";
import { useGlobal } from "../../core/global";
import ZoomableImage from "../../assets/common/ZoomableImage";
import ChatMessageList from "../../components/chat/ChatMessageList";
import ChatInputBar from "../../components/chat/ChatInputBar";
import AudioRecorder from "../../components/chat/AudioRecorder";
import Slider from '@react-native-community/slider';

const ChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { contact } = route.params;

  const {
    messagesLoading,
    setMessages,
    setMessagesLoading,
    sendingMessage,
    setSendingMessage,
    clearAttachments,
    setSelectedContact,
    resetUnreadCount,
  } = useChatStore();

  const messages = useChatStore(
    useCallback(
      (state) => state.chats[contact.CuentaMensajeriaContactoID],
      [contact.CuentaMensajeriaContactoID]
    )
  ) || [];
  const { user, cdnEndPoint, cdnLlavePublica, cdnLlavePrivada } = useGlobal();

  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [videoViewerVisible, setVideoViewerVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [currentImage, setCurrentImage] = useState(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [sendTimeout, setSendTimeout] = useState(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
    // Reset pagination states for new contact
    setCurrentPage(1);
    setHasMore(true);
    setLoadingMore(false);
    // Clean any lingering recordings
    if (global.currentRecording) {
      global.currentRecording.stopAndUnloadAsync().catch(e => { });
      global.currentRecording = null;
    }
    loadMessages();
    // Confirmar lectura de mensajes si hay mensajes sin leer
    confirmarLecturaMensajes();

    // Keyboard listeners for Android navigation bar adjustment
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (Platform.OS === 'android') {
        setKeyboardOffset(insets.bottom);
      }
    });
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') {
        setKeyboardOffset(0);
      }
    });

    // Listener to handle back navigation while recording
    const beforeRemoveListener = navigation.addListener('beforeRemove', (e) => {
      if (showAudioRecorder) {
        handleCancelRecording();
      }
    });

    return () => {
      clearAttachments();
      setSelectedContact(null);
      keyboardShowListener.remove();
      keyboardHideListener.remove();
      beforeRemoveListener();
    };
  }, [insets.bottom]);

  const loadMessages = async () => {
    try {
      // 1. Get current messages from store (includes any from SignalR)
      let currentMessages = messages;
      // If no messages in store, load from storage
      if (currentMessages.length === 0) {
        currentMessages = await ChatStorageService.getMessages(contact.CuentaMensajeriaContactoID);
        if (currentMessages.length > 0) {
          setMessages(contact.CuentaMensajeriaContactoID, currentMessages);
          loadPendingMedia(currentMessages);
          setMessagesLoading(false); // Show UI immediately
        } else {
          setMessagesLoading(true);
        }
      }

      // 2. Fetch from API for sync (Page=1, Rows=20)
      const filtros = {
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: 1,
        Rows: 20,
        UsuarioID: null,
        Token: user?.Token,
      };
      const response = await ChatApiService.consultarMensajes(filtros);
      const apiMessages = response.data || [];
      const formattedApiMessages = formatMessagesForChat(apiMessages);

      // 3. Merge: Add new messages from API that aren't in currentMessages
      const newMessages = formattedApiMessages.filter(apiMsg => !currentMessages.find(m => m._id === apiMsg._id));
      let mergedMessages = [...newMessages, ...currentMessages];
      // Sort by date descending (newest first for inverted list)
      mergedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 4. Update store and storage
      setMessages(contact.CuentaMensajeriaContactoID, mergedMessages);
      await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, mergedMessages);
      loadPendingMedia(mergedMessages);

      // 5. Confirmar lectura de mensajes si hay mensajes sin leer
      const mensajesSinLeer = mergedMessages.filter(msg =>
        msg.user._id === 2 && !msg.read
      );
      if (mensajesSinLeer.length > 0) {
        try {
          // Optimistic update
          resetUnreadCount(contact.CuentaMensajeriaContactoID);

          await ChatApiService.confirmarLectura({
            CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
            CuentaMensajeriaID: contact.CuentaMensajeriaID,
            Token: user?.Token
          });
        } catch (error) {
          console.error('Error confirmando lectura de mensajes:', error);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      // Solo mostrar alerta si no tenemos mensajes mostrados
      if (messages.length === 0) {
        Alert.alert("Error", "No se pudieron cargar los mensajes");
      }
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const filtros = {
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: nextPage,
        Rows: 20,
        UsuarioID: null,
        Token: user?.Token,
      };
      const response = await ChatApiService.consultarMensajes(filtros);
      const apiMessages = response.data || [];
      if (apiMessages.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      const formattedNewMessages = formatMessagesForChat(apiMessages);
      // Filter out duplicates
      const uniqueNewMessages = formattedNewMessages.filter(newMsg => !messages.find(m => m._id === newMsg._id));
      // Append older messages to the end (since inverted list)
      const updatedMessages = [...messages, ...uniqueNewMessages];
      // Sort by date descending (newest first for inverted list)
      updatedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
      await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
      loadPendingMedia(updatedMessages);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
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

  /**
   * Solo verifica si existe en cache.
   * YA NO DESCARGA AUTOMÁTICAMENTE.
   */
  const loadPendingMedia = async (messages) => {
    const mediaPromises = messages
      .filter(msg => msg.pendingMedia)
      .map(async (msg) => {
        try {
          // Check cache ONLY using a lightweight method if possible, 
          // but here we can reuse the service method which now has cache check.
          // However, to strictly preventing download, we should check existence manually here
          // OR rely on the fact that we want to show "Download" button if not in cache.

          // Construct expected URI
          const fileExtension = msg.pendingMedia.params.FileMime?.split('/')[1] || 'jpg';
          const fileName = `${msg.pendingMedia.params.MediaID}.${fileExtension}`;
          const fileUri = ChatApiService.CACHE_DIR + fileName; // Asumiendo que es accesible desde aquí o usamos global helper

          const fileInfo = await ChatStorageService.checkFileExists(fileUri); // We might need a helper, or just use FileSystem directly if we import it

          // To make it simpler without importing Expo FileSystem here (already imported? Yes):
          // We can just try to "get" it from service if we trust service won't download. 
          // But service DOES download if not found.
          // So we need a "checkOnly" flag or consistent path logic.

          // Simpler approach: We know where ChatApiService stores files. 
          // Let's assume we can ask ChatServices or just try to find it.

          return { id: msg._id, pending: true }; // Default to pending unless we find it
        } catch (error) {
          return { id: msg._id, error: true };
        }
      });

    // Actually, properly implementing:
    // We want to "resolve" ONLY the ones that are ALREADY on disk. 
    // ChatApiService.obtenerMediaWhatsApp downloads if missing. We don't want that.

    // Let's iterate and update state only for cached ones.
    const updatedMessages = await Promise.all(messages.map(async (msg) => {
      if (!msg.pendingMedia) return msg;

      const fileExtension = msg.pendingMedia.params.FileMime?.split('/')[1] || 'jpg';
      const fileName = `${msg.pendingMedia.params.MediaID}.${fileExtension}`;
      // Accessing constant from service is hard if not exported, but we know the path.
      // Better to expose a "checkCache" method in ChatApiService.
      const cachedUri = await ChatApiService.checkMediaCache(fileName);

      if (cachedUri) {
        const updatedMsg = { ...msg };
        delete updatedMsg.pendingMedia;
        if (msg.pendingMedia.type === 'image') updatedMsg.image = cachedUri;
        else if (msg.pendingMedia.type === 'audio') updatedMsg.audio = cachedUri;
        else if (msg.pendingMedia.type === 'video') updatedMsg.video = cachedUri;
        else if (msg.pendingMedia.type === 'file') updatedMsg.file = { name: msg.pendingMedia.name, url: cachedUri };
        return updatedMsg;
      }
      return msg;
    }));

    // Only update if changes found? optimize later.
    // We can just save the result.
    setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
    // Don't save to storage yet unless changed? safe to save.
    await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
  };

  const handleMediaDownload = async (message) => {
    // 1. Set Downloading state
    const messagesWithLoading = messages.map(m =>
      m._id === message._id ? { ...m, downloading: true } : m
    );
    setMessages(contact.CuentaMensajeriaContactoID, messagesWithLoading);

    try {
      // 2. Download
      const uri = await ChatApiService.obtenerMediaWhatsApp(message.pendingMedia.params);

      // 3. Update Success
      const finalMessages = messages.map(m => {
        if (m._id === message._id) {
          const updated = { ...m, downloading: false };
          delete updated.pendingMedia;

          if (message.pendingMedia.type === 'image') updated.image = uri;
          else if (message.pendingMedia.type === 'audio') updated.audio = uri;
          else if (message.pendingMedia.type === 'video') updated.video = uri;
          else if (message.pendingMedia.type === 'file') updated.file = { name: message.pendingMedia.name, url: uri };

          return updated;
        }
        return m;
      });

      setMessages(contact.CuentaMensajeriaContactoID, finalMessages);
      await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, finalMessages);

    } catch (error) {
      console.error("Download failed", error);
      Alert.alert("Error", "No se pudo descargar el archivo");
      // Revert loading
      const reverted = messages.map(m =>
        m._id === message._id ? { ...m, downloading: false } : m
      );
      setMessages(contact.CuentaMensajeriaContactoID, reverted);
    }
  };

  const confirmarLecturaMensajes = async () => {
    try {
      // Contar mensajes sin leer (mensajes entrantes no leídos)
      const mensajesSinLeer = messages.filter(msg =>
        msg.user._id === 2 && !msg.read
      );

      if (mensajesSinLeer.length > 0) {
        // Optimistic update
        resetUnreadCount(contact.CuentaMensajeriaContactoID);

        // Llamar al API para confirmar lectura
        await ChatApiService.confirmarLectura({
          CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
          CuentaMensajeriaID: contact.CuentaMensajeriaID,
          Token: user?.Token
        });

        // Opcional: Actualizar el estado local para marcar mensajes como leídos
        // Esto se puede hacer también vía SignalR cuando llegue la actualización
        console.log(`Confirmada lectura de ${mensajesSinLeer.length} mensajes`);
      }
    } catch (error) {
      console.error('Error confirmando lectura de mensajes:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleSend = async (text) => {
    // Debounce: prevenir envíos demasiado rápidos
    if (sendTimeout) return;

    setSendTimeout(setTimeout(() => setSendTimeout(null), 500)); // 500ms debounce
    setSendingMessage(true);

    // Create optimistic message
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

    // Add optimistic message to the beginning (since inverted list)
    const updatedMessages = [optimisticMessage, ...messages];
    setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

    // Send message via API
    try {
      await ChatApiService.enviarMensaje({
        CuentaMensajeriaID: contact.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Mensaje: text,
        Files: [],
        TipoMensaje: 'text',
        Token: user?.Token,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // For now, just log error; optimistic message remains until updated via SignalR
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImagePress = (imageUri) => {
    setCurrentImage(imageUri);
    setImageViewerVisible(true);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return "0:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoPress = (videoUri) => {
    setCurrentVideo(videoUri);
    setVideoViewerVisible(true);
    setIsPlaying(true);
  };

  const handleStartRecording = () => {
    setShowAudioRecorder(true);
  };

  const handleCancelRecording = () => {
    setShowAudioRecorder(false);
  };

  const handleSendAudio = async (audioUri, duration) => {
    setShowAudioRecorder(false);

    // Create optimistic message
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
        type: 'audio',
        localUri: audioUri,
        duration: duration
      }
    };

    // Add optimistic message to the beginning (since inverted list)
    const updatedMessages = [optimisticMessage, ...messages];
    setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

    try {
      // Upload audio to CDN
      const uploadResult = await ChatApiService.subirArchivoAlCDN({
        uri: audioUri,
        type: 'audio/mp4',
        name: `audio_${Date.now()}.m4a`
      });

      const codigoUnico = uploadResult.data[0].CodigoUnico;

      // Format file object like web version
      const file = {
        TipoMensaje: 'audio',
        FileURL: "cdn://" + codigoUnico,
        FileName: `audio_${Date.now()}.m4a`,
        FileMime: 'audio/mp4',
        HttpUrl: `${cdnEndPoint}/api/Files/GetFile?PublicKey=${cdnLlavePublica}&UniqueID=${codigoUnico}&Disposition=Inline`
      };

      // Send message via API
      await ChatApiService.enviarMensaje({
        CuentaMensajeriaID: contact.CuentaMensajeriaID,
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Mensaje: null,
        Files: [file],
        TipoMensaje: 'audio',
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
        type: '*/*',
        multiple: true,
      });

      if (result.canceled) return;

      for (const file of result.assets) {
        // Create optimistic message
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
            type: 'file',
            localUri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
          }
        };

        // Add optimistic message
        const updatedMessages = [optimisticMessage, ...messages];
        setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);

        try {
          // Upload file to CDN
          const uploadResult = await ChatApiService.subirArchivoAlCDN({
            uri: file.uri,
            type: file.mimeType,
            name: file.name
          });

          const codigoUnico = uploadResult.data[0].CodigoUnico;

          // Determine TipoMensaje
          const tipoMensaje = getTipoMensaje(file.mimeType);

          // Format file object
          const fileObj = {
            TipoMensaje: tipoMensaje,
            FileURL: "cdn://" + codigoUnico,
            FileName: file.name,
            FileMime: file.mimeType,
            HttpUrl: `${cdnEndPoint}/api/Files/GetFile?PublicKey=${cdnLlavePublica}&UniqueID=${codigoUnico}&Disposition=Inline`
          };

          // Send message via API
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
          // Remove optimistic message on error
          const filteredMessages = messages.filter(m => m._id !== optimisticMessage._id);
          setMessages(contact.CuentaMensajeriaContactoID, filteredMessages);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  const getTipoMensaje = (mimeType) => {
    if (!mimeType) return null;
    const ext = mimeType.split('/')[1]?.toLowerCase();
    if (['pdf', 'docx', 'doc', 'xlsx', 'xls', 'xml', 'zip', '7z', 'rar'].includes(ext)) return "document";
    if (['png', 'jpg', 'gif', 'jpeg', 'webp'].includes(ext)) return "image";
    if (ext === 'mp4') return "video";
    if (ext === 'mp3') return "audio";
    return null;
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : keyboardOffset}
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

          {showAudioRecorder ? (
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
          setIsPlaying(false);
          setVideoViewerVisible(false);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalVideoContainer}>
            {currentVideo ? (
              <TouchableWithoutFeedback onPress={() => setShowVideoControls(!showVideoControls)}>
                <View style={{ flex: 1, width: '100%', justifyContent: 'center' }}>
                  <Video
                    ref={videoRef}
                    source={{ uri: currentVideo }}
                    style={styles.fullScreenVideo}
                    resizeMode="contain"
                    shouldPlay={isPlaying}
                    onPlaybackStatusUpdate={status => setVideoStatus(status)}
                    onError={(error) => console.error('Video error:', error)}
                  />
                  {showVideoControls && (
                    <View style={styles.videoOverlay}>
                      <TouchableOpacity
                        style={styles.videoCloseButton}
                        onPress={() => {
                          setIsPlaying(false);
                          setVideoViewerVisible(false);
                        }}
                      >
                        <Ionicons name="close" size={28} color="white" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.videoPlayButton}
                        onPress={() => {
                          if (videoStatus.isPlaying) {
                            videoRef.current.pauseAsync();
                          } else {
                            videoRef.current.playAsync();
                          }
                        }}
                      >
                        <Ionicons
                          name={videoStatus.isPlaying ? "pause" : "play"}
                          size={50}
                          color="white"
                        />
                      </TouchableOpacity>

                      <View style={styles.videoBottomControls}>
                        <Text style={styles.videoTimeText}>
                          {formatTime(videoStatus.positionMillis)}
                        </Text>
                        <Slider
                          style={{ flex: 1, marginHorizontal: 10 }}
                          minimumValue={0}
                          maximumValue={videoStatus.durationMillis || 1}
                          value={videoStatus.positionMillis || 0}
                          onSlidingComplete={async (value) => {
                            await videoRef.current.setPositionAsync(value);
                          }}
                          minimumTrackTintColor="#25D366"
                          maximumTrackTintColor="rgba(255,255,255,0.5)"
                          thumbTintColor="#25D366"
                        />
                        <Text style={styles.videoTimeText}>
                          {formatTime(videoStatus.durationMillis)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <View style={styles.noVideoContainer}>
                <Text style={styles.noVideoText}>No se pudo cargar el video</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View >
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
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  videoPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  videoTimeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
});

export default ChatScreen;