import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { RootStackParamList } from '../../types/RootStackParamList';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'EditUserRole'>;
type RouteProps = RouteProp<RootStackParamList, 'EditUserRole'>;
type Role = 'admin' | 'user' | 'assistant';
type Profile = { id: string; full_name: string | null; email: string | null; role: Role; updated_at: string | null };

const roleOptions: { value: Role; label: string; icon: 'shield-checkmark-outline' | 'person-outline' | 'build-outline' }[] = [
    { value: 'admin', label: 'Administrador', icon: 'shield-checkmark-outline' },
    { value: 'user', label: 'Usuário', icon: 'person-outline' },
    {value: 'assistant', label: 'Assistente', icon: 'build-outline' }
];

export default function EditUserRoleScreen() {
    const navigation = useNavigation<NavigationProps>();
    const { userId } = useRoute<RouteProps>().params;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [role, setRole] = useState<Role>('user');
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const { alertVisible, alertType, alertTitle, alertMessage, alertButtonText, alertCancelText, showAlert, handleAlertPress, handleAlertCancel } = useCustomAlert();

    useEffect(() => { fetchProfile(); }, [userId]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('id, full_name, email, role, updated_at').eq('id', userId).single();
            if (error) throw error;
            const loadedProfile = { ...data, role: data.role === 'admin' ? 'admin' : 'user' } as Profile;
            setProfile(loadedProfile);
            setRole(loadedProfile.role);
        } catch (error: any) {
            showAlert('error', 'Erro', error.message || 'Não foi possível carregar o usuário.', 'OK', () => navigation.goBack());
        } finally {
            setFetching(false);
        }
    };

    const handleSaveRole = async () => {
        if (!profile || role === profile.role) {
            showAlert('info', 'Nenhuma alteração', 'Selecione uma role diferente para salvar.', 'OK');
            return;
        }
        try {
            setSaving(true);
            const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select('id, full_name, email, role, updated_at').single();
            if (error) throw error;
            setProfile(data as Profile);
            showAlert('success', 'Role atualizada', 'A permissão do usuário foi alterada com sucesso.', 'OK', () => navigation.goBack());
        } catch (error: any) {
            showAlert('error', 'Erro ao atualizar', error.message || 'Não foi possível alterar a role.', 'OK');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (value: string | null) => value ? `${new Date(value).toLocaleDateString('pt-BR')} às ${new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Não informado';

    if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#276818" /></View>;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="chevron-back" size={26} color="#1A1A1A" /></TouchableOpacity>
                    <Text style={styles.title}>Detalhes do usuário</Text>
                </View>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}><Ionicons name="person" size={38} color="#276818" /></View>
                    <Text style={styles.name}>{profile?.full_name || 'Nome não informado'}</Text>
                    <Text style={styles.email}>{profile?.email || 'E-mail não informado'}</Text>
                </View>
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informações da conta</Text>
                    <View style={styles.infoRow}><Ionicons name="mail-outline" size={22} color="#276818" /><View style={styles.infoText}><Text style={styles.label}>E-mail</Text><Text style={styles.value}>{profile?.email || 'Não informado'}</Text></View></View>
                    <View style={styles.infoRow}><Ionicons name="time-outline" size={22} color="#276818" /><View style={styles.infoText}><Text style={styles.label}>Última alteração</Text><Text style={styles.value}>{formatDate(profile?.updated_at || null)}</Text></View></View>
                </View>
                <View style={styles.roleSection}>
                    <Text style={styles.sectionTitle}>Role e permissões</Text>
                    <Text style={styles.helperText}>Escolha o nível de acesso deste usuário.</Text>
                    {roleOptions.map((option) => {
                        const selected = role === option.value;
                        return <TouchableOpacity key={option.value} style={[styles.roleOption, selected && styles.roleOptionSelected]} onPress={() => setRole(option.value)} accessibilityRole="radio" accessibilityState={{ selected }}><Ionicons name={option.icon} size={24} color={selected ? '#276818' : '#777'} /><Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{option.label}</Text><Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? '#276818' : '#AAA'} /></TouchableOpacity>;
                    })}
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveRole} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Role</Text>}</TouchableOpacity>
            </ScrollView>
            <CustomAlert visible={alertVisible} type={alertType} title={alertTitle} message={alertMessage} buttonText={alertButtonText} cancelText={alertCancelText} onPress={handleAlertPress} onCancel={handleAlertCancel} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    content: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF' },
    backButton: { padding: 4, marginRight: 10 },
    title: { fontSize: 23, fontWeight: '800', color: '#1A1A1A' },
    profileHeader: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    name: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
    email: { fontSize: 14, color: '#777', marginTop: 5 },
    infoSection: { backgroundColor: '#FFF', marginTop: 12, padding: 20 },
    roleSection: { padding: 20, marginTop: 12, backgroundColor: '#FFF' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F1F1' },
    infoText: { marginLeft: 14, flex: 1 },
    label: { fontSize: 12, color: '#888', marginBottom: 3 },
    value: { fontSize: 15, color: '#333' },
    helperText: { fontSize: 14, color: '#777', marginTop: -8, marginBottom: 14 },
    roleOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#E2E2E2', borderRadius: 12, marginBottom: 10 },
    roleOptionSelected: { borderColor: '#276818', backgroundColor: '#F0F8F1' },
    roleLabel: { flex: 1, marginLeft: 12, fontSize: 16, color: '#555' },
    roleLabelSelected: { color: '#276818', fontWeight: '700' },
    saveButton: { margin: 20, marginTop: 18, borderRadius: 12, paddingVertical: 17, backgroundColor: '#276818', alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});