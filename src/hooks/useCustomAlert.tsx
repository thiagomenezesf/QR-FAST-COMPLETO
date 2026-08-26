import { useState } from 'react';

type AlertType = 'success' | 'error' | 'warning';

export function useCustomAlert() {
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<AlertType>('success');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtonText, setAlertButtonText] = useState('OK');
    const [alertOnPress, setAlertOnPress] = useState<() => void>(() => {});

    const showAlert = (
        type: AlertType,
        title: string,
        message: string,
        buttonText: string = 'OK',
        onPress?: () => void
    ) => {
        setAlertType(type);
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertButtonText(buttonText);
        setAlertOnPress(() => onPress || (() => {}));
        setAlertVisible(true);
    };

    const hideAlert = () => {
        setAlertVisible(false);
    };

    const handleAlertPress = () => {
        setAlertVisible(false);
        alertOnPress();
    };

    return {
        alertVisible,
        alertType,
        alertTitle,
        alertMessage,
        alertButtonText,
        showAlert,
        hideAlert,
        handleAlertPress,
    };
}