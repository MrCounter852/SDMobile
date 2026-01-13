# Arquitectura del Proyecto SediMobile

Este documento describe la estructura del proyecto y las guías para el desarrollo de nuevas funcionalidades bajo el patrón de arquitectura **Feature-First**.

## 1. Estructura de Directorios

El proyecto sigue una arquitectura modular donde el código está organizado principalmente por **funcionalidades (features)** .

```
src/
├── app/                 # Configuración global de la aplicación
│   ├── theme.js         # Tema y colores
│   └── navigationRef.js # Referencias de navegación global
├── assets/              # Recursos estáticos
│   ├── images/
│   └── fonts/
├── components/          # Componentes UI globales/genéricos
│   ├── shared/          # Componentes reutilizables por múltiples features
│   └── FocusAwareStatusBar.jsx
├── config/              # Configuración de entorno y constantes
│   └── environments.js
├── core/                # Lógica núcleo y utilidades transversales
│   ├── global.js        # Store global (Zustand)
│   └── navigationRef.js
├── features/            # Módulos principales de negocio
│   ├── auth/            # Autenticación (Login, Splash, Servicios Auth)
│   ├── chat/            # Chat en tiempo real y SignalR
│   ├── crm/             # Gestión Comercial, Contactos, Leads
│   ├── favorites/       # Pantalla de Favoritos
│   ├── home/            # Pantalla de Inicio / Dashboard
│   ├── invoices/        # Facturas de Compra y Aprobaciones
│   ├── notifications/   # Centro de Notificaciones
│   ├── profile/         # Perfil de Usuario
│   └── settings/        # Configuración de la App
└── screens/             # (DEPRECATED) Directorio antiguo, no usar para código nuevo.
```

## 2. Estructura de una Feature

Cada carpeta dentro de `src/features/` debe ser autocontenida y seguir esta estructura interna:

```
src/features/nombre-feature/
├── components/      # Componentes UI específicos de esta feature
│   ├── MiComponente.jsx
│   └── SubFeature/  # Subcarpetas si es complejo
├── hooks/           # Custom hooks específicos de la feature
├── screens/         # Pantallas (Page components) registradas en navegación
│   ├── MainScreen.jsx
│   └── DetailScreen.jsx
├── services/        # Servicios API y lógica de negocio específica
│   └── featureService.js
└── store/           # (Opcional) Estado local/global específico (Zustand slice)
    └── featureStore.js
```

### Reglas de Dependencia

1.  **Feature -> Core/Shared:** Una feature puede importar libremente de `src/core`, `src/config` y `src/components/shared`.
2.  **Screen -> Component:** Las pantallas deben estar compuestas principalmente por componentes.
3.  **Feature -> Feature:** Evitar acoplamiento fuerte. Si una feature necesita algo de otra, usar interfaces claras o mover la lógica común a `src/core` o `src/components/shared`.

## 3. ¿Cómo implementar una nueva Feature?

Sigue estos pasos para añadir una nueva funcionalidad al proyecto:

### Paso 1: Crear la Estructura

Crea una nueva carpeta en `src/features/` con el nombre de tu funcionalidad (ej. `orders`).

```bash
mkdir src/features/orders
mkdir src/features/orders/screens
mkdir src/features/orders/components
mkdir src/features/orders/services
```

### Paso 2: Crear los Servicios (Lógica de Negocio)

Define la interacción con la API en `services/ordersService.js`.

```javascript
// src/features/orders/services/ordersService.js
import getEnvironmentConfig from "../../../config/environments";

export const getOrders = async (token) => {
  // ... lógica de fetch
};
```

### Paso 3: Crear los Componentes UI

Crea los componentes visuales necesarios en `components/`.

```javascript
// src/features/orders/components/OrderItem.jsx
import React from "react";
import { View, Text } from "react-native";

export const OrderItem = ({ order }) => (
  <View>
    <Text>{order.id}</Text>
  </View>
);
```

### Paso 4: Crear la Pantalla Principal

Ensambla la pantalla en `screens/`.

```javascript
// src/features/orders/screens/OrdersScreen.jsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { OrderItem } from '../components/OrderItem';
import { getOrders } from '../services/ordersService';

const OrdersScreen = () => {
    // ... lógica de estado y efectos
    return (
        <View>
            <OrderItem order={...} />
        </View>
    );
};
export default OrdersScreen;
```

### Paso 5: Registrar la Navegación (Importante)

Finalmente, expón tu pantalla en `App.jsx` y agrégala al Stack Navigator.

```javascript
// App.jsx
import OrdersScreen from "./src/features/orders/screens/OrdersScreen";

// ... dentro del Stack.Navigator
<Stack.Screen
  name="Orders"
  component={OrdersScreen}
  options={{ title: "Mis Pedidos" }}
/>;
```

## 4. Buenas Prácticas

- **Imports Relativos:** Dentro de una feature, usa imports relativos (ej. `../components/Button`).
- **Imports Absolutos/Profundos:** Para salir de la feature, navega hacia arriba (ej. `../../../core/global`).
- **Nombres en Inglés:** Preferiblemente usar nombres de archivos y variables en inglés para consistencia (`orders` vs `pedidos`), aunque el contenido UI esté en español.
- **Componentes Compartidos:** Si ves que un componente de tu feature se usará en otra, muévelo a `src/components/shared`.
