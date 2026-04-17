import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. Importando a biblioteca que você instalou
import emailjs from '@emailjs/browser';

export default function Autenticacao() {
  const router = useRouter();
  
  // Pega o email que veio da tela de login
  const { userEmail } = useLocalSearchParams(); 

  // Estado para os 6 dígitos do código que o usuário digita
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(107); // 01:47 em segundos

  // 2. Estado para guardar o código "secreto" gerado pelo sistema
  const [codigoCorreto, setCodigoCorreto] = useState('');

  // Refs para controlar o foco dos inputs automaticamente
  const inputs = useRef<(TextInput | null)[]>([]);

  // 3. Função para enviar o e-mail via EmailJS
  const enviarEmailVerificacao = async (emailDestino: string, codigo: string) => {
    const serviceId = 'service_xmns14q'; 
    const templateId = 'template_fbm1ebf'; // <--- COLOQUE SEU TEMPLATE ID AQUI
    const publicKey = '08sLjhChKAajRv2Eu'; 

    const templateParams = {
      user_email: emailDestino, // Deve ser igual ao que está no campo "To Email" no site
      passcode: codigo,         // Deve ser igual ao que está entre {{ }} no corpo do e-mail no site
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('E-mail enviado com sucesso para:', emailDestino);
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      Alert.alert('Erro', 'Não conseguimos enviar o código para o seu e-mail.');
    }
  };

  // 4. Gera o código e envia o e-mail assim que a tela abre
  useEffect(() => {
    // Gera um número aleatório de 6 dígitos entre 100000 e 999999
    const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoCorreto(novoCodigo);

    if (userEmail) {
      enviarEmailVerificacao(userEmail as string, novoCodigo);
    }
  }, [userEmail]);

  // Lógica do Cronômetro
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 5. Função de Verificação (Agora comparando com o código real)
  const handleVerify2FA = async () => {
    const codigoDigitado = code.join(''); 

    if (codigoDigitado.length < 6) {
      Alert.alert('Erro', 'Digite o código completo de 6 dígitos.');
      return;
    }

    if (codigoDigitado === codigoCorreto) {
      Alert.alert('Sucesso', 'Identidade confirmada!');
      router.replace('/home'); 
    } else {
      Alert.alert('Erro', 'Código inválido. Verifique o código enviado para o seu e-mail.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text !== '' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificação de Segurança</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <View style={styles.blueCircle}>
              <Feather name="shield" size={40} color="#FFF" />
              <View style={styles.userIconSmall}>
                <Feather name="user" size={12} color="#1e4e79" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Verificação em 2 etapas</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para{"\n"}
            <Text style={styles.phoneBold}> {userEmail ? userEmail : 'seu e-mail'}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  digit !== '' ? styles.otpInputActive : null
                ]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                value={digit}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
              />
            ))}
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Reenviar código em </Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerValue}>{formatTime(timer)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnConfirm} onPress={handleVerify2FA}>
            <Text style={styles.btnConfirmText}>Confirmar Código</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnMethod}>
            <Text style={styles.btnMethodText}>Usar outro método</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendContainer}
            onPress={() => {
              // Lógica de Reenviar: gera novo código e dispara novo e-mail
              const novo = Math.floor(100000 + Math.random() * 900000).toString();
              setCodigoCorreto(novo);
              enviarEmailVerificacao(userEmail as string, novo);
              setTimer(107);
            }}
          >
            <Text style={styles.resendText}>
              Não recebeu? <Text style={styles.resendLink}>Reenviar agora</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#1e4e79',
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  backButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginLeft: 15 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30, marginTop: -30 },
  iconCircle: {
    marginTop: 40,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  blueCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e4e79',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconSmall: { position: 'absolute', bottom: 35, backgroundColor: '#FFF', borderRadius: 10, padding: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e4e79', marginBottom: 10 },
  subtitle: { textAlign: 'center', color: '#94a3b8', lineHeight: 20, fontSize: 14 },
  phoneBold: { color: '#1e4e79', fontWeight: 'bold' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 30 },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#1e4e79',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e4e79',
  },
  otpInputActive: { backgroundColor: '#1e4e79', color: '#FFF' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  timerText: { color: '#94a3b8', fontSize: 14 },
  timerBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerValue: { color: '#1e4e79', fontWeight: 'bold', fontSize: 12 },
  btnConfirm: {
    backgroundColor: '#2b6392',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: "#2b6392",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  btnConfirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btnMethod: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e4e79',
    alignItems: 'center',
    marginTop: 15,
  },
  btnMethodText: { color: '#1e4e79', fontSize: 16, fontWeight: 'bold' },
  resendContainer: { marginTop: 25 },
  resendText: { color: '#94a3b8', fontSize: 14 },
  resendLink: { color: '#2b6392', fontWeight: 'bold' },
});
