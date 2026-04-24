import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Imports do Firebase
import { controladorCadastro } from '../controllers/controlador_cadastro';

export default function Cadastro() {
  const router = useRouter();
  const controlador = new controladorCadastro(router);

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // --- EVENTOS DE INTERFACE ---
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError(controlador.validarFormatoEmail(text));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError(controlador.validarSenha(text));
    if (confirmPassword.length > 0) {
      setConfirmPasswordError(controlador.validarConfirmacaoSenha(text, confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setConfirmPasswordError(controlador.validarConfirmacaoSenha(password, text));
  };

  const handleDateChange = (text: string) => {
    const dataFormatada = controlador.aplicarMascaraData(text);
    setDataNascimento(dataFormatada);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => controlador.voltar()}>
          <Feather name="arrow-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Conta</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Boas vindas ao REPORT</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" value={nome} onChangeText={setNome} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Data de Nascimento</Text>
          <TextInput style={styles.input} placeholder="DD/MM/AAAA" keyboardType="numeric" value={dataNascimento} onChangeText={handleDateChange} maxLength={10} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, emailError ? styles.inputError : null]} placeholder="exemplo@gmail.com" value={email} onChangeText={handleEmailChange} autoCapitalize="none" keyboardType="email-address" />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput style={[styles.input, passwordError ? styles.inputError : null]} placeholder="Mínimo 6 caracteres" secureTextEntry value={password} onChangeText={handlePasswordChange} />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar a senha</Text>
          <TextInput style={[styles.input, confirmPasswordError ? styles.inputError : null]} placeholder="Repita a senha" secureTextEntry value={confirmPassword} onChangeText={handleConfirmPasswordChange} />
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.buttonSignUp} onPress={() => controlador.realizarCadastro(nome, dataNascimento, email, password, confirmPassword, emailError)}>
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#1A1A1A' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5 },
  buttonSignUp: { backgroundColor: '#1E293B', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});