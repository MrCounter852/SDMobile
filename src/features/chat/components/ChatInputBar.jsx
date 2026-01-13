import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ChatInputBar = ({
  onSend,
  onStartRecording,
  placeholder = "Escribe un mensaje...",
  onAttachFile,
}) => {
  const [text, setText] = useState("");
  const insets = useSafeAreaInsets();
  const [paddingBottom, setPaddingBottom] = useState(60);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  const handleButtonPress = () => {
    if (text.trim()) {
      handleSend();
    } else if (onStartRecording) {
      onStartRecording();
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
        <TouchableOpacity onPress={onAttachFile} style={styles.attachButton}>
          <Ionicons name="attach-outline" size={25} color="#999" />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["#337ab7", "#88E782"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sendButton}
      >
        <TouchableOpacity
          onPress={handleButtonPress}
          disabled={!text.trim() && !onStartRecording}
          style={styles.sendButtonTouchable}
        >
          <Ionicons
            name={text.trim() ? "send" : "mic"}
            size={20}
            color="white"
          />
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
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
    position: "relative",
  },
  textInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ced4da",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
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
  attachButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
});

export default ChatInputBar;
