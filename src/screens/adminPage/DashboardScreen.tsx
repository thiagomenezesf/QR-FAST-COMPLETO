import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface EventStat {
    title: string;
    salesCount: number;
    capacity: number;
    percentage: string;
    color: string;
}

export default function DashboardScreen() {
    const navigation = useNavigation<NavProps>();
    
    // Estados para os dados reais
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalTickets, setTotalTickets] = useState(0);
    const [totalCheckins, setTotalCheckins] = useState(0);
    const [eventStats, setEventStats] = useState<EventStat[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Buscamos todos os ingressos pagos e seus respectivos eventos (trazendo capacity)
            const { data: tickets, error: ticketsError } = await supabase
                .from('tickets')
                .select(`
                    price,
                    status,
                    payment_status,
                    event_id,
                    events ( title, capacity )
                `)
                .eq('payment_status', 'paid');

            if (ticketsError) throw ticketsError;

            let revenue = 0;
            let checkins = 0;
            const eventMap: any = {};

            // 2. Processamos os dados
            tickets?.forEach(ticket => {
                // Soma receita real da coluna price
                revenue += ticket.price || 0;

                // Conta check-ins (status used)
                if (ticket.status === 'used') checkins++;
                
                // Agrupa estatísticas por evento
                const eventId = ticket.event_id;
                const eventData = ticket.events as any;
                
                if (!eventMap[eventId]) {
                    eventMap[eventId] = {
                        title: eventData?.title || 'Sem Nome',
                        salesCount: 0,
                        capacity: eventData?.capacity || 1, // evita divisão por zero
                    };
                }
                eventMap[eventId].salesCount++;
            });

            // 3. Formata a lista de eventos para o gráfico
            const colors = ['#3BB85E', '#2196F3', '#FF9800', '#E91E63'];
            const formattedEvents: EventStat[] = Object.values(eventMap).map((ev: any, index: number) => {
                const perc = (ev.salesCount / ev.capacity) * 100;
                return {
                    ...ev,
                    percentage: `${Math.min(perc, 100).toFixed(0)}%`,
                    color: colors[index % colors.length]
                };
            });

            setTotalRevenue(revenue);
            setTotalTickets(tickets?.length || 0);
            setTotalCheckins(checkins);
            setEventStats(formattedEvents);

        } catch (error: any) {
            console.error('Erro dashboard:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Painel de Controle</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchDashboardData}>
                    <Ionicons name="refresh" size={20} color="#276818" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
                }
            >
                
                <Text style={styles.sectionLabel}>Visão Geral das Vendas</Text>
                
                {/* Card Principal de Receita Real */}
                <LinearGradient
                    colors={['#276818', '#143a0d']}
                    style={styles.mainStatsCard}
                >
                    <View style={styles.mainStatsHeader}>
                        <Text style={styles.mainStatsLabel}>Receita Total (Líquida)</Text>
                        <Ionicons name="trending-up" size={24} color="#3BB85E" />
                    </View>
                    <Text style={styles.mainStatsValue}>
                        R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.growthBadge}>
                        <Text style={styles.growthText}>Dados atualizados em tempo real</Text>
                    </View>
                </LinearGradient>

                {/* Grid de Métricas Reais */}
                <View style={styles.statsGrid}>
                    <View style={styles.smallCard}>
                        <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
                            <Ionicons name="ticket" size={20} color="#1565C0" />
                        </View>
                        <Text style={styles.smallCardValue}>{totalTickets}</Text>
                        <Text style={styles.smallCardLabel}>Vendas</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}>
                            <Ionicons name="people" size={20} color="#EF6C00" />
                        </View>
                        <Text style={styles.smallCardValue}>{totalCheckins}</Text>
                        <Text style={styles.smallCardLabel}>Check-ins</Text>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Capacidade e Ocupação</Text>

                {/* Lista de Eventos Dinâmica */}
                {eventStats.length === 0 && !loading && (
                    <Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>Nenhuma venda registrada ainda.</Text>
                )}

                {eventStats.map((item, index) => (
                    <View key={index} style={styles.eventProgressCard}>
                        <View style={styles.eventProgressHeader}>
                            <Text style={styles.eventProgressTitle}>{item.title}</Text>
                            <Text style={styles.eventProgressValue}>{item.percentage}</Text>
                        </View>
                        <Text style={extraStyles.stockText}>{item.salesCount} de {item.capacity} ingressos</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: item.percentage as any, backgroundColor: item.color }]} />
                        </View>
                    </View>
                ))}

            </ScrollView>
        </View>
    );
}


const extraStyles = StyleSheet.create(
{
    stockText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    }
}
) 

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
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    refreshButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 25,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginTop: 10,
    },
    mainStatsCard: {
        padding: 25,
        borderRadius: 30,
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#276818',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    mainStatsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainStatsLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    mainStatsValue: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '900',
        marginVertical: 10,
    },
    growthBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    growthText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    smallCard: {
        width: '48%',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    smallCardValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    smallCardLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginTop: 2,
    },
    eventProgressCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    eventProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    eventProgressTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    eventProgressValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#276818',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#DDD',
        borderStyle: 'dashed',
    },
    exportButtonText: {
        marginLeft: 10,
        color: '#666',
        fontWeight: '600',
    },
});