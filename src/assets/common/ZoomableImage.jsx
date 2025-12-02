import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ source, style, onClose }) => {
  // Validar que source existe y tiene uri
  if (!source || !source.uri) {
    console.warn('ZoomableImage: source is null or missing uri property');
    return null;
  }

  const [imageDimensions, setImageDimensions] = useState(null);

  useEffect(() => {
    if (source?.uri) {
      RNImage.getSize(
        source.uri,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          console.error('Error getting image size:', error);
        }
      );
    }
  }, [source?.uri]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Función para calcular los límites de desplazamiento
  const clamp = (value, limit) => {
    'worklet';
    return Math.min(Math.max(value, -limit), limit);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        // Calcular dimensiones renderizadas
        let maxTranslateX = 0;
        let maxTranslateY = 0;

        if (imageDimensions) {
          const { width: imgW, height: imgH } = imageDimensions;
          const screenRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
          const imageRatio = imgW / imgH;

          let contentWidth, contentHeight;

          if (imageRatio > screenRatio) {
            contentWidth = SCREEN_WIDTH;
            contentHeight = SCREEN_WIDTH / imageRatio;
          } else {
            contentHeight = SCREEN_HEIGHT;
            contentWidth = SCREEN_HEIGHT * imageRatio;
          }

          const scaledWidth = contentWidth * scale.value;
          const scaledHeight = contentHeight * scale.value;

          if (scaledWidth > SCREEN_WIDTH) {
            maxTranslateX = (scaledWidth - SCREEN_WIDTH) / 2;
          }
          if (scaledHeight > SCREEN_HEIGHT) {
            maxTranslateY = (scaledHeight - SCREEN_HEIGHT) / 2;
          }
        }

        // Aplicar clamp
        const nextTranslateX = savedTranslateX.value + e.translationX;
        const nextTranslateY = savedTranslateY.value + e.translationY;

        translateX.value = clamp(nextTranslateX, maxTranslateX);
        translateY.value = clamp(nextTranslateY, maxTranslateY);

      } else {
        // Solo permitir swipe vertical para cerrar si no está con zoom
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Swipe hacia arriba para cerrar (umbral de -100)
        if (e.translationY < -100) {
          if (onClose) {
            runOnJS(onClose)();
          }
        } else {
          translateY.value = withTiming(0);
        }
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  // Componer gestos
  const composedGestures = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGestures}>
        <Animated.View style={styles.wrapper}>
          <Animated.Image
            source={source}
            style={[styles.image, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default ZoomableImage;
