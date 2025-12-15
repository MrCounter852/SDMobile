import { createNavigationContainerRef } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navegar a una pantalla específica desde cualquier lugar
 * @param {string} name - Nombre de la pantalla
 * @param {object} params - Parámetros de navegación
 */
export function navigate(name, params) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}

/**
 * Obtener el nombre de la ruta activa actual (recursivo)
 * @returns {string|null} Nombre de la ruta activa
 */
export function getCurrentRouteName() {
    if (navigationRef.isReady()) {
        return navigationRef.getCurrentRoute()?.name;
    }
    return null;
}
