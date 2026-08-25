import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'warning';

interface CustomAlertProps {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    buttonText?: string;
    onPress: () => void;
}

export default function CustomAlert({
    visible,
    type,
    title,
    message,
    buttonText = 'OK',
    onPress,
}: CustomAlertProps) {
    const iconName =
        type === 'success'
            ? 'checkmark-circle'
            : type === 'warning'
            ? 'warning'
            : 'close-circle';

    const iconColor =
        type === 'success'
            ? '#3BB85E'
            : type === 'warning'
            ? '#E6A700'
            : '#D9534F';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onPress}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Ionicons
                        name={iconName}
                        size={60}
                        color={iconColor}
                    />

                    <Text style={styles.title}>{title}</Text>

                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: iconColor }]}
                        onPress={onPress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {buttonText}
                        </Text>
                    </TouchableOpacity>
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
        backgroundColor: '#FFF',
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
        color: '#222',
        marginTop: 15,
        textAlign: 'center',
    },

    message: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        lineHeight: 23,
        marginTop: 10,
        marginBottom: 25,
    },

    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});