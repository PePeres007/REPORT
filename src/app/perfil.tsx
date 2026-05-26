import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, // Importação do componente Alert para gerenciar a confirmação
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { controladorPerfil } from '../controllers/controlador_perfil';

export default function Perfil() {
  const router = useRouter();
  const controlador = new controladorPerfil(router);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const dados = await controlador.carregarDadosCompletos();
      if (dados) {
        setNome(dados.nome);
        setEmail(dados.email);
        setFoto(dados.fotoUrl || null);
      }
      setCarregando(false);
    };
    carregar();
  }, []);

  const handleTrocarFoto = async () => {
    const uri = await controlador.alterarFoto();
    if (uri) setFoto(uri);
  };

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1e4e79" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.content}>
        {/* AVATAR */}
        <View style={styles.avatarContainer}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetra}>{nome ? nome.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBadge} onPress={handleTrocarFoto}>
            <Feather name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* DADOS DO USUÁRIO */}
        <View style={styles.form}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />

          <Text style={styles.label}>E-MAIL</Text>
          <TextInput style={styles.input} value={email} editable={false} />

          <TouchableOpacity 
            style={styles.btnSalvar} 
            onPress={() => controlador.salvarAlteracoes(nome, foto)}
          >
            <Text style={styles.btnTexto}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE AÇÕES INFERIORES */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/notificacoes' as any)}>
            <View style={styles.actionRow}>
              <Feather name="bell" size={20} color="#1e4e79" />
              <Text style={styles.actionText}>notificações</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/alterar_senha' as any)}>
            <View style={styles.actionRow}>
              <Feather name="lock" size={20} color="#1e4e79" />
              <Text style={styles.actionText}>segurança</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* BOTÃO APAGAR CONTA COM CONFIRMAÇÃO REAL */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              Alert.alert(
                "Apagar conta",
                "Tem certeza que deseja apagar a conta?",
                [
                  { 
                    text: "Não", 
                    style: "cancel" 
                  },
                  { 
                    text: "Sim", 
                    onPress: () => controlador.handleExcluirContaFinal(), 
                    style: "destructive" 
                  }
                ],
                { cancelable: true }
              );
            }}
          >
            <View style={styles.actionRow}>
              <Feather name="trash-2" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>apagar conta</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => controlador.voltar()}>
            <View style={styles.actionRow}>
              <Feather name="log-out" size={20} color="#1e4e79" />
              <Text style={styles.actionText}>sair</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { backgroundColor: '#1e4e79', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { alignItems: 'center', padding: 20 },
  avatarContainer: { marginTop: 20, marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#3A6EA5', justifyContent: 'center', alignItems: 'center' },
  avatarLetra: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#2F5D8C', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#F4F7FB' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#7A8FA6', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1A1A1A' },
  btnSalvar: { backgroundColor: '#1e4e79', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25, marginBottom: 30 },
  btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  actionsContainer: { width: '100%' },
  actionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 16, fontWeight: '500', color: '#1e4e79', marginLeft: 15 },
});