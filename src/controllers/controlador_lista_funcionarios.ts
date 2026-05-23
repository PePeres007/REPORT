import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export class controladorListaFuncionarios {
  private router: any;

  constructor(router: any) {
    this.router = router;
  }

  voltar() {
    this.router.back();
  }

  // Busca todas as denúncias no Firebase
  async carregarDenuncias() {
    try {
      const q = query(collection(db, 'reports'), orderBy('dataCriacao', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const denuncias: any[] = [];
      querySnapshot.forEach((doc) => {
        denuncias.push({ id: doc.id, ...doc.data() });
      });

      return denuncias;
    } catch (error) {
      console.error("Erro ao buscar denúncias: ", error);
      return [];
    }
  }

  // Calcula os totais do painel superior
  calcularResumo(denuncias: any[]) {
    const resumo = {
      total: denuncias.length,
      alta: 0,
      media: 0,
      baixa: 0
    };

    denuncias.forEach(d => {
      // Supondo que a urgência é determinada por uma string ou lógica interna
      // Se você tiver um campo "urgencia" no banco, usamos ele. 
      // Exemplo genérico:
      const urgencia = d.urgencia || 'baixa'; 
      
      if (urgencia.toLowerCase() === 'alta') resumo.alta++;
      else if (urgencia.toLowerCase() === 'média' || urgencia.toLowerCase() === 'media') resumo.media++;
      else resumo.baixa++;
    });

    return resumo;
  }

  verDetalhes(id: string) {
    this.router.push(`/detalhes_report?id=${id}`);
  }
}