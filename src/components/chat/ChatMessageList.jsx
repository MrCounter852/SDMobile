import React from "react";
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
    const shouldShowDaySeparator = (currentMsg, previousMsg) => {
        if (!previousMsg) return true;

        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const previousDate = new Date(previousMsg.createdAt).toDateString();

        return currentDate !== previousDate;
    };

    const renderItem = ({ item, index }) => {
        const isSentByMe = item.user._id === currentUserId;
        const previousMessage = index < messages.length - 1 ? messages[index + 1] : null;
        const showDaySeparator = shouldShowDaySeparator(item, previousMessage);

        return (
            <>
                <ChatBubble
                    message={item}
                    isSentByMe={isSentByMe}
                    onImagePress={onImagePress}
                />
                {showDaySeparator && <ChatDaySeparator date={item.createdAt} />}
            </>
        );
    };

    return (
        <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            inverted
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
