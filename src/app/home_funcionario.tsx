// src/app/home_funcionario.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { controladorHomeFuncionario } from '../controllers/controlador_home_funcionario';
import { CATEGORIAS } from '../controllers/controlador_report';

type AbaAvanco = 'pendente' | 'em_andamento' | 'finalizado';

export default function HomeFuncionario() {
  const router = useRouter();
  const controlador = new controladorHomeFuncionario(router);

  // Estados de dados
  const [todasDenuncias, setTodasDenuncias] = useState<any[]>([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPainelFiltros, setMostrarPainelFiltros] = useState(true);

  // MATRIZ DE ESTADOS DOS FILTROS
  const [abaAtiva, setAbaAtiva] = useState<AbaAvanco>('pendente'); // Sub-página ativa
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todos');
  const [filtroBairro, setFiltroBairro] = useState<string>('Todos');

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    setLoading(true);
    const dados = await controlador.buscarTodasDenuncias();
    setTodasDenuncias(dados);
    setBairrosDisponiveis(controlador.extrairBairrosUnicos(dados));
    setLoading(false);
  };

  const obterEstiloUrgencia = (urgencia: string) => {
    if (urgencia === 'Urgente') return '#F44336';
    if (urgencia === 'Médio') return '#FFB300';
    return '#4CAF50';
  };

  // Processa a filtragem cruzada dinâmica
  const dadosFiltrados = controlador.aplicarFiltrosCombinados(
    todasDenuncias,
    abaAtiva,
    filtroUrgencia,
    filtroCategoria,
    filtroBairro
  );

  const renderCardReport = ({ item }: { item: any }) => {
    const corUrgencia = obterEstiloUrgencia(item.urgencia);
    const dadosCategoria = CATEGORIAS.find(c => c.id === item.categoria);

    return (
      <TouchableOpacity style={styles.card} onPress={() => controlador.verDetalhesOcorrencia(item.id)}>
        <View style={styles.cardHeader}>
          <View style={styles.categoriaRow}>
            <Text style={styles.categoriaIcone}>{dadosCategoria?.icone || '📍'}</Text>
            <Text style={styles.categoriaLabel}>{dadosCategoria?.label || 'Outros'}</Text>
          </View>
          <View style={[styles.badgePrioridade, { borderColor: corUrgencia }]}>
            <Text style={[styles.textoPrioridade, { color: corUrgencia }]}>● {item.urgencia}</Text>
          </View>
        </View>

        <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.localizacaoContainer}>
            <Ionicons name="location-sharp" size={14} color="#1E293B" />
            <Text style={styles.enderecoTexto} numberOfLines={1}>
              {item.bairroLimpo} - {item.endereco}
            </Text>
          </View>
          <Text style={styles.dataTexto}>{item.dataFormatada}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER DA PREFEITURA */}
      <View style={styles.header}>
        <View>
          <Text style={styles.tituloHeader}>Zeladoria Municipal</Text>
          <Text style={styles.subtituloHeader}>Gestão de Demandas Operacionais</Text>
        </View>
        <View style={styles.rowAcoesHeader}>
          <TouchableOpacity 
            style={[styles.botaoIcone, !mostrarPainelFiltros && { backgroundColor: '#E2E8F0' }]} 
            onPress={() => setMostrarPainelFiltros(!mostrarPainelFiltros)}
          >
            <Ionicons name="filter" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoIcone} onPress={() => controlador.encerrarSessao()}>
            <Ionicons name="log-out-outline" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SUB-PÁGINAS / ABAS DE AVANÇO (Fixo no topo) ── */}
      <View style={styles.containerSubPaginas}>
        <TouchableOpacity 
          style={[styles.abaSubPagina, abaAtiva === 'pendente' && styles.abaSubPaginaAtiva]} 
          onPress={() => setAbaAtiva('pendente')}
        >
          <Text style={[styles.textoAba, abaAtiva === 'pendente' && styles.textoAbaAtiva]}>Pendentes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.abaSubPagina, abaAtiva === 'em_andamento' && styles.abaSubPaginaAtiva]} 
          onPress={() => setAbaAtiva('em_andamento')}
        >
          <Text style={[styles.textoAba, abaAtiva === 'em_andamento' && styles.textoAbaAtiva]}>Em Andamento</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.abaSubPagina, abaAtiva === 'finalizado' && styles.abaSubPaginaAtiva]} 
          onPress={() => setAbaAtiva('finalizado')}
        >
          <Text style={[styles.textoAba, abaAtiva === 'finalizado' && styles.abaSubPaginaAtiva]}>Finalizados</Text>
        </TouchableOpacity>
      </View>

      {/* PAINEL DE FILTROS SECUNDÁRIOS COMPLEMENTARES */}
      {mostrarPainelFiltros && (
        <View style={styles.painelFiltros}>
          {/* Filtro 1: Urgência */}
          <View style={styles.secaoFiltroItem}>
            <Text style={styles.labelFiltroGrupo}>⚠️ Urgência:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollFiltrosChips}>
              {['Todos', 'Leve', 'Médio', 'Urgente'].map(u => (
                <TouchableOpacity 
                  key={u} 
                  style={[styles.chipFiltro, filtroUrgencia === u && styles.chipFiltroAtivo]}
                  onPress={() => setFiltroUrgencia(u)}
                >
                  <Text style={[styles.textoChip, filtroUrgencia === u && styles.textoChipAtivo]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtro 2: Tipo / Categoria */}
          <View style={styles.secaoFiltroItem}>
            <Text style={styles.labelFiltroGrupo}>🚧 Tipo de Ocorrência:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollFiltrosChips}>
              {['Todos', ...CATEGORIAS.map(c => c.id)].map(catId => {
                const label = catId === 'Todos' ? 'Todos' : CATEGORIAS.find(c => c.id === catId)?.label;
                return (
                  <TouchableOpacity 
                    key={catId} 
                    style={[styles.chipFiltro, filtroCategoria === catId && styles.chipFiltroAtivo]}
                    onPress={() => setFiltroCategoria(catId)}
                  >
                    <Text style={[styles.textoChip, filtroCategoria === catId && styles.textoChipAtivo]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filtro 3: Bairro Dinâmico */}
          <View style={styles.secaoFiltroItem}>
            <Text style={styles.labelFiltroGrupo}>🏡 Filtrar por Bairro:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollFiltrosChips}>
              {bairrosDisponiveis.map(b => (
                <TouchableOpacity 
                  key={b} 
                  style={[styles.chipFiltro, filtroBairro === b && styles.chipFiltroAtivo]}
                  onPress={() => setFiltroBairro(b)}
                >
                  <Text style={[styles.textoChip, filtroBairro === b && styles.textoChipAtivo]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* CONTEÚDO / LISTAGEM DA ABA E FILTROS */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E293B" />
        </View>
      ) : (
        <FlatList
          data={dadosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderCardReport}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerVazio}>
              <Ionicons name="options-outline" size={44} color="#94A3B8" />
              <Text style={styles.textoVazio}>Nenhum chamado correspondente aos critérios.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 15 },
  tituloHeader: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  subtituloHeader: { fontSize: 13, color: '#64748B', marginTop: 1, fontWeight: '500' },
  rowAcoesHeader: { flexDirection: 'row', gap: 8 },
  botaoIcone: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },

  // Estilo das Sub-páginas/Abas superiores estáveis
  containerSubPaginas: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 15 },
  abaSubPagina: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9 },
  abaSubPaginaAtiva: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  textoAba: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  textoAbaAtiva: { color: '#1E293B', fontWeight: '800' },

  // Painel colapsável de filtros
  painelFiltros: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, gap: 12 },
  secaoFiltroItem: { gap: 6 },
  labelFiltroGrupo: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  scrollFiltrosChips: { gap: 6, paddingRight: 10 },
  chipFiltro: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  chipFiltroAtivo: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  textoChip: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  textoChipAtivo: { color: '#FFF', fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  centerVazio: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 10 },
  textoVazio: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  listaContainer: { paddingBottom: 30 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoriaRow: { flexDirection: 'row', alignItems: 'center' },
  categoriaIcone: { fontSize: 16, marginRight: 6 },
  categoriaLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  badgePrioridade: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  textoPrioridade: { fontSize: 11, fontWeight: '800' },
  
  descricao: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  localizacaoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  enderecoTexto: { fontSize: 12, color: '#64748B', marginLeft: 4, flex: 1 },
  infoDireitaRow: { flexDirection: 'row', alignItems: 'center' },
  dataTexto: { fontSize: 11, color: '#94A3B8', fontWeight: '600' }
});