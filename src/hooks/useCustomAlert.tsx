import { useState } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

// interface ShowAlertParams {
//     type: AlertType;
//     title: string;
//     message: string;
//     buttonText?: string;
//     onPress?: () => void;
//     cancelText?: string;
//     onCancel?: () => void;
// }

export function useCustomAlert() {
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<AlertType>('success');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtonText, setAlertButtonText] = useState('OK');
    const [alertOnPress, setAlertOnPress] = useState<() => void>(() => {});
    const [alertCancelText, setAlertCancelText] = useState<string | undefined>();
    const [alertOnCancel, setAlertOnCancel] = useState<() => void>(() => {});

    // const showAlert = ({
    //     type,
    //     title,
    //     message,
    //     buttonText = 'OK',
    //     onPress,
    //     cancelText,
    //     onCancel,
    // }: ShowAlertParams) => {
    //     setAlertType(type);
    //     setAlertTitle(title);
    //     setAlertMessage(message);
    //     setAlertButtonText(buttonText);

    //     setAlertOnPress(() => onPress || (() => {}));

    //     setAlertCancelText(cancelText);
    //     setAlertOnCancel(() => onCancel || (() => {}));

    //     setAlertVisible(true);
    // };

    const showAlert = (
        type: AlertType,
        title: string,
        message: string,
        buttonText: string = 'OK',
        onPress?: () => void,
        cancelText?: string,
        onCancel?: () => void
    ) => {
        setAlertType(type);
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertButtonText(buttonText);
        setAlertOnPress(() => onPress || (() => {}));
        setAlertCancelText(cancelText);
        setAlertOnCancel(() => onCancel || (() => {}));
        setAlertVisible(true);
    };

    const hideAlert = () => {
        setAlertVisible(false);
    };

    const handleAlertPress = () => {
        setAlertVisible(false);
        alertOnPress();
    };

    const handleAlertCancel = () => {
        setAlertVisible(false);
        alertOnCancel();
    };

    return {
        alertVisible,
        alertType,
        alertTitle,
        alertMessage,
        alertButtonText,
        alertCancelText,
        showAlert,
        hideAlert,
        handleAlertPress,
        handleAlertCancel,
    };
}

