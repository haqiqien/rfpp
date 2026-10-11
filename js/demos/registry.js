const loaders = {
  'pattern-grid-matching': () => import('./pattern-grid-matching.js'),
  'fruit-diameter-likelihood': () => import('./fruit-diameter-likelihood.js')
};

export function loadDemo(id) {
  return loaders[id]?.() ?? Promise.reject(new Error(`Demo ${id} belum terdaftar.`));
}
