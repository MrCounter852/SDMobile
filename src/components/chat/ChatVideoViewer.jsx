import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { formatTime } from "../../utils/chatUtils";

const ChatVideoViewer = ({ visible, videoUri, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const [showVideoControls, setShowVideoControls] = useState(true);

  const handleClose = () => {
    setIsPlaying(false);
    onClose();
  };

  const handleTogglePlay = () => {
    if (videoStatus.isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.container}>
          {videoUri ? (
            <TouchableWithoutFeedback
              onPress={() => setShowVideoControls(!showVideoControls)}
            >
              <View
                style={{ flex: 1, width: "100%", justifyContent: "center" }}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.fullScreenVideo}
                  resizeMode="contain"
                  shouldPlay={isPlaying}
                  onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
                  onError={(error) => console.error("Video error:", error)}
                />
                {showVideoControls && (
                  <View style={styles.videoOverlay}>
                    <TouchableOpacity
                      style={styles.videoCloseButton}
                      onPress={handleClose}
                    >
                      <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.videoPlayButton}
                      onPress={handleTogglePlay}
                    >
                      <Ionicons
                        name={videoStatus.isPlaying ? "pause" : "play"}
                        size={50}
                        color="white"
                      />
                    </TouchableOpacity>

                    <View style={styles.videoBottomControls}>
                      <Text style={styles.videoTimeText}>
                        {formatTime(videoStatus.positionMillis)}
                      </Text>
                      <Slider
                        style={{ flex: 1, marginHorizontal: 10 }}
                        minimumValue={0}
                        maximumValue={videoStatus.durationMillis || 1}
                        value={videoStatus.positionMillis || 0}
                        onSlidingComplete={async (value) => {
                          await videoRef.current.setPositionAsync(value);
                        }}
                        minimumTrackTintColor="#25D366"
                        maximumTrackTintColor="rgba(255,255,255,0.5)"
                        thumbTintColor="#25D366"
                      />
                      <Text style={styles.videoTimeText}>
                        {formatTime(videoStatus.durationMillis)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          ) : (
            <View style={styles.noVideoContainer}>
              <Text style={styles.noVideoText}>No se pudo cargar el video</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.errorCloseButton}
              >
                <Ionicons name="close-circle" size={36} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  fullScreenVideo: {
    width: "100%",
    height: "100%",
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: "white",
    fontSize: 16,
  },
  errorCloseButton: {
    marginTop: 20,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 10,
  },
  videoPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoBottomControls: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
  videoTimeText: {
    color: "white",
    fontSize: 12,
    minWidth: 40,
    textAlign: "center",
  },
});

export default ChatVideoViewer;
