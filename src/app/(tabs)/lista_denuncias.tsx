import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { controladorListaDenuncias } from '../../controllers/controlador_lista_denuncias';
import { CATEGORIAS } from '../../controllers/controlador_report';

export default function ListaDenunciasScreen() {
  const router = useRouter();
  const controlador = new controladorListaDenuncias(router);
  
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Nossos dois estados independentes
  const [filtrarApenasMinhas, setFiltrarApenasMinhas] = useState(false);
  const [filtrarProximas, setFiltrarProximas] = useState(false);

  // Recarrega sempre que qualquer um dos botões for alterado
  useEffect(() => {
    obterOcorrencias();
  }, [filtrarApenasMinhas, filtrarProximas]);

  const obterOcorrencias = async () => {
    setLoading(true);
    const dados = await controlador.carregarDenuncias(filtrarApenasMinhas, filtrarProximas);
    setDenuncias(dados);
    setLoading(false);
  };

  const obterVisualStatus = (status: string) => {
    switch (status) {
      case 'resolvido': 
        return { bg: '#E8F5E9', texto: '#4CAF50', label: 'Resolvido ✓' };
      case 'em_analise': 
        return { bg: '#FFF8E1', texto: '#FFB300', label: 'Em Análise 🟡' };
      default: 
        return { bg: '#FFEBEE', texto: '#F44336', label: 'Pendente 🚨' };
    }
  };

  const renderCardReport = ({ item }: { item: any }) => {
    const visualStatus = obterVisualStatus(item.status);
    const dadosCategoria = CATEGORIAS.find(c => c.id === item.categoria);

    return (
      <TouchableOpacity style={styles.card} onPress={() => controlador.verDetalhes(item.id)}>
        <View style={styles.cardHeader}>
          <View style={styles.categoriaContainer}>
            <Text style={styles.categoriaIcone}>{dadosCategoria?.icone || '📍'}</Text>
            <Text style={styles.categoriaTexto}>{dadosCategoria?.label || 'Geral'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: visualStatus.bg }]}>
            <Text style={[styles.statusTexto, { color: visualStatus.texto }]}>{visualStatus.label}</Text>
          </View>
        </View>

        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao || 'Nenhuma descrição detalhada fornecida.'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.localizacaoRow}>
            <Ionicons name="location-sharp" size={14} color="#9C6BAF" />
            <Text style={styles.enderecoTexto} numberOfLines={1}>{item.endereco}</Text>
          </View>
          <Text style={styles.dataTexto}>{item.dataFormatada}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.tituloTela}>Ocorrências Urbanas</Text>

      {/* 1. ABAS PRINCIPAIS */}
      <View style={styles.containerFiltros}>
        <TouchableOpacity 
          style={[styles.botaoFiltro, !filtrarApenasMinhas && styles.botaoFiltroAtivo]}
          onPress={() => setFiltrarApenasMinhas(false)}
        >
          <Text style={[styles.textoFiltro, !filtrarApenasMinhas && styles.textoFiltroAtivo]}>Todas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.botaoFiltro, filtrarApenasMinhas && styles.botaoFiltroAtivo]}
          onPress={() => setFiltrarApenasMinhas(true)}
        >
          <Text style={[styles.textoFiltro, filtrarApenasMinhas && styles.textoFiltroAtivo]}>Minhas Denúncias</Text>
        </TouchableOpacity>
      </View>

      {/* 2. SUB-FILTRO DE LOCALIZAÇÃO (Botão de Alternância) */}
      <View style={styles.containerSubFiltro}>
        <TouchableOpacity 
          style={[styles.chipProximidade, filtrarProximas && styles.chipProximidadeAtivo]}
          onPress={() => setFiltrarProximas(!filtrarProximas)}
        >
          <Ionicons 
            name={filtrarProximas ? "location" : "location-outline"} 
            size={16} 
            color={filtrarProximas ? "#FFF" : "#7B1FA2"} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.textoChip, filtrarProximas && styles.textoChipAtivo]}>
            {filtrarProximas ? "Mostrando raio de 400m" : "Filtrar denúncias próximas"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO PRINCIPAL */}
      {loading ? (
        <View style={styles.containerLoading}>
          <ActivityIndicator size="large" color="#7B1FA2" />
        </View>
      ) : (
        <FlatList
          data={denuncias}
          keyExtractor={(item) => item.id}
          renderItem={renderCardReport}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.containerVazio}>
              <Ionicons name="search-outline" size={50} color="#B0B0B0" />
              <Text style={styles.textoVazio}>
                Nenhum registro encontrado {filtrarProximas ? 'neste perímetro' : 'nesta aba'}.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F0FA', paddingHorizontal: 20 },
  tituloTela: { fontSize: 24, fontWeight: '800', color: '#2D1B4E', marginTop: 20, marginBottom: 15 },
  
  containerFiltros: { flexDirection: 'row', backgroundColor: '#E8D5F5', borderRadius: 12, padding: 4, marginBottom: 15 },
  botaoFiltro: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  botaoFiltroAtivo: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  textoFiltro: { fontSize: 14, fontWeight: '600', color: '#9C6BAF' },
  textoFiltroAtivo: { color: '#7B1FA2', fontWeight: '700' },

  // Estilos do novo botão de Sub-filtro
  containerSubFiltro: { flexDirection: 'row', marginBottom: 15 },
  chipProximidade: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE7F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1C4E9' },
  chipProximidadeAtivo: { backgroundColor: '#7B1FA2', borderColor: '#7B1FA2' },
  textoChip: { fontSize: 13, fontWeight: '600', color: '#7B1FA2' },
  textoChipAtivo: { color: '#FFF' },

  containerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listaContainer: { paddingBottom: 100 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoriaContainer: { flexDirection: 'row', alignItems: 'center' },
  categoriaIcone: { fontSize: 18, marginRight: 8 },
  categoriaTexto: { fontSize: 15, fontWeight: '700', color: '#2D1B4E' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTexto: { fontSize: 12, fontWeight: '800' },
  
  descricao: { fontSize: 14, color: '#7A6B8A', lineHeight: 20, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  localizacaoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15 },
  enderecoTexto: { fontSize: 12, color: '#7A6B8A', marginLeft: 4, flex: 1 },
  dataTexto: { fontSize: 12, color: '#9C6BAF', fontWeight: '500' },
  
  containerVazio: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  textoVazio: { color: '#7A6B8A', marginTop: 12, fontSize: 15, textAlign: 'center' }
});