import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../types/RootStackParamList';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'ComprarIngresso'>;

export default function BuyTicketScreen() {
  const navigation = useNavigation<NavProps>();
  const route = useRoute<any>();
  const { event } = route.params;

  const [eventData, setEventData] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
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


  useEffect(() => {
    async function fetchEventDetails() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('event_availability')
          .select('*')
          .eq('id', event.id)
          .single();

        if (error) throw error;
        setEventData(data);
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      } finally {
        setLoading(false);
      }
    }

    if (event.id) fetchEventDetails();
  }, [event.id]);

  const ticketPrice = (() => {
    if (!event.price || event.price === 'Gratuito') return 0;
    if (typeof event.price === 'number') return event.price;
    
    if (typeof event.price === 'string') {
      const cleaned = event.price
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      return parseFloat(cleaned) || 0;
    }
    return 0;
  })();

  const total = ticketPrice * quantity;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Resumo do Evento</Text>
        
        <View style={styles.eventCard}>
          <View style={styles.eventIconContainer}>
            <Ionicons name="calendar" size={24} color="#276818" />
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventInfo}>📅 {event.date}</Text>
            <Text style={styles.eventInfo} numberOfLines={1}>📍 {event.location}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Selecione a Quantidade</Text>
        
        <View style={styles.quantityCard}>
          <Text style={styles.pricePerUnit}>Preço unitário: {event.price}</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={styles.counterButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Ionicons name="remove" size={24} color="#276818" />
            </TouchableOpacity>

            <Text style={styles.quantityValue}>{quantity.toString().padStart(2, '0')}</Text>

            <TouchableOpacity
              onPress={() => {
                // CORREÇÃO AQUI: Apenas aumenta a quantidade, sem navegar
                if (eventData) {
                  if (eventData.available_tickets > quantity) {
                    setQuantity((q) => q + 1);
                  } else {
                    // Alert.alert('Limite atingido', 'Não há mais ingressos disponíveis.');
                    showAlert('warning', 'Limite atingido', 'Não há mais ingressos disponíveis.', 'OK');
                  }
                } else {
                  // Alert.alert('Aguarde', 'Carregando disponibilidade...');
                  showAlert('info', 'Aguarde', 'Carregando disponibilidade...', 'OK');
                }
              }}
              style={styles.counterButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Ionicons name="add" size={24} color="#276818" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.warningContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <Text style={styles.warningText}>
            O ingresso é pessoal e intransferível. Um QR Code único será gerado para cada unidade.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>
            {total === 0 ? 'Gratuito' : `R$ ${total.toFixed(2).replace('.', ',')}`}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (eventData && eventData.available_tickets >= quantity) {
              navigation.navigate('ConfirmarCompra', {
                event,
                quantity,
                total,
              });
            } else {
              // Alert.alert('Indisponível', 'Quantidade selecionada não disponível em estoque.');
              showAlert('warning', 'Indisponível', 'Quantidade selecionada não disponível em estoque.', 'OK');
            }
          }}
          disabled={loading}
          style={[styles.confirmButtonContainer, loading && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={['#3BB85E', '#276818']}
            style={styles.confirmButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.confirmText}>Confirmar e Pagar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  scrollContent: { padding: 25 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventDetails: { flex: 1 },
  eventTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  eventInfo: { fontSize: 13, color: '#666', marginTop: 2 },
  quantityCard: {
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
  },
  pricePerUnit: { fontSize: 14, color: '#666', marginBottom: 15 },
  counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F0F7F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E7D2',
  },
  quantityValue: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginHorizontal: 30 },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  warningText: { flex: 1, fontSize: 12, color: '#666', marginLeft: 10, lineHeight: 18 },
  footer: {
    backgroundColor: '#FFF',
    padding: 25,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: '#666', fontWeight: '500' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#276818' },
  confirmButtonContainer: {
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#276818',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
});