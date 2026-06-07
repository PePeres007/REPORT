import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { controladorListaDenuncias } from '../controllers/controlador_lista_denuncias';
import { CATEGORIAS, controladorReport } from '../controllers/controlador_report';

interface PreferenciaMonitoramento {
  id: string;
  userId: string;
  denunciaId: string;
  interacao: boolean;
  avaliacao: boolean;
  resolvida: boolean;
  criadoEm?: any;
}

interface DenunciaDisponivel {
  id: string;
  titulo: string;
  endereco: string;
  icone?: string;
  categoria?: string;
  status?: string;
  userId?: string;
  criadoEm?: any;
  latitude?: number | null;
  longitude?: number | null;
  criadaPorMim: boolean;
  distanciaMetros?: number | null;
  distancia?: string;
}

interface MonitoramentoEnriquecido extends PreferenciaMonitoramento {
  titulo: string;
  endereco: string;
  icone: string;
  categoria?: string;
  status?: string;
  criadaPorMim?: boolean;
  distancia?: string;
  distanciaMetros?: number | null;
}

function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatarDistancia(metros?: number | null): string | undefined {
  if (metros == null || Number.isNaN(metros)) return undefined;
  if (metros < 1000) return `A ${Math.round(metros)}m de você`;
  return `A ${(metros / 1000).toFixed(1).replace('.', ',')}km de você`;
}

function ordenarDenuncias(lista: DenunciaDisponivel[]) {
  return [...lista].sort((a, b) => {
    if (a.criadaPorMim && !b.criadaPorMim) return -1;
    if (!a.criadaPorMim && b.criadaPorMim) return 1;

    const aTemDistancia = typeof a.distanciaMetros === 'number';
    const bTemDistancia = typeof b.distanciaMetros === 'number';

    if (aTemDistancia && !bTemDistancia) return -1;
    if (!aTemDistancia && bTemDistancia) return 1;

    if (aTemDistancia && bTemDistancia) {
      return (a.distanciaMetros ?? 0) - (b.distanciaMetros ?? 0);
    }

    const aCriado = a.criadoEm?.seconds ? a.criadoEm.seconds : 0;
    const bCriado = b.criadoEm?.seconds ? b.criadoEm.seconds : 0;
    return bCriado - aCriado;
  });
}

