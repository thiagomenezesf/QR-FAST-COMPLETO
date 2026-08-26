import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, use } from 'react'; // 1. Adicionado
import { supabase } from '../../services/supabase'; // 2. Adicionado

type NavProps = NativeStackNavigationProp<RootStackParamList, 'DetalhesEventos'>;

export default function EventDetailsScreen() {
    const navigation = useNavigation<NavProps>();
    const route = useRoute<any>();
    const { eventId } = route.params || {};

    // 3. Estados para os dados do banco
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dataBR, setDataBR] = useState<any>(null);

    // 4. Busca os detalhes do evento ao carregar a tela
    useEffect(() => {
        async function fetchEventDetails() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('event_availability')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;                
                setEvent(data);

                const dataString = data.date;
                const [ano, mes, dia] = dataString.split('-');
                const dataBRatt = `${dia}/${mes}/${ano}`;
                setDataBR( dataBRatt );

            } catch (error) {
                console.error('Erro ao buscar detalhes:', error);
            } finally {
                setLoading(false);
            }
        }

        if (eventId) {
            fetchEventDetails();
        }
    }, [eventId]);

    // 5. Tela de carregamento
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#276818" />
                <Text style={{ marginTop: 10, color: '#666' }}>Carregando detalhes...</Text>
            </View>
        );
    }

    // 6. Caso o evento não exista
    if (!event) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Evento não encontrado.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#276818', marginTop: 10 }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Banner com Overlay */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: event.banner_url || 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229' }} style={styles.banner} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', '#F8F9FA']}
                        style={styles.imageOverlay}
                    />
                    
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Conteúdo dinâmico */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{event.category || 'Geral'}</Text>
                        </View>
                        <Text style={styles.availableText}>
                            {event.available_tickets} vagas
                        </Text>
                    </View>

                    <Text style={styles.title}>{event.title}</Text>

                    <View style={styles.quickInfoRow}>
                        <View style={styles.infoItem}>
                            <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                                <Ionicons name="calendar" size={20} color="#276818" />
                            </View>
                            <Text style={styles.infoLabel}>Data</Text>
                            <Text style={styles.infoValue}>{dataBR}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
                                <Ionicons name="location" size={20} color="#1565C0" />
                            </View>
                            <Text style={styles.infoLabel}>Local</Text>
                            <Text style={styles.infoValue}>{event.location}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Sobre o Evento</Text>
                    <Text style={styles.descriptionText}>{event.description}</Text>

                    {/* Mapeamento das regras do banco (array de strings) */}
                    {event.rules && event.rules.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Regras Importantes</Text>
                            <View style={styles.rulesContainer}>
                                {event.rules.map((rule: string, index: number) => (
                                    <View key={index} style={styles.ruleItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#276818" />
                                        <Text style={styles.ruleText}>{rule}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                    
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Barra de Ação Fixa */}
            <View style={styles.bottomActions}>
                <View>
                    <Text style={styles.priceLabel}>Valor do Ingresso</Text>
                    <Text style={styles.priceValue}>{event.price}</Text>
                </View>

                <TouchableOpacity
                    disabled={event.available_tickets === 0}
                    style={styles.buyButtonContainer}
                    onPress={() => navigation.navigate('ComprarIngresso', { event })}
                >
                    <LinearGradient
                        colors={event.available_tickets > 0 ? ['#3BB85E', '#276818'] : ['#999', '#777']}
                        style={styles.buyButton}
                    >
                        <Text style={styles.buyButtonText}>
                            {event.available_tickets > 0 ? 'Garantir Vaga' : 'Esgotado'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    imageContainer: {
        width: '100%',
        height: 350,
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginTop: -40,
        backgroundColor: '#F8F9FA',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    badge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: {
        color: '#276818',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    availableText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        marginBottom: 25,
    },
    quickInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    infoItem: {
        width: '48%',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 12,
        marginTop: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
        marginBottom: 25,
    },
    rulesContainer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ruleText: {
        fontSize: 14,
        color: '#444',
        marginLeft: 10,
        flex: 1,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#FFF',
        flexDirection: 'row',
        paddingHorizontal: 25,
        paddingTop: 20,
        paddingBottom: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#EEE',
    },
    priceLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1A1A',
    },
    buyButtonContainer: {
        width: '60%',
        height: 55,
        borderRadius: 16,
        overflow: 'hidden',
    },
    buyButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});