import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

const ChatBubble = ({ message, isSentByMe, onImagePress }) => {
    const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

    const renderTextWithLinks = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <Text
                        key={index}
                        style={{ color: 'blue', textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(part)}
                    >
                        {part}
                    </Text>
                );
            }
            return <Text key={index}>{part}</Text>;
        });
    };

    return (
        <View style={[styles.bubble, isSentByMe ? styles.sentBubble : styles.receivedBubble]}>
            {message.text && (
                <Text style={[styles.bubbleText, isSentByMe ? styles.sentBubbleText : styles.receivedBubbleText]}>
                    {renderTextWithLinks(message.text)}
                </Text>
            )}

            {message.image && !message.mediaExpired && (
                <TouchableOpacity onPress={() => onImagePress(message.image)}>
                    <Image
                        source={{ uri: message.image }}
                        style={styles.messageImage}
                        contentFit="cover"
                        transition={500}
                        placeholder={blurhash}
                        cachePolicy="memory-disk"
                    />
                </TouchableOpacity>
            )}

            {message.mediaExpired && (
                <View style={styles.expiredMedia}>
                    <Ionicons name="image-outline" size={50} color="#999" />
                    <Text style={styles.expiredText}>Archivo no disponible</Text>
                </View>
            )}

            <View style={styles.bubbleFooter}>
                <Text style={[styles.bubbleTime, isSentByMe ? styles.sentBubbleTime : styles.receivedBubbleTime]}>
                    {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>

                {isSentByMe && (
                    <View style={styles.statusContainer}>
                        {message.sent && <Ionicons name="checkmark" size={14} color="#999" />}
                        {message.delivered && <Ionicons name="checkmark-done" size={14} color="#999" />}
                        {message.read && <Ionicons name="checkmark-done" size={14} color="#337ab7" />}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        padding: 12,
        marginVertical: 2,
        maxWidth: "80%",
    },
    sentBubble: {
        backgroundColor: "#88E782",
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
        color: "#333",
    },
    receivedBubbleText: {
        color: "#333",
    },
    bubbleFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
    },
    bubbleTime: {
        fontSize: 12,
        color: "#666",
    },
    sentBubbleTime: {
        color: "#333",
    },
    receivedBubbleTime: {
        color: "#333",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 4,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#e1e4e8',
    },
    expiredMedia: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    expiredText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default ChatBubble;
