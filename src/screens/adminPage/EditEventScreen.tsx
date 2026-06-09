import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/RootStackParamList';

// Bibliotecas para Imagem
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'EditEvent'>;

export default function EditEventScreen() {
    const navigation = useNavigation<NavProps>();
    const route = useRoute();
    const { eventId } = route.params as { eventId: string };

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState('');
    const [capacity, setCapacity] = useState('');
    const [location, setLocation] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [rulesInput, setRulesInput] = useState('');

    useEffect(() => {
        fetchEventDetails();
    }, []);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title || '');
                setDescription(data.description || '');
                setLocation(data.location || '');
                setBannerUrl(data.banner_url || '');
                setDate(data.date || '');
                setPrice(data.price?.toString() || '0');
                setCapacity(data.capacity?.toString() || '100');
                setRulesInput(data.rules ? data.rules.join('\n') : '');
            }
        } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
            navigation.goBack();
        } finally {
            setFetching(false);
        }
    };

    // --- LÓGICA DE UPLOAD DE IMAGEM ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso às fotos para alterar o banner.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
            base64: true, // Necessário para converter em ArrayBuffer
        });

        if (!result.canceled) {
            handleUpload(result.assets[0]);
        }
    };

    const handleUpload = async (asset: any) => {
        try {
            setUploading(true);
            
            const fileExt = asset.uri.split('.').pop();
            const fileName = `${eventId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Converte Base64 para ArrayBuffer (padrão para upload mobile no Supabase)
            const arrayBuffer = decode(asset.base64);

            const { data, error } = await supabase.storage
                .from('event-banners')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('event-banners')
                .getPublicUrl(filePath);

            setBannerUrl(publicUrl);
            Alert.alert('Sucesso', 'Banner carregado com sucesso!');
        } catch (error: any) {
            Alert.alert('Erro no upload', error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- SALVAR ALTERAÇÕES ---
    const handleUpdateEvent = async () => {
        if (!title.trim() || !price || !date || !location.trim()) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
            return;
        }

        try {
            setLoading(true);
            const rulesArray = rulesInput
                ? rulesInput.split('\n').map(item => item.trim()).filter(item => item !== '')
                : [];

            const cleanedPrice = price.toString().replace('R$', '').replace(/\s/g, '').replace(',', '.');
            const numericPrice = parseFloat(cleanedPrice);

            if (isNaN(numericPrice)) {
                Alert.alert('Erro no Preço', 'Insira um valor numérico válido.');
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('events')
                .update({
                    title: title.trim(),
                    description: description.trim() || null,
                    location: location.trim(),
                    banner_url: bannerUrl.trim() || null,
                    date: date,
                    price: numericPrice,
                    capacity: parseInt(capacity) || 100,
                    rules: rulesArray,
                })
                .eq('id', eventId);

            if (error) throw error;

            Alert.alert('Sucesso', 'Evento atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error: any) {
            Alert.alert('Erro ao atualizar', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#3BB85E" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Editar Evento</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.sectionLabel}>Informações Principais</Text>
                    <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
                    <TextInput style={[styles.input, { height: 60 }]} placeholder="Descrição" multiline value={description} onChangeText={setDescription} />
                    <TextInput style={styles.input} placeholder="Localização" value={location} onChangeText={setLocation} />
                    
                    {/* CAMPO DE BANNER COM UPLOAD */}
                    <Text style={styles.miniLabel}>Banner do Evento (URL ou Galeria)</Text>
                    <View style={styles.uploadRow}>
                        <TextInput 
                            style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                            placeholder="URL da Imagem" 
                            value={bannerUrl} 
                            onChangeText={setBannerUrl} 
                        />
                        <TouchableOpacity 
                            style={styles.uploadButton} 
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#3BB85E" />
                            ) : (
                                <Ionicons name="camera" size={26} color="#3BB85E" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.miniLabel}>Preço (R$)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.miniLabel}>Capacidade</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
                        </View>
                    </View>

                    <TextInput style={styles.input} placeholder="Data (AAAA-MM-DD)" value={date} onChangeText={setDate} />

                    <Text style={styles.sectionLabel}>Regras (Uma por linha)</Text>
                    <TextInput 
                        style={[styles.input, { height: 100 }]} 
                        multiline 
                        value={rulesInput} 
                        onChangeText={setRulesInput} 
                        placeholder="Ex: Proibido menores"
                    />

                    <TouchableOpacity style={styles.createButton} onPress={handleUpdateEvent} disabled={loading || uploading}>
                        <LinearGradient colors={['#1A73E8', '#0d47a1']} style={styles.gradient}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createButtonText}>Salvar Alterações</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scrollContent: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    backButton: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 12, marginRight: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
    form: { paddingHorizontal: 20 },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#3BB85E', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
    miniLabel: { fontSize: 11, color: '#999', marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#EEE', marginBottom: 15 },
    uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    uploadButton: { backgroundColor: '#F0F0F0', height: 55, width: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    createButton: { marginTop: 10, borderRadius: 15, overflow: 'hidden' },
    gradient: { paddingVertical: 18, alignItems: 'center' },
    createButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});