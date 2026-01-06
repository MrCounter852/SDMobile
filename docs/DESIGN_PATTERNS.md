# 🎨 Guía de Patrones de Diseño - SediMobile

Esta guía documenta los patrones de diseño, componentes y estilos utilizados en la aplicación SediMobile para mantener consistencia visual.

---

## 📦 Paleta de Colores

```javascript
const COLORS = {
  primary: "#337ab7", // Azul principal - headers, acciones primarias
  secondary: "#0086C8", // Azul medio - iconos, acentos
  accent: "#00ACC4", // Turquesa - gradientes, highlights
  success: "#00CDA7", // Verde agua - estados exitosos, badges
  highlight: "#88E782", // Verde claro - indicadores, decoraciones
  dark: "#1E293B", // Texto principal
  gray: "#64748B", // Texto secundario
  lightGray: "#94A3B8", // Labels, placeholders
  background: "#F8FAFC", // Fondo general
  white: "#FFFFFF", // Tarjetas, superficies
};
```

### Gradientes Principales

| Nombre               | Colores                       | Uso                         |
| -------------------- | ----------------------------- | --------------------------- |
| **Primary Gradient** | `#337ab7 → #0086C8 → #00ACC4` | Headers, fondos principales |
| **Button Gradient**  | `#337ab7 → #00ACC4`           | Botones de acción primaria  |
| **Success Gradient** | `#00ACC4 → #00CDA7`           | Avatares, estados exitosos  |
| **Subtle Gradient**  | `#f5f7fa → #c3cfe2`           | Botones secundarios         |

---

## 🏗️ Estructura de Pantallas

### Header con Gradiente

```jsx
<LinearGradient
  colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.headerGradient}
>
  <SafeAreaView edges={["top"]}>
    <View style={styles.headerContent}>
      {/* Círculos decorativos */}
      <View style={styles.patternCircle1} />
      <View style={styles.patternCircle2} />

      {/* Contenido del header */}
    </View>
  </SafeAreaView>
</LinearGradient>
```

**Estilos base:**

```javascript
headerGradient: {
  borderBottomLeftRadius: 32,
  borderBottomRightRadius: 32,
  overflow: "hidden",
},
patternCircle1: {
  position: "absolute",
  width: 200,
  height: 200,
  borderRadius: 100,
  backgroundColor: "rgba(255,255,255,0.08)",
  top: -60,
  right: -40,
},
patternCircle2: {
  position: "absolute",
  width: 150,
  height: 150,
  borderRadius: 75,
  backgroundColor: "rgba(255,255,255,0.06)",
  bottom: -30,
  left: -30,
},
```

---

## 🎴 Componentes Reutilizables

### Tarjeta de Información (InfoCard)

```jsx
const InfoCard = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoCardIcon}>
      <Ionicons name={icon} size={20} color={COLORS.secondary} />
    </View>
    <View style={styles.infoCardContent}>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>{value || "—"}</Text>
    </View>
  </View>
);
```

**Estilos:**

```javascript
infoCard: {
  width: (width - 52) / 2,  // Grid de 2 columnas
  backgroundColor: COLORS.white,
  borderRadius: 16,
  padding: 16,
  margin: 6,
  flexDirection: "row",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
},
infoCardIcon: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "rgba(0,134,200,0.1)",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},
infoCardLabel: {
  fontSize: 11,
  color: COLORS.lightGray,
  fontWeight: "500",
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
infoCardValue: {
  fontSize: 14,
  color: COLORS.dark,
  fontWeight: "600",
},
```

---

### Item de Acción (ActionItem)

```jsx
const ActionItem = ({ icon, label, onPress, danger = false }) => (
  <TouchableOpacity
    style={[styles.actionItem, danger && styles.actionItemDanger]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[styles.actionItemIcon, danger && styles.actionItemIconDanger]}
    >
      <Feather
        name={icon}
        size={20}
        color={danger ? "#EF4444" : COLORS.accent}
      />
    </View>
    <Text
      style={[styles.actionItemLabel, danger && styles.actionItemLabelDanger]}
    >
      {label}
    </Text>
    <Feather
      name="chevron-right"
      size={20}
      color={danger ? "#EF4444" : COLORS.lightGray}
    />
  </TouchableOpacity>
);
```

**Estilos:**

```javascript
actionItem: {
  flexDirection: "row",
  alignItems: "center",
  padding: 18,
},
actionItemDanger: {
  backgroundColor: "#FEF2F2",
},
actionItemIcon: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: "rgba(0,172,196,0.1)",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 14,
},
actionItemIconDanger: {
  backgroundColor: "#FEE2E2",
},
```

---

## 📝 Inputs y Formularios

### Input con Icono

```jsx
<View style={styles.inputContainer}>
  <View style={styles.inputIconContainer}>
    <Ionicons name="mail-outline" size={20} color={COLORS.secondary} />
  </View>
  <TextInput
    style={styles.input}
    placeholder="Email"
    placeholderTextColor={COLORS.lightGray}
  />
</View>
```

**Estilos:**

```javascript
inputContainer: {
  width: "100%",
  height: 56,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F8FAFC",
  borderRadius: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#E2E8F0",
},
inputIconContainer: {
  width: 50,
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
},
input: {
  flex: 1,
  height: "100%",
  fontSize: 15,
  color: COLORS.dark,
  paddingRight: 16,
},
```

