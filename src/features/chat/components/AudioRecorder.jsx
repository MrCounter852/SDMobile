import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const SpectrumBar = ({ level }) => {
  const animatedHeight = useSharedValue(5);

  useEffect(() => {
    animatedHeight.value = withTiming(Math.max(5, level * 35), {
      duration: 100,
      easing: Easing.linear,
    });
  }, [level]);

  const style = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: 0.5 + level * 0.5,
    };
  });

  return <Reanimated.View style={[styles.spectrumBar, style]} />;
};

const AudioRecorder = ({ onSend, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(0);

  const [audioLevels, setAudioLevels] = useState(new Array(30).fill(0));

  const timerRef = useRef(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso al micrófono.");
        onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: ".m4a",
          },
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const minDb = -60;
            const db = Math.max(status.metering, minDb);
            const level = (db - minDb) / (0 - minDb);

            setAudioLevels((prev) => {
              const newLevels = [...prev.slice(1), level];
              return newLevels;
            });
          }
        },
        100,
      );

      setRecording(newRecording);
      recordingRef.current = newRecording;
      global.currentRecording = newRecording;
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      Alert.alert("Error", "No se pudo iniciar el micrófono.");
      onCancel();
    }
  };

  useEffect(() => {
    startRecording();
  }, []);

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch((e) => {});
      recordingRef.current = null;
    }
    setRecording(null);
    global.currentRecording = null;
  };

  const handleSend = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      if (!recording) return;

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      const finalDuration = Math.max(1, duration);

      if (uri) {
        console.log("Audio grabado exitosamente:", uri);
        onSend(uri, finalDuration);
      } else {
        Alert.alert("Error", "No se generó el archivo de audio.");
      }

      setRecording(null);
      recordingRef.current = null;
      global.currentRecording = null;
      Vibration.vibrate(50);
    } catch (error) {
      console.error("Error enviando audio:", error);
      Alert.alert("Error", "Hubo un problema al procesar el audio.");
    }
  };

  const handleCancel = async () => {
    await stopRecordingCleanup();
    setRecording(null);
    onCancel();
    Vibration.vibrate(50);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={{ ...styles.wrapper, paddingBottom: insets.bottom + 10 }}>
      <View style={styles.leftBubble}>
        <View style={styles.leftTopRow}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, styles.recordingDotActive]} />
            <Text style={styles.recordingText}>Grabando...</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>

        <View style={styles.spectrumRow}>
          <View style={styles.spectrumContainer}>
            {audioLevels.map((level, index) => (
              <SpectrumBar key={index} level={level} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.smallCircleButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>

        <LinearGradient
          colors={
            duration < 5 ? ["#cccccc", "#cccccc"] : ["#337ab7", "#88E782"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bigCircleButton]}
        >
          <TouchableOpacity
            style={styles.fullButtonTouch}
            onPress={handleSend}
            disabled={duration < 5}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  leftBubble: {
    flex: 1,
    backgroundColor: "#f0f3f1",
    borderRadius: 22,
    padding: 12,
    marginRight: 12,
  },
  leftTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recordingIndicator: { flexDirection: "row", alignItems: "center" },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#ccc",
  },
  recordingDotActive: { backgroundColor: "#ff3b30" },
  recordingText: { color: "#444", fontWeight: "600" },
  durationText: {
    fontWeight: "700",
    color: "#444",
    fontVariant: ["tabular-nums"],
  },

  spectrumRow: { alignItems: "center", justifyContent: "center" },
  spectrumContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    overflow: "hidden",
  },
  spectrumBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
    backgroundColor: "#25D366",
  },

  controlsContainer: { flexDirection: "row", alignItems: "center" },
  smallCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    elevation: 2,
  },
  cancelButton: { backgroundColor: "#ff4444" },
  bigCircleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: "#000",
    elevation: 4,
    overflow: "hidden",
  },
  fullButtonTouch: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AudioRecorder;
