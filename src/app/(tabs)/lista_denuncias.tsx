import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { controladorListaDenuncias } from '../../controllers/controlador_lista_denuncias';
import { CATEGORIAS, controladorReport } from '../../controllers/controlador_report';

export default function ListaDenunciasScreen() {
  const router = useRouter();
  const auth = getAuth();
  const usuarioLogado = auth.currentUser;
  
  const controlador = new controladorListaDenuncias(router);
  const controladorRep = new controladorReport(router); // Instanciado exclusivamente para salvar a avaliação
  
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Nossos estados de Filtros Originais
  const [filtrarApenasMinhas, setFiltrarApenasMinhas] = useState(false);
  const [filtrarProximas, setFiltrarProximas] = useState(false);
  
  // Novo Estado de Divisão (Pendentes vs Resolvidas)
  const [abaStatus, setAbaStatus] = useState<'pendentes' | 'resolvidas'>('pendentes');
  
  // Estados para gerenciar a Interface de Avaliação
  const [avaliandoId, setAvaliandoId] = useState<string | null>(null);
  const [notaTemporaria, setNotaTemporaria] = useState<number>(0);

  // Recarrega sempre que qualquer um dos botões do banco for alterado
  useEffect(() => {
    obterOcorrencias();
  }, [filtrarApenasMinhas, filtrarProximas]);

  const obterOcorrencias = async () => {
    setLoading(true);
    const dados = await controlador.carregarDenuncias(filtrarApenasMinhas, filtrarProximas);
    setDenuncias(dados);
    setLoading(false);
  };

  // Aplica a separação das resolvidas apenas em tela (Não recarrega o banco de bobeira)
  const denunciasFiltradas = useMemo(() => {
    return denuncias.filter(item => {
      const isResolvido = item.status === 'resolvido';
      return abaStatus === 'resolvidas' ? isResolvido : !isResolvido;
    });
  }, [denuncias, abaStatus]);

  // Função disparada ao clicar no Botão Confirmar
  const handleConfirmarAvaliacao = async (id: string) => {
    setLoading(true);
    await controladorRep.avaliarReport(id, notaTemporaria);
    setAvaliandoId(null);
    setNotaTemporaria(0);
    obterOcorrencias(); // Rebusca para atualizar o visual
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
    const dadosCategoria = CATEGORIAS.find((c: any) => c.id === item.categoria);

    // Tipagens seguras (Resolvendo os alertas de typescript)
    const isDono = usuarioLogado ? item.userId === usuarioLogado.uid : false;
    const isResolvida = item.status === 'resolvido';
    const notaSalva = (item.avaliacao && typeof item.avaliacao === 'object') ? item.avaliacao.nota || 0 : 0;
    
    const estaAvaliandoEste = avaliandoId === item.id;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => {
          if (!estaAvaliandoEste) {
            controlador.verDetalhes(item.id);
          }
        }}
        activeOpacity={estaAvaliandoEste ? 1 : 0.7} // Desativa o toque para os detalhes se o usuário estiver focado em avaliar
      >
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

        
        {/* MÓDULO DE AVALIAÇÃO - SÓ APARECE NA ABA DE RESOLVIDAS          */}
        
        {isResolvida && abaStatus === 'resolvidas' && (
           <View style={styles.containerAvaliacao}>
              
              {!estaAvaliandoEste ? (
                // --- VISÃO COMUM (Botões ou Apenas Leitura) ---
                <View style={styles.linhaLeituraAvaliacao}>
                   {notaSalva > 0 ? (
                      <View style={styles.areaEstrelas}>
                        <Text style={styles.textoLabelAvaliacao}>
                          {isDono ? "Sua avaliação:" : "Avaliação do cidadão:"}
                        </Text>
                        <View style={styles.estrelasRow}>
                          {[1, 2, 3, 4, 5].map((estrela) => (
                            <Ionicons 
                              key={estrela}
                              name={estrela <= notaSalva ? "star" : "star-outline"} 
                              size={16} 
                              color={estrela <= notaSalva ? "#FFD700" : "#E0E0E0"} 
                            />
                          ))}
                        </View>
                      </View>
                   ) : (
                      <View style={styles.areaEstrelas}>
                        <Text style={styles.textoLabelAvaliacao}>
                          {!isDono ? "Ainda não avaliado pelo criador." : "O problema foi solucionado?"}
                        </Text>
                      </View>
                   )}
                   
                   {/* Botão lateral pequeno de acionamento (Exclusivo para o criador) */}
                   {isDono && (
                     <TouchableOpacity 
                        style={styles.botaoPequenoAvaliar}
                        onPress={() => {
                          setAvaliandoId(item.id);
                          setNotaTemporaria(notaSalva || 0);
                        }}
                     >
                        <Text style={styles.textoBotaoPequeno}>
                          {notaSalva > 0 ? "Alterar avaliação" : "Avaliar"}
                        </Text>
                     </TouchableOpacity>
                   )}
                </View>

              ) : (
                
                // --- VISÃO DE FORMULÁRIO (Ao Clicar no Botão Avaliar) ---
                <View style={styles.areaEdicaoAvaliacao}>
                   <Text style={styles.textoLabelAvaliacaoDestaque}>Dê uma nota para a solução:</Text>
                   
                   <View style={styles.estrelasRowEdicao}>
                      {[1, 2, 3, 4, 5].map((estrela) => (
                        <TouchableOpacity key={estrela} onPress={() => setNotaTemporaria(estrela)}>
                          <Ionicons 
                            name={estrela <= notaTemporaria ? "star" : "star-outline"} 
                            size={32} 
                            color={estrela <= notaTemporaria ? "#FFD700" : "#E0E0E0"} 
                          />
                        </TouchableOpacity>
                      ))}
                   </View>
                   
                   <View style={styles.botoesEdicaoRow}>
                      <TouchableOpacity 
                         style={styles.botaoCancelar}
                         onPress={() => {
                           setAvaliandoId(null);
                           setNotaTemporaria(0);
                         }}
                      >
                         <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                         style={[styles.botaoConfirmar, notaTemporaria === 0 && { opacity: 0.5 }]}
                         disabled={notaTemporaria === 0} // Trava até ele clicar em uma estrela
                         onPress={() => handleConfirmarAvaliacao(item.id)}
                      >
                         <Text style={styles.textoBotaoConfirmar}>Confirmar</Text>
                      </TouchableOpacity>
                   </View>
                </View>
              )}
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.tituloTela}>Ocorrências Urbanas</Text>

      {/* 1. ABAS PRINCIPAIS (Dono) */}
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

      {/* 2. SUB-FILTROS: PENDENTES / RESOLVIDAS */}
      <View style={styles.containerSubFiltrosStatus}>
        <TouchableOpacity 
          style={[styles.botaoStatus, abaStatus === 'pendentes' && styles.botaoStatusAtivo]}
          onPress={() => setAbaStatus('pendentes')}
        >
          <Text style={[styles.textoStatusFiltro, abaStatus === 'pendentes' && styles.textoStatusAtivo]}>Pendentes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.botaoStatus, abaStatus === 'resolvidas' && styles.botaoStatusAtivo]}
          onPress={() => setAbaStatus('resolvidas')}
        >
          <Text style={[styles.textoStatusFiltro, abaStatus === 'resolvidas' && styles.textoStatusAtivo]}>Resolvidas</Text>
        </TouchableOpacity>
      </View>

      {/* 3. SUB-FILTRO DE LOCALIZAÇÃO */}
      <View style={styles.containerSubFiltroGeo}>
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

      {/* CONTEÚDO PRINCIPAL (Lista Renderizada) */}
      {loading ? (
        <View style={styles.containerLoading}>
          <ActivityIndicator size="large" color="#7B1FA2" />
        </View>
      ) : (
        <FlatList
          data={denunciasFiltradas}
          extraData={{ avaliandoId, notaTemporaria, usuarioLogado }} // Garante que a lista atualiza quando editando a nota
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

  // Abas de Status
  containerSubFiltrosStatus: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
  botaoStatus: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20, backgroundColor: '#E0E0E0' },
  botaoStatusAtivo: { backgroundColor: '#7B1FA2' },
  textoStatusFiltro: { fontSize: 13, fontWeight: '600', color: '#666' },
  textoStatusAtivo: { color: '#FFF' },

  // Estilos do botão Geo Localização
  containerSubFiltroGeo: { flexDirection: 'row', marginBottom: 15, justifyContent: 'center' },
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
  textoVazio: { color: '#7A6B8A', marginTop: 12, fontSize: 15, textAlign: 'center' },

  containerAvaliacao: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderColor: '#F0EAF5' },
  linhaLeituraAvaliacao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaEstrelas: { flexDirection: 'column' },
  textoLabelAvaliacao: { fontSize: 12, color: '#7A6B8A', marginBottom: 4, fontWeight: '500' },
  estrelasRow: { flexDirection: 'row', gap: 2 },
  
  botaoPequenoAvaliar: { backgroundColor: '#EDE7F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#D1C4E9' },
  textoBotaoPequeno: { fontSize: 12, fontWeight: '700', color: '#7B1FA2' },
  
  areaEdicaoAvaliacao: { alignItems: 'center', paddingVertical: 10 },
  textoLabelAvaliacaoDestaque: { fontSize: 14, fontWeight: '700', color: '#2D1B4E', marginBottom: 10 },
  estrelasRowEdicao: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  botoesEdicaoRow: { flexDirection: 'row', gap: 15 },
  
  botaoCancelar: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5' },
  textoBotaoCancelar: { color: '#666', fontWeight: '600' },
  botaoConfirmar: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#4CAF50' },
  textoBotaoConfirmar: { color: '#FFF', fontWeight: '700' },
});