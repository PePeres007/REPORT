import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../services/firebaseConfig';
import { controladorGeral } from "./controlador_geral";

//Controladora responsável pelas regras de negócio da tela de Criação de Conta.
// Encapsula as validações de formulário (e-mail, tamanho de senha, igualdade de senhas) 
// e a comunicação com a API de registro do Firebase.
export class controladorCadastro extends controladorGeral {
    // O 'super()' chama o construtor da classe pai (controladorGeral), passando o router para ela configurar.
  constructor(routerInstance: any) {
    super(routerInstance);
  }

// Valida se o formato do e-mail possui um domínio permitido.
  public validarFormatoEmail(email: string): string {
    const emailLimpo = email.trim().toLowerCase();
    const dominiosValidos = ['@gmail.com', '@hotmail.com'];
    if (emailLimpo.length === 0) return '';
    const validado = dominiosValidos.some(domain => emailLimpo.endsWith(domain));
    return validado ? '' : 'Use apenas e-mails @gmail.com ou @hotmail.com';
  }

    // Valida a política de segurança da senha (mínimo de 6 caracteres).
  public validarSenha(senha: string): string {
    if (senha.length === 0) return '';
    if (senha.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    // /\d/ procura por qualquer dígito (0-9) na string
    const temNumero = /\d/.test(senha);
    if (!temNumero) {
      return 'A senha deve conter pelo menos um número.';
    }
    // /[A-Z]/ procura por qualquer letra maiúscula de A a Z na string
    const temMaiuscula = /[A-Z]/.test(senha);
    if (!temMaiuscula) {
      return 'A senha deve conter pelo menos uma letra maiúscula.';
    }
    return '';
  }

  // Verifica se o campo de confirmação é exatamente igual à senha principal.
  public validarConfirmacaoSenha(senha: string, confirmacao: string): string {
    if (confirmacao.length === 0) return '';
    return senha !== confirmacao ? 'As senhas não coincidem.' : '';
  }

   // Aplica a máscara de data (DD/MM/AAAA) enquanto o usuário digita.
  public aplicarMascaraData(texto: string): string {
    let formatted = texto.replace(/\D/g, ''); // Remove tudo que não for número
    if (formatted.length > 2) formatted = formatted.replace(/^(\d{2})(\d)/, '$1/$2');
    if (formatted.length > 5) formatted = formatted.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    return formatted.substring(0, 10); // Limita a 10 caracteres
  }

  //Executa a rotina principal de cadastro de um novo usuário.
  // Verifica inconsistências locais antes de acionar o banco de dados (Firebase).

  public async realizarCadastro(
    nome: string, 
    dataNascimento: string, 
    email: string, 
    senha: string, 
    confirmacao: string,
    emailError: string
  ): Promise<void> {
    
    // 1. Validação de Campos Vazios e Erros Pendentes
    if (!nome || !dataNascimento || !email || !senha || !confirmacao || emailError) {
      this.exibirMensagem('Erro', 'Por favor, preencha todos os campos corretamente.');
      return;
    }

    // 2. Validação de Regras de Negócio (Rechecagem de segurança)
    if (senha.length < 6) {
      this.exibirMensagem('Senha Inválida', 'Sua senha precisa ter pelo menos 6 caracteres.');
      return;
    } else if (!/\d/.test(senha)) {
      this.exibirMensagem('Senha Fraca', 'Sua senha deve conter pelo menos um número.');
      return;
    } else if (!/[A-Z]/.test(senha)) {
      this.exibirMensagem('Senha Fraca', 'Sua senha deve conter pelo menos uma letra maiúscula.');
      return;
    }
    
    if (senha !== confirmacao) {
      this.exibirMensagem('Erro nas Senhas', 'As senhas digitadas não coincidem.');
      return;
    }

    try {
      // 1. Cria o usuário na Autenticação 
      const credencialUsuario = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
      const usuario = credencialUsuario.user;

      // 2. Salva os dados extras no Banco de Dados (Firestore)
      // Utiliza-se o 'usuario.uid' para que o documento tenha o mesmo ID do usuário no Auth
      await setDoc(doc(db, "usuarios", usuario.uid), {
        nome: nome,
        email: email.trim().toLowerCase(),
        dataNascimento: dataNascimento,
        dataCadastro: new Date().toISOString()
      });

      this.exibirMensagem('Sucesso', 'Conta criada! Verifique o código no seu e-mail.');
      
      // 3. Navega para a tela de autenticação passando o e-mail como parâmetro
      // Como precisamos passar parâmetros (params), acessamos o this.router diretamente aqui
      this.router.push({
        pathname: '/autenticacao',
        params: { userEmail: email }
      });
      
    } catch (error: any) {
      let mensagem = "Falha ao criar conta. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        mensagem = "Este e-mail já está em uso.";
      } else if (error.code === 'auth/invalid-email') {
        mensagem = "O formato do e-mail é inválido.";
      }
      
      this.exibirMensagem('Erro no Cadastro', mensagem);
    }
  }
}