import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useChatStore } from '../../core/chatStore';
import ChatApiService from '../../services/chat/chatService';
import ChatStorageService from '../../services/chat/chatStorageService';
import { formatMessagesForChat } from '../../utils/chatUtils';

export const useChatMessages = (contact, user) => {
  const {
    messagesLoading,
    setMessages,
    setMessagesLoading,
    resetUnreadCount,
  } = useChatStore();

  const messages = useChatStore(
    useCallback(
      (state) => state.chats[contact.CuentaMensajeriaContactoID],
      [contact.CuentaMensajeriaContactoID]
    )
  ) || [];

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Use a ref to prevent concurrent executions of loadPendingMedia that could cause race conditions
  const isSyncingMedia = useRef(false);

  const loadPendingMedia = useCallback(async (currentMessages) => {
    if (isSyncingMedia.current) return;
    isSyncingMedia.current = true;

    try {
      let changed = false;
      const updatedMessages = await Promise.all(currentMessages.map(async (msg) => {
        if (!msg.pendingMedia) return msg;

        const fileExtension = msg.pendingMedia.params.FileMime?.split('/')[1] || 'jpg';
        const fileName = `${msg.pendingMedia.params.MediaID}.${fileExtension}`;
        const cachedUri = await ChatApiService.checkMediaCache(fileName);

        if (cachedUri) {
          changed = true;
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

      if (changed) {
        setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
        await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
      }
    } catch (error) {
      console.error("Error in loadPendingMedia:", error);
    } finally {
      isSyncingMedia.current = false;
    }
  }, [contact.CuentaMensajeriaContactoID, setMessages]);

  const confirmarLecturaMensajes = useCallback(async (currentMessages) => {
    try {
      const msgs = currentMessages || messagesRef.current;
      const mensajesSinLeer = msgs.filter(msg => msg.user._id === 2 && !msg.read);

      if (mensajesSinLeer.length > 0) {
        resetUnreadCount(contact.CuentaMensajeriaContactoID);
        await ChatApiService.confirmarLectura({
          CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
          CuentaMensajeriaID: contact.CuentaMensajeriaID,
          Token: user?.Token
        });
      }
    } catch (error) {
      console.error('Error confirmando lectura de mensajes:', error);
    }
  }, [contact.CuentaMensajeriaContactoID, contact.CuentaMensajeriaID, resetUnreadCount, user?.Token]);

  const loadMessages = useCallback(async (isInitial = true) => {
    if (isInitial) setRefreshing(true);
    
    try {
      let currentMessagesInStore = messagesRef.current;
      
      if (currentMessagesInStore.length === 0) {
        currentMessagesInStore = await ChatStorageService.getMessages(contact.CuentaMensajeriaContactoID);
        if (currentMessagesInStore.length > 0) {
          setMessages(contact.CuentaMensajeriaContactoID, currentMessagesInStore);
          loadPendingMedia(currentMessagesInStore);
          setMessagesLoading(false);
        } else {
          setMessagesLoading(true);
        }
      }

      const filtros = {
        CuentaMensajeriaContactoID: contact.CuentaMensajeriaContactoID,
        Page: 1,
        Rows: 20,
        UsuarioID: null,
        Token: user?.Token,
      };

      const response = await ChatApiService.consultarMensajes(filtros);
      const apiMessages = response.data || [];
      const formattedApiMessages = formatMessagesForChat(apiMessages, contact, user);

      const newMessages = formattedApiMessages.filter(apiMsg => !currentMessagesInStore.find(m => m._id === apiMsg._id));
      
      if (newMessages.length > 0 || currentMessagesInStore.length === 0) {
        let mergedMessages = [...newMessages, ...currentMessagesInStore];
        mergedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setMessages(contact.CuentaMensajeriaContactoID, mergedMessages);
        await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, mergedMessages);
        loadPendingMedia(mergedMessages);
        confirmarLecturaMensajes(mergedMessages);
      } else {
        confirmarLecturaMensajes(currentMessagesInStore);
      }
      
      setCurrentPage(1);
      setHasMore(apiMessages.length === 20);
    } catch (error) {
      console.error("Error loading messages:", error);
      if (messagesRef.current.length === 0) {
        Alert.alert("Error", "No se pudieron cargar los mensajes");
      }
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  }, [contact, user, setMessages, setMessagesLoading, loadPendingMedia, confirmarLecturaMensajes]);

  const loadMoreMessages = useCallback(async () => {
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
        return;
      }

      const currentMsgs = messagesRef.current;
      const formattedNewMessages = formatMessagesForChat(apiMessages, contact, user);
      const uniqueNewMessages = formattedNewMessages.filter(newMsg => !currentMsgs.find(m => m._id === newMsg._id));
      
      if (uniqueNewMessages.length > 0) {
        const updatedMessages = [...currentMsgs, ...uniqueNewMessages];
        updatedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
        await ChatStorageService.saveMessages(contact.CuentaMensajeriaContactoID, updatedMessages);
        loadPendingMedia(updatedMessages);
      }
      
      setCurrentPage(nextPage);
      setHasMore(apiMessages.length === 20);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, contact, user, setMessages, loadPendingMedia]);

  const handleMediaDownload = useCallback(async (message) => {
    const currentMsgs = messagesRef.current;
    const messagesWithLoading = currentMsgs.map(m =>
      m._id === message._id ? { ...m, downloading: true } : m
    );
    setMessages(contact.CuentaMensajeriaContactoID, messagesWithLoading);

    try {
      const uri = await ChatApiService.obtenerMediaWhatsApp(message.pendingMedia.params);
      
      const finalMessages = messagesRef.current.map(m => {
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
      const reverted = messagesRef.current.map(m =>
        m._id === message._id ? { ...m, downloading: false } : m
      );
      setMessages(contact.CuentaMensajeriaContactoID, reverted);
    }
  }, [contact.CuentaMensajeriaContactoID, setMessages]);

  return {
    messages,
    messagesLoading,
    refreshing,
    loadingMore,
    hasMore,
    loadMessages,
    loadMoreMessages,
    handleMediaDownload,
    confirmarLecturaMensajes,
  };
};
