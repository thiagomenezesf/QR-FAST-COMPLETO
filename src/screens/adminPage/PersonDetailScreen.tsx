import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/RootStackParamList';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg'; 
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type PersonDetailRouteProp = RouteProp<RootStackParamList, 'PessoaDetalhes'>;

export default function PersonDetailScreen() {
  const route = useRoute<PersonDetailRouteProp>();
  const navigation = useNavigation();
  const { ticketId } = route.params;

  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [data, setData] = useState<any>(null);

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

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'used':
        return { label: 'Já utilizado', color: '#C62828', icon: 'close-circle-outline' };
      case 'pending':
        return { label: 'Pagamento Pendente', color: '#F57C00', icon: 'time-outline' };
      default:
        return { label: 'Disponível / Válido', color: '#2E7D32', icon: 'checkmark-circle-outline' };
    }
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id, created_at, status, owner_name, owner_email, user_id,
          events (title, date, location)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      let finalData: any = { ...ticketData, profiles: null };

      if (ticketData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', ticketData.user_id)
          .single();

        if (profileData) finalData.profiles = profileData;
      }

      setData(finalData);
    } catch (error: any) {
      // Alert.alert("Erro", "Não foi possível carregar os detalhes.");
      showAlert('error', 'Erro', 'Não foi possível carregar os detalhes.', 'OK')
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO ATUALIZADA: Agora valida se o banco realmente deletou
  const handleDeleteTicket = async () => {
    // Alert.alert(
    //   "Confirmar Exclusão",
    //   "Tem certeza que deseja cancelar e excluir este ingresso permanentemente?",
    //   [
    //     { text: "Cancelar", style: "cancel" },
    //     { 
    //       text: "Excluir Ingresso", 
    //       style: "destructive", 
    //       onPress: async () => {
    //         try {
    //           setIsDeleting(true);
              
    //           // O .select() é crucial para confirmar se a Policy permitiu a ação
    //           const { data: deletedData, error } = await supabase
    //             .from('tickets')
    //             .delete()
    //             .eq('id', ticketId)
    //             .select(); 

    //           if (error) throw error;

    //           // Se a lista vier vazia, significa que o RLS bloqueou a deleção
    //           if (!deletedData || deletedData.length === 0) {
    //             throw new Error("Você não tem permissão de administrador para excluir ingressos.");
    //           }

    //           Alert.alert("Sucesso", "Ingresso excluído com sucesso.");
    //           navigation.goBack(); 
    //         } catch (error: any) {
    //           console.error("Erro na deleção:", error);
    //           Alert.alert("Acesso Negado", error.message || "Erro ao tentar excluir.");
    //         } finally {
    //           setIsDeleting(false);
    //         }
    //       }
    //     }
    //   ]
    // );
    showAlert('warning', 'Confirmar Exclusão', 'Tem certeza que deseja cancelar e excluir este ingresso permanentemente?', 'Excluir Ingresso',
      async () => {
            try {
              setIsDeleting(true);
              
              // O .select() é crucial para confirmar se a Policy permitiu a ação
              const { data: deletedData, error } = await supabase
                .from('tickets')
                .delete()
                .eq('id', ticketId)
                .select(); 

              if (error) throw error;

              // Se a lista vier vazia, significa que o RLS bloqueou a deleção
              if (!deletedData || deletedData.length === 0) {
                throw new Error("Você não tem permissão de administrador para excluir ingressos.");
              }

              // Alert.alert("Sucesso", "Ingresso excluído com sucesso.");
              showAlert('success', 'Sucesso', 'Ingresso excluído com sucesso!', 'OK');
              navigation.goBack(); 
            } catch (error: any) {
              console.error("Erro na deleção:", error);
              // Alert.alert("Acesso Negado", error.message || "Erro ao tentar excluir.");
              showAlert('error', 'Acesso Negado', error.message || "Erro ao tentar excluir.", 'OK');
            } finally {
              setIsDeleting(false);
            }
          }, 'Cancelar');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#276818" />
      </View>
    );
  }

  const statusInfo = getStatusDetails(data?.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#276818', '#3BB85E']} style={styles.headerCard}>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <Ionicons name="person-circle" size={80} color="#FFF" style={{ marginTop: 20 }} />
        <Text style={styles.userName}>
          {data?.profiles?.full_name || data?.owner_name || 'Participante'}
        </Text>
        <Text style={styles.userEmail}>
          {data?.profiles?.email || data?.owner_email || 'E-mail não informado'}
        </Text>
      </LinearGradient>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Detalhes do Ingresso</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.iconBg}>
            <Ionicons name="calendar-outline" size={22} color="#276818" />
          </View>
          <View style={styles.infoTextGroup}>
            <Text style={styles.label}>Evento</Text>
            <Text style={styles.value}>{data?.events?.title || 'Evento não encontrado'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconBg}>
            <Ionicons name={statusInfo.icon as any} size={22} color={statusInfo.color} />
          </View>
          <View style={styles.infoTextGroup}>
            <Text style={styles.label}>Status do Ingresso</Text>
            <Text style={[styles.value, { color: statusInfo.color, fontWeight: 'bold' }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconBg}>
            <Ionicons name="time-outline" size={22} color="#666" />
          </View>
          <View style={styles.infoTextGroup}>
            <Text style={styles.label}>Data da Compra</Text>
            <Text style={styles.value}>
              {data?.created_at 
                ? `${new Date(data.created_at).toLocaleDateString('pt-BR')} às ${new Date(data.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
                : '--/--/----'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Código de Validação</Text>
        <View style={[styles.qrContainer, data?.status === 'pending' && { opacity: 0.5 }]}>
          {data?.id && (
            <QRCode
              value={data.id}
              size={180}
              color={data?.status === 'pending' ? '#666' : 'black'}
              backgroundColor="white"
            />
          )}
          <Text style={styles.ticketIdText}>ID: {data?.id?.toUpperCase()}</Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDeleteTicket}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#C62828" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#C62828" />
              <Text style={styles.deleteButtonText}>Cancelar e Excluir Ingresso</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

// ... manter os styles iguais ao anterior ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 10,
    shadowColor: '#276818',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'ios' ? 50 : 40,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  userEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  infoSection: { padding: 25, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconBg: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTextGroup: { marginLeft: 15, flex: 1 },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  value: { fontSize: 16, color: '#333', fontWeight: '600' },
  qrSection: { alignItems: 'center', paddingBottom: 60 },
  qrContainer: {
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    alignItems: 'center'
  },
  ticketIdText: { marginTop: 15, color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    backgroundColor: '#FFF'
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14
  }
});