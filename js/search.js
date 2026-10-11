export function normalizeText(value) {
  return String(value || '').toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function searchIndex(entries, query) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  for (const entry of entries) {
    let score = 0;
    const title = normalizeText(entry.title);
    const headings = (entry.headings || []).map(normalizeText);
    const text = normalizeText(entry.text);
    for (const term of terms) {
      if (title.includes(term)) score += title === term ? 12 : 8;
      for (const heading of headings) if (heading.includes(term)) score += heading === term ? 6 : 4;
      if (text.includes(term)) score += 1;
      if ((entry.tags || []).some(tag => normalizeText(tag).includes(term))) score += 2;
    }
    if (score > 0) results.push({ ...entry, score });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'id'));
}
