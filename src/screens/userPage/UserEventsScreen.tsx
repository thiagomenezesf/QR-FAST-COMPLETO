import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, ActivityIndicator, RefreshControl, Image, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'UserPage'>;

// Função de formatação de data (Mantida como a sua original)
const formatDateBadge = (dateString: string) => {
  if (!dateString) return { day: '--', month: '---' };
  try {
    const separator = dateString.includes('/') ? '/' : '-';
    const parts = dateString.split(separator);
    let year, monthIndex, day;
    if (parts[0].length === 4) {
      year = parseInt(parts[0]);
      monthIndex = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else {
      year = parseInt(parts[2]);
      monthIndex = parseInt(parts[1]) - 1;
      day = parseInt(parts[0]);
    }
    const date = new Date(year, monthIndex, day);
    const dayFormatted = day.toString().padStart(2, '0');
    const monthFormatted = date.toLocaleString('pt-BR', { month: 'short' })
      .replace('.', '').toUpperCase().substring(0, 3);
    return { day: dayFormatted, month: monthFormatted };
  } catch (e) {
    return { day: '??', month: '???' };
  }
};

export default function UserEventsScreen() {
  const navigation = useNavigation<NavProps>();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

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

  const fetchEvents = async () => {
    try {
      console.log("🔍 Buscando eventos no Supabase...");
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        console.log(`✅ ${data.length} eventos encontrados!`);
        setEvents(data);
        setFilteredEvents(data); // Garante que a lista visível receba os dados
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar eventos:', error.message);
      // Alert.alert("Erro", "Não foi possível carregar os eventos.");
      showAlert('error', 'Erro', 'Não foi possível carregar os eventos.', 'OK');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // FUNÇÃO DE FILTRO MELHORADA (Blindada contra erros)
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text || text.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = text.toLowerCase();
      const filtered = events.filter((event) => {
        const title = event.title?.toLowerCase() || '';
        const location = event.location?.toLowerCase() || '';
        const category = event.category?.toLowerCase() || '';
        return title.includes(query) || location.includes(query) || category.includes(query);
      });
      setFilteredEvents(filtered);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchText(''); 
    fetchEvents();
  };

  const renderEvent = ({ item }: any) => {
    const { day, month } = formatDateBadge(item.date);
    const hasBanner = item.banner_url && item.banner_url.startsWith('http');

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.cardContainer}
        onPress={() => navigation.navigate('DetalhesEventos', { eventId: item.id })}
      >
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: hasBanner ? item.banner_url : 'https://via.placeholder.com/800x400.png?text=Evento+Sem+Foto' }} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.floatingDateBadge}>
              <Text style={styles.dateText}>{day}</Text>
              <Text style={styles.monthText}>{month}</Text>
            </View>
            <View style={styles.floatingPrice}>
               <Text style={styles.floatingPriceText}>
                {typeof item.price === 'number' ? `R$ ${item.price.toFixed(2)}` : item.price}
               </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.categoryText}>{item.category || 'PRÓXIMO EVENTO'}</Text>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#3BB85E" />
              <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
            </View>

            <LinearGradient
                colors={['#3BB85E', '#276818']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
            >
                <Text style={styles.buttonText}>Ver Detalhes</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Explorar</Text>
        <View style={{width: 40}} /> 
      </View>

      <FlatList
        data={filteredEvents}
        extraData={filteredEvents} // Ajuda a FlatList a perceber mudanças no estado
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEvent}
        ListHeaderComponent={
          <View>
            <View style={styles.introSection}>
              <Text style={styles.welcomeText}>Eventos Disponíveis</Text>
              <Text style={styles.subtitle}>Escolha sua próxima experiência 🎉</Text>
            </View>

            {/* BARRA DE BUSCA */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#999" />
                <TextInput
                  placeholder="Pesquisar evento ou local..."
                  placeholderTextColor="#999"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={handleSearch}
                />
                {searchText !== '' && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#CCC" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#276818']} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#276818" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchText === '' ? "Nenhum evento cadastrado." : "Nenhum evento corresponde à busca."}
              </Text>
            </View>
          )
        }
      />

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
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingHorizontal: 20, 
    paddingBottom: 10 
  },
  backBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  introSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 15 },
  welcomeText: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#7C7C7C', marginTop: 4 },
  
  cardContainer: { paddingHorizontal: 20, marginBottom: 25 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 28, 
    overflow: 'hidden', 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  
  floatingDateBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 55,
  },
  dateText: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  monthText: { fontSize: 10, fontWeight: '700', color: '#3BB85E' },
  
  floatingPrice: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#3BB85E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  floatingPriceText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  cardBody: { padding: 20 },
  categoryText: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#3BB85E', 
    letterSpacing: 1, 
    marginBottom: 5 
  },
  eventTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  eventLocation: { fontSize: 14, color: '#666', marginLeft: 6 },
  
  actionButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginRight: 10 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 15 },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    height: 55,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
  }
});