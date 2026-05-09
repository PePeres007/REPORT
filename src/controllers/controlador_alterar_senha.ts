import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';

export class controladorAlterarSenha extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  async confirmarTroca(senhaAtual: string, novaSenha: string) {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    try {
      // Reautenticação é obrigatória no Firebase para trocar senha
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, novaSenha);
      this.exibirMensagem('Sucesso', 'Senha alterada com sucesso!');
      this.voltar();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        this.exibirMensagem('Erro', 'A senha atual está incorreta.');
      } else {
        this.exibirMensagem('Erro', 'Falha ao atualizar. Tente relogar no app.');
      }
    }
  }
}