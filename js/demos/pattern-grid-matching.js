export const meta = {
  id: 'pattern-grid-matching',
  title: 'Bandingkan pola dengan template',
  description: 'Ubah kotak pola baru. Demo menghitung jumlah sel yang berbeda dari template A dan B.'
};

const TEMPLATE_A = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1];
const TEMPLATE_B = [1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0];
const INITIAL_PATTERN = [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1];
let instanceCount = 0;

export function mount(container) {
  const controller = new AbortController();
  const { signal } = controller;
  const root = document.createElement('section');
  root.className = 'demo-widget';
  const heading = document.createElement('h4');
  heading.textContent = meta.title;
  const description = document.createElement('p');
  description.id = `grid-demo-help-${++instanceCount}`;
  description.textContent = 'Pilih sel pada grid Huruf baru untuk membalik nilainya. Pola dibandingkan dengan menghitung jumlah sel yang berbeda.';
  root.append(description);

  const grids = document.createElement('div');
  grids.className = 'pattern-grid-cards';
  const pattern = [...INITIAL_PATTERN];
  const interactiveCells = [];
  const makeCard = (name, values, interactive = false) => {
    const card = document.createElement('section');
    card.className = 'pattern-grid-card';
    const cardHeading = document.createElement('h5');
    cardHeading.textContent = name;
    const grid = document.createElement('div');
    grid.className = `pattern-grid${interactive ? ' is-interactive' : ''}`;
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', name);
    grid.setAttribute('aria-describedby', description.id);
    values.forEach((value, index) => {
      const cell = document.createElement(interactive ? 'button' : 'span');
      if (interactive) {
        cell.type = 'button';
        cell.setAttribute('aria-pressed', String(Boolean(value)));
        cell.setAttribute('aria-label', `${name}, baris ${Math.floor(index / 4) + 1}, kolom ${index % 4 + 1}, nilai ${value}`);
        cell.addEventListener('click', () => {
          pattern[index] = pattern[index] ? 0 : 1;
          update();
        }, { signal });
        interactiveCells.push(cell);
      } else {
        cell.setAttribute('aria-hidden', 'true');
      }
      cell.className = `pattern-grid-cell${value ? ' is-on' : ''}`;
      cell.textContent = String(value);
      if (interactive) cell.setAttribute('aria-label', `${name}, baris ${Math.floor(index / 4) + 1}, kolom ${index % 4 + 1}, nilai ${value}`);
      grid.append(cell);
    });
    card.append(cardHeading, grid);
    return card;
  };

  grids.append(makeCard('Template A', TEMPLATE_A), makeCard('Template B', TEMPLATE_B), makeCard('Huruf baru', pattern, true));
  const result = document.createElement('p');
  result.className = 'pattern-grid-result notice';
  result.setAttribute('role', 'status');
  result.setAttribute('aria-live', 'polite');
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'button secondary';
  reset.textContent = 'Pulihkan pola awal';

  function update() {
    interactiveCells.forEach((cell, index) => {
      const value = pattern[index];
      cell.textContent = String(value);
      cell.classList.toggle('is-on', Boolean(value));
      cell.setAttribute('aria-pressed', String(Boolean(value)));
    });
    const diffA = pattern.reduce((sum, value, index) => sum + Number(value !== TEMPLATE_A[index]), 0);
    const diffB = pattern.reduce((sum, value, index) => sum + Number(value !== TEMPLATE_B[index]), 0);
    const outcome = diffA === diffB ? 'jaraknya sama, hasil seri' : `lebih mirip template ${diffA < diffB ? 'A' : 'B'}`;
    result.textContent = `Sel berbeda — A: ${diffA}; B: ${diffB}. Pola baru ${outcome}.`;
  }

  reset.addEventListener('click', () => {
    pattern.splice(0, pattern.length, ...INITIAL_PATTERN);
    update();
    interactiveCells[0]?.focus();
  }, { signal });
  root.append(heading, grids, result, reset);
  container.replaceChildren(root);
  update();
  return () => controller.abort();
}
