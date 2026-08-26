import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importante instalar: npx expo install @react-native-async-storage/async-storage

export default function PurchasedTicketsScreen() {
  const navigation = useNavigation<any>();
  const [tickets, setTickets] = useState<any[]>([]);
  const [totalTicketsCount, setTotalTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false); // Para saber se estamos vendo dados locais
  const [dataBR, setDataBR] = useState<any>(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  // CHAVE ÚNICA PARA O ARMAZENAMENTO
  const TICKETS_CACHE_KEY = '@my_tickets_cache';

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const buildDisplayTickets = (rawTickets: any[]) => {
    const pendingGroups: Record<string, any[]> = {};
    const pendingOrder: string[] = [];
    const normalItems: any[] = [];

    rawTickets.forEach((ticket) => {
      const isPending = ticket.status === 'pending' && !!ticket.payment_id;
      if (!isPending) {
        normalItems.push({
          ...ticket,
          groupedPending: false,
          quantity: 1,
          total: Number(ticket.price ?? ticket.events?.price ?? 0),
        });
        return;
      }

      const key = String(ticket.payment_id);
      if (!pendingGroups[key]) {
        pendingGroups[key] = [];
        pendingOrder.push(key);
      }
      pendingGroups[key].push(ticket);
    });

    const groupedPendingItems = pendingOrder.map((paymentId) => {
      const group = pendingGroups[paymentId];
      const firstTicket = group[0];
      const quantity = group.length;
      const total = group.reduce((acc, current) => {
        return acc + Number(current.price ?? current.events?.price ?? 0);
      }, 0);

      return {
        ...firstTicket,
        id: `pending-${paymentId}`,
        groupedPending: true,
        quantity,
        total,
        payment_id: paymentId,
      };
    });

    return [...groupedPendingItems, ...normalItems];
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Se não houver user (offline no login), tenta carregar o que tem
        await loadOfflineTickets();
        return;
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          status,
          payment_id,
          payment_status,
          price,
          created_at,
          events (
            id,
            title,
            date,
            location,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTotalTicketsCount(data.length);
        setTickets(buildDisplayTickets(data));
        setIsOfflineData(false);
        // SALVA UMA CÓPIA LOCAL SEMPRE QUE BUSCAR COM SUCESSO
        await AsyncStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.log('Sem internet ou erro ao buscar, tentando modo offline...');
      await loadOfflineTickets();
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO PARA CARREGAR DADOS DO CELULAR
  const loadOfflineTickets = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(TICKETS_CACHE_KEY);
      if (cachedData !== null) {
        const parsed = JSON.parse(cachedData);
        setTotalTicketsCount(parsed.length);
        setTickets(buildDisplayTickets(parsed));
        setIsOfflineData(true);
      }
    } catch (e) {
      console.error('Erro ao ler cache offline', e);
    }
  };

  const renderEvent = ({ item }: any) => {
    const event = item.events;
    const isPending = item.status === 'pending';
    const isUsed = item.status === 'used';
    const quantity = Number(item.quantity ?? 1);
    const total = Number(item.total ?? event?.price ?? 0);
    const ticketPrice = item.price;

    const dataString = event.date;
                const [ano, mes, dia] = dataString.split('-');
                const dataBRatt = `${dia}/${mes}/${ano}`;
                setDataBR( dataBRatt );

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={isUsed}
        onPress={() => {
          if (isPending) {
            navigation.navigate('ConfirmarCompra', {
              event,
              quantity,
              total,
              paymentId: item.payment_id,
            });
          } else {
            navigation.navigate('QRCodepage', { ticketId: item.id });
          }
        }}
        style={[
            styles.ticketContainer, 
            isPending && { opacity: 0.8 },
            isUsed && { opacity: 0.6 } 
        ]}
      >
        <View style={[
            styles.ticketLeft, 
            { backgroundColor: isUsed ? '#9E9E9E' : (isPending ? '#FFA000' : '#276818') }
        ]}>
          <Ionicons 
            name={isUsed ? "checkmark-done" : (isPending ? "time" : "qr-code")} 
            size={24} 
            color="#FFF" 
          />
        </View>

        <View style={styles.ticketBody}>
          <View style={styles.ticketHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event?.title}</Text>
            <View style={[
                styles.statusBadge, 
                { backgroundColor: isUsed ? '#E0E0E0' : (isPending ? '#FFF3E0' : '#E8F5E9') }
            ]}>
              <Text style={[
                  styles.statusText, 
                  { color: isUsed ? '#666' : (isPending ? '#FF8F00' : '#276818') }
              ]}>
                {isUsed ? 'Utilizado' : (isPending ? 'Pendente' : 'Confirmado')}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.eventInfo}>{dataBR}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.eventInfo} numberOfLines={1}>{event?.location}</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.ticketFooter}>
            <Text style={styles.priceText}>
              {isPending && quantity > 1 ? formatCurrency(total) : (isPending ?formatCurrency(event?.price) : formatCurrency(ticketPrice))}
            </Text>
            <Text style={[
                styles.viewDetailsText, 
                { color: isUsed ? '#999' : (isPending ? '#999' : '#276818') }
            ]}>
              {isUsed
                ? 'Ingresso já utilizado'
                : (isPending
                  ? `${quantity} ingresso(s) - Retomar Pix`
                  : 'Ver QR Code →')}
            </Text>
          </View>
        </View>
        
        <View style={styles.cutOutTop} />
        <View style={styles.cutOutBottom} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Ingressos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* AVISO DE MODO OFFLINE (Opcional, mas bom para o usuário saber) */}
      {isOfflineData && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#FFF" />
          <Text style={styles.offlineText}>Você está visualizando ingressos salvos offline.</Text>
        </View>
      )}

      <View style={styles.summarySection}>
        {loading && tickets.length === 0 ? (
          <ActivityIndicator color="#276818" />
        ) : (
          <Text style={styles.subtitle}>
            {totalTicketsCount === 0 
              ? "Você ainda não tem ingressos." 
              : `Você tem ${totalTicketsCount} ingresso(s)`}
          </Text>
        )}
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchMyTickets}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  summarySection: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  ticketContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginBottom: 20,
    borderRadius: 20,
    height: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  ticketLeft: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketBody: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  eventInfo: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cutOutTop: {
    position: 'absolute',
    top: -10,
    left: 50,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  cutOutBottom: {
    position: 'absolute',
    bottom: -10,
    left: 50,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  offlineBanner: { 
    backgroundColor: '#666', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 5, 
    marginBottom: 10 
  },
  offlineText: { 
    color: '#FFF', 
    fontSize: 12, 
    marginLeft: 10, 
    fontWeight: '600' 
  }
});