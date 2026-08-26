import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function NovaSenhaScreen() {
    const navigation = useNavigation<any>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleUpdatePassword = async () => {
        // Validações básicas
        if (!password || !confirmPassword) {
            // Alert.alert("Erro", "Por favor, preencha todos os campos.");
            showAlert('warning', 'Erro', 'Por favor, preencha todos os campos.', 'OK');
            return;
        }

        if (password.length < 6) {
            // Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
            showAlert('warning', 'Erro', 'A senha deve ter pelo menos 6 caracteres.', 'OK');
            return;
        }

        if (password !== confirmPassword) {
            // Alert.alert("Erro", "As senhas não coincidem.");
            showAlert('warning', 'Erro', 'As senhas não coincidem.', 'OK');
            return;
        }

        try {
            setLoading(true);

            // O Supabase já sabe quem é o usuário porque ele veio de um link de recuperação válido
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            // Alert.alert(
            //     "Senha Atualizada!",
            //     "Sua nova senha foi salva com sucesso. Você já pode acessar sua conta.",
            //     [{ text: "Fazer Login", onPress: () => navigation.navigate('Login') }]
            // );
            showAlert('success', 'Senha Atualizada!', 'Sua nova senha foi salva com sucesso. Você já pode acessar sua conta.', 'Fazer Login', () => navigation.navigate('Login'));

        } catch (error: any) {
            // Alert.alert("Erro ao atualizar", error.message);
            showAlert('error', 'Erro ao atualizar', error.message, 'OK');
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
                    
                    <View style={styles.content}>
                        <View style={styles.iconHeader}>
                            <Ionicons name="shield-checkmark-outline" size={50} color="#276818" />
                        </View>
                        
                        <Text style={styles.title}>Nova Senha</Text>
                        <Text style={styles.subtitle}>
                            Crie uma senha forte para garantir a segurança da sua conta.
                        </Text>

                        {/* Campo Senha */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder='Nova senha'
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Campo Confirmar Senha */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder='Confirme a nova senha'
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdatePassword}
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
                                    <Text style={styles.buttonText}>Redefinir Senha</Text>
                                )}
                            </LinearGradient>
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
    container: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 30 },
    content: { flex: 1, justifyContent: 'center', paddingVertical: 50 },
    iconHeader: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 24, alignSelf: 'center' },
    title: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 15, color: '#7C7C7C', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, marginBottom: 20, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 55, color: '#1A1A1A', fontSize: 16 },
    buttonContainer: { width: '100%', height: 55, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonText: { fontWeight: 'bold', fontSize: 16, color: '#fff' }
});