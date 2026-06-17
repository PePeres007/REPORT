import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { controladorPerfil } from '../../controllers/controlador_perfil';
import { auth } from '../../services/firebaseConfig';
import { limparSessao, obterUsuario } from '../../services/userStorage';

export default function Configuracoes() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  // Controlador usado apenas para apagar conta
  const controlador = new controladorPerfil(router);

  useEffect(() => {
    const carregarUsuario = async () => {
      const dados = await obterUsuario();
      setUsuario(dados);
    };
    carregarUsuario();
  }, []);

  const iniciais = usuario?.nome
  ? usuario.nome.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  : '';

  // Logout real — chama diretamente signOut + limparSessao + navegação
  const handleSair = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await limparSessao();
              router.replace('/login' as any);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível encerrar a sessão. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* CARD USUÁRIO */}
      <View style={styles.cardUsuario}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome} numberOfLines={1}>{usuario?.nome || 'Carregando...'}</Text>
          <Text style={styles.email} numberOfLines={1}>{usuario?.email || ''}</Text>
        </View>
        <TouchableOpacity style={styles.btnEditarPerfil} onPress={() => router.push('/perfil' as any)}>
          <Ionicons name="pencil-outline" size={16} color="#3A6EA5" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSecao}>Conta</Text>
      <BotaoAcao icone="person-outline" texto="Editar Perfil" onPress={() => router.push('/perfil' as any)} />
      <BotaoAcao icone="lock-closed-outline" texto="Alterar Senha" onPress={() => router.push('/alterar_senha' as any)} />
      <BotaoAcao icone="notifications-outline" texto="Central de Notificações" onPress={() => router.push('/notificacoes' as any)} />
      <BotaoAcao icone="options-outline" texto="Preferências de Alertas" onPress={() => router.push('/atualizacoes' as any)} />

      <Text style={styles.tituloSecao}>Geral</Text>
      <BotaoAcao icone="help-circle-outline" texto="Ajuda e Suporte" onPress={() => Alert.alert('Suporte', 'Em breve')} />
      <BotaoAcao icone="document-text-outline" texto="Termos de Serviço" onPress={() => Alert.alert('Termos', 'Em breve')} />

      <Text style={styles.tituloSecao}>Ações</Text>
      <BotaoAcao
        icone="trash-outline"
        texto="Apagar Conta"
        perigo
        onPress={() => {
          Alert.alert(
            'Apagar conta',
            'Tem certeza que deseja apagar a conta? Esta ação é irreversível.',
            [
              { text: 'Não', style: 'cancel' },
              { text: 'Sim', onPress: () => controlador.handleExcluirContaFinal(), style: 'destructive' }
            ],
            { cancelable: true }
          );
        }}
      />

      {/* BOTÃO SAIR — destacado, fora da lista, visível no iPhone mini */}
      <TouchableOpacity style={styles.btnSair} onPress={handleSair} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={22} color="#FFF" />
        <Text style={styles.btnSairTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function BotaoAcao({ icone, texto, onPress, perigo = false }: {
  icone: any;
  texto: string;
  onPress: () => void;
  perigo?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.itemMenu} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icone} size={22} color={perigo ? '#E74C3C' : '#3A6EA5'} style={{ marginRight: 15 }} />
        <Text style={[styles.itemTexto, perigo && { color: '#E74C3C' }]}>{texto}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },

  cardUsuario: {
    backgroundColor: '#3A6EA5',
    margin: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#5F89B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  nome: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#D6E4F0', fontSize: 12, marginTop: 2 },
  btnEditarPerfil: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloSecao: {
    marginLeft: 20,
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#7A8FA6',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemMenu: {
    backgroundColor: '#FFF',
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  itemTexto: { fontSize: 15, fontWeight: '500', color: '#333' },

  // Botão sair: vermelho sólido, fora da lista, bem visível no iPhone mini
  btnSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 17,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnSairTexto: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});