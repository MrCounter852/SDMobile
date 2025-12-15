import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking, AppState, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkPermissionsAsync } from '../../core/notificationConfig';

const SettingsScreen = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const appState = useRef(AppState.currentState);

    const checkStatus = async () => {
        const status = await checkPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
    };

    useEffect(() => {
        checkStatus();

        // Re-check permissions when app comes back to foreground (in case user changed them in settings)
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                checkStatus();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleOpenSettings = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Linking.openURL('app-settings:');
            } else {
                await Linking.openSettings();
            }
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notificaciones</Text>

                <View style={styles.row}>
                    <View style={styles.rowInfo}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="notifications-outline" size={24} color="#333" />
                        </View>
                        <View>
                            <Text style={styles.rowTitle}>Permitir Notificaciones</Text>
                            <Text style={styles.rowSubtitle}>
                                {notificationsEnabled
                                    ? 'Recibirás notificaciones en este dispositivo'
                                    : 'Las notificaciones están desactivadas'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleOpenSettings} // On Android/iOS we can't programmatically enable, must go to settings
                        disabled={false}
                    />
                </View>

                {!notificationsEnabled && (
                    <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
                        <Text style={styles.settingsButtonText}>Ir a Configuración del Sistema</Text>
                        <Ionicons name="settings-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.infoText}>
                    Nota: Si desactivas las notificaciones, es posible que no te enteres de nuevos mensajes o eventos importantes mientras la aplicación no esté en pantalla.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 20,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    rowSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    settingsButton: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        gap: 8,
    },
    settingsButtonText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 14,
    },
    infoText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center'
    }
});

export default SettingsScreen;
