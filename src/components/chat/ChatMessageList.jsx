import React, { useRef, useEffect } from "react";
import { FlatList, StyleSheet, RefreshControl } from "react-native";
import ChatBubble from "./ChatBubble";
import ChatDaySeparator from "./ChatDaySeparator";

const ChatMessageList = ({
    messages,
    currentUserId,
    onImagePress,
    onVideoPress,
    onRefresh,
    refreshing = false,
}) => {
    const flatListRef = useRef(null);

    // Scroll to bottom ONLY on initial load
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            // Wait for content to render before scrolling
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 300);
        }
    }, [messages.length]);

    const shouldShowDaySeparator = (currentMsg, previousMsg) => {
        if (!previousMsg) return true;

        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const previousDate = new Date(previousMsg.createdAt).toDateString();

        return currentDate !== previousDate;
    };

    // Reverse messages to show newest at bottom without inverted
    const reversedMessages = [...messages].reverse();

    const renderItem = ({ item, index }) => {
        const isSentByMe = item.user._id === currentUserId;
        const previousMessage = index > 0 ? reversedMessages[index - 1] : null;
        const showDaySeparator = shouldShowDaySeparator(item, previousMessage);

        return (
            <>
                {showDaySeparator && <ChatDaySeparator date={item.createdAt} />}
                <ChatBubble
                    message={item}
                    isSentByMe={isSentByMe}
                    onImagePress={onImagePress}
                    onVideoPress={onVideoPress}
                />
            </>
        );
    };

    return (
        <FlatList
            ref={flatListRef}
            data={reversedMessages}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            removeClippedSubviews={false}
            maxToRenderPerBatch={20}
            windowSize={21}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
            }}
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
});

export default ChatMessageList;

