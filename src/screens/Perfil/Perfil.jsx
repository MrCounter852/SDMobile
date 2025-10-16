import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const Perfil = ({ navigation }) => {

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.content}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>SM</Text>
                </View>

                <Text style={styles.title}>Bienvenido a SediMobile</Text>
                <Text style={styles.subtitle}>Pantalla de Perfil básica</Text>

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Continuar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default Perfil;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#2b8cff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 4,
    },
    logoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
});