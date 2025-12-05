import React, { useRef, useEffect } from "react";
import { FlatList, StyleSheet, RefreshControl } from "react-native";
import ChatBubble from "./ChatBubble";
import ChatDaySeparator from "./ChatDaySeparator";

const ChatMessageList = ({
    messages,
    currentUserId,
    onImagePress,
    onRefresh,
    refreshing = false,
}) => {
    const flatListRef = useRef(null);

    // Scroll to bottom when messages first load
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [messages.length === 0 ? null : messages[0]?._id]);

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
        const nextMessage = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
        const showDaySeparator = shouldShowDaySeparator(item, nextMessage);

        return (
            <>
                {showDaySeparator && <ChatDaySeparator date={item.createdAt} />}
                <ChatBubble
                    message={item}
                    isSentByMe={isSentByMe}
                    onImagePress={onImagePress}
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
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
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

