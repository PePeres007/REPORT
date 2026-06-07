import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { controladorPerfil } from '../../controllers/controlador_perfil';
import { obterUsuario } from '../../services/userStorage';

export default function Configuracoes() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  
  // Instanciamos o controlador para poder usar a função de apagar conta
  const controlador = new controladorPerfil(router);

  useEffect(() => {
    const carregarUsuario = async () => {
      const dados = await obterUsuario();
      setUsuario(dados);
    };
    carregarUsuario();
  }, []);

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Configurações</Text>
      </View>

      {/* CARD USUÁRIO */}
      <View style={styles.cardUsuario}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais || '?'}</Text>
        </View>
        <View>
          <Text style={styles.nome}>{usuario?.nome || 'Carregando...'}</Text>
          <Text style={styles.email}>{usuario?.email || ''}</Text>
        </View>
      </View>

      <Text style={styles.tituloSecao}>Conta</Text>
      
      <BotaoAcao icone="person-outline" texto="Editar Perfil" onPress={() => router.push('/perfil')} />
      <BotaoAcao icone="lock-closed-outline" texto="Alterar Senha" onPress={() => router.push('/alterar_senha' as any)} />
      <BotaoAcao icone="notifications-outline" texto="Central de Notificações" onPress={() => router.push('/notificacoes' as any)} />
      
      {/* --- NOVO BOTÃO DE ATUALIZAÇÕES / PREFERÊNCIAS DE ALERTA --- */}
      <BotaoAcao 
        icone="options-outline" 
        texto="Preferências de Alertas" 
        onPress={() => router.push('/atualizacoes' as any)} 
      />

      <Text style={styles.tituloSecao}>Geral</Text>
      <BotaoAcao icone="help-circle-outline" texto="Ajuda e Suporte" onPress={() => Alert.alert("Suporte", "Em breve")} />
      <BotaoAcao icone="document-text-outline" texto="Termos de Serviço" onPress={() => Alert.alert("Termos", "Em breve")} />

      <Text style={styles.tituloSecao}>Ações</Text>
      
      <BotaoAcao 
        icone="trash-outline" 
        texto="Apagar Conta" 
        perigo 
        onPress={() => {
          Alert.alert(
            "Apagar conta",
            "Tem certeza que deseja apagar a conta?",
            [
              { text: "Não", style: "cancel" },
              { 
                text: "Sim", 
                onPress: () => controlador.handleExcluirContaFinal(), 
                style: "destructive" 
              }
            ],
            { cancelable: true }
          );
        }} 
      />

      <BotaoAcao icone="log-out-outline" texto="Sair" perigo onPress={() => Alert.alert("Sair", "Função de sair")} />
    </ScrollView>
  );
}

function BotaoAcao({ icone, texto, onPress, perigo = false }: { icone: any, texto: string, onPress: () => void, perigo?: boolean }) {
  return (
    <TouchableOpacity style={styles.itemMenu} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons 
          name={icone} 
          size={22} 
          color={perigo ? '#E74C3C' : '#3A6EA5'} 
          style={{ marginRight: 15 }}
        />
        <Text style={[styles.itemTexto, perigo && { color: '#E74C3C' }]}>
          {texto}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  contentContainer: { paddingBottom: 40 },
  header: { backgroundColor: '#1e4e79', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  headerTitulo: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  cardUsuario: { backgroundColor: '#3A6EA5', margin: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#5F89B5', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarTexto: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  nome: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#D6E4F0', fontSize: 13 },
  tituloSecao: { marginLeft: 20, marginTop: 10, marginBottom: 5, fontSize: 14, fontWeight: 'bold', color: '#7A8FA6' },
  itemMenu: { backgroundColor: '#FFF', padding: 18, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  itemTexto: { fontSize: 16, fontWeight: '500', color: '#333' },
});