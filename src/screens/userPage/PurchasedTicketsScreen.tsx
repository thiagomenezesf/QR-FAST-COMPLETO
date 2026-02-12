import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'IngressosComprados'>;

export default function PurchasedTicketsScreen() {
  
  const navigation = useNavigation<NavProps>();

  // Mock de eventos (depois vem do banco)
  const [events] = useState([
    {
      id: '1',
      title: 'Festival de Música',
      date: '20/10/2026',
      location: 'São Paulo - SP',
      price: 'R$ 50,00',
    },
    {
      id: '2',
      title: 'Palestra Tech',
      date: '05/11/2026',
      location: 'Online',
      price: 'Gratuito',
    },
    {
      id: '3',
      title: 'Festa Universitária',
      date: '12/12/2026',
      location: 'Campinas - SP',
      price: 'R$ 30,00',
    },
  ]);

  const renderEvent = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DetalhesEventos', { eventId: item.id })}
    >
      <LinearGradient
        colors={['#b2d3bc', '#bed1c4', '#99b19f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.eventTitle}>{item.title}</Text>

        <Text style={styles.eventInfo}>📅 {item.date}</Text>
        <Text style={styles.eventInfo}>📍 {item.location}</Text>
        <Text style={styles.eventPrice}>🎟️ {item.price}</Text>

        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Ver detalhes</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingressos Adquiridos</Text>
      <Text style={styles.subtitle}>Verifique seus ingressos 🎟️</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f2e9',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  eventInfo: {
    color: '#fff',
    marginBottom: 4,
  },
  eventPrice: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 6,
  },
  buttonContainer: {
    marginTop: 14,
    backgroundColor: '#3BB85E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
