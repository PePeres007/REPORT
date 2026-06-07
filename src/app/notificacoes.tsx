import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ControladorNotificacao, Notificacao } from '../controllers/controlador_notificacao';
import { obterUsuario } from '../services/userStorage';
import { getAuth } from 'firebase/auth';

export default function Notificacoes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let ativo = true;

    const iniciar = async () => {
      try {
        const auth = getAuth();
        const usuarioId = auth.currentUser?.uid;
      
        if (!usuarioId) {
          if (ativo) setLoading(false);
          return;
        }

        const listaInicial = await ControladorNotificacao.buscarNotificacoesDoUsuario(usuarioId);
        if (ativo) {
          setNotificacoes(listaInicial);
          setLoading(false);
        }

        unsubscribe = ControladorNotificacao.escutarNotificacoesDoUsuario(
          usuarioId,
          (lista) => {
            if (!ativo) return;
            setNotificacoes(lista);
            setLoading(false);
          },
          () => {
            if (ativo) setLoading(false);
          }
        );
      } catch (error) {
        console.error('Erro ao carregar notificações na View:', error);
        if (ativo) setLoading(false);
      }
    };

    iniciar();

    return () => {
      ativo = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const marcarLida = async (item: Notificacao) => {
    if (item.lida) return;
    try {
      await ControladorNotificacao.marcarComoLida(item.id);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const obterIconeTipo = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'resolvida':
        return { nome: 'checkmark-circle', cor: '#2ECC71' };
      case 'interacao':
        return { nome: 'chatbubble-ellipses', cor: '#3498DB' };
      case 'avaliacao':
      default:
        return { nome: 'thumbs-up', cor: '#E67E22' };
    }
  };

  const renderItem = ({ item }: { item: Notificacao }) => {
    const isLida = !!item.lida;
    const icone = obterIconeTipo(item.tipo);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => marcarLida(item)}
        style={[styles.card, !isLida && styles.cardNaoLida]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={icone.nome as any} size={24} color={icone.cor} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.categoria}>{item.categoriaDenuncia}</Text>
              <Text style={styles.tipoTexto}>
                {item.tipo === 'resolvida'
                  ? 'Denúncia resolvida'
                  : item.tipo === 'interacao'
                  ? 'Nova atualização'
                  : 'Novo apoio'}
              </Text>
            </View>
          </View>

          <View style={styles.direitaHeader}>
            {!isLida && <View style={styles.pontoNaoLida} />}
            <Text style={styles.data}>{item.dataEnvio}</Text>
          </View>
        </View>

        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.mensagem}>{item.mensagem}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Central de Notificações</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e4e79" />
        </View>
      ) : notificacoes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="mail-open-outline" size={48} color="#999" />
          <Text style={styles.vazioTexto}>Você não possui notificações no momento.</Text>
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#1e4e79',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitulo: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  vazioTexto: { color: '#7A8FA6', marginTop: 10, textAlign: 'center', fontSize: 15 },
  lista: { padding: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  cardNaoLida: {
    borderColor: '#CDE5FF',
    backgroundColor: '#F9FCFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoria: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7A8FA6',
    textTransform: 'uppercase',
  },
  tipoTexto: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  direitaHeader: { alignItems: 'flex-end', marginLeft: 10 },
  data: { fontSize: 11, color: '#A0AEC0' },
  pontoNaoLida: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e4e79',
    marginBottom: 6,
  },
  titulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#1F2937' },
  mensagem: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
});
