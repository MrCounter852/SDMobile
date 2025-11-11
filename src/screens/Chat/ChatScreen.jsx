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
  Image,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { GiftedChat, Send, InputToolbar } from "react-native-gifted-chat";
import { useChatStore } from "../../core/chatStore";
import ChatApiService from "../../core/chatApi";
import { useGlobal } from "../../core/global";
import { LinearGradient } from "expo-linear-gradient";

const ChatScreen = ({ route, navigation }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

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

    loadMessages();
    return () => {
      clearAttachments();
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
      const formattedMessages = formatMessagesForGiftedChat(
        response.data || []
      );
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const formatMessagesForGiftedChat = (apiMessages) => {
    return apiMessages.map((msg) => ({
      _id: msg.CuentaMensajeriaMensajeID,
      text: msg.Texto || "",
      createdAt: new Date(msg.Fecha),
      user: {
        _id: msg.Recepcion ? 2 : 1, // 1 = usuario actual, 2 = contacto
        name: msg.Recepcion ? contact.Nombre : user?.NombreCompleto || "Yo",
        avatar: null, // Puedes agregar avatares si están disponibles
      },
      // Para archivos adjuntos
      ...(msg.FileID && {
        image: msg.HttpUrl,
        file: {
          name: msg.FileName,
          type: msg.FileMime,
          url: msg.HttpUrl,
        },
      }),
      // Estado del mensaje
      sent:
        msg.Status === "sent" ||
        msg.Status === "delivered" ||
        msg.Status === "read",
      received: msg.Recepcion,
      pending: false,
    }));
  };

  const onSend = useCallback(
    async (messagesToSend = []) => {
      const message = messagesToSend[0];

      try {
        setSendingMessage(true);

        // Preparar datos para la API
        const messageData = {
          CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
          Mensaje: message.text,
          Files: attachments.map((att) => ({
            TipoMensaje: att.type,
            FileURL: att.uri,
            FileName: att.name,
            FileMime: att.type,
          })),
          Token: user?.Token,
        };

        // Enviar mensaje
        const response = await ChatApiService.enviarMensaje(messageData);

        if (response.success) {
          // Recargar mensajes para mostrar el enviado
          await loadMessages();

          // Limpiar adjuntos
          clearAttachments();
        } else {
          throw new Error(response.message || "Error al enviar mensaje");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "No se pudo enviar el mensaje");
      } finally {
        setSendingMessage(false);
      }
    },
    [attachments, contact, user, loadMessages, clearAttachments]
  );

  const renderSend = (props) => (
    <LinearGradient
      colors={["#337ab7", "#88E782"]} // Replace with your desired start and end colors (e.g., blue to darker blue)
      start={{ x: 0, y: 0 }} // Optional: gradient start point (top-left)
      end={{ x: 1, y: 1 }} // Optional: gradient end point (bottom-right)
      style={styles.sendButton}
    >
      <TouchableOpacity
        onPress={() => {
          if (props.text && props.onSend) {
            props.onSend({ text: props.text.trim() }, true);
          }
        }}
      >
        <Ionicons name="send" size={20} color="white" />
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimary}
    />
  );

  const renderMessageText = (props) => {
    const { currentMessage } = props;
    return (
      <View
        style={[
          styles.messageTextContainer,
          currentMessage.user._id === 1
            ? styles.sentMessage
            : styles.receivedMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            currentMessage.user._id === 1
              ? styles.sentMessageText
              : styles.receivedMessageText,
          ]}
        >
          {currentMessage.text}
        </Text>
        <Text style={styles.messageTime}>
          {currentMessage.createdAt.toLocaleDateString() +
            " " +
            currentMessage.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
    <View style={[styles.container]}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{
              _id: 1,
              name: user?.NombreCompleto || "Yo",
            }}
            placeholder="Escribe un mensaje..."
            showAvatarForEveryMessage={false}
            renderSend={renderSend}
            renderInputToolbar={renderInputToolbar}
            renderMessageText={renderMessageText}
            isTyping={isTyping}
            messagesContainerStyle={styles.messagesContainer}
            textInputStyle={styles.textInput}
            scrollToBottomStyle={styles.scrollToBottom}
            alwaysShowSend={true}
            renderUsernameOnMessage={false}
            renderAvatarOnTop={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderBubble={(props) => {
              const { currentMessage } = props;
              return (
                <View
                  style={[
                    styles.bubble,
                    currentMessage.user._id === 1
                      ? styles.sentBubble
                      : styles.receivedBubble,
                  ]}
                >
                  {currentMessage.text && (
                    <Text
                      style={[
                        styles.bubbleText,
                        currentMessage.user._id === 1
                          ? styles.sentBubbleText
                          : styles.receivedBubbleText,
                      ]}
                    >
                      {currentMessage.text}
                    </Text>
                  )}
                  {currentMessage.image && (
                    <Image
                      source={{ uri: currentMessage.image }}
                      style={styles.messageImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={[
                      styles.bubbleTime,
                      currentMessage.user._id === 1
                        ? styles.sentBubbleTime
                        : styles.receivedBubbleTime,
                    ]}
                  >
                    {currentMessage.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  messagesContainer: {
    backgroundColor: "#f8f9fa",
  },
  inputToolbar: {
    borderTopColor: "#e9ecef",
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputPrimary: {
    alignItems: "center",
  },
  textInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ced4da",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 100,
    padding: 10,
  },
  messageTextContainer: {
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
  },
  sentMessage: {
    backgroundColor: "#337ab7",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#e9ecef",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: "#fff",
  },
  receivedMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  bubble: {
    padding: 12,
    marginVertical: 2,
    maxWidth: "80%",
  },
  sentBubble: {
    backgroundColor: "#337ab7",
    alignSelf: "flex-end",
    marginLeft: 60,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  receivedBubble: {
    backgroundColor: "#e9ecef",
    alignSelf: "flex-start",
    marginRight: 60,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleText: {
    fontSize: 16,
  },
  sentBubbleText: {
    color: "#fff",
  },
  receivedBubbleText: {
    color: "#333",
  },
  bubbleTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  sentBubbleTime: {
    color: "#fff",
  },
  receivedBubbleTime: {
    color: "#333",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 4,
  },
  scrollToBottom: {
    backgroundColor: "#337ab7",
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
