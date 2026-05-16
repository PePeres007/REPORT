import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { controladorCadastro } from '../controllers/controlador_cadastro';

export default function CadastroFuncionario() {
  const router = useRouter();
  const controlador = new controladorCadastro(router);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [secretaria, setSecretaria] = useState('');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => controlador.voltar()}>
          <Feather name="arrow-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Servidor</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.info}>Cadastre um novo funcionário da prefeitura para acesso ao painel de gestão.</Text>
        
        <Text style={styles.label}>Nome do Servidor</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome Completo" />

        <Text style={styles.label}>E-mail Institucional</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="exemplo@prefeitura.gov.br" autoCapitalize="none" />

        <Text style={styles.label}>Secretaria / Órgão</Text>
        <TextInput style={styles.input} value={secretaria} onChangeText={setSecretaria} placeholder="Ex: Emlurb, Saúde..." />

        <Text style={styles.label}>Senha Provisória</Text>
        <TextInput style={styles.input} secureTextEntry value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" />

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            // Chamando a nova rotina especializada para servidores públicos
            controlador.realizarCadastroFuncionario(nome, email, senha, secretaria);
          }}
        >
          <Text style={styles.buttonText}>Cadastrar Servidor</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  form: { padding: 30 },
  info: { color: '#64748B', marginBottom: 30, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  button: { backgroundColor: '#1E293B', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' }
});