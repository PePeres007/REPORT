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
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIAS, controladorReport } from '../controllers/controlador_report';
import { db } from '../services/firebaseConfig';

const COR_PRIMARIA = '#7B1FA2';
const COR_FUNDO = '#F5F0FA';
const COR_CARD = '#FFFFFF';

export default function ReportDetailsScreen() {
  const router = useRouter();
    const params = useLocalSearchParams();
    const reportId = Array.isArray(params.id)
      ? params.id[0]
      : params.id;  const controlador = new controladorReport(router);
  const auth = getAuth();
  
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  // Escuta os dados do Firebase em tempo real usando o ID do documento
    useEffect(() => {
        // Se não houver ID, para de carregar e avisa
        if (!reportId) {
          console.error("ID da denúncia não fornecido");
          setCarregando(false);
          return;
        }

        const docRef = doc(db, 'denuncias', reportId);

        const unsub = onSnapshot(docRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setDados({ id: docSnap.id, ...docSnap.data() });
            } else {
              Alert.alert("Erro", "Denúncia não encontrada.");
              router.back();
            }
            setCarregando(false); // Para o loading independente de existir ou não
          }, 
          (error) => {
            console.error("Erro no onSnapshot:", error);
            setCarregando(false);
          }
        );

        return () => unsub();
      }, [reportId]);

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={COR_PRIMARIA} />
      </View>
    );
  }

  const catInfo = CATEGORIAS.find((c) => c.id === dados?.categoria);
  const userId = auth.currentUser?.uid || 'anonimo';

  const getUrgenciaCor = (nivel: string) => {
    if (nivel === 'Leve') return '#4CAF50';
    if (nivel === 'Urgente') return '#F44336';
    return '#FFB300';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
          <Ionicons name="chevron-back" size={28} color={COR_PRIMARIA} />
        </TouchableOpacity>
        <Text style={styles.tituloCabecalho}>Detalhes da Ocorrência</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Imagem da Ocorrência - O segredo da foto carregar é o height fixo e a key */}
        <View style={styles.containerImagem}>
          {dados?.fotoUrl ? (
            <Image 
              source={{ uri: dados.fotoUrl }} 
                  style={styles.foto} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={styles.semFoto}>
                  <Ionicons name="image-outline" size={50} color="#CCC" />
                  <Text style={styles.textoSemFoto}>Sem foto disponível</Text>
                </View>          
            )}
        </View>

        {/* Card de Informações */}
        <View style={styles.cardInfo}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeCategoria}>
              <Text style={styles.iconeCat}>{catInfo?.icone || '📍'}</Text>
              <Text style={styles.labelCat}>{catInfo?.label || 'Outros'}</Text>
            </View>
            <View style={[styles.badgeUrgencia, { borderColor: getUrgenciaCor(dados?.urgencia) }]}>
              <Text style={[styles.textoUrgencia, { color: getUrgenciaCor(dados?.urgencia) }]}>
                ● {dados?.urgencia || 'Médio'}
              </Text>
            </View>
          </View>

          <Text style={styles.labelSecao}>📍 Endereço</Text>
          <Text style={styles.valorEndereco}>{dados?.endereco}</Text>

          <View style={styles.divisor} />

          <Text style={styles.labelSecao}>📝 Descrição</Text>
          <Text style={styles.valorDescricao}>{dados?.descricao}</Text>
        </View>

        {/* Botões de Interação e Contadores */}
        <View style={styles.containerAcoes}>
          <TouchableOpacity 
            style={[styles.botaoAcao, styles.botaoApoiar]} 
            onPress={() => controlador.apoiarDenuncia(reportId, userId)}
          >
            <Ionicons name="megaphone-outline" size={20} color="#FFF" />
            <Text style={styles.textoBotao}>Apoiar ({dados?.apoiadores?.length || 0})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.botaoAcao, styles.botaoResolvido]} 
            onPress={() => controlador.resolverDenuncia(reportId, userId)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.textoBotao}>Resolvido ({dados?.resolvidos?.length || 0})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COR_FUNDO },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COR_CARD,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  botaoVoltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: COR_FUNDO },
  tituloCabecalho: { fontSize: 18, fontWeight: '700', color: COR_PRIMARIA },
  scrollContent: { paddingBottom: 40 },
  containerImagem: { width: '100%', height: 280, backgroundColor: '#E1E1E1', marginBottom: 0 },
  foto: { width: '100%', height: '100%' },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' },
  textoSemFoto: { color: '#999', marginTop: 8, fontWeight: '600' },
  cardInfo: { 
    backgroundColor: COR_CARD, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -30, 
    padding: 24,
    minHeight: 300 
  },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  badgeCategoria: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E5F5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  iconeCat: { fontSize: 20, marginRight: 8 },
  labelCat: { fontWeight: '700', color: COR_PRIMARIA, fontSize: 15 },
  badgeUrgencia: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  textoUrgencia: { fontSize: 13, fontWeight: '800' },
  labelSecao: { fontSize: 13, fontWeight: '700', color: '#9C6BAF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  valorEndereco: { fontSize: 16, color: '#2D1B4E', marginBottom: 20, lineHeight: 22 },
  divisor: { height: 1, backgroundColor: '#F0EAF5', marginVertical: 10, marginBottom: 20 },
  valorDescricao: { fontSize: 16, color: '#4A3B63', lineHeight: 26 },
  containerAcoes: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  botaoAcao: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  botaoApoiar: { backgroundColor: COR_PRIMARIA },
  botaoResolvido: { backgroundColor: '#4CAF50' },
  textoBotao: { color: '#FFF', fontWeight: '800', fontSize: 14, marginLeft: 8 },
}); 