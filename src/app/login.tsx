import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
// Importa o 'auth' configurado saindo da pasta 'app' e entrando na 'services'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { controladorLogin } from '../controllers/controlador_login';
// 1. INICIALIZAÇÃO DO FIREBASE

// import { getAnalytics } from "firebase/analytics"; // Analytics costuma dar erro no Expo Go, use se necessário

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  // 1. ESTADOS (States)
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // 2. Instanciando o objeto
  const controlador = new controladorLogin(router);

  // --- CONFIGURAÇÃO LOGIN GOOGLE ---
  const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: 'COLE_AQUI_O_SEU_NOVO_ID_WEB.apps.googleusercontent.com',
  iosClientId: 'COLE_AQUI_O_SEU_NOVO_ID_IOS.apps.googleusercontent.com',
  androidClientId: 'COLE_AQUI_O_SEU_NOVO_ID_ANDROID.apps.googleusercontent.com',
});
//1092143546861-psnshs3k3o75irs2laibiquj8ic4mgek
//1092143546861-23ik71tk7124qsn56onnhd50lufmcm6v
//1092143546861-esocaei1pjdib2g31ealsipdqh6fhq16
  // Delega o processamento da resposta do Google para o Controlador
  useEffect(() => {
    controlador.processarRetornoGoogle(response);
  }, [response]);

  // Função disparada a cada letra digitada no campo de e-mail
  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Pede ao controlador para validar e guarda a mensagem de erro (se houver)
    const erroCalculado = controlador.validarFormatoEmail(text);
    setEmailError(erroCalculado);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bem vindo de volta</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Usuário@email.com"
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="No mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonLogin} onPress={() => controlador.realizarLogin(email, password, emailError)}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Ou se cadastre com</Text>
          <View style={styles.line} />
        </View>

        {/* BOTAO DO GOOGLE OCULTO PARA A APRESENTAÇÃO 
        <TouchableOpacity
          style={styles.buttonGoogle}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Image
            source={require('../../assets/images/google_logo.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.emailText}>Google</Text>
        </TouchableOpacity>
        */}

        {/* BOTÃO DE CADASTRO (Navega para a tela de cadastro) */}
        <TouchableOpacity
          style={styles.buttonEmailContainer}
          onPress={() => controlador.navegarPara('/cadastro')}
        >
          <LinearGradient
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
    marginBottom: 12, // 
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
    color: '#1E293B',
    fontWeight: '500',
  }
});