
import { controladorGeral } from './controlador_geral';

export class controladorIndex extends controladorGeral {
  private delayMiliSegundos: number;

  constructor(routerInstance: any, delay: number = 3000) {
    // O 'super()' chama o construtor da classe pai (controladorGeral), passando o router para ela configurar.
    super(routerInstance); 
    this.delayMiliSegundos = delay;
  }

  public timerNavegacao(): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
    // Chama o metodo de navegação da classe pai para ir para a tela de login após o tempo definido.
      this.substituirRota('/login'); 
    },this.delayMiliSegundos);
  }

  public stoptNavegacao(timer: ReturnType<typeof setTimeout>): void {
    clearTimeout(timer);
  }
}