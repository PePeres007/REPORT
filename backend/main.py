from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # NOVO: Importa o CORS
from pydantic import BaseModel
import sqlite3
import random
import hashlib

app = FastAPI(title="API do REPORT!")

# NOVO: Configuração de segurança (Permite que o React Native converse com a API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na produção, colocamos o domínio real aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 1. CONEXÃO E CRIAÇÃO DO BANCO DE DADOS (SQLite)
# ---------------------------------------------------------
def get_db_connection():
    # Cria um arquivo 'report_db.sqlite' na pasta backend
    conn = sqlite3.connect('report_db.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

# Cria a tabela de usuários assim que a API iniciar
def criar_tabelas():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            codigo_2fa TEXT
        )
    ''')
    conn.commit()
    conn.close()

criar_tabelas()

# ---------------------------------------------------------
# 2. MODELOS DE DADOS (O que o app React Native vai enviar)
# ---------------------------------------------------------
class CadastroRequest(BaseModel):
    nome: str
    email: str
    senha: str

class LoginRequest(BaseModel):
    email: str
    senha: str

class Validar2FARequest(BaseModel):
    email: str
    codigo: str

# Função simples para encriptar a senha (Segurança Básica)
def gerar_hash(senha: str):
    return hashlib.sha256(senha.encode()).hexdigest()

# ---------------------------------------------------------
# 3. ROTAS DA API (Endpoints)
# ---------------------------------------------------------

@app.post("/cadastro")
def cadastrar_usuario(dados: CadastroRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verifica se o email já existe
    usuario_existente = cursor.execute("SELECT * FROM usuarios WHERE email = ?", (dados.email,)).fetchone()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    # Salva no banco com a senha protegida (hash)
    senha_segura = gerar_hash(dados.senha)
    cursor.execute(
        "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
        (dados.nome, dados.email, senha_segura)
    )
    conn.commit()
    conn.close()
    
    return {"mensagem": "Usuário cadastrado com sucesso!"}


@app.post("/login")
def iniciar_login(dados: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    senha_segura = gerar_hash(dados.senha)
    usuario = cursor.execute(
        "SELECT * FROM usuarios WHERE email = ? AND senha_hash = ?", 
        (dados.email, senha_segura)
    ).fetchone()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    # Se a senha está correta, GERAR CÓDIGO 2FA (6 dígitos)
    codigo_gerado = str(random.randint(100000, 999999))
    
    # Salva o código temporário no banco de dados para aquele usuário
    cursor.execute("UPDATE usuarios SET codigo_2fa = ? WHERE id = ?", (codigo_gerado, usuario['id']))
    conn.commit()
    conn.close()
    
    # Na vida real, aqui usaríamos uma biblioteca para enviar um Email/SMS real.
    # Por enquanto, vamos imprimir no terminal para você testar no React Native.
    print(f"\n[SIMULAÇÃO DE EMAIL] O código 2FA de {usuario['nome']} é: {codigo_gerado}\n")
    
    return {"mensagem": "Senha correta. Verifique seu e-mail para pegar o código 2FA.", "requer_2fa": True}


@app.post("/validar-2fa")
def validar_codigo(dados: Validar2FARequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    usuario = cursor.execute("SELECT * FROM usuarios WHERE email = ?", (dados.email,)).fetchone()
    
    if not usuario or usuario['codigo_2fa'] != dados.codigo:
        raise HTTPException(status_code=401, detail="Código 2FA inválido ou expirado.")
    
    # Se o código está certo, limpa ele do banco (para não ser reutilizado) e aprova a entrada
    cursor.execute("UPDATE usuarios SET codigo_2fa = NULL WHERE id = ?", (usuario['id'],))
    conn.commit()
    conn.close()
    
    return {"mensagem": "Login concluído com sucesso!", "token_acesso": "xyz_token_simulado"}