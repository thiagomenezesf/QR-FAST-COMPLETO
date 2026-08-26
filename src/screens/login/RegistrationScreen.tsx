import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert } from 'react-native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase'; 
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const navigation = useNavigation<NavProps>();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      // Alert.alert("Erro", "Preencha todos os campos!");
      showAlert('warning', 'Erro', 'Preencha todos os campos!', 'OK');
      return;
    }

    if (password !== confirmPassword) {
      // Alert.alert("Erro", "As senhas não coincidem!");
      showAlert('warning', 'Erro', 'As senhas não coincidem!', 'OK');
      return;
    }

    try {
      setLoading(true);

      // 1. Cadastra no Auth do Supabase com METADATA (O crachá instantâneo)
      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { 
            full_name: name,
            role: 'user' // <- Isso evita o erro 500 no AppNavigator
          },
        },
      });

      if (authError) throw authError;

      if (data?.user) {
        console.log("👤 Usuário criado no Auth com metadata 'user'.");
        
        // Pequena pausa apenas para estabilidade do servidor
        await new Promise(resolve => setTimeout(resolve, 800));

        // 2. Tenta criar a linha na tabela 'profiles' para persistência a longo prazo
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: name,
              email: email,
              role: 'user', 
            },
          ]);

        if (profileError) {
          console.warn("⚠️ Perfil no banco falhou, mas metadata garantirá o acesso:", profileError.message);
        } else {
          console.log("✅ Perfil espelhado na tabela 'profiles' com sucesso!");
        }
      }

      // 3. Verificação de Fluxo de Confirmação (E-mail)
      if (data.user && data.session === null) {
        // Alert.alert(
        //   "Verifique seu e-mail", 
        //   "Enviamos um link de confirmação. Você precisa confirmar para conseguir logar."
        // );
        showAlert('info', 'Verifique seu e-mail', 'Enviamos um link de confirmação. Você precisa confirmar para conseguir logar.', 'OK');
        navigation.navigate('Login');
      } else {
        // Se o e-mail confirm já estiver off, o login é automático
        // Alert.alert("Sucesso", "Conta criada com sucesso!");
        showAlert('success', 'Sucesso', 'Conta criada com sucesso!', 'OK');
        // O AppNavigator agora deve redirecionar sozinho pelo AuthListener
      }

    } catch (error: any) {
      console.error("🔥 Erro no cadastro:", error);
      // Alert.alert("Erro no Cadastro", error.message || "Ocorreu um erro interno.");
      showAlert('error', 'Erro no Cadastro', error.message || "Ocorreu um erro interno.", 'OK');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FAFAFA' }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Junte-se ao <Text style={{fontWeight: '700', color: '#276818'}}>QR Fast</Text> e facilite seus acessos.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#999"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.9} 
              style={[styles.buttonContainer, loading && { opacity: 0.7 }]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#3BB85E', '#276818']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Finalizar Cadastro</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}> Faça login</Text>
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
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7C7C7C',
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    marginTop: 15,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#276818',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 30,
  },
  footerText: {
    color: '#999',
    fontSize: 15,
  },
  loginLinkText: {
    color: '#276818',
    fontSize: 15,
    fontWeight: '700',
  },
});