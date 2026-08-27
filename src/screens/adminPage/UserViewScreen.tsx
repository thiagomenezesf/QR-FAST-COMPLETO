import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    TextInput, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator, 
    Alert,
    ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase'; 
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type Users = {
    id: string;
    full_name: string;
    role: string;
    email: string;
};

type NavProps = NativeStackNavigationProp<RootStackParamList, 'UsuariosCadastrados'>;

export default function PessoasScreen() {
    const navigation = useNavigation<NavProps>();

    // Estados da Lista e Filtros
    const [user, setUser] = useState<Users[]>([]);
    const [filteredUser, setFilteredUser] = useState<Users[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'user' | 'admin' | 'assistant'>('all');
    
    // Estados de Controle e Modal
    const [loading, setLoading] = useState(true);

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
        fetchData();
    }, []);

    // Lógica de Filtro Combinada (Texto + Status)
    useEffect(() => {
        let result = user;

        if (statusFilter !== 'all') {
            result = result.filter(p => p.role === statusFilter);
        }

        if (searchText.trim() !== '') {
            const query = searchText.toLowerCase();
            result = result.filter(p => 
                p.full_name.toLowerCase().includes(query) || 
                p.email.toLowerCase().includes(query)
            );
        }

        setFilteredUser(result);
    }, [searchText, statusFilter, user]);

    async function fetchData() {
        try {
            setLoading(true);
            const { data, error } = await supabase
    .from('profiles')
    .select('*');

            if (error) throw error;

            const formattedData = data.map((item: any) => ({
                id: item.id,
                full_name: item.full_name || 'Sem nome',
                role: item.role || 'Sem cargo',
                email: item.email || 'Sem e-mail'
            }));

            setUser(formattedData);
        } catch (error: any) {
            // Alert.alert('Erro ao carregar', error.message);
            showAlert('error', 'Erro ao carregar', error.message, 'OK');
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: Users }) => {
        const getStatusStyles = (status: string) => {
            switch (status) {
                case 'admin': return { color: '#3BB85E', icon: 'shield-checkmark-outline', label: 'Administrador' };
                case 'assistant': return { color: '#FFB800', icon: 'build-outline', label: 'Assistente' };
                default: return { color: '#001d7c', icon: 'person-outline', label: 'Usuário' };
            }
        };
        const statusStyle = getStatusStyles(item.role);

        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('EditUserRole', { userId: item.id })}>
                    <LinearGradient colors={['#FFFFFF', '#F9FBF9']} style={styles.card}>
                        <View style={[styles.statusIndicator, { backgroundColor: statusStyle.color }]} />
                        <View style={[styles.cardIcon, { backgroundColor: statusStyle.color + '40' }]}>
                            <Ionicons name="person" size={20} color={statusStyle.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.personName}>{item.full_name}</Text>
                            <Text style={styles.personEmail}>{item.email}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                                {/* <Text style={styles.eventBadge}>{item.event_title}</Text> */}
                                <View style={[styles.miniStatusBadge, { backgroundColor: statusStyle.color + '15' }]}>
                                    <Text style={[styles.miniStatusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                                </View>
                            </View>
                        </View>
                        <Ionicons name={statusStyle.icon as any} size={22} color={statusStyle.color} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* Linha do Topo com Botão Voltar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Participantes</Text>
                </View>
                
                {/* Barra de Busca */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nome ou e-mail..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText !== '' && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={18} color="#CCC" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filtros de Status */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'user', label: 'Usuários' },
                        { id: 'assistant', label: 'Assistentes' },
                        { id: 'admin', label: 'Administradores' },
                    ].map((filter) => (
                        <TouchableOpacity 
                            key={filter.id}
                            onPress={() => setStatusFilter(filter.id as any)}
                            style={[
                                styles.filterChip, 
                                statusFilter === filter.id && styles.filterChipActive
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText, 
                                statusFilter === filter.id && styles.filterChipTextActive
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredUser}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
                onRefresh={fetchData}
                refreshing={loading}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50} color="#DDD" />
                        <Text style={styles.emptyText}>Nenhum participante encontrado.</Text>
                    </View>
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

const pickerStyle = {
    inputIOS: { fontSize: 16, padding: 15, backgroundColor: '#F0F0F0', borderRadius: 12, marginBottom: 15, color: '#333' },
    inputAndroid: { fontSize: 16, padding: 12, backgroundColor: '#F0F0F0', borderRadius: 12, marginBottom: 15, color: '#333' },
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { 
        paddingTop: Platform.OS === 'ios' ? 50 : 40, 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginLeft: -10
    },
    backButton: {
        padding: 10,
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F3F4F6', 
        borderRadius: 12, 
        paddingHorizontal: 12, 
        marginBottom: 15 
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, marginLeft: 8, color: '#333' },
    filterScroll: { flexDirection: 'row' },
    filterChip: { 
        paddingHorizontal: 18, 
        paddingVertical: 8, 
        borderRadius: 20, 
        backgroundColor: '#F3F4F6', 
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    filterChipActive: { backgroundColor: '#3BB85E', borderColor: '#3BB85E' },
    filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    filterChipTextActive: { color: '#FFF' },
    cardContainer: { paddingHorizontal: 20, marginBottom: 12 },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 16, 
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8
    },
    statusIndicator: { width: 4, height: '100%', position: 'absolute', left: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
    cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardContent: { flex: 1 },
    personName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    personEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    eventBadge: { fontSize: 11, color: '#3BB85E', fontWeight: 'bold' },
    miniStatusBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    miniStatusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 15 },
});