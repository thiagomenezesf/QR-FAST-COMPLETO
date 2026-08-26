import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert } from 'react-native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// 1. Importe o Linking do Expo
import * as Linking from 'expo-linking';
import { supabase } from '../../services/supabase';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'RecuperarSenha'>;

export default function RecuperarSenhaScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<NavProps>();

    const {
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertButtonText,
    alertCancelText,
    showAlert,
    handleAlertPress,
    handleAlertCancel,
    } = useCustomAlert();

    const handleRecuperar = async () => {
        if (!email.trim()) {
            // Alert.alert("Atenção", "Por favor, digite seu e-mail.");
            showAlert('warning', 'Atenção', 'Por favor, digite seu e-mail.', 'OK');
            return;
        }

        try {
            setLoading(true);

            // 2. Gere a URL de redirecionamento dinamicamente
            // Isso cria o link correto tanto para Expo Go quan// Altere para garantir que NÃO use localhost
            const redirectTo = Linking.createURL('reset-password');
            console.log("URL CORRETA:", redirectTo);

            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: redirectTo,
            });

            if (error) throw error;

            // Alert.alert(
            //     "Verifique seu e-mail (pode estar no Spam!)", 
            //     "Enviamos um link de recuperação. Ao clicar nele, você será trazido de volta para o app para criar sua nova senha.",
            //     [{ text: "OK", onPress: () => navigation.goBack() }]
            // );
            showAlert('info', 'Verifique seu e-mail (pode estar no Spam!)', 'Enviamos um link de recuperação. Ao clicar nele, você será trazido de volta para o app para criar sua nova senha.', 'OK', () => navigation.goBack());

        } catch (error: any) {
            // Alert.alert("Erro", error.message || "Ocorreu um erro ao tentar recuperar a senha.");
            showAlert('error', 'Erro', error.message || "Ocorreu um erro ao tentar recuperar a senha.", 'OK');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
                <View style={styles.container}>
                    
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <View style={styles.iconHeader}>
                            <Ionicons name="key-outline" size={50} color="#276818" />
                        </View>
                        
                        <Text style={styles.title}>Recuperar Senha</Text>
                        <Text style={styles.subtitle}>
                            Digite seu e-mail abaixo. Enviaremos um link para você redefinir sua senha com segurança dentro do aplicativo.
                        </Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder='Seu e-mail cadastrado'
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleRecuperar}
                            activeOpacity={0.9}
                            style={styles.buttonContainer}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#3BB85E', '#276818']}
                                style={styles.buttonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Enviar Instruções</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Lembrou a senha?</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                            <Text style={styles.backToLoginText}> Voltar para o Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <CustomAlert
                            visible={alertVisible}
                            type={alertType}
                            title={alertTitle}
                            message={alertMessage}
                            buttonText={alertButtonText}
                            cancelText={alertCancelText}
                            onPress={handleAlertPress}
                            onCancel={handleAlertCancel}
                        />
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 30,
    },
    backButton: {
        marginTop: 50,
        marginLeft: -10,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 50,
    },
    iconHeader: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#7C7C7C',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 25,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 55,
        color: '#1A1A1A',
        fontSize: 16,
    },
    buttonContainer: {
        width: '100%',
        height: 55,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#276818',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#fff',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    footerText: {
        color: '#999',
        fontSize: 15,
    },
    backToLoginText: {
        color: '#276818',
        fontSize: 15,
        fontWeight: '700',
    }
});