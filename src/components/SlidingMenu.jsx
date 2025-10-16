// SlidingMenuWithTopSlider.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  ScrollView,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

export default function SlidingMenu({ isVisible, onClose }) {
  const translateY = useSharedValue(isVisible ? 0 : height);
  const viewProgress = useSharedValue(0); // 0 = grid, 1 = slider+submenu

  const [isSliderView, setIsSliderView] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(null);

  // Ejemplo de datos: cada item tiene subOpciones
  const menuItems = [
    { id: 1, title: 'Item 1', sub: ['A', 'B', 'C'] },
    { id: 2, title: 'Item 2', sub: ['D', 'E'] },
    { id: 3, title: 'Item 3', sub: ['F', 'G', 'H', 'I'] },
    { id: 4, title: 'Item 4', sub: ['J'] },
    { id: 5, title: 'Item 5', sub: ['K', 'L'] },
    { id: 6, title: 'Item 6', sub: ['M', 'N'] },
  ];

  // Manejo hardware back (Android)
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSliderView) {
        // si slider abierto -> animar de vuelta al grid
        viewProgress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(setIsSliderView)(false);
        });
        return true;
      } else if (isVisible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isSliderView, isVisible, onClose, viewProgress]);

  // abrir/cerrar sheet
  React.useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
    } else {
      translateY.value = withTiming(height, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      // reset visual
      viewProgress.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        setIsSliderView(false);
        setSelectedIndex(null);
      }, 220);
    }
  }, [isVisible, translateY, viewProgress]);

  // Drag to dismiss
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = translateY.value + gestureState.dy;
        if (newY >= 0 && newY <= height) {
          translateY.value = newY;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          translateY.value = withTiming(height, { duration: 250 }, () => {
            runOnJS(onClose)();
            runOnJS(setIsSliderView)(false);
            runOnJS(setSelectedIndex)(null);
          });
          viewProgress.value = withTiming(0, { duration: 120 });
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      },
    })
  ).current;

  // Estilo animado del sheet
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Grid: se desvanece / escala cuando se abre el slider
  const gridStyle = useAnimatedStyle(() => {
    const p = viewProgress.value;
    return {
      opacity: interpolate(p, [0, 1], [1, 0], Extrapolate.CLAMP),
      transform: [
        { scale: interpolate(p, [0, 1], [1, 0.97], Extrapolate.CLAMP) },
        { translateY: interpolate(p, [0, 1], [0, 10], Extrapolate.CLAMP) },
      ],
      // bloquea touches cuando el slider está visible
      // notación: pointerEvents no puede venir desde animated style en RN, así que controlamos desde state
    };
  });

  // Slider superior: aparece desde arriba con opacidad
  const sliderStyle = useAnimatedStyle(() => {
    const p = viewProgress.value;
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolate.CLAMP),
      transform: [{ translateY: interpolate(p, [0, 1], [-18, 0], Extrapolate.CLAMP) }],
    };
  });

  // Contenido del submenu (cuerpo): aparece con un fade-in/translate
  const submenuStyle = useAnimatedStyle(() => {
    const p = viewProgress.value;
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolate.CLAMP),
      transform: [{ translateY: interpolate(p, [0, 1], [8, 0], Extrapolate.CLAMP) }],
    };
  });

  // Press en un item del grid: abre slider arriba y muestra submenu del item
  const handleItemPress = (index) => {
    setSelectedIndex(index);
    setIsSliderView(true);
    // animar progreso
    viewProgress.value = withTiming(1, {
      duration: 380,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  };

  // Cambiar item seleccionado desde el slider (mientras slider visible)
  const handleSliderSelect = (index) => {
    // solo animación visual de selección
    setSelectedIndex(index);
    // podrías usar viewProgress para animar detalles dependientes de index si quieres
  };

  return (
    <Animated.View style={[styles.overlay, sheetStyle]}>
      <Animated.View style={styles.menu} {...panResponder.panHandlers}>
        <View style={styles.grabber} />

        {/* SLIDER (top) - siempre en la parte superior del menu, aparece con animación */}
        <Animated.View style={[styles.sliderContainer, sliderStyle, { pointerEvents: isSliderView ? 'auto' : 'none' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slider}>
            {menuItems.map((item, idx) => {
              const active = selectedIndex === idx;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sliderItem, active ? styles.sliderItemActive : null]}
                  onPress={() => handleSliderSelect(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={active ? styles.sliderItemTextActive : styles.sliderItemText}>{item.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* CUERPO: o grid (cuando viewProgress=0) o submenu (cuando viewProgress=1).
            En vez de condicionales bruscos, los animamos y controlamos pointerEvents vía state */}
        <View style={styles.body}>
          {/* Grid - animado */}
          <Animated.View style={[styles.grid, gridStyle]} pointerEvents={isSliderView ? 'none' : 'auto'}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => handleItemPress(idx)}
                activeOpacity={0.75}
              >
                <Text style={styles.gridItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Submenu content - animado */}
          <Animated.View style={[styles.submenuContainer, submenuStyle]} pointerEvents={isSliderView ? 'auto' : 'none'}>
            {selectedIndex != null ? (
              <ScrollView contentContainerStyle={styles.submenuScroll}>
                {(menuItems[selectedIndex]?.sub || []).map((opt, i) => (
                  <TouchableOpacity key={i} style={styles.submenuItem} activeOpacity={0.8} onPress={() => {
                    // Aquí ejecutas la acción de la opción (navegar, cerrar, etc.)
                    console.log('Seleccionada opción', opt, 'de', menuItems[selectedIndex].title);
                    // ejemplo: cerrar sheet al elegir opción
                    // onClose();
                  }}>
                    <Text style={styles.submenuText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              // placeholder cuando no hay seleccionado (poco visible)
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Selecciona un ítem para ver opciones</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: '#fff',
    height: height / 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  grabber: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // slider (top)
  sliderContainer: {
    height: 110,
    // ocupa espacio en top del menu; el body se colocará debajo
    marginBottom: 4,
  },
  slider: {
    paddingLeft: 2,
    paddingRight: 8,
    alignItems: 'center',
  },
  sliderItem: {
    width: 90,
    height: 90,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 12,
  },
  sliderItemActive: {
    backgroundColor: '#007AFF22',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  sliderItemText: {
    fontSize: 13,
    color: '#222',
  },
  sliderItemTextActive: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },

  // body: contiene grid y submenu (superpuestos)
  body: {
    flex: 1,
  },

  // grid (principal)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f6f6f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 10,
  },
  gridItemText: {
    fontSize: 14,
  },

  // submenu container (se muestra cuando slider activo)
  submenuContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0, // comienza en la misma area del body
    bottom: 0,
    paddingTop: 6,
  },
  submenuScroll: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  submenuItem: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  submenuText: {
    fontSize: 15,
  },

  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 18,
  },
  placeholderText: {
    color: '#888',
  },
});
