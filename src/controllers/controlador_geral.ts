import { Alert } from 'react-native';

export class controladorGeral {
  protected router: any;

  constructor(routerInstance: any) {
    this.router = routerInstance;
  }

  public navegarPara(rota: string): void {
    this.router.push(rota);
  }

  public substituirRota(rota: string): void {
    this.router.replace(rota);
  }

  public voltar(): void {
    if (this.router.canGoBack()) {
      this.router.back();
    } else {
      this.substituirRota('/'); // Volta pro início como segurança
    }
  }

  public exibirMensagem(titulo: string, mensagem: string): void {
    Alert.alert(titulo, mensagem);
  }
}