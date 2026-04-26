# REPORT!: Plataforma Colaborativa para Gestão e Monitoramento de Ocorrências Urbanas

O REPORT! é uma solução móvel desenvolvida em React Native voltada para o mapeamento e gestão de problemas de infraestrutura urbana na cidade de Recife. A plataforma utiliza o conceito de crowdsourcing para conectar cidadãos e gestão pública, permitindo que o habitante atue como um sensor geográfico ativo.

---

##  Funcionalidades do Sistema

* **Autenticação de Usuários**: Sistema de acesso seguro com validação via e-mail (2FA) utilizando EmailJS.
* **Mapeamento em Tempo Real**: Visualização georreferenciada de incidentes através de mapas interativos.
* **Registro de Ocorrências**:

  * Geolocalização automática via GPS.
  * Categorização por tipologia de problema (pavimentação, iluminação, saneamento, etc.).
  * Registro fotográfico obrigatório para comprovação visual.
* **Monitoramento e Resolução**: Interface para visualização de detalhes e marcação de ocorrências como resolvidas (exclusão lógica).

---

##  Pilha Tecnológica

* **Framework**: React Native e Expo SDK
* **Linguagem**: TypeScript
* **Gerenciamento de Rotas**: Expo Router
* **Backend**: Firebase (Firestore e Storage)
* **Serviço de E-mail**: EmailJS
* **Mapas**: React Native Maps e OpenStreetMap

---

##  Instalação e Configuração

Siga os passos abaixo no seu terminal para configurar o ambiente de desenvolvimento local.

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/report-recife.git
cd report-recife
```

### 2. Instalar as dependências

```bash
npm install
npm install @emailjs/browser
```

### 3. Configuração do Firebase

Crie um arquivo chamado `firebaseConfig.ts` dentro da pasta de serviços (`services/firebaseConfig.ts`) e insira suas credenciais:

```ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

### 4. Definição e Configuração do EmailJS

Para o envio de e-mails de validação, utilize a estrutura abaixo.

>  **Importante:** Certifique-se de que a opção **"Use Private Key" está desativada** no dashboard do EmailJS, utilizando apenas a Public Key.

```ts
import emailjs from '@emailjs/browser';

const enviarEmailValidacao = (templateParams) => {
  emailjs.send(
    'SEU_SERVICE_ID', 
    'SEU_TEMPLATE_ID', 
    templateParams, 
    'SUA_PUBLIC_KEY'
  )
  .then((result) => {
      console.log('E-mail enviado:', result.text);
  }, (error) => {
      console.error('Erro ao enviar e-mail:', error.text);
  });
};
```

---

##  Executando o Projeto

Para iniciar o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

Após a execução, utilize o aplicativo **Expo Go** no seu smartphone para escanear o QR Code gerado no terminal.

---

##  Metodologia e Dados

O projeto fundamenta-se no processo **KDD (Knowledge Discovery in Databases)** para análise de dados históricos da EMLURB e prevê a aplicação de técnicas de inteligência artificial:

* **Clustering (K-Means)**: Identificação automática de agrupamentos espaciais de alta criticidade.
* **Classificação Supervisionada**: Triagem automatizada da urgência baseada nos relatos textuais.

---

##  Equipe de Desenvolvimento (UFRPE)

* Arthur Alves
* Breno Jansen
* Caio Carvalho
* Davi Eufrásio
* Gabriel Escobar
* Pedro Peres


