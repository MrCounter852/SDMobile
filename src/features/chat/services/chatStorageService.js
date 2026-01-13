import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_KEY_PREFIX = 'chat_messages_';
const CONTACTS_KEY = 'chat_contacts_list';

class ChatStorageService {

    // === MENSAJES ===

    /**
     * Obtener mensajes locales de un contacto
     * @param {number} contactId 
     * @returns {Promise<Array>} Array de mensajes
     */
    async getMessages(contactId) {
        try {
            const key = `${MESSAGES_KEY_PREFIX}${contactId}`;
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? this.parseMessages(JSON.parse(jsonValue)) : [];
        } catch (e) {
            console.error('Error reading messages from storage:', e);
            return [];
        }
    }

    /**
     * Guardar mensajes de un contacto (sobrescribe)
     * @param {number} contactId 
     * @param {Array} messages 
     */
    async saveMessages(contactId, messages) {
        try {
            const key = `${MESSAGES_KEY_PREFIX}${contactId}`;
            const jsonValue = JSON.stringify(messages);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (e) {
            console.error('Error saving messages to storage:', e);
        }
    }

    /**
     * Agregar un mensaje a la lista local (útil para optimismo UI)
     * @param {number} contactId 
     * @param {Object} message 
     */
    async appendMessage(contactId, message) {
        try {
            const currentMessages = await this.getMessages(contactId);
            const newMessages = [...currentMessages, message];
            await this.saveMessages(contactId, newMessages);
        } catch (e) {
            console.error('Error appending message:', e);
        }
    }

    // === CONTACTOS ===

    /**
     * Obtener lista de contactos guardada
     * @returns {Promise<Array>}
     */
    async getContacts() {
        try {
            const jsonValue = await AsyncStorage.getItem(CONTACTS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading contacts from storage:', e);
            return [];
        }
    }

    /**
     * Guardar lista de contactos
     * @param {Array} contacts 
     */
    async saveContacts(contacts) {
        try {
            const jsonValue = JSON.stringify(contacts);
            await AsyncStorage.setItem(CONTACTS_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving contacts to storage:', e);
        }
    }

    /**
     * Helper para convertir strings de fecha a objetos Date
     * @param {Array} messages 
     * @returns {Array} Mensajes con fechas parseadas
     */
    parseMessages(messages) {
        if (!Array.isArray(messages)) return [];
        return messages.map(msg => ({
            ...msg,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
        }));
    }

    /**
     * Obtener todos los chats guardados localmente
     * @returns {Promise<Object>} Objeto con chats { [contactId]: messages[] }
     */
    async getAllChats() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const messageKeys = keys.filter(key => key.startsWith(MESSAGES_KEY_PREFIX));

            if (messageKeys.length === 0) return {};

            const stores = await AsyncStorage.multiGet(messageKeys);
            const chats = {};

            stores.forEach(([key, value]) => {
                if (value) {
                    const contactId = key.replace(MESSAGES_KEY_PREFIX, '');
                    try {
                        const parsedRaw = JSON.parse(value);
                        chats[contactId] = this.parseMessages(parsedRaw);
                    } catch (e) {
                        console.error(`Error parsing chat ${contactId}:`, e);
                    }
                }
            });

            return chats;
        } catch (e) {
            console.error('Error loading all chats:', e);
            return {};
        }
    }

    /**
     * Limpiar todo el almacenamiento del chat (útil para logout)
     * @param {boolean} keepContacts Si es true, mantiene la lista de contactos
     */
    async clearAll(keepContacts = false) {
        try {
            const keys = await AsyncStorage.getAllKeys();
            let keysToRemove = keys.filter(key => key.startsWith('chat_'));

            if (keepContacts) {
                keysToRemove = keysToRemove.filter(key => key !== CONTACTS_KEY);
            }

            await AsyncStorage.multiRemove(keysToRemove);
        } catch (e) {
            console.error('Error clearing chat storage:', e);
        }
    }
}

export default new ChatStorageService();
