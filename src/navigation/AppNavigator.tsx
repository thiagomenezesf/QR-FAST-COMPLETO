import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native'; 
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import * as Login from '../screens/login';
import * as Admin from '../screens/adminPage';
import * as User from '../screens/userPage';
import { RootStackParamList } from '../types/RootStackParamList';
import { supabase } from '../services/supabase';

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- FUNÇÃO PARA DESCOBRIR A ROLE (Otimizada) ---
async function getUserRole(session: any) {
  // 1. Se o metadata existir e for 'user', nem gasta internet indo ao banco
  // Isso evita o erro 500 no momento do cadastro!
  const metaRole = session.user.user_metadata?.role;
  
  // Se for um login normal (não cadastro), o banco é mais confiável para ver se a role mudou
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!error && data) return data.role;
  } catch {
    // Silencioso
  }

  return metaRole || 'user';
}

function AuthListener() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'PASSWORD_RECOVERY') {
        navigation.navigate('NovaSenha');
      }

      if (event === 'SIGNED_IN' && session) {
        const role = await getUserRole(session);
        
        if (role === 'admin') {
          navigation.reset({ index: 0, routes: [{ name: 'Administração' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'UserPageNew' }] });
        }
      }

      if (event === 'SIGNED_OUT') {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigation]);

  return null; 
}

export default function AppNavigator() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    async function checkInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const role = await getUserRole(session);
          if (role === 'admin') setInitialRoute('Administração');
          else setInitialRoute('UserPageNew');
        }
      } catch (error) {
        console.error("Erro na verificação inicial:", error);
      } finally {
        setIsInitialLoading(false);
      }
    }
    checkInitialSession();
  }, []);

  if (isInitialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#276818" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthListener />
      <Stack.Navigator id="MainStack" initialRouteName={initialRoute} screenOptions={{ headerShown: true }}>
        
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login.LoginScreen} />
          <Stack.Screen name="Register" component={Login.RegistrationScreen} />
          <Stack.Screen name="RecuperarSenha" component={Login.RecuperarSenhaScreen} />
          <Stack.Screen name="NovaSenha" component={Login.NovaSenhaScreen} />
        </Stack.Group>

        <Stack.Group screenOptions={{ headerShown: false, title: 'Painel Adm' }}>
          <Stack.Screen name="Administração" component={Admin.AdmScreen} />
          <Stack.Screen name="Pessoas" component={Admin.PeopleListScreen} />
          <Stack.Screen name="PessoaDetalhes" component={Admin.PersonDetailScreen} />
          <Stack.Screen name="Dashboard" component={Admin.DashboardScreen} />
          <Stack.Screen name="Scanner" component={Admin.ScannerScreen} />
          <Stack.Screen name="CreateEvent" component={Admin.CreateEventScreen}/>
          <Stack.Screen name="EditEvent" component={Admin.EditEventScreen}/>
          <Stack.Screen name="AdminEventsList" component={Admin.AdminEventsList}/>
        </Stack.Group>

        <Stack.Group screenOptions={{ headerShown: false, title: 'Página do Usuário' }}>
          <Stack.Screen name="UserPage" component={User.UserEventsScreen} />
          <Stack.Screen name="DetalhesEventos" component={User.EventDetailScreen} />
          <Stack.Screen name="ComprarIngresso" component={User.BuyTicketScreen} />
          <Stack.Screen name="ConfirmarCompra" component={User.BuyConfirmationScreen} />
          <Stack.Screen name="UserPageNew" component={User.UserScreen} />
          <Stack.Screen name="IngressosComprados" component={User.PurchasedTicketsScreen} />
          <Stack.Screen name="QRCodepage" component={User.QRCodeScreen} />
        </Stack.Group>

      </Stack.Navigator>
    </NavigationContainer>
  );
}