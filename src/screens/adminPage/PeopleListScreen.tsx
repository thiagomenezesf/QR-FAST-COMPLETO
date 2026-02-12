import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

type Person = {
    id: string;
    name: string;
    email: string;
    event?: string;
};

export default function PessoasScreen() {
    const [people, setPeople] = useState<Person[]>([
        { id: '1', name: 'João Silva', email: 'joao@email.com', event: 'Festa 1' },
        { id: '2', name: 'Maria Souza', email: 'maria@email.com', event: 'Festa 2' },
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedValue, setSelectedValue] = useState(null);

    const items = [
        { label: 'Festa de Gala', value: 'festa1' },
        { label: 'Sunset Party', value: 'festa2' },
        { label: 'Tech Conference', value: 'festa3' },
    ];

    function handleAddPerson() {
        if (!name || !email) return;

        const newPerson = {
            id: Date.now().toString(),
            name,
            email,
            event: items.find(i => i.value === selectedValue)?.label
        };

        setPeople((prev) => [newPerson, ...prev]);
        setName('');
        setEmail('');
        setSelectedValue(null);
        setModalVisible(false);
    }

    const renderItem = ({ item }: { item: Person }) => (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={['#FFFFFF', '#F9FBF9']}
                style={styles.card}
            >
                <View style={styles.cardIcon}>
                    <Ionicons name="person" size={20} color="#3BB85E" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.personName}>{item.name}</Text>
                    <Text style={styles.personEmail}>{item.email}</Text>
                    {item.event && <Text style={styles.eventBadge}>{item.event}</Text>}
                </View>
                <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Participantes</Text>
                <Text style={styles.subtitle}>{people.length} pessoas confirmadas</Text>
            </View>

            <FlatList
                data={people}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <LinearGradient
                    colors={['#3BB85E', '#1B8A3B']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.fabText}>Novo Ingresso</Text>
                </LinearGradient>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderIndicator} />
                        <Text style={styles.modalTitle}>Emitir Ingresso</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome Completo</Text>
                            <TextInput
                                placeholder="Ex: Lucas Oliveira"
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                placeholder="lucas@email.com"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Evento</Text>
                            <RNPickerSelect
                                onValueChange={(value) => setSelectedValue(value)}
                                items={items}
                                style={pickerStyle}
                                value={selectedValue}
                                placeholder={{ label: 'Selecione o evento...', value: null }}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#999" />}
                            />
                        </View>
                        
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddPerson}>
                            <LinearGradient
                                colors={['#3BB85E', '#1B8A3B']}
                                style={styles.saveGradient}
                            >
                                <Text style={styles.saveText}>Confirmar e Gerar</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const pickerStyle = {
    inputIOS: {
        fontSize: 16,
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        color: '#333',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        color: '#333',
        paddingRight: 30,
    },
    iconContainer: {
        top: 15,
        right: 15,
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 25,
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 15,
        color: '#7C7C7C',
        marginTop: 4,
    },
    cardContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFF',
        // Sombra leve para iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Sombra para Android
        elevation: 3,
    },
    cardIcon: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    personName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    personEmail: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    eventBadge: {
        fontSize: 11,
        color: '#3BB85E',
        fontWeight: '600',
        marginTop: 6,
        textTransform: 'uppercase',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: '60%',
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#3BB85E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: 40,
    },
    modalHeaderIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#1A1A1A',
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    saveButton: {
        marginTop: 10,
    },
    saveGradient: {
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
        fontWeight: '600',
    },
});