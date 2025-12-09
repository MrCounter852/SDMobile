import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as IntentLauncher from 'expo-intent-launcher';
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
const ChatBubble = ({ message, isSentByMe, onImagePress, onVideoPress, onMediaDownload }) => {
    const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';


    const getFileColor = (fileName) => {
        if (!fileName) return '#666';
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'pdf': return '#e74c3c'; // red
            case 'doc':
            case 'docx': return '#3498db'; // blue
            case 'xls':
            case 'xlsx': return '#27ae60'; // green
            default: return '#666';
        }
    };

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

    const openDocument = async (fileUrl, fileName) => {
        try {
            if (Platform.OS === 'android') {
                // On Android, use IntentLauncher to show "Open with" dialog
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: fileUrl,
                    type: getMimeType(fileName),
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                });
            } else {
                // On iOS, Linking.openURL will show the share sheet with "Open in" options
                await Linking.openURL(fileUrl);
            }
        } catch (error) {
            console.error('Error opening document:', error);
            // Fallback to regular Linking
            Linking.openURL(fileUrl);
        }
    };

    const getMimeType = (fileName) => {
        if (!fileName) return 'application/octet-stream';
        const ext = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'rtf': 'application/rtf',
            'csv': 'text/csv',
        };
        return mimeTypes[ext] || 'application/octet-stream';
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
            {message.pendingMedia && message.pendingMedia.type === 'image' && (
                <View style={styles.messageImagePlaceholder}>
                    {message.downloading ? (
                        <ActivityIndicator size="small" color="#999" />
                    ) : (
                        <TouchableOpacity style={styles.downloadButton} onPress={() => onMediaDownload(message)}>
                            <Ionicons name="cloud-download-outline" size={32} color="#666" />
                            <Text style={styles.downloadText}>Descargar Imagen</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {message.file && (
                <TouchableOpacity onPress={() => Linking.openURL(message.file.url)} style={styles.fileContainer}>
                    <Ionicons name="document" size={30} color={getFileColor(message.file.name)} />
                    <Text style={styles.fileName}>{message.file.name}</Text>
                </TouchableOpacity>
            )}
            {message.pendingMedia && message.pendingMedia.type === 'file' && (
                <View style={styles.filePlaceholder}>
                    {message.downloading ? (
                        <ActivityIndicator size="small" color="#999" />
                    ) : (
                        <TouchableOpacity style={styles.downloadRow} onPress={() => onMediaDownload(message)}>
                            <Ionicons name="cloud-download-outline" size={24} color="#666" />
                            <Text style={styles.fileName}>{message.pendingMedia.name || 'Descargar Archivo'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {message.audio && !message.mediaExpired && (
                <AudioPlayer uri={message.audio} />
            )}
            {message.pendingMedia && message.pendingMedia.type === 'audio' && (
                <View style={styles.audioPlaceholder}>
                    {message.downloading ? (
                        <ActivityIndicator size="small" color="#999" />
                    ) : (
                        <TouchableOpacity style={styles.downloadRow} onPress={() => onMediaDownload(message)}>
                            <Ionicons name="cloud-download-outline" size={24} color="#666" paddingRight={8} />
                            <Text style={styles.downloadText}>Descargar Audio</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {message.video && !message.mediaExpired && (
                <VideoPlayer uri={message.video} onFullScreen={onVideoPress} />
            )}
            {message.pendingMedia && message.pendingMedia.type === 'video' && (
                <View style={styles.videoPlaceholder}>
                    {message.downloading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <TouchableOpacity style={styles.downloadButton} onPress={() => onMediaDownload(message)}>
                            <Ionicons name="cloud-download-outline" size={32} color="#fff" />
                            <Text style={[styles.downloadText, { color: '#fff' }]}>Descargar Video</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {message.mediaExpired && (
                <View style={styles.expiredMedia}>
                    <Ionicons name="alert-circle-outline" size={50} color="#999" />
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
    fileContainer: {
        minWidth: 200,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginTop: 4,
    },
    messageImagePlaceholder: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#e1e4e8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filePlaceholder: {
        minWidth: 200,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginTop: 4,
    },
    audioPlaceholder: {
        minWidth: 250,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginTop: 4,
    },
    audioPlaceholderText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
    },
    fileName: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        flex: 1,
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

    videoPlaceholder: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 8,
        marginTop: 4,
    },
    downloadButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    downloadText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
});

export default ChatBubble;
