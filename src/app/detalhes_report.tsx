import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../services/firebaseConfig';
import { obterUsuario } from '../services/userStorage';
import { CATEGORIAS, controladorReport, LISTA_ORGAOS_MUNICIPAIS } from '../controllers/controlador_report';

const COR_PRIMARIA = '#7B1FA2';
const COR_FUNDO = '#F5F0FA';
const COR_CARD = '#FFFFFF';

export default function ReportDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const controlador = new controladorReport(router);
  const auth = getAuth();
  
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [perfilFuncionario, setPerfilFuncionario] = useState(false);

  // Estados do Formulário do Relatório do Funcionário
  const [abrirFormulario, setAbrirFormulario] = useState(false);
  const [orgaoSolucao, setOrgaoSolucao] = useState('');
  const [orgaoAuxiliar, setOrgaoAuxiliar] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [planoSolucao, setPlanoSolucao] = useState('');
  const [maoDeObra, setMaoDeObra] = useState('');
  const [material, setMaterial] = useState('');
  const [intervencao, setIntervencao] = useState('');
  const [apoio, setApoio] = useState('');
  const [abrirDropdownAuxiliar, setAbrirDropdownAuxiliar] = useState(false);
  const orgaosAuxiliaresDisponiveis = ['Nenhum', ...LISTA_ORGAOS_MUNICIPAIS.filter(o => o !== orgaoSolucao)];
  // Novos campos para a fase de conclusão
  const [dataConclusao, setDataConclusao] = useState('');
  const [gastosTotais, setGastosTotais] = useState('');
  
  const [relatorioConfirmado, setRelatorioConfirmado] = useState(false);

  // Função para aplicar máscara de data DD/MM/AAAA
  const aplicarMascaraData = (texto: string) => {
    let valor = texto.replace(/\D/g, ''); // Remove tudo que não for número
    if (valor.length > 8) {
      valor = valor.substring(0, 8); // Limita a 8 dígitos máximos
    }
    if (valor.length > 4) {
      valor = valor.replace(/^(\d{2})(\d{2})(\d+)/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d+)/, '$1/$2');
    }
    return valor;
  };

  useEffect(() => {
    if (!reportId) {
      setCarregando(false);
      return;
    }

    // 1. Checa se quem está a visualizar é funcionário público
    const checarPerfil = async () => {
      const userLocal = await obterUsuario();
      if (userLocal?.email?.endsWith('@prefeitura.gov.br') || userLocal?.tipo === 'funcionario') {
        setPerfilFuncionario(true);
      }
    };
    checarPerfil();
    
    const aplicarMascaraData = (texto: string) => {
    let valor = texto.replace(/\D/g, ''); // Remove tudo que não for número
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8); // Limita a 8 dígitos máximos
    }
    
    if (valor.length > 4) {
      valor = valor.replace(/^(\d{2})(\d{2})(\d+)/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d+)/, '$1/$2');
    }
    
    return valor;
  };

    // 2. Escuta mudanças na denúncia em tempo real
    const docRef = doc(db, 'denuncias', reportId as string);
    const unsub = onSnapshot(docRef, (docSnap) => {
      // VERIFICAÇÃO DE EXISTÊNCIA E CRIAÇÃO DA VARIÁVEL INFO (Isto é o que faltava!)
      if (docSnap.exists()) {
        const info = docSnap.data(); 
        setDados({ id: docSnap.id, ...info });
        
        // Se já existir um relatório salvo no banco, pré-preenche os inputs da tela
        if (info.relatorioTecnico) {
          const rel = info.relatorioTecnico;
          setOrgaoSolucao(rel.orgaoSolucao || '');
          setOrgaoAuxiliar(rel.orgaoAuxiliar || ''); // Resgata o auxiliar salvo
          setDataPrevista(rel.dataPrevista || rel.tempoEstimado || '');
          setPlanoSolucao(rel.planoSolucao || '');
          setMaoDeObra(rel.custosEstimados?.maoDeObra?.toString() || '');
          setMaterial(rel.custosEstimados?.material?.toString() || '');
          setIntervencao(rel.custosEstimados?.intervencao?.toString() || '');
          setApoio(rel.custosEstimados?.apoio?.toString() || '');
          setDataConclusao(rel.dataConclusao || '');
          setGastosTotais(rel.gastosTotais || '');
        } else {
          // AUTO-PREENCHIMENTO INTELIGENTE NO MOMENTO DA GERAÇÃO
          // Adicionamos "as any" para o TypeScript aceitar a nova propriedade
          const categoriaEncontrada = CATEGORIAS.find(c => c.id === info.categoria) as any;
          if (categoriaEncontrada && categoriaEncontrada.orgaoSolucao) {
            setOrgaoSolucao(categoriaEncontrada.orgaoSolucao);
          }
          setOrgaoAuxiliar('Nenhum'); // Valor inicial padrão
        }
      } else {
        Alert.alert("Erro", "Denúncia não encontrada.");
        router.back();
      }
      setCarregando(false);
    });

    return () => unsub();
  }, [reportId]);

  // Validação estrita se todos os campos obrigatórios estão preenchidos
  const validarCamposPlanejamento = () => {
    return orgaoSolucao.trim() !== '' && 
           dataPrevista.trim() !== '' && 
           planoSolucao.trim() !== '' &&
           maoDeObra.trim() !== '' &&
           material.trim() !== '' &&
           intervencao.trim() !== '' &&
           apoio.trim() !== '';
  };

  const validarCamposConclusao = () => {
    return validarCamposPlanejamento() && dataConclusao.trim() !== '' && gastosTotais.trim() !== '';
  };

  const lidarComSalvarPlanejamento = async () => {
    if (!validarCamposPlanejamento()) {
      Alert.alert("Aviso", "Preencha todas as tabelas de custos e campos do plano antes de confirmar.");
      return;
    }
    setRelatorioConfirmado(true);
    Alert.alert("Sucesso", "Relatório estruturado com sucesso. O botão de alteração de status foi liberado!");
  };

  const lidarComConfirmacaoFinal = async () => {
    if (!validarCamposConclusao()) {
      Alert.alert("Aviso", "Preencha a data de conclusão e os gastos totais reais para fechar a auditoria.");
      return;
    }
    setRelatorioConfirmado(true);
    Alert.alert("Sucesso", "Prestação de contas registrada! Pronto para finalizar.");
  };

