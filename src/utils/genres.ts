// Gêneros agrupados por categoria de conteúdo
export const GENRES_BY_TYPE = {
  movie: [
    'Romance', 'Comédia Romântica', 'Drama', 'Romance de Época', 'Fantasia',
    'Suspense / Mistério', 'Animação', 'Comédia', 'Aventura', 'Ficção Científica',
    'Terror', 'Documentário', 'Musical', 'Biografia', 'Ação', 'Thriller',
    'Crime', 'Faroeste', 'Histórico',
  ],
  series: [
    'Drama', 'Comédia', 'Romance', 'Suspense', 'Crime', 'Mistério',
    'Fantasia', 'Ficção Científica', 'Terror', 'Animação', 'Docussérie',
    'Reality', 'Mini-série', 'Histórica', 'Thriller',
  ],
  book: [
    'Romance', 'Fantasia', 'Ficção Científica', 'Mistério', 'Suspense',
    'Terror', 'Não-ficção', 'Biografia', 'Autoajuda', 'Clássico',
    'Infantil', 'Juvenil', 'Mangá', 'Poesia', 'Conto', 'Thriller',
    'Histórico', 'Crônica', 'Ensaio',
  ],
  game: [
    'RPG', 'Aventura', 'Ação', 'Plataforma', 'Puzzle', 'Estratégia',
    'Simulação', 'Esportes', 'Corrida', 'Terror', 'FPS', 'Luta',
    'Roguelike', 'Visual Novel', 'Indie', 'MMORPG', 'Música / Ritmo',
  ],
} as const satisfies Record<string, readonly string[]>;

export type GenresByType = typeof GENRES_BY_TYPE;

/** Retorna a lista de gêneros para um tipo de mídia */
export function getGenresForType(type: keyof GenresByType): readonly string[] {
  return GENRES_BY_TYPE[type] ?? GENRES_BY_TYPE.movie;
}

// Lista legada usada como fallback universal
export const POPULAR_GENRES = GENRES_BY_TYPE.movie;
export type PopularGenre = (typeof POPULAR_GENRES)[number];
