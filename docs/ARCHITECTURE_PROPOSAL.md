# Propuesta de Reestructuración de Arquitectura - SediMobile

## 1. Diagnóstico Actual

*   **Ubicación Incorrecta de Componentes:** La carpeta `src/assets/common` contiene componentes de React (`CustomModalPicker.jsx`, etc.). `assets` debe ser **exclusivamente** para recursos estáticos (imágenes, fuentes, iconos), nunca código.
*   **Mezcla de Idiomas:** Carpetas en Español (`GestionComercial`, `FacturasCompra`) mezcladas con Inglés (`Chat`, `Settings`, `Home`). Esto dificulta la navegación y el onboarding de nuevos desarrolladores.
*   **Arquitectura por Capas vs. Features:** Actualmente tienes "Todos los servicios juntos", "Todas las pantallas juntas". Esto hace que para trabajar en el "Chat", tengas que saltar entre 5 carpetas diferentes (`core`, `components/chat`, `screens/Chat`, `services/chat`, `hooks/chat`).
*   **Core Sobrecargado:** `src/core` está actuando como un cajón de sastre. Contiene estado de negocio (`chatStore.js`) mezclado con configuración (`theme.js`).

## 2. Arquitectura Propuesta: Feature-First (Basada en Funcionalidades)

La idea es agrupar el código por **lo que hace** (funcionalidad), no por **lo que es** (archivo). Cada "Feature" debe ser un módulo casi independiente.

### Estructura de Directorios Recomendada

```text
src/
├── app/                  # Configuración Global de la App
│   ├── navigation/       # Stacks y Navigators globales
│   ├── store/            # Configuración base del store (si usas Redux/Zustand global)
│   ├── theme/            # Theme.js (Colores, fuentes)
│   └── config.js         # Variables de entorno
│
├── assets/               # SOLO Archivos estáticos
│   ├── images/
│   └── fonts/
│
├── components/           # Componentes UI "Tontos" y Compartidos (Shared)
│   ├── Button/
│   ├── Input/
│   ├── Layout/
│   └── Modals/           # Aquí irían los que estaban en assets/common
│
├── features/             # EL NÚCLEO: Módulos de negocio
│   ├── auth/             # Login, Registro, AuthState
│   │   ├── components/
│   │   ├── screens/
│   │   └── services/
│   │
│   ├── chat/             # Toda la lógica del Chat aquí
│   │   ├── components/   # ChatBubble, InputBar (Solo usados en chat)
│   │   ├── hooks/        # useChatMessages
│   │   ├── screens/      # ChatScreen, ContactList
│   │   ├── services/     # chatService
│   │   └── store/        # chatStore (Mover desde core)
│   │
│   ├── crm/              # (Antiguo GestionComercial)
│   │   ├── components/
│   │   ├── screens/
│   │   └── services/
│   │
│   └── invoices/         # (Antiguo FacturasCompra)
│       ├── components/
│       ├── screens/
│       └── services/
│
├── hooks/                # Hooks globales compartidos (ej. useConnectivity, useTheme)
├── services/             # Clientes API globales (ej. api.js con axios interceptors)
└── utils/                # Funciones puras (date formatters, validaciones)
```

## 3. Plan de Migración (Paso a Paso)

No intentes cambiar todo a la vez. Hazlo en fases:

### Fase 1: Limpieza Higiénica (Inmediato)
1.  Mover componentes de `src/assets/common` a `src/components/shared` o `src/components/ui`.
2.  Eliminar código muerto.

### Fase 2: Estandarización de Nombres (Renaming)
Decidir un idioma base (Recomendado: **Inglés**).
*   `GestionComercial` -> `crm` o `commercial`
*   `FacturasCompra` -> `invoices`
*   `Inicio` -> `dashboard`

### Fase 3: Modularización (El gran cambio)
1.  Crear carpeta `src/features`.
2.  Mover el módulo más aislado primero (ej. `Chat` o `Auth`).
3.  Mover `chatStore.js` de `core` a `features/chat/store`.
4.  Actualizar importaciones.

## 4. Beneficios
*   **Escalabilidad:** Puedes agregar nuevas features sin tocar las existentes.
*   **Mantenibilidad:** Si falla el Chat, sabes que el problema está en `src/features/chat`.
*   **Trabajo en Equipo:** Menos conflictos de merge porque los archivos están separados por dominio.
