import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Animated, Easing, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av'; 
import { supabase } from '../../services/supabase'; 

const successSoundAsset = require('../../../assets/sucess1.mp3');
const failSoundAsset = require('../../../assets/fail.mp3');

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Scanner'>;

export default function ScannerScreen() {
    const navigation = useNavigation<NavProps>();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (processing) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: Platform.OS !== 'web', 
                })
            ).start();
        } else {
            spinValue.setValue(0);
        }
    }, [processing]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        async function setupAudio() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
            } catch (e) {
                console.log("Erro ao configurar áudio:", e);
            }
        }
        setupAudio();
    }, []);

    useEffect(() => {
        requestPermission();
    }, []);

    async function playFeedbackSound(isSuccess: boolean) {
        try {
            const source = isSuccess ? successSoundAsset : failSoundAsset;
            const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log("Áudio bloqueado pelo navegador.");
        }
    }

    const resetScanner = () => {
        setScanned(false);
        setProcessing(false);
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned || processing) return;
        
        setScanned(true); 
        setProcessing(true); 

        try {
            // 1. BUSCA O INGRESSO
            const { data: ticket, error: fetchError } = await supabase
                .from('tickets')
                .select('id, status, events(title)')
                .eq('id', data)
                .single();

            if (fetchError || !ticket) {
                // playFeedbackSound(false);
                Alert.alert("Erro", "Ingresso inválido ou não encontrado.", [{ text: "OK", onPress: resetScanner }]);
                return;
            }

            // 2. VERIFICA SE JÁ FOI USADO
            if (ticket.status === 'used') {
                // playFeedbackSound(false);
                Alert.alert("Atenção", "Este ingresso JÁ FOI UTILIZADO!", [{ text: "OK", onPress: resetScanner }]);
                return;
            }

            // 3. ATUALIZA PARA USADO
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used' })
                .eq('id', data);

            if (updateError) throw updateError;

            // 4. SUCESSO TOTAL
            // playFeedbackSound(true);
            
            const eventData = ticket.events as any;
            const eventTitle = Array.isArray(eventData) ? eventData[0]?.title : eventData?.title;
            
            // Pequeno delay para a animação de "Lido!" aparecer antes do Alerta
            setTimeout(() => {
                Alert.alert(
                    "Sucesso!", 
                    `Ingresso validado para:\n${eventTitle || 'Evento'}`,
                    [{ text: "Próximo", onPress: resetScanner }]
                );
            }, 600);
            
        } catch (error: any) {
            console.error("Erro na validação:", error.message);
            playFeedbackSound(false);
            Alert.alert("Erro", "Falha na comunicação com o banco de dados.", [{ text: "OK", onPress: resetScanner }]);
        } finally {
            // ISSO AQUI É O QUE MATA O CARREGAMENTO INFINITO:
            // Ele desativa o estado 'processing' mesmo que dê erro no try ou no catch.
            setProcessing(false);
        }
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={80} color="#666" />
                <Text style={styles.permissionText}>Precisamos de acesso à câmera.</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Permitir Câmera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />
            
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={torch}
                // Desliga o sensor da câmera assim que 'scanned' for true
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <View style={styles.uiContainer} pointerEvents="box-none">
                <View style={styles.overlayBackground}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.middleRow}>
                        <View style={styles.unfocusedSide} />
                        <View style={styles.focusedContainer}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            {!scanned && <View style={styles.scanLine} />}
                        </View>
                        <View style={styles.unfocusedSide} />
                    </View>
                    <View style={styles.unfocusedContainer}>
                        <Text style={styles.instructionText}>Posicione o QR Code no quadrado</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Validar</Text>
                    <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
                        <Ionicons name={torch ? "flash" : "flash-off"} size={24} color={torch ? "#FFD700" : "#FFF"} />
                    </TouchableOpacity>
                </View>

                {scanned && (
                    <View style={styles.successOverlay}>
                        <LinearGradient colors={['#3BB85E', '#276818']} style={styles.successBadge}>
                            {processing ? (
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Ionicons name="sync" size={40} color="#FFF" />
                                </Animated.View>
                            ) : (
                                <Ionicons name="checkmark-circle" size={40} color="#FFF" />
                            )}
                            <Text style={styles.successText}>
                                {processing ? "Validando..." : "Lido!"}
                            </Text>
                        </LinearGradient>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    uiContainer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    overlayBackground: { flex: 1 },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F8F9FA' },
    permissionText: { textAlign: 'center', fontSize: 16, color: '#666', marginVertical: 20 },
    permissionButton: { backgroundColor: '#276818', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
    permissionButtonText: { color: '#FFF', fontWeight: 'bold' },
    header: { position: 'absolute', top: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
    iconBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    unfocusedSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    middleRow: { flexDirection: 'row', height: 280 },
    focusedContainer: { width: 280, position: 'relative' },
    instructionText: { color: '#FFF', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#3BB85E', borderWidth: 4 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
    scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#3BB85E', top: '50%' },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    successBadge: { padding: 30, borderRadius: 25, alignItems: 'center', minWidth: 160 },
    successText: { color: '#FFF', fontWeight: 'bold', marginTop: 10, fontSize: 18 }
});