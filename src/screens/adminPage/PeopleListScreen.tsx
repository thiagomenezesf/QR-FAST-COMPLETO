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

type Person = {
    id: string;
    owner_name: string;
    owner_email: string;
    event_title?: string;
    status: string;
    price?: number;
};

type NavProps = NativeStackNavigationProp<RootStackParamList, 'Pessoas'>;

export default function PessoasScreen() {
    const navigation = useNavigation<NavProps>();

    // Estados da Lista e Filtros
    const [people, setPeople] = useState<Person[]>([]);
    const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'pending' | 'used'>('all');
    
    // Estados de Controle e Modal
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Estados do Formulário
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [price, setPrice] = useState(''); 
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
    const [eventOptions, setEventOptions] = useState<{label: string, value: any}[]>([]);

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
        fetchEvents();
    }, []);

    // Lógica de Filtro Combinada (Texto + Status)
    useEffect(() => {
        let result = people;

        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter);
        }

        if (searchText.trim() !== '') {
            const query = searchText.toLowerCase();
            result = result.filter(p => 
                p.owner_name.toLowerCase().includes(query) || 
                p.owner_email.toLowerCase().includes(query)
            );
        }

        setFilteredPeople(result);
    }, [searchText, statusFilter, people]);

    async function fetchData() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tickets')
                .select(`id, owner_name, owner_email, status, price, events ( title )`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data.map((item: any) => ({
                id: item.id,
                owner_name: item.owner_name || 'Sem nome',
                owner_email: item.owner_email || 'Sem e-mail',
                status: item.status,
                price: item.price,
                event_title: item.events?.title || 'Evento não identificado'
            }));

            setPeople(formattedData);
        } catch (error: any) {
            // Alert.alert('Erro ao carregar', error.message);
            showAlert('error', 'Erro ao carregar', error.message, 'OK');
        } finally {
            setLoading(false);
        }
    }

    async function fetchEvents() {
        try {
            const { data, error } = await supabase.from('events').select('id, title');
            if (error) throw error;
            if (data) {
                setEventOptions(data.map(ev => ({ label: ev.title, value: ev.id })));
            }
        } catch (error: any) {
            console.error('Erro ao buscar eventos:', error.message);
        }
    }

    async function handleAddPerson() {
        if (!name || !email || !selectedEventId || !price) {
            // Alert.alert('Atenção', 'Preencha todos os campos.');
            showAlert('warning', 'Atenção', 'Preencha todos os campos.', 'OK');
            return;
        }
        try {
            setLoading(true);
            const { data: userData } = await supabase.rpc('get_user_id_by_email', { email_search: email.toLowerCase().trim() });
            const foundUserId = userData && userData.length > 0 ? userData[0].id : null;

            const { error: insertError } = await supabase.from('tickets').insert([{
                owner_name: name,
                owner_email: email.toLowerCase().trim(),
                event_id: selectedEventId,
                user_id: foundUserId,
                price: parseFloat(price.replace(',', '.')),
                status: 'valid',
                payment_status: 'paid',
                payment_id: 'MANUAL_ADM_' + Date.now()
            }]);

            if (insertError) throw insertError;
            
            setName(''); setEmail(''); setPrice(''); setSelectedEventId(undefined);
            setModalVisible(false);
            fetchData();
        } catch (error: any) { 
            // Alert.alert('Erro', error.message); 
            showAlert('error', 'Erro', error.message, 'OK');
        } finally { 
            setLoading(false); 
        }
    }

    const renderItem = ({ item }: { item: Person }) => {
        const getStatusStyles = (status: string) => {
            switch (status) {
                case 'used': return { color: '#979595', icon: 'checkmark-circle', label: 'Usado' };
                case 'pending': return { color: '#ecbc38', icon: 'time', label: 'Pendente' };
                default: return { color: '#3BB85E', icon: 'ticket', label: 'Válido' };
            }
        };
        const statusStyle = getStatusStyles(item.status);

        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('PessoaDetalhes', { ticketId: item.id })}>
                    <LinearGradient colors={['#FFFFFF', '#F9FBF9']} style={styles.card}>
                        <View style={[styles.statusIndicator, { backgroundColor: statusStyle.color }]} />
                        <View style={styles.cardIcon}><Ionicons name="person" size={20} color="#3BB85E" /></View>
                        <View style={styles.cardContent}>
                            <Text style={styles.personName}>{item.owner_name}</Text>
                            <Text style={styles.personEmail}>{item.owner_email}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                                <Text style={styles.eventBadge}>{item.event_title}</Text>
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
                        { id: 'valid', label: 'Válidos' },
                        { id: 'pending', label: 'Pendentes' },
                        { id: 'used', label: 'Usados' }
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
                data={filteredPeople}
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

            {/* Botão Flutuante (FAB) */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <LinearGradient colors={['#3BB85E', '#1B8A3B']} style={styles.fabGradient}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.fabText}>Novo Ingresso</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Modal de Cadastro */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderIndicator} />
                        <Text style={styles.modalTitle}>Emitir Ingresso</Text>
                        
                        <TextInput placeholder="Nome" style={styles.input} value={name} onChangeText={setName} />
                        <TextInput placeholder="E-mail" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <TextInput placeholder="Preço (R$)" style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
                        
                        <RNPickerSelect 
                            onValueChange={setSelectedEventId} 
                            items={eventOptions} 
                            style={pickerStyle} 
                            placeholder={{ label: 'Selecione o evento...', value: null }}
                        />

                        <TouchableOpacity onPress={handleAddPerson} style={styles.saveButton} disabled={loading}>
                            <LinearGradient colors={['#3BB85E', '#1B8A3B']} style={styles.saveGradient}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Confirmar e Gerar</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

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
    cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardContent: { flex: 1 },
    personName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    personEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    eventBadge: { fontSize: 11, color: '#3BB85E', fontWeight: 'bold' },
    miniStatusBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    miniStatusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 15 },
    fab: { position: 'absolute', bottom: 30, alignSelf: 'center', width: '65%' },
    fabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30 },
    fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
    modalHeaderIndicator: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#111827' },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 15, fontSize: 16 },
    saveButton: { marginTop: 10 },
    saveGradient: { paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelText: { textAlign: 'center', marginTop: 20, color: '#9CA3AF', fontWeight: '600' },
});