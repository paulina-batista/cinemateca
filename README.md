# 🎬 Kino — Curadoria Pessoal de Arte e Mídias

Aplicação cinematográfica e refinada para catalogar filmes e séries, com estética inspirada no **Google Stitch**, sincronização em nuvem via **Supabase**, prevenção nativa de títulos duplicados, cartazes em alta resolução e experiência responsiva otimizada para celular (3 cartazes por linha) e desktop.

---

## 🎨 Identidade Visual e Paleta Oficial

O Kino adota uma paleta exclusiva e sofisticada:

| Token | Nome | Hexadecimal | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Primary** | Vinho profundo | `#781D33` | Identidade principal, botões de ação, abas ativas e etiqueta "Último adicionado" |
| **Secondary** | Dourado | `#C99A4E` | Detalhes nobres, estrelas de avaliação, ícones destacados e bordas especiais |
| **Tertiary** | Vinho rosado | `#8C253E` | Estados de hover, botões secundários e variações de contraste |
| **Neutral** | Bordô quase preto | `#1E080D` | Tipografia principal, títulos, contrastes escuros |

---

## 🛠️ Stack Tecnológica

- **Vite 8** (bundler de alta performance)
- **React 19** + **TypeScript** (tipagem estrita e arquitetura componentizada)
- **Tailwind CSS v4** (sistema de design baseado em tokens Kino)
- **Supabase** (`@supabase/supabase-js`)
  - Banco de Dados PostgreSQL com políticas RLS (Row Level Security)
  - Realtime subscriptions para sincronização entre computador e celular
  - Storage resiliente para capas (armazenamento em nuvem com fallback Base64)
- **IndexedDB Nativo** (cache local de alta performance com migração automática na autenticação)
- **PWA & Service Worker** (instalação nativa em Android e iOS)
- **Lucide React** (iconografia minimalista)

---

## ✨ Recursos Principais

### 1. Destaque Especial para o "Último Adicionado"
- Banner em destaque (hero card) estilizado com a cor **Primary (`#781D33`)** e detalhes dourados.
- Identificação visual elegante indicando o título mais recente adicionado à biblioteca.
- Atualização em tempo real baseada na data de criação original (`createdAt`).

### 2. Prevenção Rigorosa contra Títulos Duplicados
- **Camada Frontend**: Comparação *case-insensitive* e remoção de espaços nas extremidades (*trim*). Bloqueia cadastros duplicados com a mensagem amigável: *"Este título já está na sua biblioteca."*
- **Camada Banco de Dados (Supabase)**: Índice único condicional `uq_media_items_user_type_title` por usuário, tipo e título normalizado (`LOWER(TRIM(title))`).

### 3. Sincronização Unificada (Celular ↔ Computador)
- O Supabase é a fonte central da biblioteca: títulos adicionados no celular aparecem imediatamente no computador e vice-versa.
- Migração automática e segura de dados locais existentes no celular para o Supabase no momento do login, sem duplicatas e sem sobrescrever registros remotos.
- Realtime listeners para atualização instantânea sem necessidade de recarregar a página.

### 4. Responsividade Mobile-First
- **Celular**: Grade estrita de **3 cartazes por linha**, proporção 2:3 perfeita para capas, textos legíveis e respeito às áreas seguras (*safe-area-insets*).
- **Desktop**: Grid expandido com até 6 colunas, aproveitando o espaço de forma cinematográfica.
- **Botão Flutuante Único (+)**: Acesso rápido no canto inferior direito para adicionar títulos em qualquer tela.

### 5. Exclusivo para Filmes e Séries
- Interface focada e enxuta, sem distrações de livros ou jogos.
- Registros legados preservados de forma íntegra no banco de dados.

---

## ⚡ Configuração do Supabase

O projeto vem com credenciais pré-configuradas de forma permanente no cliente frontend. Caso queira configurar seu próprio banco de dados, aplique a migração em [supabase/migrations/20261101_kino_schema.sql](file:///C:/Users/silva/.gemini/antigravity-ide/scratch/cinemateca/supabase/migrations/20261101_kino_schema.sql).

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://jcfxgcynetnojlvphkgt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_7RhpQjMWhsA3n5WwPG7kEA_HU5G59Wr
```

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Compilar para produção e checar tipos
npm run build
```
