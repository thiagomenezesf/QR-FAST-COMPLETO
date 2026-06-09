import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg'; // Biblioteca instalada
import { supabase } from '../../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';

const { width } = Dimensions.get('window');

export default function QRCodeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { ticketId } = route.params; // Recebe o ID do ticket vindo da lista

  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketDetails();
  }, []);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          events (
            title,
            date,
            location
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicketData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#276818" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header com botão fechar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingresso Digital</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.ticketCard}>
        {/* Info do Evento */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{ticketData?.events?.title}</Text>
          <Text style={styles.eventDetails}>{ticketData?.events?.date} • {ticketData?.events?.location}</Text>
        </View>

        {/* Linha Divisora */}
        <View style={styles.dividerContainer}>
          <View style={styles.circleLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.circleRight} />
        </View>

        {/* QR Code Real */}
        <View style={styles.qrContainer}>
          <QRCode
            value={ticketId} // O conteúdo do QR Code é o ID do ticket
            size={width * 0.6}
            color="black"
            backgroundColor="white"
          />
          <Text style={styles.ticketIdText}>ID: {ticketId.split('-')[0].toUpperCase()}</Text>
        </View>

        <Text style={styles.instructions}>
          Apresente este código na entrada do evento para realizar o check-in.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#276818', // Cor tema para dar destaque
    paddingHorizontal: 20,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    marginBottom: 30,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  eventInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '118%', // Para os círculos "comerem" a borda
    marginVertical: 20,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
  },
  circleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#276818',
    marginLeft: -10,
  },
  circleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#276818',
    marginRight: -10,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  ticketIdText: {
    marginTop: 15,
    fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
    letterSpacing: 2,
  },
  instructions: {
    marginTop: 25,
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});