const executarTransicaoStatus = async () => {
    setCarregando(true);
    let resultado = false;

    // Criamos um "pacote" blindado, garantindo que NADA vai como undefined
    const pacoteRelatorio = {
      orgaoSolucao: orgaoSolucao || '',
      orgaoAuxiliar: orgaoAuxiliar || 'Nenhum', // Força um texto válido
      dataPrevista: dataPrevista || '',
      planoSolucao: planoSolucao || '',
      maoDeObra: maoDeObra || '0',
      material: material || '0',
      intervencao: intervencao || '0',
      apoio: apoio || '0',
      dataConclusao: dataConclusao || '',
      gastosTotais: gastosTotais || '0'
    };

    if (dados.status === 'pendente') {
      resultado = await controlador.salvarPlanejamentoSolucao(reportId, pacoteRelatorio);
    } else if (dados.status === 'em_analise') {
      resultado = await controlador.finalizarOcorrenciaComRelatorio(reportId, pacoteRelatorio, dados.relatorioTecnico);
    }

    setCarregando(false);
    if (resultado) {
      Alert.alert("Fase Concluída!", "O andamento deste chamado foi atualizado no banco municipal.");
      router.back();
    } else {
      Alert.alert("Erro", "Falha de rede ao sincronizar com o Firestore.");
    }
  };

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={COR_PRIMARIA} />
      </View>
    );
  }

  const catInfo = CATEGORIAS.find((c) => c.id === dados?.categoria);
  const userId = auth.currentUser?.uid || 'anonimo';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
          <Ionicons name="chevron-back" size={28} color={COR_PRIMARIA} />
        </TouchableOpacity>
        <Text style={styles.tituloCabecalho}>Detalhes da Ocorrência</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.containerImagem}>
          {dados?.fotoUrl ? (
            <Image source={{ uri: dados.fotoUrl }} style={styles.foto} resizeMode="cover" />
          ) : (
            <View style={styles.semFoto}>
              <Ionicons name="image-outline" size={50} color="#CCC" />
              <Text style={styles.textoSemFoto}>Sem foto disponível</Text>
            </View>          
          )}
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeCategoria}>
              <Text style={styles.iconeCat}>{catInfo?.icone || '📍'}</Text>
              <Text style={styles.labelCat}>{catInfo?.label || 'Outros'}</Text>
            </View>
            <View style={[styles.badgeStatusText, { backgroundColor: dados?.status === 'resolvido' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: dados?.status === 'resolvido' ? '#4CAF50' : '#F44336' }}>
                {dados?.status?.toUpperCase() || 'PENDENTE'}
              </Text>
            </View>
          </View>

          <Text style={styles.labelSecao}>📍 Endereço Informado</Text>
          <Text style={styles.valorEndereco}>{dados?.endereco}</Text>
          <View style={styles.divisor} />

          <Text style={styles.labelSecao}>📝 Descrição do Cidadão</Text>
          <Text style={styles.valorDescricao}>{dados?.descricao}</Text>
          
          {/* ───────────────────────────────────────────────────────────────────
              PAINEL EXCLUSIVO DO FUNCIONÁRIO (FORMULÁRIOS DE RELATÓRIO)
              ─────────────────────────────────────────────────────────────────── */}
          {perfilFuncionario && (
            <View style={styles.containerAreaFuncionario}>
              <View style={styles.divisor} />
              <Text style={styles.tituloSecaoFuncionario}>💼 Relatório Técnico de Zeladoria</Text>

              {/* Botão para colapsar/abrir edição do formulário */}
              {dados.status !== 'resolvido' && (
                <TouchableOpacity 
                  style={styles.botaoAbrirForm} 
                  onPress={() => setAbrirFormulario(!abrirFormulario)}
                >
                  <Text style={styles.textoBotaoAbrirForm}>
                    {abrirFormulario ? "🔼 Ocultar Campos do Relatório" : "🔽 Preencher/Editar Campos do Relatório"}
                  </Text>
                </TouchableOpacity>
              )}

              {(abrirFormulario || dados.status === 'resolvido') && (
                <View style={styles.formRelatorio}>
                  {/* ÓRGÃO COMPETENTE (AUTO-PREENCHIDO) */}
                  <Text style={styles.labelInput}> Órgão Competente (Principal)</Text>
                  <TextInput 
                    style={styles.inputForm} 
                    value={orgaoSolucao} 
                    onChangeText={setOrgaoSolucao}
                    placeholder="Defina a autarquia principal..."
                    editable={dados.status !== 'resolvido'}
                  />

                  {/* ÓRGÃO AUXILIAR (DROPDOWN DINÂMICO COM EXCLUSÃO) */}
                  <Text style={styles.labelInput}> Órgão Auxiliar de Suporte</Text>
                  
                  {dados.status !== 'resolvido' ? (
                    <View style={styles.containerDropdownGeral}>
                      <TouchableOpacity 
                        style={styles.seletorDropdownBotao} 
                        onPress={() => setAbrirDropdownAuxiliar(!abrirDropdownAuxiliar)}
                      >
                        <Text style={styles.textoSelecaoAtual}>{orgaoAuxiliar || 'Selecione um suporte...'}</Text>
                        <Ionicons 
                          name={abrirDropdownAuxiliar ? "chevron-up" : "chevron-down"} 
                          size={18} 
                          color="#7B1FA2" 
                        />
                      </TouchableOpacity>

                      {/* Caixa de Opções Expandida */}
                      {abrirDropdownAuxiliar && (
                        <View style={styles.caixaOpcoesDropdown}>
                          {orgaosAuxiliaresDisponiveis.map((orgaoItem, idx) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={[
                                styles.opcaoItemLinha, 
                                orgaoAuxiliar === orgaoItem && { backgroundColor: '#F3E5F5' }
                              ]}
                              onPress={() => {
                                setOrgaoAuxiliar(orgaoItem);
                                setAbrirDropdownAuxiliar(false);
                              }}
                            >
                              <Text style={[
                                styles.textoOpcaoItem, 
                                orgaoAuxiliar === orgaoItem && { fontWeight: '700', color: '#7B1FA2' }
                              ]}>
                                {orgaoItem}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    // Se o chamado já estiver fechado, exibe apenas como texto travado para auditoria
                    <TextInput style={[styles.inputForm, { backgroundColor: '#F1F5F9' }]} value={orgaoAuxiliar} editable={false} />
                  )}

                  <Text style={styles.labelInput}> Data Prevista de Conclusão</Text>
                  <TextInput 
                    style={styles.inputForm} 
                    value={dataPrevista} 
                    onChangeText={(texto) => setDataPrevista(aplicarMascaraData(texto))}
                    placeholder="DD/MM/AAAA"
                    keyboardType="numeric"
                    maxLength={10}
                    editable={dados.status !== 'resolvido'}
                  />

                  <Text style={styles.labelInput}>Descrição do Plano de Intervenção</Text>
                  <TextInput 
                    style={[styles.inputForm, { minHeight: 70, textAlignVertical: 'top' }]} 
                    value={planoSolucao} 
                    onChangeText={setPlanoSolucao}
                    multiline
                    placeholder="Descreva detalhadamente o passo a passo da engenharia de reparo..."
                    editable={dados.status !== 'resolvido'}
                  />

                  {/* TABELA DE CUSTOS EXIGIDA */}
                  <Text style={styles.labelInput}>📊 Tabela de Estimativa Orçamentária (R$)</Text>
                  <View style={styles.tabelaCustos}>
                    <View style={styles.linhaTabela}><Text style={styles.celulaLabel}>Mão de Obra:</Text><TextInput keyboardType="numeric" style={styles.celulaInput} value={maoDeObra} onChangeText={setMaoDeObra} placeholder="0.00" editable={dados.status !== 'resolvido'}/></View>
                    <View style={styles.linhaTabela}><Text style={styles.celulaLabel}>Material:</Text><TextInput keyboardType="numeric" style={styles.celulaInput} value={material} onChangeText={setMaterial} placeholder="0.00" editable={dados.status !== 'resolvido'}/></View>
                    <View style={styles.linhaTabela}><Text style={styles.celulaLabel}>Intervenção:</Text><TextInput keyboardType="numeric" style={styles.celulaInput} value={intervencao} onChangeText={setIntervencao} placeholder="0.00" editable={dados.status !== 'resolvido'}/></View>
                    <View style={styles.linhaTabela}><Text style={styles.celulaLabel}>Apoio Técnico:</Text><TextInput keyboardType="numeric" style={styles.celulaInput} value={apoio} onChangeText={setApoio} placeholder="0.00" editable={dados.status !== 'resolvido'}/></View>
                  </View>

                  {/* SEÇÃO INJETADA SE ESTIVER NA FASE 2: EM ANDAMENTO */}
                  {(dados.status === 'em_analise' || dados.status === 'resolvido') && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={[styles.labelInput, { color: '#C62828' }]}>🔒 Prestação de Contas Final (Fechamento)</Text>
                      
                      <Text style={styles.labelInput}> Data Real de Conclusão</Text>
                      <TextInput 
                        style={styles.inputForm} 
                        value={dataConclusao} 
                        onChangeText={(texto) => setDataConclusao(aplicarMascaraData(texto))}
                        placeholder="DD/MM/AAAA"
                        keyboardType="numeric"
                        maxLength={10}
                        editable={dados.status !== 'resolvido'}
                      />

                      <Text style={styles.labelInput}>Gastos Totais Consolidados (R$)</Text>
                      <TextInput 
                        style={styles.inputForm} 
                        keyboardType="numeric"
                        value={gastosTotais} 
                        onChangeText={setGastosTotais}
                        placeholder="Valor final total gasto na obra"
                        editable={dados.status !== 'resolvido'}
                      />
                    </View>
                  )}

                  {/* Botões de validação intermediária do relatório */}
                  {dados.status === 'pendente' && (
                    <TouchableOpacity style={styles.btnValidarRelatorio} onPress={lidarComSalvarPlanejamento}>
                      <Text style={styles.textoBtnValidar}>✓ Confirmar Planejamento</Text>
                    </TouchableOpacity>
                  )}

                  {dados.status === 'em_analise' && (
                    <TouchableOpacity style={[styles.btnValidarRelatorio, { backgroundColor: '#C62828' }]} onPress={lidarComConfirmacaoFinal}>
                      <Text style={styles.textoBtnValidar}>✓ Confirmar Relatório & Gastos Totais</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── SEÇÃO INFERIOR DINÂMICA DE BOTÕES DE AÇÃO ── */}
        <View style={styles.containerAcoes}>
          {!perfilFuncionario ? (
            /* VISÃO DO CIDADÃO COMUM */
            <>
              <TouchableOpacity style={[styles.botaoAcao, styles.botaoApoiar]} onPress={() => controlador.apoiarDenuncia(reportId, userId)}>
                <Ionicons name="megaphone-outline" size={20} color="#FFF" />
                <Text style={styles.textoBotao}>Apoiar ({dados?.apoiadores?.length || 0})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoAcao, styles.botaoResolvido]} onPress={() => controlador.resolverDenuncia(reportId, userId)}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                <Text style={styles.textoBotao}>Resolvido ({dados?.resolvidos?.length || 0})</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* VISÃO RESTRITA DO SERVIDOR PÚBLICO MUNICIPAL */
            dados.status === 'pendente' ? (
              <>
                <TouchableOpacity 
                  style={[styles.botaoAcao, { backgroundColor: '#757575' }]} 
                  onPress={() => setAbrirFormulario(true)}
                >
                  <Text style={styles.textoBotao}>Estruturar Plano</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.botaoAcao, styles.botaoApoiar, !relatorioConfirmado && styles.btnBloqueado]} 
                  disabled={!relatorioConfirmado}
                  onPress={executarTransicaoStatus}
                >
                  <Text style={styles.textoBotao}>⚙️ Resolver Denúncia</Text>
                </TouchableOpacity>
              </>
            ) : dados.status === 'em_analise' ? (
              <>
                <TouchableOpacity 
                  style={[styles.botaoAcao, { backgroundColor: '#9C27B0' }]} 
                  onPress={() => setAbrirFormulario(true)}
                >
                  <Text style={styles.textoBotao}>Revisar Auditoria</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.botaoAcao, { backgroundColor: '#2E7D32' }, !relatorioConfirmado && styles.btnBloqueado]} 
                  disabled={!relatorioConfirmado}
                  onPress={executarTransicaoStatus}
                >
                  <Text style={styles.textoBotao}>✓ Finalizar Denúncia</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.areaEncerradaAviso}>
                <Text style={styles.textoEncerradoAviso}>🔒 Demanda arquivada e concluída pela prefeitura.</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COR_FUNDO },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COR_CARD, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  botaoVoltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: COR_FUNDO },
  tituloCabecalho: { fontSize: 18, fontWeight: '700', color: COR_PRIMARIA },
  scrollContent: { paddingBottom: 40 },
  containerImagem: { width: '100%', height: 250, backgroundColor: '#E1E1E1' },
  foto: { width: '100%', height: '100%' },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' },
  textoSemFoto: { color: '#999', marginTop: 8, fontWeight: '600' },
  cardInfo: { backgroundColor: COR_CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 22, minHeight: 300 },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badgeCategoria: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E5F5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  iconeCat: { fontSize: 20, marginRight: 8 },
  labelCat: { fontWeight: '700', color: COR_PRIMARIA, fontSize: 15 },
  badgeStatusText: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  labelSecao: { fontSize: 12, fontWeight: '700', color: '#9C6BAF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  valorEndereco: { fontSize: 15, color: '#2D1B4E', marginBottom: 15, lineHeight: 22 },
  divisor: { height: 1, backgroundColor: '#F0EAF5', marginVertical: 10 },
  valorDescricao: { fontSize: 15, color: '#4A3B63', lineHeight: 24, marginBottom: 10 },
  
  // Estilos da área técnica do servidor público
  containerAreaFuncionario: { marginTop: 10 },
  tituloSecaoFuncionario: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  botaoAbrirForm: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  textoBotaoAbrirForm: { fontSize: 13, fontWeight: '700', color: '#475569' },
  formRelatorio: { backgroundColor: '#FAF9FC', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E8D5F5' },
  labelInput: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 10 },
  inputForm: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 14, color: '#1E293B' },
  
  tabelaCustos: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden', marginTop: 5 },
  linhaTabela: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 4 },
  celulaLabel: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },
  celulaInput: { width: 100, textAlign: 'right', fontSize: 14, fontWeight: '600', color: '#1E293B', paddingVertical: 6 },
  
  btnValidarRelatorio: { backgroundColor: '#7B1FA2', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  textoBtnValidar: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  containerAcoes: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 15, gap: 10 },
  botaoAcao: { flex: 1, flexDirection: 'row', paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  botaoApoiar: { backgroundColor: COR_PRIMARIA },
  botaoResolvido: { backgroundColor: '#4CAF50' },
  textoBotao: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  btnBloqueado: { backgroundColor: '#CBD5E1', opacity: 0.6 },
  areaEncerradaAviso: { flex: 1, backgroundColor: '#E8F5E9', padding: 15, borderRadius: 12, alignItems: 'center' },
  textoEncerradoAviso: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  containerDropdownGeral: {
    position: 'relative',
    zIndex: 999, // Garante que o menu expandido flutue por cima dos inputs de baixo
    marginBottom: 5
  },
  seletorDropdownBotao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
  },
  textoSelecaoAtual: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  caixaOpcoesDropdown: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D5F5',
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    maxHeight: 180,
    overflow: 'scroll',
  },
  opcaoItemLinha: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  textoOpcaoItem: {
    fontSize: 13,
    color: '#334155',
  },
});