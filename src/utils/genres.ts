// Gêneros oficiais do Kino (Filmes e Séries)
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
} as const;

export type GenresByType = typeof GENRES_BY_TYPE;

/** Retorna a lista de gêneros para Filmes ou Séries */
export function getGenresForType(type: 'movie' | 'series' | string): readonly string[] {
  if (type === 'series') return GENRES_BY_TYPE.series;
  return GENRES_BY_TYPE.movie;
}

export const POPULAR_GENRES = GENRES_BY_TYPE.movie;
export type PopularGenre = (typeof POPULAR_GENRES)[number];
