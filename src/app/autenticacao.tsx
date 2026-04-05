import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Autenticacao() {
  const router = useRouter();
  
  // Estado para os 6 dígitos do código
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(107); // 01:47 em segundos

  // Refs para controlar o foco dos inputs automaticamente
  const inputs = useRef<(TextInput | null)[]>([]);

  // Lógica do Cronômetro
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move para o próximo campo se houver texto
    if (text !== '' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Se apagar, volta para o campo anterior
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificação de Segurança</Text>
        </View>

        <View style={styles.content}>
          {/* ÍCONE DE ESCUDO */}
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
            <Text style={styles.phoneBold}> ******@gmail.com</Text>
          </Text>

          {/* CAMPOS DE CÓDIGO */}
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

          {/* TIMER */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Reenviar código em </Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerValue}>{formatTime(timer)}</Text>
            </View>
          </View>

          {/* BOTÕES */}
          <TouchableOpacity style={styles.btnConfirm}>
            <Text style={styles.btnConfirmText}>Confirmar Código</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnMethod}>
            <Text style={styles.btnMethodText}>Usar outro método</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendContainer}>
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
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#1e4e79', // Azul escuro do topo
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -30, // Efeito de sobreposição se desejar, ou ajuste conforme necessário
  },
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
  userIconSmall: {
    position: 'absolute',
    bottom: 35,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e4e79',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: '#94a3b8',
    lineHeight: 20,
    fontSize: 14,
  },
  phoneBold: {
    color: '#1e4e79',
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
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
  otpInputActive: {
    backgroundColor: '#1e4e79',
    color: '#FFF',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  timerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  timerBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerValue: {
    color: '#1e4e79',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnConfirm: {
    backgroundColor: '#2b6392',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    // Sombra leve
    shadowColor: "#2b6392",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  btnConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnMethod: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e4e79',
    alignItems: 'center',
    marginTop: 15,
  },
  btnMethodText: {
    color: '#1e4e79',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: 25,
  },
  resendText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resendLink: {
    color: '#2b6392',
    fontWeight: 'bold',
  },
});