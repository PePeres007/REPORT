// src/screens/Ouvidoria.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { ControladorOuvidoria, SugestaoItem } from '../controllers/controlador_ouvidoria';

export default function Ouvidoria() {
  const [perfilUsuario, setPerfilUsuario] = useState<string>('cidadao'); 
  const [nomeUsuario, setNomeUsuario] = useState<string>('');
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados do Modal de Criação/Edição
  const [modalVisivel, setModalVisivel] = useState<boolean>(false);
  const [idSelecionado, setIdSelecionado] = useState<string | null>(null);
  const [inputTexto, setInputTexto] = useState<string>('');

  useEffect(() => {
    verificarPerfilECarregarDados();
  }, []);

  const verificarPerfilECarregarDados = async () => {
    setLoading(true);
    try {
      const usuarioAtual = auth.currentUser;
      if (usuarioAtual) {
        const docRef = doc(db, "usuarios", usuarioAtual.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const dadosUser = docSnap.data();
          const tipo = dadosUser.tipo || 'cidadao';
          setPerfilUsuario(tipo);
          setNomeUsuario(dadosUser.nome || 'Cidadão');

          // Se for prefeitura, traz tudo. Se for cidadão, traz apenas as dele.
          if (tipo === 'prefeitura') {
            const todas = await ControladorOuvidoria.listarTodasSugestoes();
            setSugestoes(todas);
          } else {
            const minhas = await ControladorOuvidoria.listarMinhasSugestoes(usuarioAtual.uid);
            setSugestoes(minhas);
          }
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o canal de ouvidoria.");
    } finally {
      setLoading(false);
    }
  };

  const atualizarLista = async () => {
    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) return;

    if (perfilUsuario === 'prefeitura') {
      const todas = await ControladorOuvidoria.listarTodasSugestoes();
      setSugestoes(todas);
    } else {
      const minhas = await ControladorOuvidoria.listarMinhasSugestoes(usuarioAtual.uid);
      setSugestoes(minhas);
    }
  };

  const salvarSugestao = async () => {
    if (!inputTexto.trim()) {
      Alert.alert("Aviso", "Por favor, descreva a sua sugestão.");
      return;
    }

    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) return;

    try {
      if (idSelecionado) {
        await ControladorOuvidoria.atualizarSugestao(idSelecionado, inputTexto);
        Alert.alert("Sucesso", "Sugestão atualizada com sucesso.");
      } else {
        await ControladorOuvidoria.criarSugestao(usuarioAtual.uid, nomeUsuario, inputTexto);
        Alert.alert("Sucesso", "Sua sugestão foi enviada para análise da Prefeitura!");
      }
      fecharModal();
      await atualizarLista();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar a sugestão.");
    }
  };

  const confirmarExclusao = (id: string) => {
    Alert.alert(
      "Excluir Sugestão",
      "Tem certeza que deseja apagar essa sugestão antes da leitura da prefeitura?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await ControladorOuvidoria.deletarSugestao(id);
              await atualizarLista();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover.");
            }
          }
        }
      ]
    );
  };

  const abrirModalParaEdicao = (item: SugestaoItem) => {
    setIdSelecionado(item.id);
    setInputTexto(item.texto);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setIdSelecionado(null);
    setInputTexto('');
    setModalVisivel(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Ouvidoria & Ideias Urbanas</Text>
      <Text style={styles.subtitle}>
        {perfilUsuario === 'prefeitura' 
          ? "Sugestões enviadas pelos cidadãos de Recife:" 
          : "Proponha melhorias, ideias de infraestrutura ou ciclofaixas:"}
      </Text>
      
      {perfilUsuario === 'cidadao' && (
        <TouchableOpacity style={styles.btnAdicionar} onPress={() => setModalVisivel(true)}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color="#FFF" />
          <Text style={styles.btnAdicionarTexto}> Nova Sugestão de Melhoria</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sugestoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardSugestao}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#6C757D" />
              <Text style={styles.autorTexto}>
                {perfilUsuario === 'prefeitura' ? item.nomeUsuario : "Sua Sugestão"}
              </Text>
            </View>
            
            <Text style={styles.corpoTexto}>{item.texto}</Text>

            {perfilUsuario === 'cidadao' && (
              <View style={styles.acoesContainer}>
                <TouchableOpacity style={styles.btnEditar} onPress={() => abrirModalParaEdicao(item)}>
                  <Ionicons name="create-outline" size={14} color="#007AFF" />
                  <Text style={styles.btnEditarTexto}> Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnExcluir} onPress={() => confirmarExclusao(item.id)}>
                  <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                  <Text style={styles.btnExcluirTexto}> Apagar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>Nenhuma sugestão registrada até o momento.</Text>
        }
      />

      {/* Modal de Input de Texto do Cidadão */}
      <Modal visible={modalVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {idSelecionado ? "Editar Sugestão" : "O que pode melhorar na cidade?"}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ex: Sugiro a implementação de uma ciclofaixa na Avenida Caxangá, conectando as rotas já existentes..."
              value={inputTexto}
              onChangeText={setInputTexto}
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.btnCancelarModal} onPress={fecharModal}>
                <Text style={styles.txtBotaoVoltar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvarModal} onPress={salvarSugestao}>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6C757D', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  btnAdicionar: { flexDirection: 'row', backgroundColor: '#28A745', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnAdicionarTexto: { color: '#FFF', fontWeight: 'bold' },
  cardSugestao: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E9ECEF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#EDF2F7', paddingBottom: 6 },
  autorTexto: { fontSize: 12, fontWeight: 'bold', color: '#495057', marginLeft: 6 },
  corpoTexto: { fontSize: 14, color: '#2D3748', lineHeight: 20 },
  acoesContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingTop: 8 },
  btnEditar: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  btnEditarTexto: { color: '#007AFF', fontSize: 13 },
  btnExcluir: { flexDirection: 'row', alignItems: 'center' },
  btnExcluirTexto: { color: '#FF3B30', fontSize: 13 },
  listaVazia: { textAlign: 'center', color: '#6C757D', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14, color: '#212529' },
  input: { borderWidth: 1, borderColor: '#CED4DA', borderRadius: 6, padding: 12, marginBottom: 16, height: 120, textAlignVertical: 'top', fontSize: 14 },
  modalBotoes: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelarModal: { padding: 12, flex: 0.45, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: '#6C757D' },
  txtBotaoVoltar: { color: '#6C757D' },
  btnSalvarModal: { padding: 12, flex: 0.45, backgroundColor: '#28A745', alignItems: 'center', borderRadius: 6 },
  txtBotaoSalvar: { color: '#FFF', fontWeight: 'bold' }
});
