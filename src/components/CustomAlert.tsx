import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    buttonText?: string;
    cancelText?: string;
    onPress?: () => void;
    onCancel?: () => void;
}

export default function CustomAlert({
    visible,
    type,
    title,
    message,
    buttonText = 'OK',
    cancelText,
    onPress,
    onCancel,
}: CustomAlertProps) {
    const iconName =
        type === 'success'
            ? 'checkmark-circle'
            : type === 'warning'
            ? 'information-circle-outline'
            : (type === 'error' ? 'close-circle' : 'information-circle-outline');

    const iconColor =
        type === 'success'
            ? '#3BB85E'
            : type === 'warning'
            ? '#E6A700'
            : (type === 'error' ? '#D9534F' : '#405466');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel || onPress}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Ionicons
                        name={iconName}
                        size={60}
                        color={iconColor}
                    />

                    <Text style={styles.title}>
                        {title}
                    </Text>

                    <Text style={styles.message}>
                        {message}
                    </Text>

                    <View style={styles.buttonsContainer}>

                        {cancelText && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {cancelText}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: iconColor },
                                cancelText && styles.buttonWithCancel,
                            ]}
                            onPress={onPress}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {buttonText}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },

    container: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#4d4c4c',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 15,
        textAlign: 'center',
    },

    message: {
        fontSize: 16,
        color: '#c2c2c2',
        textAlign: 'center',
        lineHeight: 23,
        marginTop: 10,
        marginBottom: 25,
    },

    buttonsContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
    },

    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    buttonWithCancel: {
        flex: 1,
    },

    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#666',
    },

    cancelButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});