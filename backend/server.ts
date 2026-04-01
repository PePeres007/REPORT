import cors from 'cors';
import express, { Request, Response } from 'express';

// --- INICIALIZAÇÃO ---
const app = express();

// --- CONFIGURAÇÕES ---
app.use(cors());
app.use(express.json());

// --- ROTA DE LOGIN ---
app.post('/login', (req: Request, res: Response) => {
  
  // RECEPÇÃO DE DADOS
  const { email, password } = req.body;
  console.log(`Tentativa de login: ${email}`);

  // VALIDAÇÃO PROVISÓRIA
  if (email === 'caio@gmail.com' && password === '1234') {
    
    // SUCESSO
    res.status(200).json({ message: "Login autorizado com sucesso!" });
    return;

  } else {
    
    // ERRO
    res.status(401).json({ message: "E-mail ou senha incorretos." });
    return;

  }
});

// --- ATIVAÇÃO DO SERVIDOR ---
app.listen(3000, '0.0.0.0', () => {
  console.log("Servidor Backend rodando na porta 3000");
});