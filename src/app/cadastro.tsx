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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export default function Cadastro() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 1. VALIDAÇÃO DE E-MAIL
  const validateEmail = (text: string) => {
    setEmail(text);
    const cleanEmail = text.trim().toLowerCase();
    const allowedDomains = ['@gmail.com', '@hotmail.com'];
    
    if (cleanEmail.length > 0) {
      const isValid = allowedDomains.some(domain => cleanEmail.endsWith(domain));
      setEmailError(isValid ? '' : 'Use apenas e-mails @gmail.com ou @hotmail.com');
    } else {
      setEmailError('');
    }
  };

  // 2. CONFIRMAR SENHA
  const validateSenha = (text: string) => {
    setConfirmPassword(text);
    if (text.length > 0 && text !== password) {
      setPasswordError('As senhas não coincidem');
    } else {
      setPasswordError('');
    }
  };

  // 3. MÁSCARA DA DATA
  const handleDateChange = (text: string) => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length > 2) formatted = formatted.replace(/^(\d{2})(\d)/, '$1/$2');
    if (formatted.length > 5) formatted = formatted.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setDataNascimento(formatted.substring(0, 10));
  };

  // 4. FUNÇÃO DE CADASTRO REAL (FIREBASE)
  const handleSignUp = async () => {
    if (emailError || passwordError || !email || !password || !nome) {
      Alert.alert('Erro', 'Preencha os campos corretamente.');
      return;
    }

    try {
      // Cria o usuário na Autenticação
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      // Salva os dados no Banco de Dados (Firestore)
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email.trim().toLowerCase(),
        dataNascimento: dataNascimento,
        dataCadastro: new Date().toISOString()
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.push('../login');

    } catch (error: any) {
      let mensagem = "Erro ao cadastrar.";
      if (error.code === 'auth/email-already-in-use') mensagem = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') mensagem = "A senha deve ter no mínimo 6 dígitos.";
      
      Alert.alert('Erro', mensagem);
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('../login')}>
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
          <TextInput style={[styles.input, emailError ? styles.inputError : null]} placeholder="exemplo@gmail.com" value={email} onChangeText={validateEmail} autoCapitalize="none" keyboardType="email-address" />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar a senha</Text>
          <TextInput style={[styles.input, passwordError ? styles.inputError : null]} placeholder="Repita a senha" secureTextEntry value={confirmPassword} onChangeText={validateSenha} />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.buttonSignUp} onPress={handleSignUp}>
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