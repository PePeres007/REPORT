import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1e4e79" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => controlador.voltar()}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleTrocarFoto}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetra}>{nome[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Feather name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput 
            style={styles.input} 
            value={nome} 
            onChangeText={setNome}
            placeholder="Seu nome"
          />

          <Text style={styles.label}>E-MAIL (NÃO ALTERÁVEL)</Text>
          <TextInput 
            style={[styles.input, { opacity: 0.6 }]} 
            value={email} 
            editable={false}
          />

          <TouchableOpacity 
            style={styles.btnSalvar} 
            onPress={() => controlador.salvarAlteracoes(nome, foto)}
          >
            <Text style={styles.btnTexto}>Salvar Alterações</Text>
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
  label: { fontSize: 12, fontWeight: 'bold', color: '#7A8FA6', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, fontSize: 16, color: '#2C3E50', marginBottom: 20, elevation: 1 },
  btnSalvar: { backgroundColor: '#1e4e79', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});