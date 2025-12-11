import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule } from 'expo-audio'; // Importación nueva
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
// Componente para una sola barra usando Reanimated (mucho más rápido para 60fps)
const SpectrumBar = ({ level }) => {
  const animatedHeight = useSharedValue(5);

  useEffect(() => {
    // Animamos suavemente hacia el nuevo nivel
    animatedHeight.value = withTiming(level * 30 + 5, {
      duration: 100,
      easing: Easing.linear,
    });
  }, [level]);

  const style = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: Math.max(0.5, level), // Más opacidad si es más alto
    };
  });

  return <Reanimated.View style={[styles.spectrumBar, style]} />;
};

const AudioRecorder = ({ onSend, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(0);
  // Usamos el hook nativo de expo-audio
  const recorder = useAudioRecorder({
    sampleRate: 44100,
    encoding: 'aac',
    bitRate: 128000,
  });

  const [audioLevels, setAudioLevels] = useState(new Array(30).fill(0));
  const timerRef = useRef(null);
  const analysisInterval = useRef(null);

  // Pedir permisos al montar
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permiso denegado', 'Se requiere acceso al micrófono');
        onCancel();
      }
    })();
    
    // Limpieza al desmontar
    return () => stopRecordingCleanup();
  }, []);

  const stopRecordingCleanup = async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisInterval.current) clearInterval(analysisInterval.current);
  };

  const startRecording = async () => {
    try {
      // 1. Primero verificamos explícitamente el estado del permiso
      let permission = await AudioModule.getRecordingPermissionsAsync();

      // 2. Si nunca se ha preguntado (undetermined), los pedimos ahora
      if (permission.status === 'undetermined') {
        permission = await AudioModule.requestRecordingPermissionsAsync();
      }

      // 3. Si después de pedirlo sigue denegado, salimos
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso al micrófono para grabar notas de voz.');
        onCancel(); // Cerramos el componente para evitar estados inconsistentes
        return;
      }

      // 4. Limpieza preventiva por si había algo corriendo
      await stopRecordingCleanup();

      // 5. Iniciamos la grabación (Ahora es seguro)
      recorder.record();
      
      setDuration(0);

      // Iniciamos los timers visuales
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      analysisInterval.current = setInterval(() => {
        // Lógica de simulación de ondas o lectura de metering
        const simulatedLevel = Math.random() * 0.8 + 0.1; 
        setAudioLevels(prev => [...prev.slice(1), simulatedLevel]);
      }, 100);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      Alert.alert('Error', 'No se pudo iniciar el micrófono.');
      onCancel();
    }
  };

  // El useEffect de inicio ahora es más simple, solo llama a la función robusta
  useEffect(() => {
    startRecording();
    
    // Cleanup al desmontar
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  // Iniciar automáticamente al montar (opcional, o llamar desde botón)
  useEffect(() => {
    startRecording();
  }, []);

  const handleSend = async () => {
    await stopRecordingCleanup();
    // recorder.uri es la ruta del archivo
    if (recorder.uri && duration > 0) {
      onSend(recorder.uri, duration);
    }
  };

  const handleCancel = async () => {
    await stopRecordingCleanup();
    onCancel();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ ...styles.wrapper, paddingBottom: insets.bottom + 10 }}>
      {/* Burbuja izquierda */}
      <View style={styles.leftBubble}>
        <View style={styles.leftTopRow}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, styles.recordingDotActive]} />
            <Text style={styles.recordingText}>Grabando...</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>

        {/* Visualizador de Espectro */}
        <View style={styles.spectrumRow}>
          <View style={styles.spectrumContainer}>
            {audioLevels.map((level, index) => (
              <SpectrumBar key={index} level={level} />
            ))}
          </View>
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.smallCircleButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
        <LinearGradient
                colors={["#337ab7", "#88E782"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
          style={[styles.bigCircleButton]}
        >
          <TouchableOpacity
            onPress={handleSend}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  leftBubble: {
    flex: 1,
    backgroundColor: '#f0f3f1',
    borderRadius: 22,
    padding: 12,
    marginRight: 12,
  },
  leftTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center' },
  recordingDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor: '#ccc' },
  recordingDotActive: { backgroundColor: '#ff3b30' },
  recordingText: { color: '#444', fontWeight: '600' },
  durationText: { fontWeight: '700', color: '#444' },
  
  spectrumRow: { alignItems: 'center', justifyContent: 'center' },
  spectrumContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 40, 
    overflow: 'hidden' 
  },
  spectrumBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
    backgroundColor: '#25D366',
  },

  controlsContainer: { flexDirection: 'row', alignItems: 'center' },
  smallCircleButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    shadowColor: '#000', elevation: 2,
  },
  cancelButton: { backgroundColor: '#ff4444' },
  bigCircleButton: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', elevation: 4,
  },
  sendButton: { backgroundColor: '#25D366' },
});

export default AudioRecorder;