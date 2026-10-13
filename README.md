# 🎴 BinderDex

**BinderDex** é um catalogador e fichário virtual interativo para colecionadores de Trading Card Games (TCG). O projeto simula a experiência realista de um fichário físico com layout duplo de 9 bolsos (3x3), folheamento de páginas, capas personalizadas e busca integrada de cartas.

![BinderDex Preview](public/favicon.svg)

---

## ✨ Funcionalidades

- **📖 Experiência Realista de Fichário Físico:**
  - Visualização em spread duplo (páginas esquerda e direita estilo fichário de 9 bolsos por página).
  - Capa frontal e contracapa personalizáveis (cor do fichário, texturas, logotipo e título customizados).
  - Capa interna com resumo da coleção (total de cartas, valor estimado, jogos e estatísticas).
  - Navegação suave entre páginas com numeração dinâmica.

- **🎯 Drag & Drop Avançado:**
  - Arraste e solte cartas livremente entre qualquer bolso da página.
  - **Auto-Turn de Páginas:** Ao arrastar uma carta sobre as setas de próxima/anterior página, a página vira automaticamente mantendo a carta segura no cursor para soltá-la no bolso desejado.

- **🎮 Suporte a Múltiplos Jogos com Busca Direcionada:**
  - Suporte a **Pokémon TCG**, **Magic: The Gathering** e **Yu-Gi-Oh!**.
  - O fichário é vinculado ao jogo escolhido: ao adicionar cartas, o sistema restringe a busca automaticamente àquele jogo, acelerando a catalogação.
  - Seletor de jogos em dropdown extensível para inclusão fácil de novos TCGs.

- **✨ Acabamentos & Efeitos Especiais:**
  - Identificação de acabamento: Normal, Foil, Holofoil, Reverse Holo e Secret Rare.
  - Efeitos visuais realistas de brilho e reflexo de cartas raras.

- **💾 Persistência Local & Sem Dependência de Cadastro:**
  - Armazenamento automático via LocalStorage.
  - Sistema de exportação e importação de backups JSON das suas coleções.

- **⚡ Interface Rápida e Responsiva:**
  - Construído com React 19, TypeScript e Tailwind CSS v4.
  - Tema Dark moderno, ícones Lucide e layout otimizado.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm`, `pnpm` ou `yarn`

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/binderdex.git
   cd binderdex
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000) (ou a porta indicada no terminal).

---

## 🌐 Como Fazer Deploy na Vercel

O projeto já inclui o arquivo `vercel.json` configurado com as regras de rewrite para Single Page Application (SPA), garantindo carregamento rápido e sem erros 404 em rotas.

### Opção 1: Pelo Dashboard da Vercel (Recomendado)

1. Faça o push do seu código para um repositório no **GitHub**, **GitLab** ou **Bitbucket**.
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique no botão **"Add New..."** → **"Project"**.
4. Importe o repositório do **BinderDex**.
5. As configurações padrão já serão detectadas automaticamente:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. (Opcional) No campo **Project Name**, defina `binderdex` para obter o subdomínio `binderdex.vercel.app` (se disponível).
7. Clique em **"Deploy"**.

Em poucos segundos, o seu site estará no ar com HTTPS e CDN global!

---

### Opção 2: Pelo Terminal via Vercel CLI

1. Instale o Vercel CLI globalmente (caso ainda não possua):
   ```bash
   npm i -g vercel
   ```

2. Na pasta raiz do projeto, execute:
   ```bash
   vercel
   ```

3. Para publicar a versão final de produção:
   ```bash
   vercel --prod
   ```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor local de desenvolvimento Vite |
| `npm run build` | Compila o projeto em TypeScript e empacota para produção na pasta `dist/` |
| `npm run preview` | Pré-visualiza localmente a compilação gerada em `dist/` |
| `npm run lint` | Executa a verificação estática de tipos (`tsc --noEmit`) |
| `npm run clean` | Remove arquivos de build anteriores |

---

## 📁 Estrutura de Pastas

```text
├── public/                 # Favicon SVG e assets públicos estáticos
├── src/
│   ├── components/         # Componentes da interface
│   │   ├── BinderCardSlot.tsx   # Bolso individual com suporte a drag & drop
│   │   ├── BinderCover.tsx      # Capa e contracapa realistas
│   │   ├── BinderListView.tsx   # Visão geral e grade de fichários
│   │   ├── BinderModal.tsx      # Modal de criação/edição de fichário
│   │   ├── BinderSpread.tsx     # Visão de páginas abertas (9 bolsos)
│   │   ├── CardSearchModal.tsx  # Busca e inclusão de cartas por jogo
│   │   └── Header.tsx           # Barra superior de navegação e busca
│   ├── services/           # Integrações de APIs de cartas (Pokémon, Scryfall, YGOPRODeck)
│   ├── types/              # Definições TypeScript (fichários, bolsos, jogos)
│   ├── utils/              # Persistência de dados (LocalStorage) e helpers
│   ├── App.tsx             # Componente raiz da aplicação
│   └── main.tsx            # Ponto de entrada React
├── vercel.json             # Configuração de deploy e rewrites para a Vercel
├── vite.config.ts          # Configuração do bundler Vite e plugins
└── package.json            # Metadados do projeto e dependências
```

---

## 🛡️ Licença

Este projeto é disponibilizado sob a licença [MIT](LICENSE). Cartas, nomes e logotipos de Pokémon, Magic: The Gathering e Yu-Gi-Oh! pertencem aos seus respectivos proprietários e editoras.
