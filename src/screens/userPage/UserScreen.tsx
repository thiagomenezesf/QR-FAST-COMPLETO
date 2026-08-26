import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Alert, Modal, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'UserPageNew'>;

interface Notification {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
}

export default function UserScreen() {
    const navigation = useNavigation<NavProps>();
    const [userName, setUserName] = useState('Visitante');
    const [showLogout, setShowLogout] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

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

    // 1. Carregar dados iniciais (histórico)
    useEffect(() => {
        loadData();
    }, []);

    // 2. CONFIGURAÇÃO REALTIME (Ouvir mudanças agora)
    useEffect(() => {
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'events' },
                (payload) => {
                    const newEvent = payload.new as any;
                    const notif: Notification = {
                        id: Math.random().toString(),
                        title: 'Novo Evento!',
                        description: `"${newEvent.title}" acaba de ser publicado.`,
                        icon: 'flash',
                        color: '#FFD700',
                        bgColor: '#FFF8E1'
                    };
                    setNotifications(prev => [notif, ...prev]);
                    setHasNewNotifications(true);
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tickets' },
                async (payload) => {
                    // Quando um ticket novo entra, buscamos o nome do evento dele
                    const newTicket = payload.new as any;
                    const { data } = await supabase
                        .from('events')
                        .select('title')
                        .eq('id', newTicket.event_id)
                        .single();

                    const notif: Notification = {
                        id: Math.random().toString(),
                        title: 'Compra Confirmada!',
                        description: `Seu ingresso para "${data?.title || 'o evento'}" já está na carteira.`,
                        icon: 'ticket',
                        color: '#276818',
                        bgColor: '#E8F5E9'
                    };
                    setNotifications(prev => [notif, ...prev]);
                    setHasNewNotifications(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadData = async () => {
        await fetchUserName();
        await checkRealNotifications();
    };

    const fetchUserName = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const nameFromAuth = user.user_metadata?.display_name || user.user_metadata?.full_name;
                setUserName(nameFromAuth ? nameFromAuth.split(' ')[0] : user.email?.split('@')[0] || 'Usuário');
            }
        } catch (error) {
            console.log('Erro ao carregar nome:', error);
        }
    };

    const checkRealNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let realNotifs: Notification[] = [];

            // 1. BUSCAR TICKETS NO HISTÓRICO
            const { data: tickets } = await supabase
                .from('tickets')
                .select('id, events(title)')
                .eq('user_id', user.id)
                .limit(5);

            if (tickets && tickets.length > 0) {
                tickets.forEach(t => {
                    const eventData = t.events as any;
                    realNotifs.push({
                        id: `ticket_${t.id}`,
                        title: 'Ingresso Confirmado',
                        description: `Seu ingresso para "${eventData?.title || "seu evento"}" está ativo.`,
                        icon: 'ticket',
                        color: '#276818',
                        bgColor: '#E8F5E9'
                    });
                });
            }

            // 2. BUSCAR EVENTOS NOVOS (ÚLTIMAS 24H)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: novosEventos } = await supabase
                .from('events')
                .select('title')
                .gt('created_at', yesterday)
                .limit(5);

            if (novosEventos && novosEventos.length > 0) {
                realNotifs.push({
                    id: 'new_event_hist',
                    title: 'Novidade na área!',
                    description: `O evento "${novosEventos[0].title}" foi postado recentemente.`,
                    icon: 'flash',
                    color: '#FFD700',
                    bgColor: '#FFF8E1'
                });
            }

            // Notificação de Segurança
            const now = new Date();
            realNotifs.push({
                id: 'login_notif',
                title: 'Acesso Confirmado',
                description: `Login realizado às ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}.`,
                icon: 'shield-checkmark',
                color: '#1976D2',
                bgColor: '#E3F2FD'
            });

            setNotifications(realNotifs);
            if (realNotifs.length > 0) setHasNewNotifications(true);

        } catch (error) {
            console.log('Erro ao buscar notificações:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (error: any) {
            // Alert.alert("Erro ao sair", error.message);
            showAlert('error', 'Erro ao sair', error.message || 'Não foi possível sair da conta.', 'OK');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <LinearGradient colors={['#E8F5E9', '#F8F9FA']} style={styles.headerBackground}>
                <View style={styles.topRow}>
                    <View style={styles.profileContainer}>
                        <TouchableOpacity style={styles.logoBadge} onPress={() => setShowLogout(!showLogout)}>
                            <Ionicons name="person" size={24} color="#276818" />
                        </TouchableOpacity>
                        {showLogout && (
                            <TouchableOpacity style={styles.logoutBubble} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={16} color="#FF4444" />
                                <Text style={styles.logoutText}>Sair</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={styles.notificationBtn} onPress={() => { setShowNotifications(true); setHasNewNotifications(false); }}>
                        <Ionicons name="notifications-outline" size={24} color="#333" />
                        {hasNewNotifications && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.welcomeSection}>
                    <Text style={styles.title}>Olá, <Text style={{color: '#276818'}}>{userName}</Text></Text>
                    <Text style={styles.subtitle}>O que vamos curtir hoje?</Text>
                </View>
            </LinearGradient>

            <Modal animationType="fade" transparent visible={showNotifications} onRequestClose={() => setShowNotifications(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifications(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notificações</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {notifications.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#999', marginTop: 10 }}>Nenhuma notificação no momento.</Text>
                            ) : (
                                notifications.map((item) => (
                                    <View key={item.id} style={styles.notificationItem}>
                                        <View style={[styles.notifIcon, {backgroundColor: item.bgColor}]}>
                                            <Ionicons name={item.icon} size={20} color={item.color} />
                                        </View>
                                        <View style={styles.notifTextContainer}>
                                            <Text style={styles.notifTitle}>{item.title}</Text>
                                            <Text style={styles.notifDesc}>{item.description}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.menuSection}>
                <TouchableOpacity activeOpacity={0.9} style={styles.mainCard} onPress={() => navigation.navigate('UserPage')}>
                    <LinearGradient colors={['#3BB85E', '#276818']} style={styles.cardGradient}>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>Explorar Eventos</Text>
                            <Text style={styles.cardDescription}>Encontre as melhores festas e experiências</Text>
                        </View>
                        <View style={styles.cardIconWrapper}>
                            <Ionicons name="beer-outline" size={40} color="#FFF" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Sua Carteira</Text>

                <TouchableOpacity activeOpacity={0.7} style={styles.secondaryCard} onPress={() => navigation.navigate('IngressosComprados')}>
                    <View style={styles.secondaryIconContainer}>
                        <Ionicons name="ticket-outline" size={30} color="#276818" />
                    </View>
                    <View style={styles.secondaryTextContainer}>
                        <Text style={styles.secondaryTitle}>Meus Ingressos</Text>
                        <Text style={styles.secondarySubtitle}>Acesse seus QR Codes de entrada</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <View style={[styles.infoBanner, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                    <Text style={[styles.infoText, { color: '#2E7D32' }]}>Conta sincronizada e segura.</Text>
                </View>
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
    headerBackground: {
        paddingTop: 60, paddingHorizontal: 25, paddingBottom: 30,
        borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    profileContainer: { alignItems: 'center', position: 'relative' },
    logoBadge: {
        width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', elevation: 2,
    },
    logoutBubble: {
        position: 'absolute', top: 55, left: 0, backgroundColor: '#FFF',
        paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', elevation: 10, zIndex: 999,
        borderWidth: 1, borderColor: '#EEE', minWidth: 80,
    },
    logoutText: { color: '#FF4444', fontWeight: '700', marginLeft: 8, fontSize: 14 },
    notificationBtn: {
        width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', position: 'relative'
    },
    badge: {
        position: 'absolute', top: 12, right: 12, width: 10, height: 10,
        backgroundColor: '#FF4444', borderRadius: 5, borderWidth: 2, borderColor: '#FFF'
    },
    welcomeSection: { marginTop: 10 },
    title: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start', alignItems: 'flex-end',
        paddingTop: 110, paddingRight: 25
    },
    modalContent: {
        width: Dimensions.get('window').width * 0.8,
        backgroundColor: '#FFF', borderRadius: 20, padding: 20,
        elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', paddingBottom: 10
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
    notificationItem: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
    notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    notifTextContainer: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
    notifDesc: { fontSize: 12, color: '#777', marginTop: 2 },
    menuSection: { flex: 1, paddingHorizontal: 25, paddingTop: 30 },
    mainCard: {
        height: 160, borderRadius: 25, overflow: 'hidden',
        marginBottom: 30, elevation: 8, shadowColor: '#276818',
    },
    cardGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 25 },
    cardInfo: { flex: 1, paddingRight: 10 },
    cardTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    cardDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8, lineHeight: 20 },
    cardIconWrapper: {
        width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20, justifyContent: 'center', alignItems: 'center'
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 15, marginLeft: 5 },
    secondaryCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EEE', marginBottom: 20
    },
    secondaryIconContainer: {
        width: 55, height: 55, backgroundColor: '#E8F5E9',
        borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    secondaryTextContainer: { flex: 1 },
    secondaryTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    secondarySubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    infoBanner: {
        flexDirection: 'row', alignItems: 'center',
        padding: 15, borderRadius: 15, marginTop: 'auto', marginBottom: 40,
        borderWidth: 1,
    },
    infoText: { fontSize: 12, marginLeft: 10, fontWeight: '600' },
});