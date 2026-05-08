import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { obterUsuario } from '../services/userStorage';

export default function Configuracoes() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

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
    <View style={styles.container}>
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
          <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
          <Text style={styles.email}>{usuario?.email || 'email@email.com'}</Text>
        </View>
      </View>

      {/* CONTA */}
      <Text style={styles.tituloSecao}>CONTA</Text>

      <View style={styles.cardOpcoes}>
        <Item 
          icon="person-outline" 
          texto="Editar Perfil" 
          onPress={() => router.push('/perfil' as any)} 
        />
        <Item 
          icon="lock-closed-outline" 
          texto="Alterar Senha" 
          onPress={() => router.push('/alterar_senha' as any)} 
        />
        <Item 
          icon="mail-outline" 
          texto="Notificações" 
          onPress={() => console.log('Notificações clicado')} 
        />
      </View>

      {/* ZONA DE PERIGO */}
      <Text style={styles.tituloSecao}>ZONA DE PERIGO</Text>
      <View style={styles.cardOpcoes}>
        <Item 
          icon="trash-outline" 
          texto="Apagar Conta" 
          perigo 
          onPress={() => alert('Em desenvolvimento')} 
        />
      </View>
    </View>
  );
}

// 🔹 COMPONENTE ITEM (AJUSTADO)
function Item({ icon, texto, onPress, perigo = false }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={perigo ? '#E74C3C' : '#2C3E50'} 
          style={{ marginRight: 10 }}
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
  header: { backgroundColor: '#1e4e79', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  headerTitulo: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  cardUsuario: { backgroundColor: '#3A6EA5', margin: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#5F89B5', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarTexto: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  nome: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#D6E4F0', fontSize: 13 },
  tituloSecao: { marginLeft: 20, marginTop: 10, marginBottom: 5, color: '#7A8FA6', fontWeight: 'bold', fontSize: 12 },
  cardOpcoes: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemTexto: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
});