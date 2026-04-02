import React, {useState} from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Cadastro() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 1. FUNÇÃO DE VALIDAÇÃO DE E-MAIL
  const validateEmail = (text: string) => {
    setEmail(text);
    const cleanEmail = text.trim().toLowerCase();
    const allowedDomains = ['@gmail.com', '@hotmail.com'];
    
    if (cleanEmail.length > 0) {
      const isValid = allowedDomains.some(domain => cleanEmail.endsWith(domain));
      if (!isValid) {
        setEmailError('Use apenas e-mails @gmail.com ou @hotmail.com');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }};
  // 2. FUNÇÃO DE CONFIRMAR SENHA
  const validateSenha = (text: string) => {
    setConfirmPassword(text); // Atualiza o valor do campo de confirmação
    
    if (text.length > 0 && text !== password) {
      setPasswordError('As senhas não coincidem');
    } else {
      setPasswordError('');
    }
  };
  
  // 2. FUNÇÃO DE CADASTRO

  const handleSignUp = async () => {
    if (emailError || email.length === 0 || password.length === 0) {
      Alert.alert('Erro', 'Por favor, preencha os campos corretamente.');
      return;
    }};

  return (
    <View>
      
      {/* --- CABEÇALHO COM BOTÃO DE VOLTAR --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} // Retorna para a tela de Login
        >
          <Feather name="arrow-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Criar Conta</Text>
        
        {/* Esta View vazia serve apenas para empurrar o título para o centro exato da tela */}
        <View style={{ width: 28 }} /> 
      </View>

      {/* --- CONTEÚDO DA TELA --- */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Boas vindas ao REPORT</Text>

        {/* CAMPO DE NOME */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={[styles.input]}
            placeholder="Usuário01"
            autoCapitalize="words"
            keyboardType="default"
          />
        </View>
        {/* CAMPO DE DATA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Data de Nascimento</Text>
          <TextInput
            style={[styles.input]}
            placeholder="DD/MM/AAAA"
            autoCapitalize="words"
            keyboardType="numeric"
          />
        </View>
        {/* CAMPO DE EMAIL */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Usuário@email.com"
            value={email}
            onChangeText={validateEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>
        {/* CAMPO DE SENHA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="No mínimo 4 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {/* CAMPO DE CONFIRMAR SENHA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar a senha</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Digite a mesma senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={validateSenha}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>
        {/* BOTÃO CRIAR CONTA */}
        <TouchableOpacity style={styles.buttonSignUp} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Linha sutil separando o cabeçalho
  },
  backButton: {
    padding: 5, // Aumenta a área de toque (hitbox) para facilitar o clique do usuário
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 16,
  },
    title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
  },
    buttonSignUp: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }


});