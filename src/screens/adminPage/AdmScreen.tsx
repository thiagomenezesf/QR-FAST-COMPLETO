import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase'; // Import do Supabase

const MenuButton = ({ title, subtitle, icon, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
);

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Administração'>;

export default function AdmScreen() {
    const navigation = useNavigation<NavProps>();
    const [isPressedQR, setIsPressedQR] = useState(false);
    const [showLogout, setShowLogout] = useState(false); // Estado para controlar o menu de logout

    // Função de Logout para o ADM
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error: any) {
            Alert.alert("Erro ao sair", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Painel de</Text>
                    <Text style={styles.title}>Administração</Text>
                </View>

                {/* CONTAINER DO PERFIL COM LOGOUT */}
                <View style={styles.profileContainer}>
                    <TouchableOpacity 
                        style={styles.profileBtn} 
                        onPress={() => setShowLogout(!showLogout)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle" size={45} color="#276818" />
                    </TouchableOpacity>

                    {showLogout && (
                        <TouchableOpacity 
                            style={styles.logoutBubble} 
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={16} color="#FF4444" />
                            <Text style={styles.logoutText}>Sair</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Grid 1: Pessoas e Estatísticas */}
            <View style={styles.grid}>
                <MenuButton 
                    title="Pessoas"
                    subtitle="Gerenciar lista"
                    icon="people-outline"
                    color="#276818"
                    onPress={() => navigation.navigate('Pessoas')}
                />

                <MenuButton 
                    title="Estatísticas"
                    subtitle="Ver relatórios"
                    icon="bar-chart-outline"
                    color="#1A73E8"
                    onPress={() => navigation.navigate('Dashboard')}
                />
            </View>

            {/* Grid 2: Novo Evento e Gerenciar/Editar */}
            <View style={[styles.grid, { marginTop: -15 }]}>
                <MenuButton 
                    title="Novo Evento"
                    subtitle="Cadastrar festa"
                    icon="add-circle-outline"
                    color="#3BB85E"
                    onPress={() => navigation.navigate('CreateEvent' as any)}
                />

                <MenuButton 
                    title="Gerenciar"
                    subtitle="Editar eventos"
                    icon="create-outline"
                    color="#E91E63" 
                    onPress={() => navigation.navigate('AdminEventsList' as any)} 
                />
            </View>

            <View style={styles.scannerSection}>
                <Text style={styles.sectionLabel}>Ação Principal</Text>
                
                <TouchableOpacity 
                    onPressOut={() => setIsPressedQR(false)} 
                    onPressIn={() => setIsPressedQR(true)} 
                    onPress={() => navigation.navigate('Scanner')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#3BB85E', '#276818']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.buttonQR,
                            isPressedQR && styles.buttonPressedScale
                        ]}
                    >
                        <View style={styles.qrContent}>
                            <View style={styles.qrIconWrapper}>
                                <Ionicons name="qr-code-outline" size={40} color="white" />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>Ler QR Code</Text>
                                <Text style={styles.cardSubtitle}>Validar entrada no evento</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                    O sistema sincroniza automaticamente as entradas validadas.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 25 },
    header: { marginTop: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
    welcome: { fontSize: 16, color: '#666', fontWeight: '500' },
    title: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
    
    // ESTILOS DO LOGOUT NO ADM
    profileContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    profileBtn: { padding: 5 },
    logoutBubble: {
        position: 'absolute',
        top: 50,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 999,
        borderWidth: 1,
        borderColor: '#EEE',
        minWidth: 85,
    },
    logoutText: {
        color: '#FF4444',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 14,
    },

    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    menuCard: { backgroundColor: '#FFF', width: '47%', padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    menuTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
    menuSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
    scannerSection: { width: '100%' },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    buttonQR: { borderRadius: 25, padding: 25, elevation: 8, shadowColor: '#276818', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    buttonPressedScale: { transform: [{ scale: 0.98 }], opacity: 0.9 },
    qrContent: { flexDirection: 'row', alignItems: 'center' },
    qrIconWrapper: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
    infoBox: { flexDirection: 'row', backgroundColor: '#EEE', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
    infoText: { fontSize: 13, color: '#666', marginLeft: 10, flex: 1 }
});