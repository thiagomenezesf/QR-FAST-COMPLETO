import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function BuyConfirmationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { event, quantity, total, paymentId } = route.params;

  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState({ qrCode: '', qrCodeCopyPaste: '', paymentId: '' });
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hora
  const [isPaid, setIsPaid] = useState(false); // Estado para controlar se já foi pago

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

  const fetchTimeLeft = async () => {
    if (!paymentId) {
    return;
    }
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('expires_at')
        .eq('payment_id', paymentId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.expires_at) {
        const expiration = new Date(data.expires_at).getTime();
        const now = Date.now();

        const secondsLeft = Math.max(
          0,
          Math.floor((expiration - now) / 1000)
        );
        setTimeLeft(secondsLeft);
      }
    } catch (error: any) {
      console.error('Erro ao buscar tempo restante:', error.message);
    }
  };

  useEffect(() => {
    fetchTimeLeft();
  }, []);

  const restoreExistingPix = async (existingPaymentId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('get-pix-payment', {
        body: { paymentId: existingPaymentId }
      });

      if (!data?.payment_id) throw new Error('Pagamento não encontrado');

      setPixData({
        qrCode: data.qr_code || '',
        qrCodeCopyPaste: data.qr_code_copy_paste || '',
        paymentId: data.payment_id.toString(),
      });

      if (data.status === 'approved' || data.status === 'paid') {
        setIsPaid(true);

        await supabase
          .from('tickets')
          .update({
            payment_status: 'paid',
            status: 'valid',
          })
          .eq('payment_id', existingPaymentId);
      }
    } catch (error: any) {
      console.error('Erro ao restaurar Pix existente:', error.message);

      showAlert('error', 'Pagamento indisponível', 'Não foi possível recuperar este pagamento. Nenhum novo Pix será gerado.', 'OK');
    } finally {
      setLoading(false);
    }
  };

  // 1. FUNÇÃO QUE CHAMA A EDGE FUNCTION
  const generatePix = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Alert.alert('Erro', 'Usuário não autenticado.');
        showAlert('error', 'Erro', 'Usuário não autenticado.', 'OK');
        return;
      }

      const fullName = user.user_metadata?.display_name || user.user_metadata?.full_name || 'Usuário QR Fast';

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          eventId: event.id,
          userId: user.id,
          amount: total,
          email: user.email,
          fullName: fullName,
          quantity: quantity
        }
      });

      if (error) throw error;

      if (data) {
        setPixData({
          qrCode: data.qr_code,
          qrCodeCopyPaste: data.qr_code_copy_paste,
          paymentId: data.payment_id
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar Pix:', error.message);
      // Alert.alert('Erro', 'Não conseguimos gerar o pagamento. Tente novamente.');
      showAlert('error', 'Erro', 'Não conseguimos gerar o pagamento. Tente novamente.', 'OK');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNÇÃO QUE VERIFICA O PAGAMENTO E ATUALIZA PARA VALID
  const checkPaymentStatus = async () => {
    if (!pixData.paymentId || isPaid) return;

    try {
      // Busca o status atual na tabela tickets
      const { data, error } = await supabase
        .from('tickets')
        .select('payment_status')
        .eq('payment_id', pixData.paymentId.toString())
        .limit(1)
        .single();

      if (data && data.payment_status === 'paid') {
        setIsPaid(true);

        // AQUI A MÁGICA: Seta o status para 'valid' assim que detectar o pagamento
        await supabase
          .from('tickets')
          .update({ status: 'valid' })
          .eq('payment_id', pixData.paymentId.toString());

        // Alert.alert('Pagamento Confirmado! 🎉', 'Seu ingresso já está disponível.', [
        //   { text: 'Ver Ingressos', onPress: () => navigation.navigate('IngressosComprados') }
        // ]);
        showAlert('success', 'Pagamento Confirmado! 🎉', 'Seu ingresso já está disponível.', 'Ver Ingressos', () => navigation.navigate('IngressosComprados'));
      }
    } catch (err) {
      // Silencioso: continua tentando no próximo intervalo
    }
  };

  // useEffect 1: Roda apenas UMA vez ao abrir a tela para gerar/restaurar o QR Code
  useEffect(() => {
    if (paymentId) {
      restoreExistingPix(paymentId);
    } else {
      generatePix();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Vazio aqui para não repetir

  // useEffect 2: Fica "vigiando" o paymentId. Assim que o ID aparecer, ele liga o vigilante
  useEffect(() => {
    let statusChecker: ReturnType<typeof setInterval>;

    if (pixData.paymentId && !isPaid) {
      statusChecker = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }

    return () => {
      if (statusChecker) clearInterval(statusChecker);
    };
  }, [pixData.paymentId, isPaid]); // Só roda quando o ID chegar ou o status mudar

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async () => {
    if (!pixData.qrCodeCopyPaste) return;
    await Clipboard.setStringAsync(pixData.qrCodeCopyPaste);
    // Alert.alert('Sucesso', 'Código Pix copiado!');
    showAlert('success', 'Sucesso', 'Código Pix copiado!', 'OK');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>
            {total === 0 ? 'Gratuito' : `R$ ${total.toFixed(2).replace('.', ',')}`}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.eventMiniTitle}>{event.title}</Text>
          <Text style={styles.quantityText}>{quantity}x Ingresso(s)</Text>
        </View>

        <View style={styles.pixSection}>
          <View style={styles.pixHeader}>
            <Ionicons name="flash" size={20} color="#00BFA5" />
            <Text style={styles.pixTitle}>Pague via Pix</Text>
          </View>

          <View style={styles.qrContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#276818" />
            ) : isPaid ? (
              <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={80} color="#3BB85E" />
                <Text style={{ fontWeight: 'bold', color: '#3BB85E' }}>PAGO!</Text>
              </View>
            ) : timeLeft > 0 ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${pixData.qrCode}` }} 
                style={{ width: 180, height: 180 }} 
              />
            ) : (
              <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={50} color="#E53935" />
                <Text style={{ textAlign: 'center', color: '#E53935', fontSize: 12, marginTop: 10 }}>
                  Tempo esgotado!{'\n'}Gere um novo código.
                </Text>
              </View>
            )}
          </View>

          {!loading && !isPaid && timeLeft > 0 && (
            <>
              <Text style={styles.pixInstruction}>
                Aponte a câmera para o QR Code ou use o código abaixo
              </Text>

              <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                <Ionicons name="copy-outline" size={20} color="#276818" />
                <Text style={styles.copyButtonText}>Pix Copia e Cola</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={timeLeft <= 60 ? "#E53935" : "#777"} />
            <Text style={[styles.timerText, timeLeft <= 60 && { color: '#E53935', fontWeight: '800' }]}>
              {isPaid 
                ? "Pagamento confirmado!" 
                : timeLeft > 0 
                  ? `Este código expira em ${formatTime(timeLeft)}` 
                  : "Código expirado."
              }
            </Text>
          </View>
        </View>

        <View style={styles.securityBox}>
          <Ionicons name="lock-closed-outline" size={16} color="#666" />
          <Text style={styles.securityText}>Pagamento processado pelo Mercado Pago</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('IngressosComprados')}
          disabled={loading}
        >
          <LinearGradient
            colors={isPaid ? ['#3BB85E', '#276818'] : ['#999', '#666']}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmText}>
              {isPaid ? "Ver meus ingressos" : "Aguardando pagamento..."}
            </Text>
            <Ionicons name="arrow-forward" size={22} color="#FFF" />
          </LinearGradient>
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
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  scrollContent: {
    padding: 25,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    marginVertical: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
  },
  eventMiniTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pixSection: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pixTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
    color: '#333',
  },
  qrContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  pixInstruction: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  copyButtonText: {
    color: '#276818',
    fontWeight: '700',
    marginLeft: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  timerText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
    marginLeft: 6,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  securityText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  footer: {
    padding: 25,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  confirmButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});