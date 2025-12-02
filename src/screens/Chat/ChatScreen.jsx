import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Keyboard,
  RefreshControl,
  Modal,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GiftedChat, InputToolbar, Day } from "react-native-gifted-chat";
import { useChatStore } from "../../core/chatStore";
import ChatApiService from "../../services/chat/chatService";
import { useGlobal } from "../../core/global";
import { LinearGradient } from "expo-linear-gradient";

// 1. IMPORTANTE: Usamos Image de expo-image
import { Image } from "expo-image";
import ZoomableImage from '../../assets/common/ZoomableImage';

const ChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // Blurhash para mientras carga la imagen (opcional, da un efecto pro)
  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const { contact } = route.params;
  const {
    messages,
    messagesLoading,
    setMessages,
    setMessagesLoading,
    sendingMessage,
    setSendingMessage,
    attachments,
    clearAttachments,
    setSelectedContact,
  } = useChatStore();

  const { user } = useGlobal();
  const [isTyping, setIsTyping] = useState(false);

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
        Page: 1, Rows: 50, UsuarioID: null, Token: user?.Token,
      };
      const response = await ChatApiService.consultarMensajes(filtros);
      // Asumimos que formatMessagesForGiftedChat está definido arriba o importado
      const formattedMessages = await formatMessagesForGiftedChat(response.data || []);
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadMessages(); };

  // He incluido la función aquí para que el código sea completo, 
  // asegurando que 'formattedMsg.image' tenga la URL correcta.
  const formatMessagesForGiftedChat = async (apiMessages) => {
    const formattedMessages = [];
    for (const msg of apiMessages) {
        const formattedMsg = {
            _id: msg.CuentaMensajeriaMensajeID,
            text: msg.Texto || "",
            createdAt: new Date(msg.Fecha),
            user: { _id: msg.Recepcion ? 2 : 1, name: msg.Recepcion ? contact?.Nombre : user?.NombreCompleto },
            // ... resto de status ...
            sent: msg.Status === "sent",
            delivered: msg.Status === "delivered",
            read: msg.Status === "read",
        };

        // Lógica simplificada de medios para el ejemplo
        if (msg.HttpUrl && (msg.TipoMensaje === 'image' || msg.TipoMensaje === 'sticker')) {
            formattedMsg.image = msg.HttpUrl;
        }
        // ... tu lógica de fetch media existente ...
        
        formattedMessages.push(formattedMsg);
    }
    return formattedMessages;
  };

  const onSend = useCallback(async (messagesToSend = []) => {
      // ... tu lógica de onSend ...
      // Solo simulación para que compile
      setSendingMessage(true);
      setTimeout(() => { setSendingMessage(false); }, 1000);
  }, []);


  const renderSend = (props) => (
    <LinearGradient
      colors={["#337ab7", "#88E782"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.sendButton}
    >
      <TouchableOpacity onPress={() => props.text && props.onSend && props.onSend({ text: props.text.trim() }, true)}>
        <Ionicons name="send" size={20} color="white" />
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar {...props} containerStyle={styles.inputToolbar} primaryStyle={styles.inputPrimary} />
  );

  const renderMessageText = (props) => {
    const { currentMessage } = props;
    return (
      <View style={[styles.messageTextContainer, currentMessage.user._id === 1 ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={[styles.messageText, currentMessage.user._id === 1 ? styles.sentMessageText : styles.receivedMessageText]}>
          {currentMessage.text}
        </Text>
        <Text style={styles.messageTime}>
          {currentMessage.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
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
    <>
      <View style={[styles.container]}>
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{ _id: 1, name: user?.NombreCompleto || "Yo" }}
            placeholder="Escribe un mensaje..."
            showAvatarForEveryMessage={false}
            renderSend={renderSend}
            renderInputToolbar={renderInputToolbar}
            renderMessageText={renderMessageText}
            isTyping={isTyping}
            // Fix Android keyboard
            messagesContainerStyle={[styles.messagesContainer, { paddingBottom: Platform.OS === 'android' ? 0 : 0 }]}
            textInputStyle={styles.textInput}
            scrollToBottomStyle={styles.scrollToBottom}
            alwaysShowSend={true}
            renderUsernameOnMessage={false}
            bottomOffset={Platform.OS === "ios" ? insets.bottom : 0}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderAvatar={null}
            renderDay={(props) => (
               <Day {...props} textStyle={{ color: '#fff', fontWeight: 'bold' }} wrapperStyle={{ backgroundColor: '#337ab7', borderRadius: 12, marginTop: 10, marginBottom: 10 }} />
            )}
            renderBubble={(props) => {
              const { currentMessage } = props;
              const isSentByMe = currentMessage.user._id === 1;
              return (
                <View style={[styles.bubble, isSentByMe ? styles.sentBubble : styles.receivedBubble]}>
                  {currentMessage.text && (
                    <Text style={[styles.bubbleText, isSentByMe ? styles.sentBubbleText : styles.receivedBubbleText]}>
                      {currentMessage.text}
                    </Text>
                  )}
                  {currentMessage.image && (
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentImage(currentMessage.image);
                        setImageViewerVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: currentMessage.image }}
                        style={styles.messageImage}
                        contentFit="cover"
                        transition={500}
                        placeholder={blurhash}
                        cachePolicy="memory-disk" 
                      />
                    </TouchableOpacity>
                  )}
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, isSentByMe ? styles.sentBubbleTime : styles.receivedBubbleTime]}>
                      {currentMessage.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    {isSentByMe && (
                      <View style={styles.statusContainer}>
                        {currentMessage.sent && <Ionicons name="checkmark" size={14} color="#999" />}
                        {currentMessage.delivered && <Ionicons name="checkmark-done" size={14} color="#999" />}
                        {currentMessage.read && <Ionicons name="checkmark-done" size={14} color="#337ab7" />}
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </SafeAreaView>

        {sendingMessage && (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator size="small" color="#337ab7" />
            <Text style={styles.sendingText}>Enviando...</Text>
          </View>
        )}
      </View>

      {/* 3. REFACTOR: Modal Personalizado usando Expo Image */}
      {/* Esto reemplaza a ImageViewing. Es más ligero y controlable. */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.modalBackground}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Botón cerrar */}
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setImageViewerVisible(false)}
                hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
            >
              <Ionicons name="close-circle" size={36} color="white" />
            </TouchableOpacity>

            {/* Imagen Full Screen */}
            <View style={styles.modalImageContainer}>
                <ZoomableImage
                    source={currentImage ? { uri: currentImage } : null}
                    style={styles.fullScreenImage}
                />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ... Tus estilos anteriores se mantienen ...
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerButton: { marginRight: 16, paddingHorizontal: 12, paddingVertical: 6 },
  headerButtonText: { color: "#337ab7", fontSize: 16, fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  messagesContainer: { backgroundColor: "#f8f9fa" },
  inputToolbar: { borderTopColor: "#e9ecef", borderTopWidth: 1, paddingHorizontal: 8, paddingVertical: 8 },
  inputPrimary: { alignItems: "center" },
  textInput: { backgroundColor: "#f8f9fa", borderRadius: 20, borderWidth: 1, borderColor: "#ced4da", paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 8, fontSize: 16 },
  sendButton: { borderRadius: 100, padding: 10 },
  messageTextContainer: { padding: 8, borderRadius: 8, maxWidth: "80%" },
  sentMessage: { backgroundColor: "#337ab7", alignSelf: "flex-end" },
  receivedMessage: { backgroundColor: "#e9ecef", alignSelf: "flex-start" },
  messageText: { fontSize: 16 },
  sentMessageText: { color: "#fff" },
  receivedMessageText: { color: "#333" },
  messageTime: { fontSize: 12, color: "#666", marginTop: 4 },
  bubble: { padding: 12, marginVertical: 2, maxWidth: "80%" },
  sentBubble: { backgroundColor: "#88E782", alignSelf: "flex-end", marginLeft: 60, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18 },
  receivedBubble: { backgroundColor: "#e9ecef", alignSelf: "flex-start", marginRight: 60, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  bubbleText: { fontSize: 16 },
  sentBubbleText: { color: "#333" },
  receivedBubbleText: { color: "#333" },
  bubbleFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  bubbleTime: { fontSize: 12, color: "#666" },
  sentBubbleTime: { color: "#333" },
  receivedBubbleTime: { color: "#333" },
  statusContainer: { flexDirection: "row", alignItems: "center", marginLeft: 4 },
  
  // Estilos Actualizados para Expo Image
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#e1e4e8', // Color de fondo mientras carga
  },
  
  scrollToBottom: { backgroundColor: "#337ab7" },
  sendingIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e9ecef" },
  sendingText: { marginLeft: 8, fontSize: 14, color: "#666" },

  // Nuevos estilos para el Modal
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Fondo casi negro
  },
  closeButton: {
    position: 'absolute',
    top: 50, // Ajustado para que no pegue con el notch
    right: 20,
    zIndex: 10,
    padding: 5
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  }
});

export default ChatScreen;