export default function AtualizacoesScreen() {
  const router = useRouter();
  const auth = getAuth();
  const usuarioLogado = auth.currentUser;

  const controladorDenuncias = useMemo(() => new controladorListaDenuncias(router), [router]);
  const controladorRadar = useMemo(() => new controladorReport(router), [router]);

  const [loading, setLoading] = useState(true);
  const [carregandoAcao, setCarregandoAcao] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string>('');

  const [monitoramentos, setMonitoramentos] = useState<MonitoramentoEnriquecido[]>([]);
  const [denunciasDoApp, setDenunciasDoApp] = useState<DenunciaDisponivel[]>([]);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [denunciaSelecionadaId, setDenunciaSelecionadaId] = useState<string>('');

  const [notifInteracao, setNotifInteracao] = useState(true);
  const [notifAvaliacao, setNotifAvaliacao] = useState(false);
  const [notifResolvida, setNotifResolvida] = useState(true);

  const obterLocalizacaoAtual = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const localizacao = await Location.getCurrentPositionAsync({});
      return {
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      };
    } catch {
      return null;
    }
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const uid = usuarioLogado?.uid || 'user_atual';
      setUsuarioId(uid);

      const [monitoramentosBrutos, denunciasBrutas] = await Promise.all([
        controladorRadar.carregarMonitoramentosUsuario(uid),
        controladorDenuncias.carregarDenuncias(false, false),
      ]);

      const minhaLocalizacao = await obterLocalizacaoAtual();

      const denunciasEnriquecidas: DenunciaDisponivel[] = denunciasBrutas.map((item: any) => {
        const criadaPorMim = !!usuarioLogado && item.userId === usuarioLogado.uid;

        let distanciaMetros: number | null = null;
        let distancia: string | undefined;

        if (
          minhaLocalizacao &&
          item.latitude != null &&
          item.longitude != null &&
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
        ) {
          distanciaMetros = calcularDistanciaMetros(
            minhaLocalizacao.latitude,
            minhaLocalizacao.longitude,
            item.latitude,
            item.longitude
          );
          distancia = formatarDistancia(distanciaMetros);
        }

        const categoria = item.categoria ?? '';
        const categoriaObj = CATEGORIAS.find((c: any) => c.id === categoria);

        return {
          id: item.id,
          titulo: item.titulo || item.descricao || 'Denúncia sem título',
          endereco: item.endereco || 'Endereço não informado',
          icone: item.icone || categoriaObj?.icone || '📍',
          categoria,
          status: item.status,
          userId: item.userId,
          criadoEm: item.criadoEm,
          latitude: item.latitude,
          longitude: item.longitude,
          criadaPorMim,
          distanciaMetros,
          distancia,
        };
      });

      const denunciasOrdenadas = ordenarDenuncias(denunciasEnriquecidas);
      setDenunciasDoApp(denunciasOrdenadas);

      const mapaDenuncias = new Map(denunciasOrdenadas.map((d) => [d.id, d]));
      const monitoramentosEnriquecidos: MonitoramentoEnriquecido[] = [];
      const monitoramentosInvalidos: string[] = [];

      monitoramentosBrutos.forEach((m: any) => {
        const denuncia = mapaDenuncias.get(m.denunciaId);
        if (!denuncia) {
          if (m?.id) monitoramentosInvalidos.push(m.id);
          return;
        }

        monitoramentosEnriquecidos.push({
          id: m.id,
          userId: m.userId,
          denunciaId: m.denunciaId,
          interacao: !!m.interacao,
          avaliacao: !!m.avaliacao,
          resolvida: !!m.resolvida,
          criadoEm: m.criadoEm,
          titulo: denuncia.titulo,
          endereco: denuncia.endereco,
          icone: denuncia.icone || '📍',
          categoria: denuncia.categoria,
          status: denuncia.status,
          criadaPorMim: denuncia.criadaPorMim,
          distancia: denuncia.distancia,
          distanciaMetros: denuncia.distanciaMetros,
        });
      });

      if (monitoramentosInvalidos.length > 0) {
        await Promise.all(monitoramentosInvalidos.map((id) => controladorRadar.removerMonitoramento(id)));
      }

      monitoramentosEnriquecidos.sort((a, b) => {
        const indexA = denunciasOrdenadas.findIndex((d) => d.id === a.denunciaId);
        const indexB = denunciasOrdenadas.findIndex((d) => d.id === b.denunciaId);
        return indexA - indexB;
      });

      setMonitoramentos(monitoramentosEnriquecidos);
    } catch (error) {
      console.error('Erro ao carregar dados do radar:', error);
      setDenunciasDoApp([]);
      setMonitoramentos([]);
    } finally {
      setLoading(false);
    }
  }, [controladorDenuncias, controladorRadar, obterLocalizacaoAtual, usuarioLogado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const limparEstadoModal = () => {
    setModalVisivel(false);
    setIdEditando(null);
    setDenunciaSelecionadaId('');
    setNotifInteracao(true);
    setNotifAvaliacao(false);
    setNotifResolvida(true);
  };

  const abrirModalCriar = () => {
    if (denunciasDoApp.length === 0) {
      Alert.alert('Sem denúncias', 'Não há denúncias disponíveis para selecionar.');
      return;
    }

    setIdEditando(null);
    setDenunciaSelecionadaId(denunciasDoApp[0]?.id || '');
    setNotifInteracao(true);
    setNotifAvaliacao(false);
    setNotifResolvida(true);
    setModalVisivel(true);
  };

  const abrirModalEditar = (item: MonitoramentoEnriquecido) => {
    setIdEditando(item.id);
    setDenunciaSelecionadaId(item.denunciaId);
    setNotifInteracao(item.interacao);
    setNotifAvaliacao(item.avaliacao);
    setNotifResolvida(item.resolvida);
    setModalVisivel(true);
  };

  const handleSalvarConfiguracao = async () => {
    const ocorrenciaAlvo = denunciasDoApp.find((d) => d.id === denunciaSelecionadaId);
    if (!ocorrenciaAlvo) {
      Alert.alert('Erro', 'Selecione uma denúncia válida antes de continuar.');
      return;
    }

    if (!usuarioId) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário logado.');
      return;
    }

    try {
      setCarregandoAcao(true);

      if (idEditando) {
        const duplicado = monitoramentos.some(
          (m) => m.denunciaId === denunciaSelecionadaId && m.id !== idEditando
        );

        if (duplicado) {
          Alert.alert('Aviso', 'Você já está monitorando esta ocorrência.');
          return;
        }

        await controladorRadar.atualizarMonitoramento(
          idEditando,
          notifInteracao,
          notifAvaliacao,
          notifResolvida
        );

        Alert.alert('Sucesso', 'Monitoramento atualizado com sucesso.');
      } else {
        const jaMonitora = monitoramentos.some((m) => m.denunciaId === denunciaSelecionadaId);
        if (jaMonitora) {
          Alert.alert('Aviso', 'Você já está monitorando esta ocorrência.');
          return;
        }

        await controladorRadar.criarMonitoramento(
          usuarioId,
          ocorrenciaAlvo.id,
          notifInteracao,
          notifAvaliacao,
          notifResolvida
        );

        Alert.alert('Sucesso', 'Ocorrência adicionada ao seu radar!');
      }

      limparEstadoModal();
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar monitoramento:', error);
      Alert.alert('Erro', 'Não foi possível salvar seu radar.');
    } finally {
      setCarregandoAcao(false);
    }
  };

  const handleRemoverMonitoramento = (id: string) => {
    Alert.alert(
      'Parar de Monitorar',
      'Você não receberá mais notificações sobre o andamento desta ocorrência.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCarregandoAcao(true);
              await controladorRadar.removerMonitoramento(id);
              await carregarDados();
            } catch (error) {
              console.error('Erro ao remover monitoramento:', error);
              Alert.alert('Erro', 'Não foi possível remover o monitoramento.');
            } finally {
              setCarregandoAcao(false);
            }
          },
        },
      ]
    );
  };

  const obterBadgeStatus = (status?: string) => {
    switch (status) {
      case 'resolvido':
        return { bg: '#DCFCE7', texto: '#166534', label: 'Resolvido' };
      case 'em_analise':
        return { bg: '#FEF3C7', texto: '#92400E', label: 'Em análise' };
      default:
        return { bg: '#FEE2E2', texto: '#991B1B', label: 'Pendente' };
    }
  };

  const renderCardMonitoramento = ({ item }: { item: MonitoramentoEnriquecido }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.infoOcorrencia}>
          <Text style={styles.cardIcone}>{item.icone}</Text>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardTitulo} numberOfLines={1}>
                {item.titulo}
              </Text>
              {item.criadaPorMim && (
                <View style={styles.badgeAutor}>
                  <Text style={styles.textoBadgeAutor}>Sua</Text>
                </View>
              )}
              {item.distancia && (
                <View style={styles.badgeDistancia}>
                  <Text style={styles.textoBadgeDistancia}>Perto</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardEndereco} numberOfLines={1}>
              📍 {item.endereco}
            </Text>
          </View>
        </View>

        <View style={styles.acoesCard}>
          <TouchableOpacity onPress={() => abrirModalEditar(item)} style={styles.botaoIcone}>
            <Ionicons name="options-outline" size={20} color="#1e4e79" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRemoverMonitoramento(item.id)} style={styles.botaoIcone}>
            <Ionicons name="notifications-off-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divisorCard} />

      <View style={styles.containerBadges}>
        {item.interacao && (
          <View style={[styles.badge, styles.badgeAzul]}>
            <Text style={styles.textoBadge}>Interações</Text>
          </View>
        )}
        {item.avaliacao && (
          <View style={[styles.badge, styles.badgeRoxo]}>
            <Text style={styles.textoBadge}>Apoios</Text>
          </View>
        )}
        {item.resolvida && (
          <View style={[styles.badge, styles.badgeVerde]}>
            <Text style={styles.textoBadge}>Status Solucionado</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Radar de Ocorrências</Text>
      </View>

      <View style={styles.containerAviso}>
        <Ionicons name="information-circle" size={22} color="#1e4e79" />
        <Text style={styles.textoAviso}>
          As atualizações dos itens marcados abaixo serão enviadas diretamente para sua{' '}
          <Text style={{ fontWeight: '700' }}>Central de Notificações</Text>.
        </Text>
      </View>

      {loading || carregandoAcao ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e4e79" />
          {carregandoAcao && <Text style={{ marginTop: 12, color: '#64748B' }}>Salvando alterações...</Text>}
        </View>
      ) : monitoramentos.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="eye-off-outline" size={55} color="#CBD5E1" />
          <Text style={styles.vazioTexto}>
            Você não está rastreando nenhuma ocorrência específica no momento.
          </Text>
          <TouchableOpacity style={styles.botaoAdicionarVazio} onPress={abrirModalCriar}>
            <Text style={styles.textoBotaoAdicionar}>Escolher Ocorrência</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={monitoramentos}
            keyExtractor={(item) => item.id}
            renderItem={renderCardMonitoramento}
            contentContainerStyle={styles.lista}
          />

          <TouchableOpacity style={styles.botaoFlutuante} onPress={abrirModalCriar}>
            <Ionicons name="eye-outline" size={26} color="#FFF" />
            <Text style={styles.textoFlutuante}>+ Rastrear</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            <Text style={styles.tituloModal}>
              {idEditando ? 'Ajustar Alertas de Rastreio' : 'Rastrear Ocorrência Específica'}
            </Text>

            <Text style={styles.labelModal}>Selecione qual ocorrência acompanhar:</Text>

            <View style={styles.wrapperListaSelecao}>
              <FlatList
                data={denunciasDoApp}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 230 }}
                nestedScrollEnabled
                renderItem={({ item }) => {
                  const badgeStatus = obterBadgeStatus(item.status);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.opcaoDenunciaLista,
                        denunciaSelecionadaId === item.id && styles.opcaoDenunciaSelecionada,
                      ]}
                      onPress={() => setDenunciaSelecionadaId(item.id)}
                    >
                      <Text style={{ fontSize: 20, marginRight: 10 }}>{item.icone || '📍'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.tituloOpcao} numberOfLines={1}>
                            {item.titulo}
                          </Text>
                          {item.criadaPorMim && (
                            <View style={styles.badgeAutor}>
                              <Text style={styles.textoBadgeAutor}>Sua</Text>
                            </View>
                          )}
                          {item.distancia && (
                            <View style={styles.badgeDistancia}>
                              <Text style={styles.textoBadgeDistancia}>Perto</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.enderecoOpcao} numberOfLines={1}>
                          {item.endereco}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <View style={[styles.badgeStatusMini, { backgroundColor: badgeStatus.bg }]}>
                            <Text style={[styles.textoBadgeStatusMini, { color: badgeStatus.texto }]}>
                              {badgeStatus.label}
                            </Text>
                          </View>
                          {item.distancia && <Text style={styles.distanciaOpcao}>{item.distancia}</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <Text style={styles.labelModal}>Quero ser alertado quando:</Text>

            <TouchableOpacity style={styles.opcaoCheckbox} onPress={() => setNotifInteracao(!notifInteracao)}>
              <Ionicons name={notifInteracao ? 'checkbox' : 'square-outline'} size={24} color="#1e4e79" />
              <Text style={styles.textoCheckbox}>Adicionarem novos comentários ou notas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.opcaoCheckbox} onPress={() => setNotifAvaliacao(!notifAvaliacao)}>
              <Ionicons name={notifAvaliacao ? 'checkbox' : 'square-outline'} size={24} color="#1e4e79" />
              <Text style={styles.textoCheckbox}>A comunidade manifestar apoio/relevância</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.opcaoCheckbox} onPress={() => setNotifResolvida(!notifResolvida)}>
              <Ionicons name={notifResolvida ? 'checkbox' : 'square-outline'} size={24} color="#1e4e79" />
              <Text style={styles.textoCheckbox}>O status for alterado para Resolvido</Text>
            </TouchableOpacity>

            <View style={styles.containerBotoesModal}>
              <TouchableOpacity style={styles.botaoCancelarModal} onPress={limparEstadoModal}>
                <Text style={styles.textoBotaoCancelar}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvarModal} onPress={handleSalvarConfiguracao}>
                <Text style={styles.textoBotaoSalvar}>Confirmar Radar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#1e4e79',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitulo: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  vazioTexto: {
    color: '#7A8FA6',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  lista: { padding: 20, paddingBottom: 100 },

  containerAviso: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  textoAviso: { flex: 1, fontSize: 13, color: '#1E3A8A', lineHeight: 18 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoOcorrencia: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcone: { fontSize: 24, marginRight: 10, marginTop: 2 },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  cardEndereco: { fontSize: 12, color: '#64748B' },
  acoesCard: { flexDirection: 'row', gap: 6 },
  botaoIcone: { padding: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  divisorCard: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  containerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeAzul: { backgroundColor: '#EFF6FF' },
  badgeRoxo: { backgroundColor: '#F3E8FF' },
  badgeVerde: { backgroundColor: '#DCFCE7' },
  textoBadge: { fontSize: 11, fontWeight: '600', color: '#475569' },

  botaoAdicionarVazio: {
    backgroundColor: '#1e4e79',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  textoBotaoAdicionar: { color: '#FFF', fontWeight: 'bold' },
  botaoFlutuante: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#1e4e79',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  textoFlutuante: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  conteudoModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '88%',
  },
  tituloModal: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 18 },
  labelModal: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, marginTop: 8 },
  wrapperListaSelecao: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
  },
  opcaoDenunciaLista: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  opcaoDenunciaSelecionada: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1e4e79',
  },
  tituloOpcao: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  badgeAutor: { backgroundColor: '#3A6EA5', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 },
  textoBadgeAutor: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  enderecoOpcao: { fontSize: 12, color: '#64748B', marginTop: 2 },
  distanciaOpcao: { fontSize: 11, color: '#0284C7', fontWeight: '600' },
  badgeMini: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  textoBadgeMini: { color: '#334155', fontSize: 10, fontWeight: '700' },
  badgeStatusMini: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  textoBadgeStatusMini: { fontSize: 10, fontWeight: '700' },
  badgeDistancia: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  textoBadgeDistancia: { color: '#1D4ED8', fontSize: 10, fontWeight: '700' },
  opcaoCheckbox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  textoCheckbox: { fontSize: 14, color: '#334155' },
  containerBotoesModal: { flexDirection: 'row', gap: 12, marginTop: 20 },
  botaoCancelarModal: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  textoBotaoCancelar: { color: '#475569', fontWeight: 'bold' },
  botaoSalvarModal: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#1e4e79',
    alignItems: 'center',
  },
  textoBotaoSalvar: { color: '#FFF', fontWeight: 'bold' },
});
