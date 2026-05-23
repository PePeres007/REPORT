import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { controladorListaFuncionarios } from '../controllers/controlador_lista_funcionarios';

export default function ListaGestao() {
  const router = useRouter();
  const controlador = new controladorListaFuncionarios(router);
  
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [resumo, setResumo] = useState({ total: 0, alta: 0, media: 0, baixa: 0 });
  const [filtro, setFiltro] = useState('Todas'); // Para as abas do protótipo

  useEffect(() => {
    const carregarDados = async () => {
      // No mundo real, os dados virão do Firebase usando a função abaixo
      // const dados = await controlador.carregarDenuncias();
      
      // Dados fictícios simulando o Firebase para você visualizar a tela igual ao protótipo
      const dadosMock = [
        { id: '1', categoria: 'Vias Públicas', descricao: 'Cratera na via principal', endereco: 'Av. Boa Viagem, 123', urgencia: 'Alta', tempo: 'Há 10 min' },
        { id: '2', categoria: 'Iluminação', descricao: 'Poste com risco de queda', endereco: 'Rua do Sol, 45', urgencia: 'Alta', tempo: 'Há 45 min' },
        { id: '3', categoria: 'Saneamento', descricao: 'Vazamento de esgoto', endereco: 'Rua da Aurora, 789', urgencia: 'Média', tempo: 'Há 2 horas' },
        { id: '4', categoria: 'Vias Públicas', descricao: 'Buraco pequeno', endereco: 'Av. Norte, 1011', urgencia: 'Baixa', tempo: 'Há 5 horas' },
      ];

      setDenuncias(dadosMock);
      setResumo(controlador.calcularResumo(dadosMock));
    };

    carregarDados();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    let corUrgencia = '#10B981'; // Verde (Baixa)
    if (item.urgencia === 'Alta') corUrgencia = '#EF4444'; // Vermelho
    else if (item.urgencia === 'Média') corUrgencia = '#F59E0B'; // Laranja

    return (
      <TouchableOpacity style={styles.card} onPress={() => controlador.verDetalhes(item.id)}>
        <View style={styles.cardHeader}>
          <View style={[styles.badgeUrgencia, { backgroundColor: corUrgencia + '15' }]}>
            <View style={[styles.pontoUrgencia, { backgroundColor: corUrgencia }]} />
            <Text style={[styles.textoBadge, { color: corUrgencia }]}>{item.urgencia} Prioridade</Text>
          </View>
          <Text style={styles.tempoTexto}>{item.tempo}</Text>
        </View>

        <Text style={styles.cardTitulo}>{item.descricao}</Text>
        
        <View style={styles.cardLocal}>
          <Feather name="map-pin" size={14} color="#64748B" />
          <Text style={styles.enderecoTexto}>{item.endereco}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Zeladoria Urbana</Text>
          <Text style={styles.subtitulo}>Painel de Gestão</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="user" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PAINEL DE TOTAIS */}
      <View style={styles.painelTotais}>
        <View style={styles.cardTotal}>
          <Text style={styles.labelTotal}>Novas Denúncias</Text>
          <View style={styles.rowValor}>
            <Text style={styles.valorTotal}>{resumo.total}</Text>
            <Feather name="trending-up" size={20} color="#EF4444" />
          </View>
        </View>

        <View style={styles.rowSecundarios}>
          <View style={[styles.cardSecundario, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
            <Text style={styles.labelSecundario}>Alta</Text>
            <Text style={styles.valorSecundario}>{resumo.alta}</Text>
          </View>
          <View style={[styles.cardSecundario, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
            <Text style={styles.labelSecundario}>Média</Text>
            <Text style={styles.valorSecundario}>{resumo.media}</Text>
          </View>
          <View style={[styles.cardSecundario, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
            <Text style={styles.labelSecundario}>Baixa</Text>
            <Text style={styles.valorSecundario}>{resumo.baixa}</Text>
          </View>
        </View>
      </View>

      {/* ABAS DE FILTRO */}
      <View style={styles.filtrosContainer}>
        {['Todas', 'Vias Públicas', 'Iluminação', 'Saneamento'].map((aba) => (
          <TouchableOpacity 
            key={aba} 
            style={[styles.abaBtn, filtro === aba && styles.abaAtiva]}
            onPress={() => setFiltro(aba)}
          >
            <Text style={[styles.abaTexto, filtro === aba && styles.abaTextoAtivo]}>{aba}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA DE DENÚNCIAS */}
      <FlatList
        data={filtro === 'Todas' ? denuncias : denuncias.filter(d => d.categoria === filtro)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listaContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  saudacao: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  subtitulo: { fontSize: 14, color: '#64748B', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  
  painelTotais: { paddingHorizontal: 20, marginBottom: 20 },
  cardTotal: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 15 },
  labelTotal: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  rowValor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  valorTotal: { fontSize: 36, fontWeight: 'bold', color: '#1E293B' },
  
  rowSecundarios: { flexDirection: 'row', gap: 10 },
  cardSecundario: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  labelSecundario: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  valorSecundario: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 5 },

  filtrosContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  abaBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10 },
  abaAtiva: { backgroundColor: '#1E293B' },
  abaTexto: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  abaTextoAtivo: { color: '#FFF' },

  listaContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeUrgencia: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pontoUrgencia: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  textoBadge: { fontSize: 12, fontWeight: '700' },
  tempoTexto: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  cardLocal: { flexDirection: 'row', alignItems: 'center' },
  enderecoTexto: { fontSize: 13, color: '#64748B', marginLeft: 6 },
});