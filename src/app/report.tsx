import { getAuth } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIAS, controladorReport } from '../controllers/controlador_report';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Passo = 1 | 2 | 3 | 4;

// ─── Constantes ──────────────────────────────────────────────────────────────
const TOTAL_PASSOS = 4;
const ROTULOS_PASSOS = ['Categoria', 'Foto', 'Endereço', 'Descrição'];
const COR_PRIMARIA = '#7B1FA2';
const COR_SECUNDARIA = '#9C27B0';
const COR_FUNDO = '#F5F0FA';
const COR_CARD = '#FFFFFF';

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat: string; lon: string }>();
  const controlador = new controladorReport(router);

  const latitude = parseFloat(params.lat ?? '0');
  const longitude = parseFloat(params.lon ?? '0');

  // ── Estado do wizard ────────────────────────────────────────────────────────
  const [passo, setPasso] = useState<Passo>(1);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [endereco, setEndereco] = useState('');
  const [carregandoEndereco, setCarregandoEndereco] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  // ── Animação de progresso ───────────────────────────────────────────────────
  const progressoAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressoAnim, {
      toValue: passo,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [passo]);

  // Ao entrar no passo 3, busca o endereço automaticamente
  useEffect(() => {
    if (passo === 3 && endereco === '') {
      buscarEndereco();
    }
  }, [passo]);

  const buscarEndereco = async () => {
    setCarregandoEndereco(true);
    const end = await controlador.obterEnderecoPorCoordenadas(latitude, longitude);
    setEndereco(end);
    setCarregandoEndereco(false);
  };

  // ── Animação de transição de passo ─────────────────────────────────────────
  const animarTransicao = (acao: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(acao, 150);
  };

  const avancar = () => {
    if (passo === 1 && !categoria) {
      Alert.alert('Atenção', 'Escolha uma categoria antes de continuar.');
      return;
    }
    if (passo < TOTAL_PASSOS) {
      animarTransicao(() => setPasso((p) => (p + 1) as Passo));
    }
  };

  const voltar = () => {
    if (passo > 1) {
      animarTransicao(() => setPasso((p) => (p - 1) as Passo));
    } else {
      router.back();
    }
  };

  // ── Foto ────────────────────────────────────────────────────────────────────
  const abrirOpcoesFoto = () => {
    Alert.alert('Adicionar Foto', 'Como deseja adicionar a foto?', [
      {
        text: '📷 Câmera',
        onPress: async () => {
          const uri = await controlador.tirarFoto();
          if (uri) setFotoUri(uri);
        },
      },
      {
        text: '🖼️ Galeria',
        onPress: async () => {
          const uri = await controlador.escolherDaGaleria();
          if (uri) setFotoUri(uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ── Envio ───────────────────────────────────────────────────────────────────
  const enviarReport = async () => {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Adicione uma descrição antes de enviar.');
      return;
    }
    setEnviando(true);
    const auth = getAuth();
    const userId = auth.currentUser?.uid ?? null;
    const sucesso = await controlador.salvarReport(
      {
        categoria: categoria!,
        fotoUri,
        endereco,
        descricao: descricao.trim(),
        latitude,
        longitude,
      },
      userId
    );
    setEnviando(false);
    if (sucesso) {
      Alert.alert('✅ Report Enviado!', 'Seu problema foi registrado com sucesso. Obrigado!', [
        { text: 'OK', onPress: () => router.replace('/home') },
      ]);
    } else {
      Alert.alert('Erro', 'Não foi possível enviar o report. Tente novamente.');
    }
  };

  // ── Barra de progresso ──────────────────────────────────────────────────────
  const larguraProgressoPct = progressoAnim.interpolate({
    inputRange: [1, TOTAL_PASSOS],
    outputRange: ['25%', '100%'],
  });

  // ── Renderização dos passos ─────────────────────────────────────────────────
  const renderPasso = () => {
    switch (passo) {
      // ── PASSO 1: CATEGORIA ──────────────────────────────────────────────────
      case 1:
        return (
          <View style={styles.conteudoPasso}>
            <Text style={styles.tituloPasso}>Qual é o tipo do problema?</Text>
            <Text style={styles.subtituloPasso}>Selecione a categoria que melhor descreve a situação.</Text>
            <ScrollView contentContainerStyle={styles.gridCategorias} showsVerticalScrollIndicator={false}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.cardCategoria, categoria === cat.id && styles.cardCategoriaSelecionado]}
                  onPress={() => setCategoria(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.iconeCategoria}>{cat.icone}</Text>
                  <Text style={[styles.labelCategoria, categoria === cat.id && styles.labelCategoriaSelecionado]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      // ── PASSO 2: FOTO ───────────────────────────────────────────────────────
      case 2:
        return (
          <View style={styles.conteudoPasso}>
            <Text style={styles.tituloPasso}>Adicione uma foto</Text>
            <Text style={styles.subtituloPasso}>
              Uma foto ajuda a identificar melhor o problema. Este passo é opcional.
            </Text>
            <TouchableOpacity style={styles.areafoto} onPress={abrirOpcoesFoto} activeOpacity={0.8}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.fotoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderFoto}>
                  <Text style={styles.iconeUpload}>📷</Text>
                  <Text style={styles.textoUpload}>Toque para adicionar foto</Text>
                  <Text style={styles.subTextoUpload}>câmera ou galeria</Text>
                </View>
              )}
            </TouchableOpacity>
            {fotoUri && (
              <TouchableOpacity style={styles.botaoTrocarFoto} onPress={abrirOpcoesFoto}>
                <Text style={styles.textoBotaoTrocarFoto}>🔄 Trocar foto</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      // ── PASSO 3: ENDEREÇO ───────────────────────────────────────────────────
      case 3:
        return (
          <View style={styles.conteudoPasso}>
            <Text style={styles.tituloPasso}>Confirme o endereço</Text>
            <Text style={styles.subtituloPasso}>
              O endereço foi preenchido automaticamente com base no local marcado no mapa.
              Você pode editá-lo se necessário.
            </Text>
            {carregandoEndereco ? (
              <View style={styles.carregandoEndereco}>
                <ActivityIndicator size="large" color={COR_PRIMARIA} />
                <Text style={styles.textoCarregando}>Buscando endereço...</Text>
              </View>
            ) : (
              <View style={styles.campoEnderecoContainer}>
                <Text style={styles.labelCampo}>📍 Endereço</Text>
                <TextInput
                  style={styles.inputEndereco}
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Digite o endereço manualmente..."
                  placeholderTextColor="#B0B0B0"
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity style={styles.botaoRedetectar} onPress={buscarEndereco}>
                  <Text style={styles.textoBotaoRedetectar}>🔄 Redetectar endereço</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      // ── PASSO 4: DESCRIÇÃO ──────────────────────────────────────────────────
      case 4:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.conteudoPasso}>
              <Text style={styles.tituloPasso}>Descreva o problema</Text>
              <Text style={styles.subtituloPasso}>
                Dê mais detalhes sobre a situação para facilitar o atendimento.
              </Text>

              {/* Resumo do report */}
              <View style={styles.resumoContainer}>
                <Text style={styles.resumoTitulo}>📋 Resumo do seu report</Text>
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoLabel}>Categoria:</Text>
                  <Text style={styles.resumoValor}>
                    {CATEGORIAS.find((c) => c.id === categoria)?.icone}{' '}
                    {CATEGORIAS.find((c) => c.id === categoria)?.label}
                  </Text>
                </View>
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoLabel}>Foto:</Text>
                  <Text style={styles.resumoValor}>{fotoUri ? '✅ Adicionada' : '❌ Sem foto'}</Text>
                </View>
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoLabel}>Endereço:</Text>
                  <Text style={styles.resumoValor} numberOfLines={2}>{endereco || 'Não informado'}</Text>
                </View>
              </View>

              <Text style={styles.labelCampo}>✏️ Descrição</Text>
              <TextInput
                style={styles.inputDescricao}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Ex: Há um buraco grande na calçada próximo ao poste, dificultando a passagem de pedestres..."
                placeholderTextColor="#B0B0B0"
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.contadorCaracteres}>{descricao.length}/500</Text>
            </View>
          </KeyboardAvoidingView>
        );
    }
  };

  // ── JSX Principal ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Cabeçalho ── */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
          <Text style={styles.textoBotaoVoltar}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.tituloCabecalho}>Novo Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Indicador de passos ── */}
      <View style={styles.indicadorContainer}>
        <View style={styles.barraProgressoFundo}>
          <Animated.View style={[styles.barraProgressoPreenchida, { width: larguraProgressoPct }]} />
        </View>
        <View style={styles.passosLinha}>
          {ROTULOS_PASSOS.map((label, idx) => {
            const numPasso = idx + 1;
            const ativo = passo === numPasso;
            const completo = passo > numPasso;
            return (
              <View key={label} style={styles.passoItem}>
                <View
                  style={[
                    styles.passoBolinha,
                    ativo && styles.passoBolinhahAtiva,
                    completo && styles.passoBolinhaConcluida,
                  ]}
                >
                  <Text
                    style={[
                      styles.passoNumero,
                      (ativo || completo) && styles.passoNumerohAtivo,
                    ]}
                  >
                    {completo ? '✓' : numPasso}
                  </Text>
                </View>
                <Text style={[styles.passoLabel, ativo && styles.passoLabelAtivo]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Conteúdo do passo animado ── */}
      <Animated.View style={[styles.conteudoAnimado, { opacity: fadeAnim }]}>
        {renderPasso()}
      </Animated.View>

      {/* ── Botões de navegação ── */}
      <View style={styles.rodape}>
        {passo < TOTAL_PASSOS ? (
          <TouchableOpacity style={styles.botaoPrincipal} onPress={avancar} activeOpacity={0.8}>
            <Text style={styles.textoBotaoPrincipal}>
              {passo === 2 && !fotoUri ? 'Pular e Continuar →' : 'Continuar →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.botaoPrincipal, styles.botaoEnviar]}
            onPress={enviarReport}
            disabled={enviando}
            activeOpacity={0.8}
          >
            {enviando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.textoBotaoPrincipal}>🚨 Enviar Report</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COR_FUNDO,
  },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COR_CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7F6',
    elevation: 2,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COR_FUNDO,
  },
  textoBotaoVoltar: {
    fontSize: 30,
    color: COR_PRIMARIA,
    lineHeight: 35,
  },
  tituloCabecalho: {
    fontSize: 18,
    fontWeight: '700',
    color: COR_PRIMARIA,
    letterSpacing: 0.5,
  },

  // Indicador de progresso
  indicadorContainer: {
    backgroundColor: COR_CARD,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7F6',
  },
  barraProgressoFundo: {
    height: 4,
    backgroundColor: '#E8D5F5',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  barraProgressoPreenchida: {
    height: '100%',
    backgroundColor: COR_PRIMARIA,
    borderRadius: 2,
  },
  passosLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passoItem: {
    alignItems: 'center',
    flex: 1,
  },
  passoBolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8D5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  passoBolinhahAtiva: {
    backgroundColor: COR_PRIMARIA,
    elevation: 3,
  },
  passoBolinhaConcluida: {
    backgroundColor: '#4CAF50',
  },
  passoNumero: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9C6BAF',
  },
  passoNumerohAtivo: {
    color: '#FFFFFF',
  },
  passoLabel: {
    fontSize: 10,
    color: '#9C6BAF',
    fontWeight: '500',
  },
  passoLabelAtivo: {
    color: COR_PRIMARIA,
    fontWeight: '700',
  },

  // Conteúdo animado
  conteudoAnimado: {
    flex: 1,
  },
  conteudoPasso: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  tituloPasso: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  subtituloPasso: {
    fontSize: 14,
    color: '#7A6B8A',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Grid de categorias
  gridCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  cardCategoria: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COR_CARD,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#7B1FA2',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 8,
  },
  cardCategoriaSelecionado: {
    borderColor: COR_PRIMARIA,
    backgroundColor: '#F3E5F5',
    elevation: 5,
    shadowOpacity: 0.2,
  },
  iconeCategoria: {
    fontSize: 28,
    marginBottom: 6,
  },
  labelCategoria: {
    fontSize: 10,
    textAlign: 'center',
    color: '#5A4B6B',
    fontWeight: '600',
  },
  labelCategoriaSelecionado: {
    color: COR_PRIMARIA,
  },

  // Foto
  areafoto: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COR_CARD,
    borderWidth: 2,
    borderColor: '#E8D5F5',
    borderStyle: 'dashed',
    elevation: 2,
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  placeholderFoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconeUpload: {
    fontSize: 48,
  },
  textoUpload: {
    fontSize: 16,
    fontWeight: '700',
    color: COR_PRIMARIA,
  },
  subTextoUpload: {
    fontSize: 13,
    color: '#9C6BAF',
  },
  botaoTrocarFoto: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
  },
  textoBotaoTrocarFoto: {
    color: COR_PRIMARIA,
    fontWeight: '600',
    fontSize: 14,
  },

  // Endereço
  carregandoEndereco: {
    alignItems: 'center',
    marginTop: 40,
    gap: 16,
  },
  textoCarregando: {
    color: COR_PRIMARIA,
    fontSize: 15,
    fontWeight: '600',
  },
  campoEnderecoContainer: {
    flex: 1,
  },
  labelCampo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 10,
  },
  inputEndereco: {
    backgroundColor: COR_CARD,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#2D1B4E',
    borderWidth: 1.5,
    borderColor: '#E8D5F5',
    minHeight: 90,
    textAlignVertical: 'top',
    elevation: 1,
  },
  botaoRedetectar: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
  },
  textoBotaoRedetectar: {
    color: COR_PRIMARIA,
    fontWeight: '600',
    fontSize: 13,
  },

  // Resumo (passo 4)
  resumoContainer: {
    backgroundColor: COR_CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COR_PRIMARIA,
    elevation: 2,
  },
  resumoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COR_PRIMARIA,
    marginBottom: 10,
  },
  resumoItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  resumoLabel: {
    fontSize: 13,
    color: '#7A6B8A',
    fontWeight: '600',
    minWidth: 75,
  },
  resumoValor: {
    fontSize: 13,
    color: '#2D1B4E',
    fontWeight: '500',
    flex: 1,
  },
  inputDescricao: {
    backgroundColor: COR_CARD,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#2D1B4E',
    borderWidth: 1.5,
    borderColor: '#E8D5F5',
    minHeight: 130,
    textAlignVertical: 'top',
    elevation: 1,
  },
  contadorCaracteres: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9C6BAF',
    marginTop: 6,
  },

  // Rodapé
  rodape: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COR_CARD,
    borderTopWidth: 1,
    borderTopColor: '#EDE7F6',
  },
  botaoPrincipal: {
    backgroundColor: COR_PRIMARIA,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COR_PRIMARIA,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  botaoEnviar: {
    backgroundColor: '#C62828',
    shadowColor: '#C62828',
  },
  textoBotaoPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
