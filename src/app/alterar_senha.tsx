import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { controladorAlterarSenha } from '../controllers/controlador_alterar_senha';

export default function AlterarSenha() {
  const router = useRouter();
  const controlador = new controladorAlterarSenha(router);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => controlador.voltar()}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>SENHA ATUAL</Text>
        <TextInput style={styles.input} secureTextEntry value={atual} onChangeText={setAtual} />

        <Text style={styles.label}>NOVA SENHA</Text>
        <TextInput style={styles.input} secureTextEntry value={nova} onChangeText={setNova} />

        <TouchableOpacity style={styles.btn} onPress={() => controlador.confirmarTroca(atual, nova)}>
          <Text style={styles.btnTexto}>Atualizar Senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { backgroundColor: '#1e4e79', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { padding: 30 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#7A8FA6', marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 1 },
  btn: { backgroundColor: '#1e4e79', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnTexto: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});