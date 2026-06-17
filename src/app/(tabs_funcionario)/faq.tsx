import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ControladorFAQ, FAQItem } from '../../controllers/controlador_faq';
import { auth, db } from '../../services/firebaseConfig';

export default function Faq() {
  const [perfilUsuario, setPerfilUsuario] = useState<string>('cidadao'); 
  const [perguntas, setPerguntas] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Estados do Modal
  const [modalVisivel, setModalVisivel] = useState<boolean>(false);
  const [idSelecionado, setIdSelecionado] = useState<string | null>(null);
  const [inputPergunta, setInputPergunta] = useState<string>('');
  const [inputResposta, setInputResposta] = useState<string>('');

  useEffect(() => {
    verificarPerfilEObterDados();
  }, []);

  const verificarPerfilEObterDados = async () => {
    setLoading(true);
    try {
      const usuarioAtual = auth.currentUser;
      if (usuarioAtual) {
        if (usuarioAtual.email?.endsWith('@prefeitura.gov.br')) {
          setPerfilUsuario('funcionario');
        } else {
          const docRef = doc(db, "usuarios", usuarioAtual.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const dadosUser = docSnap.data();
            if (dadosUser && dadosUser.tipo === 'funcionario') setPerfilUsuario('funcionario');
          }
        }
      }
      const dados = await ControladorFAQ.listarPerguntas();
      setPerguntas(dados);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as informações.");
    } finally {
      setLoading(false);
    }
  };

  const salvarFAQ = async () => {
    if (!inputPergunta.trim()) {
      Alert.alert("Aviso", "Por favor, escreva sua pergunta.");
      return;
    }

    // Se a prefeitura tentar salvar sem resposta, avisa
    if (perfilUsuario === 'funcionario' && !inputResposta.trim()) {
      Alert.alert("Aviso", "Por favor, insira a resposta oficial.");
      return;
    }

    try {
      if (perfilUsuario === 'cidadao') {
        // Cidadão envia como pendente
        await ControladorFAQ.enviarDuvidaCidadao(inputPergunta);
        Alert.alert("Sucesso", "Sua pergunta foi enviada para a prefeitura e logo será respondida aqui!");
      } else {
        // Prefeitura cria ou responde
        if (idSelecionado) {
          await ControladorFAQ.atualizarPergunta(idSelecionado, inputPergunta, inputResposta);
          Alert.alert("Sucesso", "Resposta publicada com sucesso.");
        } else {
          await ControladorFAQ.criarPergunta(inputPergunta, inputResposta);
          Alert.alert("Sucesso", "Novo comunicado adicionado.");
        }
      }
      
      fecharModal();
      const dadosAtualizados = await ControladorFAQ.listarPerguntas();
      setPerguntas(dadosAtualizados);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar a publicação.");
    }
  };

  const confirmarExclusao = (id: string) => {
    Alert.alert("Remover Pergunta", "Deseja excluir esta pergunta permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await ControladorFAQ.deletarPergunta(id);
            const dadosAtualizados = await ControladorFAQ.listarPerguntas();
            setPerguntas(dadosAtualizados);
          } catch (error) {
            Alert.alert("Erro", "Não foi possível deletar o registro.");
          }
        }
      }
    ]);
  };

  const abrirModalParaEdicao = (item: FAQItem) => {
    setIdSelecionado(item.id);
    setInputPergunta(item.pergunta);
    setInputResposta(item.resposta);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setIdSelecionado(null);
    setInputPergunta('');
    setInputResposta('');
    setModalVisivel(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Ouvidoria & Perguntas Frequentes</Text>
      
      {/* BOTÃO AGORA APARECE PARA TODOS (Muda apenas a cor e texto) */}
      <TouchableOpacity 
        style={[styles.btnAdicionar, { backgroundColor: perfilUsuario === 'funcionario' ? '#007AFF' : '#28A745' }]} 
        onPress={() => setModalVisivel(true)}
      >
        <Ionicons name={perfilUsuario === 'funcionario' ? "add-circle-outline" : "chatbubbles-outline"} size={20} color="#FFF" />
        <Text style={styles.btnAdicionarTexto}>
          {perfilUsuario === 'funcionario' ? " Publicar Comunicado" : " Fazer uma Pergunta"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={perguntas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <View style={styles.cardFAQ}>
              <TouchableOpacity style={styles.perguntaContainer} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perguntaTexto}>{item.pergunta}</Text>
                  
                  {/* Etiqueta de Status */}
                  <View style={[styles.badge, { backgroundColor: item.status === 'pendente' ? '#FFF3CD' : '#D4EDDA' }]}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: item.status === 'pendente' ? '#856404' : '#155724' }}>
                      {item.status === 'pendente' ? '⏳ Aguardando Resposta' : '✅ Respondida'}
                    </Text>
                  </View>
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#495057" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.respostaContainer}>
                  {item.status === 'pendente' ? (
                     <Text style={[styles.respostaTexto, { fontStyle: 'italic', color: '#6C757D' }]}>
                       A prefeitura ainda está analisando esta dúvida...
                     </Text>
                  ) : (
                     <Text style={styles.respostaTexto}>{item.resposta}</Text>
                  )}
                  
                  {perfilUsuario === 'funcionario' && (
                    <View style={styles.acoesContainer}>
                      <TouchableOpacity style={styles.btnEditar} onPress={() => abrirModalParaEdicao(item)}>
                        <Ionicons name={item.status === 'pendente' ? "chatbox-ellipses-outline" : "pencil-outline"} size={14} color="#007AFF" />
                        <Text style={styles.btnEditarTexto}>{item.status === 'pendente' ? " Responder" : " Editar"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnExcluir} onPress={() => confirmarExclusao(item.id)}>
                        <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                        <Text style={styles.btnExcluirTexto}> Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.listaVazia}>Nenhuma dúvida publicada ainda.</Text>}
      />

      <Modal visible={modalVisivel} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {perfilUsuario === 'cidadao' ? "Envie sua dúvida" : (idSelecionado ? "Responder / Editar" : "Novo Comunicado Oficial")}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder={perfilUsuario === 'cidadao' ? "Ex: Como solicito a poda de uma árvore?" : "Escreva a pergunta..."}
              placeholderTextColor="#94A3B8"
              value={inputPergunta}
              onChangeText={setInputPergunta}
              multiline
              editable={perfilUsuario === 'cidadao' || !idSelecionado} // Cidadão escreve, mas prefeitura não muda a pergunta do cidadão (só responde)
            />
            
            {/* O CIDADÃO NÃO VÊ O CAMPO DE RESPOSTA! */}
            {perfilUsuario === 'funcionario' && (
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Escreva a resposta pública oficial..."
                value={inputResposta}
                onChangeText={setInputResposta}
                multiline
              />
            )}

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.btnCancelarModal} onPress={fecharModal}>
                <Text style={styles.txtBotaoVoltar}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvarModal} onPress={salvarFAQ}>
                <Text style={styles.txtBotaoSalvar}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529', marginBottom: 20, textAlign: 'center' },
  btnAdicionar: { flexDirection: 'row', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnAdicionarTexto: { color: '#FFF', fontWeight: 'bold' },
  cardFAQ: { backgroundColor: '#FFF', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E9ECEF', overflow: 'hidden' },
  perguntaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  perguntaTexto: { fontSize: 15, fontWeight: '600', color: '#343A40', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  respostaContainer: { padding: 16, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  respostaTexto: { fontSize: 14, color: '#495057', lineHeight: 20 },
  acoesContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: '#DEE2E6', paddingTop: 8 },
  btnEditar: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  btnEditarTexto: { color: '#007AFF', fontSize: 13 },
  btnExcluir: { flexDirection: 'row', alignItems: 'center' },
  btnExcluirTexto: { color: '#FF3B30', fontSize: 13 },
  listaVazia: { textAlign: 'center', color: '#6C757D', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#CED4DA', borderRadius: 6, padding: 10, marginBottom: 12, textAlignVertical: 'top' },
  modalBotoes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancelarModal: { padding: 12, flex: 0.45, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: '#6C757D' },
  txtBotaoVoltar: { color: '#6C757D' },
  btnSalvarModal: { padding: 12, flex: 0.45, backgroundColor: '#007AFF', alignItems: 'center', borderRadius: 6 },
  txtBotaoSalvar: { color: '#FFF', fontWeight: 'bold' }
});