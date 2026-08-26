import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function AdminEventsList() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused(); // Para recarregar a lista ao voltar da edição
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const {
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertButtonText,
    showAlert,
    handleAlertPress,
    } = useCustomAlert();

    useEffect(() => {
        if (isFocused) {
            fetchEvents();
        }
    }, [isFocused]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error: any) {
            //Alert.alert('Erro', 'Não foi possível carregar os eventos.');
            showAlert('error', 'Erro', 'Não foi possível carregar os eventos.', 'OK');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Tens a certeza que desejas eliminar o evento "${title}"? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('events').delete().eq('id', id);
                        if (error) {
                            Alert.alert('Erro', 'Não foi possível eliminar o evento.');
                        } else {
                            fetchEvents(); // Recarrega a lista
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.eventCard}>
            <Image 
                source={{ 
                    uri: item.banner_url || `https://picsum.photos/seed/${item.id}/200` 
                }} 
                style={styles.eventImage} 
            />
            <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.eventDate}>
                    <Ionicons name="calendar-outline" size={14} /> {item.date}
                </Text>
            </View>
            
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#E3F2FD' }]} 
                    onPress={() => navigation.navigate('EditEvent', { eventId: item.id })}
                >
                    <Ionicons name="create-outline" size={22} color="#1A73E8" />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FFEBEE' }]} 
                    onPress={() => handleDelete(item.id, item.title)}
                >
                    <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gerir Eventos</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3BB85E" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
                    }
                />
            )}

            <CustomAlert
                    visible={alertVisible}
                    type={alertType}
                    title={alertTitle}
                    message={alertMessage}
                    buttonText={alertButtonText}
                    onPress={handleAlertPress}
                    />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, marginRight: 15, elevation: 2 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    listContent: { paddingHorizontal: 20, paddingBottom: 30 },
    eventCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 16, 
        padding: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    eventImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#EEE' },
    eventInfo: { flex: 1, marginLeft: 15 },
    eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    eventDate: { fontSize: 13, color: '#666', marginTop: 4 },
    actions: { flexDirection: 'row' },
    actionButton: { 
        width: 40, 
        height: 40, 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginLeft: 8 
    },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});