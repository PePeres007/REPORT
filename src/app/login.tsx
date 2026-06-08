import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { salvarUsuario } from '../services/userStorage';

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

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const controlador = new controladorLogin(router);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: 'COLE_AQUI_O_SEU_NOVO_ID_WEB.apps.googleusercontent.com',
    iosClientId: 'COLE_AQUI_O_SEU_NOVO_ID_IOS.apps.googleusercontent.com',
    androidClientId: 'COLE_AQUI_O_SEU_NOVO_ID_ANDROID.apps.googleusercontent.com',
  });

  useEffect(() => {
    controlador.processarRetornoGoogle(response);
  }, [response]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
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

        <TouchableOpacity onPress={() => controlador.esqueceuSenha(email)}>
          <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* 🔥 BOTÃO LOGIN ATUALIZADO */}
        <TouchableOpacity 
          style={styles.buttonLogin} 
          onPress={async () => {
            await salvarUsuario({
              nome: email.split('@')[0],
              email: email
            });

            controlador.realizarLogin(email, password, emailError);
          }}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Ou se cadastre com</Text>
          <View style={styles.line} />
        </View>

        {/* BOTÃO DE CADASTRO */}
        <TouchableOpacity
          style={styles.buttonEmailContainer}
          onPress={() => controlador.navegarPara('/escolha_perfil')}
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
