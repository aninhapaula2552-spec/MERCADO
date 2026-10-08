# Remix Mercado Fresh 🛒

Aplicativo moderno e inteligente para organizar listas de compras de supermercado, acompanhar gastos em tempo real, calcular ofertas no atacado e economizar nas compras.

## ✨ Funcionalidades

- **Listas Inteligentes:** Crie e gerencie listas de compras com cálculo automático de totais.
- **Preços de Atacado & Descontos:** Identificação visual de itens com desconto por quantidade ou preço especial.
- **Níveis de Importância:** Destaque de itens por prioridade visual.
- **Controle do Gás:** Acompanhamento do consumo de botijão, cálculo automático de dias de duração, custo diário, previsão da próxima troca (com indicador visual 🟢🟡🔴) e integração direta com a lista de compras.
- **Histórico de Compras:** Registro de listas concluídas e histórico de gastos.
- **Sincronização em Nuvem:** Persistência em tempo real via Firebase Firestore e autenticação com conta Google.
- **Multi-moedas e Temas:** Suporte a BRL, USD, EUR, GBP e personalização de cores.

---

## 🚀 Como Executar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Preencha sua chave `GEMINI_API_KEY` se for utilizar recursos de IA.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🌐 Como Publicar Grátis (Vercel)

1. Exporte este repositório para o seu **GitHub** (via menu do AI Studio ou `git push`).
2. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
3. Clique em **"Add New..."** > **"Project"** e selecione o repositório.
4. Adicione a variável de ambiente:
   - `GEMINI_API_KEY`: sua chave de API
5. Clique em **Deploy**. Seu app estará no ar com HTTPS gratuito em poucos minutos!