---

## 🔘 Botones

### Botón Primario (con Gradiente)

```jsx
<TouchableOpacity onPress={handleAction} activeOpacity={0.9}>
  <LinearGradient
    colors={[COLORS.primary, COLORS.accent]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.primaryButton}
  >
    <Text style={styles.primaryButtonText}>ACCIÓN</Text>
    <Feather name="arrow-right" size={20} color="#FFF" />
  </LinearGradient>
</TouchableOpacity>
```

**Estilos:**

```javascript
primaryButton: {
  height: 56,
  borderRadius: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
},
primaryButtonText: {
  color: COLORS.white,
  fontSize: 16,
  fontWeight: "700",
  letterSpacing: 0.5,
},
```

### Botón Secundario

```javascript
secondaryButton: {
  height: 52,
  borderRadius: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#F1F5F9",
  borderWidth: 1,
  borderColor: "#E2E8F0",
  gap: 8,
},
secondaryButtonText: {
  color: COLORS.primary,
  fontSize: 15,
  fontWeight: "600",
},
```

---

## 📊 Tarjeta de Stats

```jsx
<View style={styles.statsContainer}>
  <View style={styles.statItem}>
    <Ionicons name="document-text-outline" size={22} color={COLORS.secondary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>Label</Text>
  </View>
  <View style={styles.statDivider} />
  {/* Más items... */}
</View>
```

**Estilos:**

```javascript
statsContainer: {
  flexDirection: "row",
  backgroundColor: COLORS.white,
  marginHorizontal: 20,
  marginTop: -28,  // Overlap con header
  borderRadius: 20,
  padding: 20,
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 8,
},
statItem: {
  flex: 1,
  alignItems: "center",
},
statDivider: {
  width: 1,
  backgroundColor: "#E2E8F0",
  marginVertical: 4,
},
```

---

## 🏷️ Secciones con Header

```jsx
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Ionicons name="person-outline" size={20} color={COLORS.primary} />
    <Text style={styles.sectionTitle}>Título de Sección</Text>
  </View>
  {/* Contenido */}
</View>
```

**Estilos:**

```javascript
section: {
  marginTop: 28,
  paddingHorizontal: 20,
},
sectionHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
},
sectionTitle: {
  fontSize: 17,
  fontWeight: "700",
  color: COLORS.dark,
  marginLeft: 10,
},
```

---

## 📱 StatusBar

Usar siempre `FocusAwareStatusBar` para manejar correctamente el status bar entre navegaciones:

```jsx
import FocusAwareStatusBar from "../../components/FocusAwareStatusBar";

// Para headers con gradiente oscuro
<FocusAwareStatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

// Para fondos claros
<FocusAwareStatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
```

---

## 🎯 Espaciado y Tamaños

| Elemento                      | Valor     |
| ----------------------------- | --------- |
| Border Radius (Cards)         | `16-20px` |
| Border Radius (Buttons)       | `14-16px` |
| Border Radius (Inputs)        | `16px`    |
| Border Radius (Icons)         | `12-14px` |
| Padding Horizontal (Pantalla) | `20-24px` |
| Padding Cards                 | `16-18px` |
| Gap entre elementos           | `8-12px`  |
| Altura inputs                 | `56px`    |
| Altura botones                | `52-56px` |
| Tamaño iconos contenedor      | `40-44px` |

---

## 🔤 Tipografía

| Uso              | Tamaño    | Peso    | Color                  |
| ---------------- | --------- | ------- | ---------------------- |
| Título principal | `24-26px` | 700     | `COLORS.dark` / `#FFF` |
| Subtítulo        | `17px`    | 700     | `COLORS.dark`          |
| Texto normal     | `14-15px` | 400-500 | `COLORS.dark`          |
| Labels           | `11-12px` | 500     | `COLORS.lightGray`     |
| Botón primario   | `16px`    | 700     | `#FFF`                 |
| Botón secundario | `15px`    | 600     | `COLORS.primary`       |

---

## 🌟 Sombras

### Sombra suave (Cards)

```javascript
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.04,
shadowRadius: 8,
elevation: 2,
```

### Sombra media (Stats, Cards flotantes)

```javascript
shadowColor: COLORS.primary,
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.12,
shadowRadius: 24,
elevation: 8,
```

---

## 📚 Librerías Utilizadas

- **expo-linear-gradient** - Gradientes
- **@expo/vector-icons** - Ionicons, Feather, MaterialCommunityIcons
- **react-native-safe-area-context** - SafeAreaView
- **@react-navigation/native** - useIsFocused (para FocusAwareStatusBar)

---

## ✅ Checklist de Diseño

- [ ] Usar `FocusAwareStatusBar` en lugar de `StatusBar`
- [ ] Headers con gradiente y círculos decorativos
- [ ] Tarjeta de stats flotante (overlap negativo)
- [ ] Inputs con iconos a la izquierda
- [ ] Botones con gradiente para acciones primarias
- [ ] Cards con border-radius de 16-20px
- [ ] Secciones con header (icono + título)
- [ ] Footer con versión de la app
- [ ] Espaciado consistente (20-24px horizontal)
