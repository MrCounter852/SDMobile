import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const VideoPlayer = ({ uri, onFullScreen }) => {
    const videoRef = useRef(null);
    const [status, setStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const handlePlayPause = async () => {
        if (videoRef.current) {
            if (status.isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    };

    const handleFullScreen = async () => {
        // Pausar el video del chat antes de abrir fullscreen
        if (videoRef.current) {
            await videoRef.current.pauseAsync();
        }
        if (onFullScreen) {
            onFullScreen(uri);
        }
    };

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.video}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                onPlaybackStatusUpdate={(status) => {
                    setStatus(status);
                    if (status.isLoaded && isLoading) {
                        setIsLoading(false);
                    }
                }}
                onLoad={() => setIsLoading(false)}
                onError={(error) => {
                    console.error('Video error:', error);
                    setIsLoading(false);
                }}
            />

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            {!isLoading && (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPause}
                    >
                        <Ionicons
                            name={status.isPlaying ? 'pause' : 'play'}
                            size={32}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.fullscreenButton}
                        onPress={handleFullScreen}
                    >
                        <Ionicons name="expand" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        borderRadius: 8,
        backgroundColor: '#000',
        overflow: 'hidden',
        marginTop: 4,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VideoPlayer;
