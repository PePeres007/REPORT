import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { ControladorNotificacao } from '../controllers/controlador_notificacao';
import { obterUsuario } from '../services/userStorage';

interface Notificacao {
  id: string;
  tipo: 'RESOLVIDO' | 'CONTINUA';
  titulo: string;
  mensagem: string;
  dataEnvio: string;
  categoriaDenuncia: string;
}

export default function Notificacoes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    const carregarNotificacoes = async () => {
      try {
        const usuario = await obterUsuario();
        
        if (usuario?.id) {
          const dadosReais = await ControladorNotificacao.buscarNotificacoesDoUsuario(usuario.id);
          setNotificacoes(dadosReais);
        }
      } catch (error) {
        console.error("Erro ao carregar notificações na View:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarNotificacoes();
  }, []);

  const renderItem = ({ item }: { item: Notificacao }) => {
    const isResolvido = item.tipo === 'RESOLVIDO';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isResolvido ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={isResolvido ? "#2ECC71" : "#E67E22"} 
            />
            <Text style={styles.categoria}>{item.categoriaDenuncia}</Text>
          </View>
          <Text style={styles.data}>{item.dataEnvio}</Text>
        </View>

        <Text style={[styles.titulo, { color: isResolvido ? "#27AE60" : "#D35400" }]}>
          {item.titulo}
        </Text>
        
        <Text style={styles.mensagem}>{item.mensagem}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Central de Notificações</Text>
      </View>

      {/* CONTEÚDO */}
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
    alignItems: 'center' 
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
    elevation: 2
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8
  },
  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  categoria: { marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: '#7A8FA6', textTransform: 'uppercase' },
  data: { fontSize: 11, color: '#A0AEC0' },
  titulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  mensagem: { fontSize: 14, color: '#4A5568', lineHeight: 20 }
});
