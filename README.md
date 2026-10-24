# 🎀 Cinemateca • Minha Coleção Pessoal

Aplicativo elegante, delicado e organizado com estética **coquette streaming** para catalogar filmes e séries assistidos, construído com arquitetura *offline-first*, persistência nativa via **IndexedDB**, instalação como **PWA**, sistema de **Backup e Restauração** e **Sincronização na Nuvem via Supabase**.

---

## 🛠️ Stack Tecnológica

- **Vite** (bundler ultrarrápido com hot reload)
- **React 19** + **TypeScript** (tipagem estrita e componentes modulares)
- **Tailwind CSS v4** (sistema de design com paleta blush, rosa antigo e vinho suave)
- **IndexedDB Nativo** (armazenamento local offline-first para registros e capas binárias `Blob`)
- **Supabase** (`@supabase/supabase-js` para autenticação por e-mail, banco de dados PostgreSQL com RLS e Storage de capas)
- **PWA & Service Worker** (instalação no celular e desktop com cache de recursos estáticos e fontes)
- **Lucide React** (iconografia consistente)

---

## ✨ Funcionalidades

### 1. Autenticação e Nuvem Supabase
- **Login por E-mail e Senha**: Cadastro de novos usuários e login integrado com Supabase Auth.
- **Banco de Dados PostgreSQL**: Tabela `media_items` com políticas de segurança em nível de linha (Row Level Security - RLS), garantindo que cada usuário acesse apenas seus próprios dados.
- **Armazenamento de Capas na Nuvem**: Upload automático de capas locais (`Blob`) para o bucket `media-covers` no Supabase Storage.
- **Configuração Fácil**: Suporte a variáveis de ambiente (`.env`) e tela intuitiva no aplicativo para salvar a URL e a Chave Anon diretamente pelo navegador.
- **Script de Migração**: Arquivo [supabase/schema.sql](file:///C:/Users/silva/.gemini/antigravity-ide/scratch/cinemateca/supabase/schema.sql) pronto para ser executado no SQL Editor do Supabase.

### 2. Sincronização Bidirecional Offline-First
- **Trabalho Offline Ininterrupto**: O catálogo funciona 100% mesmo sem internet ou sem login. Registros e capas são salvos localmente no IndexedDB.
- **Sincronização Automática ao Reconectar**: Ao restabelecer a conexão com a internet, o aplicativo detecta o evento de rede e envia alterações pendentes para o Supabase.
- **Sincronização de Exclusões**: Itens excluídos offline são marcados para remoção na nuvem na próxima conexão (soft delete local -> hard delete remoto).
- **Download para Cache Offline**: Ao sincronizar títulos da nuvem para o aparelho, as capas são baixadas como `Blob` binário e gravadas no IndexedDB para continuarem disponíveis sem internet.
- **Selo de Status**: Indicador visual dinâmico com contagem de pendências, status de envio e botão de sincronização manual.

### 3. Avaliações com Meias Estrelas (0,5 a 5,0)
- Escala completa permitida: `0,5`, `1,0`, `1,5`, `2,0`, `2,5`, `3,0`, `3,5`, `4,0`, `4,5` e `5,0` estrelas.
- Seleção intuitiva com divisão visual das estrelas (metade esquerda e direita) sensíveis ao toque e clique.
- Botões de passo fino `[ -0,5 ]` e `[ +0,5 ]` para máxima facilidade em telas de smartphones.
- Renderização visual precisa de estrelas cheias, meias estrelas e estrelas vazias nos cards, detalhes e formulários.
- Persistência decimal exata no IndexedDB e Supabase sem arredondamentos indesejados.

### 4. PWA e Funcionamento 100% Offline
- **Service Worker (`public/sw.js`)**: Cache estático com estratégia *Network-First com fallback de cache* para páginas e *Cache-First* para assets e fontes.
- **Manifest PWA (`public/manifest.json`)**: Configurado com nome "Cinemateca", cores do tema `#fdf8f8`, ícones 192x192 e 512x512 em modo `standalone`.
- **Indicador de Conexão**: Badge discreto no topo indicando status `Conectado à Internet` ou `Modo Offline`, com explicação interativa sobre o funcionamento local.

### 5. Sistema de Backup e Restauração
- Acessível pelo botão **"Backup"** no cabeçalho.
- **Exportar Backup**: Gera um arquivo JSON independente contendo todos os registros e as capas convertidas em Base64 Data URLs.
- **Restaurar Backup**: Validação rigorosa de integridade, contagem de novos registros, detecção de conflitos de ID e 3 políticas de mesclagem selecionáveis.

---

## ⚡ Como Configurar o Supabase

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. No painel do seu projeto, acesse **SQL Editor** e cole o conteúdo do arquivo [supabase/schema.sql](file:///C:/Users/silva/.gemini/antigravity-ide/scratch/cinemateca/supabase/schema.sql). Clique em **Run**.
3. Obtenha as credenciais em **Project Settings > API**:
   - `Project URL`
   - `anon public key`
4. Crie um arquivo `.env` na raiz da pasta `cinemateca` (baseado no `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
   ```
   *Alternativamente, você pode clicar em **"Entrar na Nuvem" > "Configurar credenciais"** diretamente na interface do aplicativo.*

---

## 🚀 Como Executar o Projeto

No terminal dentro da pasta `cinemateca`:

```bash
# 1. Iniciar servidor de desenvolvimento local
npm run dev

# 2. Compilar e validar tipos para produção
npm run build

# 3. Pré-visualizar a versão compilada
npm run preview
```

O aplicativo estará acessível em: `http://localhost:5173/`
