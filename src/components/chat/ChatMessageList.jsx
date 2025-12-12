import React, { useRef, useEffect } from "react";
import { FlatList, StyleSheet, RefreshControl, View, ActivityIndicator, Text } from "react-native";
import ChatBubble from "./ChatBubble";
import ChatDaySeparator from "./ChatDaySeparator";

const ChatMessageList = ({
    messages,
    currentUserId,
    onImagePress,
    onVideoPress,
    onRefresh,
    refreshing = false,
    onMediaDownload,
    onEndReached,
    loadingMore = false,
}) => {
    const flatListRef = useRef(null);

    const shouldShowDaySeparator = (currentMsg, previousMsg) => {
        if (!previousMsg) return true;

        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const previousDate = new Date(previousMsg.createdAt).toDateString();

        return currentDate !== previousDate;
    };

    const renderItem = ({ item, index }) => {
        const isSentByMe = item.user._id === currentUserId;
        // In inverted list, messages are [Newest ... Oldest]
        // So the "previous" (chronologically older) message is at index + 1
        const olderMessage = messages[index + 1];
        const showDaySeparator = shouldShowDaySeparator(item, olderMessage);

        return (
            <View style={styles.messageContainer}>
                {showDaySeparator && <ChatDaySeparator date={item.createdAt} />}
                <ChatBubble
                    message={item}
                    isSentByMe={isSentByMe}
                    onImagePress={onImagePress}
                    onVideoPress={onVideoPress}
                    onMediaDownload={onMediaDownload}
                />
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#337ab7" />
                <Text style={styles.footerText}>Cargando más mensajes...</Text>
            </View>
        );
    };

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => `${item._id}-${item.createdAt.getTime()}`}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            inverted={true}
            removeClippedSubviews={true}  // Activar virtualización
            maxToRenderPerBatch={5}       // Reducir batch size
            windowSize={10}               // Ventana más pequeña
            initialNumToRender={10}       // Menos elementos iniciales
            updateCellsBatchingPeriod={50} // Reducir frecuencia de updates
            getItemLayout={(data, index) => ({
                length: 100, // Altura promedio estimada
                offset: 100 * index,
                index
            })}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    contentContainer: {
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    messageContainer: {
        flexDirection: 'column',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    footerText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
});

export default ChatMessageList;

