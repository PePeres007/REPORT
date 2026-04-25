import emailjs from '@emailjs/browser';
import { Alert } from 'react-native';

export class controladorAutenticacao {
  router: any;

  constructor(router: any) {
    this.router = router;
  }

  async enviarEmailVerificacao(emailDestino: string, codigo: string) {
    const serviceId = 'service_xmns14q'; 
    const templateId = 'template_fbm1ebf'; 
    const publicKey = '08sLjhChKAajRv2Eu'; 

    const templateParams = {
      user_email: emailDestino, 
      passcode: codigo,         
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('E-mail enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar:', error);
      Alert.alert('Erro', 'Certifique-se de habilitar "Non-browser environments" no painel do EmailJS.');
    }
  }

  gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  verificarCodigo(codigoDigitado: string, codigoCorreto: string) {
    if (codigoDigitado.length < 6) {
      Alert.alert('Erro', 'Digite o código completo.');
      return false;
    }

    if (codigoDigitado === codigoCorreto) {
      Alert.alert('Sucesso', 'Identidade confirmada!');
      this.router.replace('/home'); 
      return true;
    } else {
      Alert.alert('Erro', 'Código inválido. Verifique o e-mail enviado.');
      return false;
    }
  }

  formatarTempo(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}