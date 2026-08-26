import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Adicionado useFocusEffect
import React, { useState, useCallback } from 'react'; // Adicionado useCallback
import { Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width } = Dimensions.get('window');

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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

  // LIMPA OS CAMPOS SEMPRE QUE A TELA GANHA FOCO
  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setSenha('');
    }, [])
  );

  const validaLogin = async () => {
    if (!email || !senha) {
      // Alert.alert("Erro", "Preencha todos os campos!");
      showAlert('warning', 'Erro', 'Preencha todos os campos!', 'OK');
      return;
    }

    try {
      setLoading(true);

      // 1. Tenta realizar o login no Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (error) {
        let mensagem = error.message;
        if (mensagem === "Invalid login credentials") mensagem = "E-mail ou senha incorretos.";
        // Alert.alert("Erro no Login", mensagem);
        showAlert('error', 'Erro no Login', mensagem, 'OK');
        return;
      }

      // 2. Login deu certo! Agora buscamos a ROLE na tabela 'profiles'
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError.message);
          // Se não achar o perfil, mandamos para a página de usuário por padrão
          navigation.navigate('UserPageNew');
          return;
        }

        // 3. Redirecionamento baseado na ROLE do banco de dados
        if (profile?.role === 'admin') {
          navigation.navigate('Administração');
        } else {
          navigation.navigate('UserPageNew');
        }
      }

    } catch (error: any) {
      console.error("Erro inesperado:", error);
      // Alert.alert("Erro", "Ocorreu um erro inesperado ao processar seu login.");
      showAlert('error', 'Erro', 'Ocorreu um erro inesperado ao processar seu login.', 'OK');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="qr-code" size={40} color="#276818" />
            </View>
            <Text style={styles.title}>QR <Text style={{color: '#276818'}}>Fast</Text></Text>
            <Text style={styles.subtitle}>Bem-vindo de volta! Faça seu login.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder='E-mail'
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder='Senha'
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('RecuperarSenha')}
              style={styles.buttonRecuperarSenha}
            >
              <Text style={styles.linkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={validaLogin}
              activeOpacity={0.9}
              style={[styles.loginButtonContainer, loading && { opacity: 0.8 }]}
              disabled={loading}
            >
              <LinearGradient
                colors={['#3BB85E', '#276818']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
              style={styles.buttonCadastro}
            >
              <Text style={styles.buttonCadastroText}>Cadastre-se agora</Text>
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
    justifyContent: 'space-around',
    paddingVertical: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#7C7C7C',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
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
  buttonRecuperarSenha: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButtonContainer: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
    marginRight: 10,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
  },
  buttonCadastro: {
    marginTop: 5,
    paddingVertical: 10,
  },
  buttonCadastroText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#276818',
  }
});