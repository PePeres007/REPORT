import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIAS } from '../controllers/controlador_report';
import { db } from '../services/firebaseConfig';

// ─── Cores ────────────────────────────────────────────────────────────────────
const COR_PRIMARIA = '#1E293B';
const COR_FUNDO = '#F8FAFC';
const COR_CARD = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converte "DD/MM/AAAA" para objeto Date */
function parseDateBR(str: string): Date | null {
  if (!str || str.length !== 10) return null;
  const [d, m, a] = str.split('/').map(Number);
  if (!d || !m || !a) return null;
  return new Date(a, m - 1, d);
}

/** Diferença em dias entre duas datas (positivo = B após A) */
function diffDias(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Converte milissegundos em string legível */
function formatarDuracao(ms: number): string {
  const dias = Math.round(ms / (1000 * 60 * 60 * 24));
  if (dias < 7) return `${dias} dia${dias !== 1 ? 's' : ''}`;
  const semanas = Math.floor(dias / 7);
  const resto = dias % 7;
  if (resto === 0) return `${semanas} semana${semanas !== 1 ? 's' : ''}`;
  return `${semanas} sem. e ${resto} dia${resto !== 1 ? 's' : ''}`;
}

/** Formata valor monetário */
function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AnalysePrazo {
  tipo: 'pontual' | 'adiantado' | 'atraso_leve' | 'atraso_grave';
  dias: number;
  label: string;
  cor: string;
  fundo: string;
  emoji: string;
}

interface AnalyseOrcamento {
  tipo: 'economizou' | 'no_limite' | 'estourou';
  diferenca: number;
  percentual: number;
  label: string;
  cor: string;
  fundo: string;
  emoji: string;
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RelatorioObraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!reportId) { setCarregando(false); return; }
    const docRef = doc(db, 'denuncias', reportId as string);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) setDados({ id: snap.id, ...snap.data() });
      setCarregando(false);
    });
  }, [reportId]);

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={COR_PRIMARIA} />
      </View>
    );
  }

  if (!dados || !dados.relatorioTecnico) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cabecalho}>
          <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
            <Ionicons name="chevron-back" size={28} color={COR_PRIMARIA} />
          </TouchableOpacity>
          <Text style={styles.tituloCabecalho}>Relatório da Obra</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centralizado}>
          <Ionicons name="document-outline" size={60} color="#CBD5E1" />
          <Text style={styles.textoVazio}>Relatório técnico ainda não disponível para esta ocorrência.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rel = dados.relatorioTecnico;
  const catInfo = CATEGORIAS.find((c) => c.id === dados.categoria);

  // ── Análise de Prazo ───────────────────────────────────────────────────────
  const dataPrevista = parseDateBR(rel.dataPrevista);
  const dataConclusao = parseDateBR(rel.dataConclusao);
  let analisePrazo: AnalysePrazo | null = null;

  if (dataPrevista && dataConclusao) {
    const dias = diffDias(dataPrevista, dataConclusao); // positivo = atrasou
    if (dias < 0) {
      analisePrazo = {
        tipo: 'adiantado',
        dias: Math.abs(dias),
        label: `Entregue ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''} antes do prazo`,
        cor: '#0284C7',
        fundo: '#E0F2FE',
        emoji: '🔵',
      };
    } else if (dias === 0) {
      analisePrazo = {
        tipo: 'pontual',
        dias: 0,
        label: 'Entregue exatamente no prazo',
        cor: '#16A34A',
        fundo: '#DCFCE7',
        emoji: '🟢',
      };
    } else if (dias <= 7) {
      analisePrazo = {
        tipo: 'atraso_leve',
        dias,
        label: `Atraso leve de ${dias} dia${dias !== 1 ? 's' : ''}`,
        cor: '#D97706',
        fundo: '#FEF3C7',
        emoji: '🟡',
      };
    } else {
      analisePrazo = {
        tipo: 'atraso_grave',
        dias,
        label: `Atraso grave de ${dias} dias`,
        cor: '#DC2626',
        fundo: '#FEE2E2',
        emoji: '🔴',
      };
    }
  }

  // ── Análise Orçamentária ───────────────────────────────────────────────────
  const custos = rel.custosEstimados || {};
  const totalEstimado =
    (Number(custos.maoDeObra) || 0) +
    (Number(custos.material) || 0) +
    (Number(custos.intervencao) || 0) +
    (Number(custos.apoio) || 0);
  const totalReal = Number(rel.gastosTotais) || 0;
  let analyseOrcamento: AnalyseOrcamento | null = null;

  if (totalEstimado > 0 && totalReal > 0) {
    const diferenca = totalReal - totalEstimado; // positivo = estourou
    const percentual = Math.abs(Math.round((diferenca / totalEstimado) * 100));

    if (diferenca < 0) {
      analyseOrcamento = {
        tipo: 'economizou',
        diferenca: Math.abs(diferenca),
        percentual,
        label: `Economizou ${percentual}% do orçamento`,
        cor: '#0284C7',
        fundo: '#E0F2FE',
        emoji: '💙',
      };
    } else if (percentual <= 5) {
      analyseOrcamento = {
        tipo: 'no_limite',
        diferenca,
        percentual,
        label: 'Dentro do orçamento previsto',
        cor: '#16A34A',
        fundo: '#DCFCE7',
        emoji: '✅',
      };
    } else {
      analyseOrcamento = {
        tipo: 'estourou',
        diferenca,
        percentual,
        label: `Orçamento estourado em ${percentual}%`,
        cor: '#DC2626',
        fundo: '#FEE2E2',
        emoji: '⚠️',
      };
    }
  }

  // ── Tempo total do atendimento ─────────────────────────────────────────────
  let tempoTotal: string | null = null;
  try {
    const inicio = dados.criadoEm?.seconds
      ? new Date(dados.criadoEm.seconds * 1000)
      : dados.criadoEm
      ? new Date(dados.criadoEm)
      : null;
    const fim = rel.dataFinalizacaoDoc ? new Date(rel.dataFinalizacaoDoc) : null;
    if (inicio && fim) tempoTotal = formatarDuracao(fim.getTime() - inicio.getTime());
  } catch (_) {}

  // ── Avaliação do cidadão ───────────────────────────────────────────────────
  const notaCidadao =
    dados.avaliacao && typeof dados.avaliacao === 'object'
      ? dados.avaliacao.nota || 0
      : 0;
  const totalApoiadores = dados.apoiadores?.length || 0;
  const totalResolvidos = dados.resolvidos?.length || 0;

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
          <Ionicons name="chevron-back" size={28} color={COR_PRIMARIA} />
        </TouchableOpacity>
        <Text style={styles.tituloCabecalho}>Relatório de Obra</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── IDENTIDADE DA OBRA ── */}
        <View style={styles.cardIdentidade}>
          <View style={styles.rowIdentidade}>
            <Text style={styles.iconeCategoria}>{catInfo?.icone || '📍'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelCategoria}>{catInfo?.label || 'Ocorrência'}</Text>
              <Text style={styles.textoEndereco} numberOfLines={2}>{dados.endereco}</Text>
            </View>
            <View style={styles.badgeResolvido}>
              <Text style={styles.textoBadgeResolvido}>✓ RESOLVIDO</Text>
            </View>
          </View>

          <View style={styles.divisorCard} />

          <View style={styles.rowOrgaos}>
            <View style={styles.itemOrgao}>
              <Text style={styles.labelOrgao}>🏛️ Órgão Principal</Text>
              <Text style={styles.valorOrgao}>{rel.orgaoSolucao || '—'}</Text>
            </View>
            {rel.orgaoAuxiliar && rel.orgaoAuxiliar !== 'Nenhum' && (
              <View style={styles.itemOrgao}>
                <Text style={styles.labelOrgao}>🤝 Suporte</Text>
                <Text style={styles.valorOrgao}>{rel.orgaoAuxiliar}</Text>
              </View>
            )}
          </View>

          {tempoTotal && (
            <View style={styles.rowTempoTotal}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.textoTempoTotal}>
                Atendimento concluído em <Text style={{ fontWeight: '700', color: COR_PRIMARIA }}>{tempoTotal}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* ── ANÁLISE DE PRAZO ── */}
        <Text style={styles.tituloSecao}>📅 Análise de Prazo</Text>
        {analisePrazo ? (
          <View style={[styles.cardAnalise, { borderLeftColor: analisePrazo.cor }]}>
            <View style={[styles.badgeAnalise, { backgroundColor: analisePrazo.fundo }]}>
              <Text style={[styles.textoBadgeAnalise, { color: analisePrazo.cor }]}>
                {analisePrazo.emoji} {analisePrazo.label}
              </Text>
            </View>
            <View style={styles.tabelaDatas}>
              <View style={styles.itemData}>
                <Text style={styles.labelData}>Prazo Previsto</Text>
                <Text style={styles.valorData}>{rel.dataPrevista || '—'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              <View style={styles.itemData}>
                <Text style={styles.labelData}>Conclusão Real</Text>
                <Text style={[styles.valorData, { color: analisePrazo.cor }]}>
                  {rel.dataConclusao || '—'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cardAnaliseVazio}>
            <Text style={styles.textoSemDados}>Datas não informadas no relatório.</Text>
          </View>
        )}

        {/* ── ANÁLISE ORÇAMENTÁRIA ── */}
        <Text style={styles.tituloSecao}>💰 Análise Orçamentária</Text>
        {analyseOrcamento ? (
          <View style={[styles.cardAnalise, { borderLeftColor: analyseOrcamento.cor }]}>
            <View style={[styles.badgeAnalise, { backgroundColor: analyseOrcamento.fundo }]}>
              <Text style={[styles.textoBadgeAnalise, { color: analyseOrcamento.cor }]}>
                {analyseOrcamento.emoji} {analyseOrcamento.label}
              </Text>
            </View>

            {/* Linha orçado vs real */}
            <View style={styles.linhaOrcamento}>
              <View style={styles.itemOrcamento}>
                <Text style={styles.labelOrcamento}>Orçado</Text>
                <Text style={styles.valorOrcamentoEstimado}>{formatarReais(totalEstimado)}</Text>
              </View>
              <View style={styles.separadorOrcamento} />
              <View style={styles.itemOrcamento}>
                <Text style={styles.labelOrcamento}>Gasto Real</Text>
                <Text style={[styles.valorOrcamentoReal, { color: analyseOrcamento.cor }]}>
                  {formatarReais(totalReal)}
                </Text>
              </View>
              <View style={styles.separadorOrcamento} />
              <View style={styles.itemOrcamento}>
                <Text style={styles.labelOrcamento}>Diferença</Text>
                <Text style={[styles.valorOrcamentoReal, { color: analyseOrcamento.cor }]}>
                  {analyseOrcamento.tipo === 'economizou' ? '-' : '+'}{formatarReais(analyseOrcamento.diferenca)}
                </Text>
              </View>
            </View>

            {/* Tabela de custos estimados */}
            <View style={styles.divisorCard} />
            <Text style={styles.labelTabelaCustos}>Detalhamento do Orçamento Estimado</Text>
            {[
              { label: 'Mão de Obra', valor: Number(custos.maoDeObra) || 0 },
              { label: 'Material', valor: Number(custos.material) || 0 },
              { label: 'Intervenção', valor: Number(custos.intervencao) || 0 },
              { label: 'Apoio Técnico', valor: Number(custos.apoio) || 0 },
            ].map((item) => (
              <View key={item.label} style={styles.linhaCusto}>
                <Text style={styles.labelCusto}>{item.label}</Text>
                <Text style={styles.valorCusto}>{formatarReais(item.valor)}</Text>
              </View>
            ))}
            <View style={styles.linhaCustoTotal}>
              <Text style={styles.labelCustoTotal}>Total Estimado</Text>
              <Text style={styles.valorCustoTotal}>{formatarReais(totalEstimado)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardAnaliseVazio}>
            <Text style={styles.textoSemDados}>Valores orçamentários não informados.</Text>
          </View>
        )}

        {/* ── PLANO DE INTERVENÇÃO ── */}
        {rel.planoSolucao ? (
          <>
            <Text style={styles.tituloSecao}>📋 Plano de Intervenção</Text>
            <View style={styles.cardPlano}>
              <Text style={styles.textoPlano}>{rel.planoSolucao}</Text>
            </View>
          </>
        ) : null}

        {/* ── AVALIAÇÃO DA COMUNIDADE ── */}
        <Text style={styles.tituloSecao}>⭐ Avaliação da Comunidade</Text>
        <View style={styles.cardComunidade}>
          <View style={styles.rowComunidade}>
            {/* Avaliação em estrelas */}
            <View style={styles.blocoEstrelas}>
              <Text style={styles.labelComunidade}>Avaliação do Cidadão</Text>
              {notaCidadao > 0 ? (
                <>
                  <View style={styles.estrelasRow}>
                    {[1, 2, 3, 4, 5].map((e) => (
                      <Ionicons
                        key={e}
                        name={e <= notaCidadao ? 'star' : 'star-outline'}
                        size={22}
                        color={e <= notaCidadao ? '#FBBF24' : '#E2E8F0'}
                      />
                    ))}
                  </View>
                  <Text style={styles.notaNumero}>{notaCidadao}/5</Text>
                </>
              ) : (
                <Text style={styles.textoSemNota}>Não avaliado</Text>
              )}
            </View>

            <View style={styles.separadorVertical} />

            {/* Apoiadores e Resolvidos */}
            <View style={styles.blocoComunidade}>
              <View style={styles.itemComunidade}>
                <Text style={styles.numeroComunidade}>{totalApoiadores}</Text>
                <Text style={styles.labelComunidadeMetrica}>apoiadores</Text>
              </View>
              <View style={styles.itemComunidade}>
                <Text style={styles.numeroComunidade}>{totalResolvidos}</Text>
                <Text style={styles.labelComunidadeMetrica}>marcaram resolvido</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── RODAPÉ ── */}
        <View style={styles.rodape}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#94A3B8" />
          <Text style={styles.textoRodape}>
            Relatório gerado automaticamente pelo sistema REPORT
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COR_FUNDO },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  textoVazio: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },

  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COR_CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  botaoVoltar: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: COR_FUNDO,
  },
  tituloCabecalho: { fontSize: 17, fontWeight: '800', color: COR_PRIMARIA },

  scrollContent: { padding: 16, paddingBottom: 40 },

  tituloSecao: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 10,
  },

  // Card de identidade
  cardIdentidade: {
    backgroundColor: COR_CARD,
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  rowIdentidade: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconeCategoria: { fontSize: 32, marginTop: 2 },
  labelCategoria: { fontSize: 16, fontWeight: '800', color: COR_PRIMARIA, marginBottom: 4 },
  textoEndereco: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  badgeResolvido: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  textoBadgeResolvido: { fontSize: 10, fontWeight: '800', color: '#16A34A' },

  divisorCard: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  rowOrgaos: { flexDirection: 'row', gap: 16 },
  itemOrgao: { flex: 1 },
  labelOrgao: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' },
  valorOrgao: { fontSize: 13, fontWeight: '600', color: COR_PRIMARIA, lineHeight: 18 },

  rowTempoTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  textoTempoTotal: { fontSize: 13, color: '#64748B' },

  // Cards de análise
  cardAnalise: {
    backgroundColor: COR_CARD,
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardAnaliseVazio: {
    backgroundColor: COR_CARD,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
  },
  textoSemDados: { color: '#94A3B8', fontSize: 14 },

  badgeAnalise: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 14,
  },
  textoBadgeAnalise: { fontSize: 14, fontWeight: '800' },

  // Datas
  tabelaDatas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemData: { flex: 1, alignItems: 'center' },
  labelData: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  valorData: { fontSize: 15, fontWeight: '800', color: COR_PRIMARIA },

  // Orçamento
  linhaOrcamento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  separadorOrcamento: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  itemOrcamento: { flex: 1, alignItems: 'center' },
  labelOrcamento: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  valorOrcamentoEstimado: { fontSize: 15, fontWeight: '800', color: COR_PRIMARIA },
  valorOrcamentoReal: { fontSize: 15, fontWeight: '800' },

  labelTabelaCustos: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  linhaCusto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  labelCusto: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  valorCusto: { fontSize: 13, fontWeight: '700', color: COR_PRIMARIA },
  linhaCustoTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
  },
  labelCustoTotal: { fontSize: 13, fontWeight: '800', color: COR_PRIMARIA },
  valorCustoTotal: { fontSize: 15, fontWeight: '800', color: COR_PRIMARIA },

  // Plano
  cardPlano: {
    backgroundColor: COR_CARD,
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  textoPlano: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Comunidade
  cardComunidade: {
    backgroundColor: COR_CARD,
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  rowComunidade: { flexDirection: 'row', alignItems: 'center' },
  blocoEstrelas: { flex: 1, alignItems: 'center' },
  estrelasRow: { flexDirection: 'row', gap: 4, marginVertical: 6 },
  notaNumero: { fontSize: 13, fontWeight: '700', color: '#FBBF24' },
  textoSemNota: { fontSize: 13, color: '#94A3B8', marginTop: 6 },
  labelComunidade: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },

  separadorVertical: { width: 1, height: 70, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

  blocoComunidade: { flex: 1, gap: 12 },
  itemComunidade: { alignItems: 'center' },
  numeroComunidade: { fontSize: 26, fontWeight: '800', color: COR_PRIMARIA },
  labelComunidadeMetrica: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  // Rodapé
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textoRodape: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
});
