import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const ChatInputBar = ({ onSend, placeholder = "Escribe un mensaje..." }) => {
    const [text, setText] = useState("");
    const insets = useSafeAreaInsets();
    const [paddingBottom, setPaddingBottom] = useState(insets.bottom || 8);

    useEffect(() => {
        // Inicializar padding
        setPaddingBottom(insets.bottom || 8);

        const keyboardWillShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const keyboardWillHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(keyboardWillShow, () => {
            // Al mostrar teclado, eliminar el padding extra del safe area
            setPaddingBottom(8);
        });
        const hideSubscription = Keyboard.addListener(keyboardWillHide, () => {
            // Al ocultar, restaurar el padding del safe area
            setPaddingBottom(insets.bottom || 8);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [insets.bottom]);

    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText("");
        }
    };

    return (
        <View style={{ ...styles.container, paddingBottom: paddingBottom }}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    multiline
                    maxLength={1000}
                />
            </View>

            <LinearGradient
                colors={["#337ab7", "#88E782"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
            >
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!text.trim()}
                    style={styles.sendButtonTouchable}
                >
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e9ecef",
    },
    inputContainer: {
        flex: 1,
        marginRight: 8,
    },
    textInput: {
        backgroundColor: "#f8f9fa",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ced4da",
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        borderRadius: 100,
        padding: 10,
    },
    sendButtonTouchable: {
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ChatInputBar;
