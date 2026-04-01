import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Permite que o navegador feche após o login do Google
WebBrowser.maybeCompleteAuthSession();

// --- CONFIGURAÇÃO ---
// Lembre-se de colocar o IP da sua máquina aqui para o Axios funcionar no celular
const API_URL = 'http://192.168.x.x:3000'; 

export default function Login() {
  // 1. ESTADOS (States)
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // 2. CONFIGURAÇÃO LOGIN GOOGLE
  const [request, response, promptAsync] = Google.useAuthRequest({
    // ID do "Aplicativo da Web" (que você já tem na imagem)
    webClientId: '1029108826846-uhe1v7vshnbt8pcrn8r76r0clm540n0q.apps.googleusercontent.com', 
    
    // ID do "iOS" que você criou (Bundle ID: host.exp.exponent)
    iosClientId: 'COLE_AQUI_O_SEU_NOVO_ID_IOS.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log("Token recebido com sucesso!");
      Alert.alert("Sucesso", "Login com Google realizado!");
    } else if (response?.type === 'error') {
      console.error("Erro no Login Google:", response.error);
      Alert.alert("Erro", "Falha na autenticação. Verifique os IDs no console do Google.");
    }
  }, [response]);

  // 3. FUNÇÃO DE VALIDAÇÃO DE E-MAIL
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
    }
  };

  // 4. FUNÇÃO DE LOGIN (Back-end)
  const handleLogin = async () => {
    if (emailError || email.length === 0 || password.length === 0) {
      Alert.alert('Erro', 'Por favor, preencha os campos corretamente.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email: email.trim().toLowerCase(),
        password: password
      });
      Alert.alert('Sucesso', res.data.message);
    } catch (error: any) {
      if (error.response) {
        Alert.alert('Erro de Login', error.response.data.message);
      } else {
        Alert.alert('Erro de Conexão', 'Servidor offline ou IP incorreto.');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bem vindo de volta</Text>

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

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* BOTÃO ENTRAR */}
        <TouchableOpacity style={styles.buttonLogin} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Ou se cadastre com</Text>
          <View style={styles.line} />
        </View>

        {/* BOTÃO GOOGLE FUNCIONAL */}
        <TouchableOpacity 
          style={styles.buttonGoogle} 
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png' }} 
            style={styles.googleIcon} 
          />
          <Text style={styles.emailText}>Google</Text>
        </TouchableOpacity>

        {/* BOTÃO DE CADASTRO (Navega para a tela de cadastro) */}
        <TouchableOpacity 
          style={styles.buttonEmailContainer} 
          onPress={() => router.push('../cadastro')}
        >
          <LinearGradient
            // Cores do gradiente: de um cinza bem claro para um cinza um pouco mais escuro
            colors={['#E2E8F0', '#FFFFFF', '#E2E8F0']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}
          >
            <MaterialCommunityIcons name="email-outline" size={24} color="#1E293B" style={{ marginRight: 10 }} />
            <Text style={styles.emailText}>Email</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- ESTILIZAÇÃO ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 30,
    justifyContent: 'center',
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
  forgotPassword: {
    color: '#3B82F6',
    textAlign: 'right',
    marginBottom: 30,
    fontWeight: '500',
  },
  buttonLogin: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#64748B',
    fontSize: 14,
  },
  
  buttonGoogle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 12, // <-- Adicionei este espaço para separar do botão de baixo
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  
  buttonEmailContainer: {
    borderRadius: 12,
    overflow: 'hidden', 
  },
  gradientBackground: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#1E293B', // Mantém o texto escuro para dar contraste com o fundo cinza claro
    fontWeight: '500',
  }
});