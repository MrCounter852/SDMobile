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
            return jsonValue != null ? JSON.parse(jsonValue) : [];
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
     * Limpiar todo el almacenamiento del chat (útil para logout)
     */
    async clearAll() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const chatKeys = keys.filter(key => key.startsWith('chat_'));
            await AsyncStorage.multiRemove(chatKeys);
        } catch (e) {
            console.error('Error clearing chat storage:', e);
        }
    }
}

export default new ChatStorageService();
