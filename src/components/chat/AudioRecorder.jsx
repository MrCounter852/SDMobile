import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
const AudioRecorder = ({ onSend, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState(new Array(25).fill(0.1));
  const durationInterval = useRef(null);
  const levelsInterval = useRef(null);
  const animatedValues = useRef(audioLevels.map(() => new Animated.Value(0.1))).current;

  useEffect(() => {
    return () => {
      cleanup().then(() => setRecording(null));
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        cleanup().then(() => setRecording(null));
      };
    }, [])
  );

  // Animar barras cada vez que cambia audioLevels
  useEffect(() => {
    audioLevels.forEach((level, index) => {
      Animated.timing(animatedValues[index], {
        toValue: Math.max(level, 0.05),
        duration: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [audioLevels]);

  const cleanup = async () => {
    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (levelsInterval.current) {
        clearInterval(levelsInterval.current);
        levelsInterval.current = null;
      }
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
    } catch (error) {
      try {
        if (recording) {
          await recording.unloadAsync();
        }
      } catch (e) {
        console.error('Fallback cleanup error', e);
      }
    }
  };

  const startRecording = async () => {
    try {
      await cleanup();
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitas permitir el acceso al micrófono para grabar audio.',
          [{ text: 'OK', onPress: onCancel }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate,
        100
      );

      setRecording(newRecording);
      setRecordingStatus('recording');
      setDuration(0);

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Simular niveles (en producción sustituir por mediciones reales)
      levelsInterval.current = setInterval(() => {
        setAudioLevels(prevLevels =>
          prevLevels.map(() => Math.random() * 0.9 + 0.05)
        );
      }, 100);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación de audio.');
      onCancel();
    }
  };

  const onRecordingStatusUpdate = (status) => {
    if (status.isRecording) {
      setRecordingStatus('recording');
    } else if (status.canRecord) {
      setRecordingStatus('paused');
    }
  };

  const handleSend = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri && duration > 0) {
        onSend(uri, duration);
      } else {
        Alert.alert('Error', 'La grabación está vacía.');
      }
    } catch (error) {
      console.error('Error sending recording:', error);
      Alert.alert('Error', 'No se pudo procesar la grabación.');
    }
  };

  const handleCancel = async () => {
    await cleanup();
    setRecording(null);
    onCancel();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ ...styles.wrapper, paddingBottom: insets.bottom + 10 }}>
      {/* Burbuja izquierda: indicador + espectro (estilo WhatsApp) */}
      <View style={styles.leftBubble}>
        <View style={styles.leftTopRow}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, recordingStatus === 'recording' && styles.recordingDotActive]} />
            <Text style={styles.recordingText}>Grabando...</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>

        <View style={styles.spectrumRow}>
          <View style={styles.spectrumContainer}>
            {animatedValues.map((animatedValue, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.spectrumBar,
                  {
                    height: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 36],
                    }),
                    backgroundColor: '#25D366',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Controles a la derecha: cancelar + enviar */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.smallCircleButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bigCircleButton,
            duration === 0 ? styles.bigButtonDisabled : styles.sendButton
          ]}
          onPress={handleSend}
          disabled={duration === 0}
        >
          <Ionicons name="checkmark" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    minHeight: 86,
  },

  // Burbuja izquierda (similar a mensaje grabando en whatsapp)
  leftBubble: {
    flex: 1,
    backgroundColor: '#f0f3f1', // fondo tipo burbuja gris-claro
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  leftTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b8b8b',
    marginRight: 8,
  },
  recordingDotActive: {
    backgroundColor: '#ff3b30', // rojo vivo
  },
  recordingText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },

  durationText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  spectrumRow: {
    //marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    flex: 0,
    marginRight: 12,
  },
  spectrumBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
    backgroundColor: '#0b2113ff',
  },

  slideCancelText: {
    color: '#6b6b6b',
    fontSize: 12,
    alignSelf: 'center',
  },

  // Controles estilo WhatsApp a la derecha
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 42 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },

  bigCircleButton: {
    width: 56,
    height: 56,
    borderRadius: 56 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
  sendButton: {
    backgroundColor: '#25D366',
  },
  bigButtonDisabled: {
    backgroundColor: '#bfeccf', // versión deshabilitada del verde
  },
});

export default AudioRecorder;
