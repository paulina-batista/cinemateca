import type { MediaItem, SortMode } from '../types/media';

/**
 * Remove acentuação e diacríticos para comparação consistente.
 */
export function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza o título para ordenação alfabética ignorando artigos iniciais
 * (português, inglês e francês).
 * Exemplos:
 * "O Fabuloso Destino de Amélie Poulain" -> "Fabuloso Destino de Amélie Poulain"
 * "The Crown" -> "Crown"
 * "A Garota Exemplar" -> "Garota Exemplar"
 */
export function getSortableTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const trimmed = rawTitle.trim();

  // Regex para artigos iniciais comuns
  const articleRegex = /^(o|a|os|as|um|uma|uns|umas|the|an|a|le|la|les)\s+|^l['’]/i;
  const withoutArticle = trimmed.replace(articleRegex, '');

  const cleaned = withoutArticle.trim();
  return cleaned.length > 0 ? cleaned : trimmed;
}

/**
 * Compara dois títulos considerando normalização de artigos e diacríticos.
 */
export function compareTitles(titleA: string, titleB: string): number {
  const sortA = removeDiacritics(getSortableTitle(titleA)).toLowerCase();
  const sortB = removeDiacritics(getSortableTitle(titleB)).toLowerCase();

  const primaryDiff = sortA.localeCompare(sortB, 'pt-BR', { sensitivity: 'base' });
  if (primaryDiff !== 0) return primaryDiff;

  // Se empatar sem artigo, desempata pelo título completo original
  return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
}

/**
 * Ordena a lista de itens de acordo com o modo escolhido.
 * O padrão obrigatório do projeto é ordem alfabética inteligente por título.
 */
export function sortMediaItems(items: MediaItem[], mode: SortMode = 'title-asc'): MediaItem[] {
  const list = [...items];

  switch (mode) {
    case 'title-asc':
      return list.sort((a, b) => compareTitles(a.title, b.title));
    case 'title-desc':
      return list.sort((a, b) => compareTitles(b.title, a.title));
    case 'rating-desc':
      return list.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return compareTitles(a.title, b.title);
      });
    case 'rating-asc':
      return list.sort((a, b) => {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return compareTitles(a.title, b.title);
      });
    case 'recent':
      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    case 'status':
      return list.sort((a, b) => {
        const statusA = (a.status || '').toLowerCase();
        const statusB = (b.status || '').toLowerCase();
        const statusDiff = statusA.localeCompare(statusB, 'pt-BR');
        if (statusDiff !== 0) return statusDiff;
        return compareTitles(a.title, b.title);
      });
    default:
      return list.sort((a, b) => compareTitles(a.title, b.title));
  }
}

/**
 * Realiza busca inteligente por termo, sem diferenciar maiúsculas/minúsculas
 * e tolerante a acentos no título e no gênero.
 */
export function filterMediaItems(items: MediaItem[], query: string): MediaItem[] {
  const normalizedQuery = removeDiacritics(query.trim()).toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const normalizedTitle = removeDiacritics(item.title).toLowerCase();
    const normalizedGenre = removeDiacritics(item.genre).toLowerCase();

    return normalizedTitle.includes(normalizedQuery) || normalizedGenre.includes(normalizedQuery);
  });
}
