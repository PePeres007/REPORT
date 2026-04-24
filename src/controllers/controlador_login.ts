import { controladorGeral } from './controlador_geral';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';


//Lida com a autenticação via Firebase, validação de campos e integração 
//com provedores externos (Google).
export class controladorLogin extends controladorGeral {
    // O 'super()' chama o construtor da classe pai (controladorGeral), passando o router para ela configurar.
  constructor(routerInstance: any) {
    super(routerInstance); 
  }

    //Valida se o formato do e-mail possui um domínio permitido pelo sistema.
  public validarFormatoEmail(email: string): string {
  const emailLimpo = email.trim().toLowerCase();
  const dominiosValidos = ['@gmail.com', '@hotmail.com'];
  // Se o campo estiver vazio, não mostra erro imediatamente
  if (emailLimpo.length === 0) {
    return '';
  }

    const validado = dominiosValidos.some(domain => emailLimpo.endsWith(domain));
    return validado ? '' : 'Use apenas e-mails @gmail.com ou @hotmail.com';
  }

  // Processa o login utilizando e-mail e senha no banco de dados do Firebase Auth.
  public async realizarLogin(email: string, senha: string, emailError: string): Promise<void> {
    if (emailError || !email || !senha) {
      this.exibirMensagem('Erro', 'Preencha os campos corretamente.');
      return;
    }

    try {
      // 1. O Firebase tenta fazer o login
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
      
      // 2. Utiliza o método herdado para mostrar o sucesso
      this.exibirMensagem("Sucesso", "Login realizado!");
      
      // 3. Utiliza o método herdado para navegação segura
      this.substituirRota('/home');
      
    } catch (error: any) {
      let mensagem = "Falha na conexão com o servidor.";
      
      // 4. Tradução dos códigos de erro do Firebase
      if (error.code === 'auth/invalid-credential') {
        mensagem = "E-mail ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        mensagem = "Muitas tentativas falhas. Tente novamente mais tarde.";
      }
      
      this.exibirMensagem('Erro de Acesso', mensagem);
    }
  }

  // Processa o objeto de resposta retornado pela API de autenticação do Google.
  public processarRetornoGoogle(response: any): void {
    if (response?.type === 'success') {
      console.log("Token recebido do Google!");
      this.exibirMensagem("Sucesso", "Autenticação com Google validada!");
      // this.substituirRota('/home'); // Opcional: Navegar para a Home após o login Google
    } else if (response?.type === 'error') {
      this.exibirMensagem("Erro Google", "Falha na comunicação com o servidor do Google.");
    }
  }
}