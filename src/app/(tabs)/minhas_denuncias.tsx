// src/app/(tabs)/minhas_denuncias.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { controladorMinhasDenuncias } from '../../controllers/controlador_minhas_denuncias';
import { CATEGORIAS } from '../../controllers/controlador_report';

export default function MinhasDenuncias() {
  const router = useRouter();
  const controlador = new controladorMinhasDenuncias(router);
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const dados = await controlador.buscarDenunciasDoUsuario();
    setDenuncias(dados);
    setLoading(false);
  };

  const getStatusCor = (status: string) => {
    switch (status) {
      case 'resolvido': return { bg: '#D1FAE5', text: '#10B981', label: 'Resolvido' };
      case 'em_analise': return { bg: '#FEF3C7', text: '#F59E0B', label: 'Em Análise' };
      default: return { bg: '#FEE2E2', text: '#EF4444', label: 'Pendente' };
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    const statusStyle = getStatusCor(item.status);
    const catInfo = CATEGORIAS.find(c => c.id === item.categoria);

    return (
      <TouchableOpacity style={styles.card} onPress={() => controlador.verDetalhes(item.id)}>
        <View style={styles.cardHeader}>
          <View style={styles.catContainer}>
            <Text style={styles.iconeCat}>{catInfo?.icone || '📍'}</Text>
            <Text style={styles.nomeCat}>{catInfo?.label || 'Outros'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
        
        <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>
        
        <View style={styles.cardFooter}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.endereco} numberOfLines={1}>{item.endereco}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>As Minhas Denúncias</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7B1FA2" />
        </View>
      ) : (
        <FlatList
          data={denuncias}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.vazioTexto}>Ainda não reportou nenhuma ocorrência.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 20, marginBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  vazioTexto: { color: '#94A3B8', marginTop: 10, fontSize: 16 },
  lista: { paddingBottom: 100 }, // Espaço para a NavBar não cobrir o último item
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catContainer: { flexDirection: 'row', alignItems: 'center' },
  iconeCat: { fontSize: 18, marginRight: 8 },
  nomeCat: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  descricao: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  endereco: { fontSize: 12, color: '#64748B', marginLeft: 4, flex: 1 },
});