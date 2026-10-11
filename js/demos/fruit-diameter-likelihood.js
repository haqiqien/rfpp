export const meta = {
  id: 'fruit-diameter-likelihood',
  title: 'Peluang kelas menurut diameter buah',
  description: 'Slider diameter menampilkan kurva kepadatan ilustratif jeruk dan apel serta membandingkan nilainya.'
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 600;
const HEIGHT = 250;
const MEAN_ORANGE = 6;
const MEAN_APPLE = 8.5;
const SIGMA = 1.2;
let instanceCount = 0;

function normalDensity(value, mean, sigma) {
  return Math.exp(-0.5 * ((value - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

export function mount(container) {
  const controller = new AbortController();
  const { signal } = controller;
  const root = document.createElement('section');
  root.className = 'demo-widget';
  const heading = document.createElement('h4');
  heading.textContent = meta.title;
  const description = document.createElement('p');
  description.id = `fruit-demo-help-${++instanceCount}`;
  description.textContent = 'Geser diameter buah. Demo membandingkan dua kurva ilustratif dengan simpangan baku 1,2 cm.';
  const label = document.createElement('label');
  label.className = 'fruit-diameter-label';
  label.htmlFor = `fruit-diameter-${++instanceCount}`;
  label.textContent = 'Diameter buah (cm)';
  const slider = document.createElement('input');
  slider.id = label.htmlFor;
  slider.type = 'range';
  slider.min = '2';
  slider.max = '12';
  slider.step = '0.1';
  slider.value = '5.5';
  slider.setAttribute('aria-describedby', description.id);

  const chart = svgElement('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img', 'aria-describedby': description.id });
  const title = svgElement('title');
  title.textContent = 'Kurva kepadatan ilustratif jeruk dan apel';
  const desc = svgElement('desc');
  desc.textContent = 'Dua kurva normal dengan rata-rata diameter 6 cm dan 8,5 cm. Garis vertikal menunjukkan diameter terpilih.';
  chart.append(title, desc);
  const axis = svgElement('line', { x1: 34, y1: HEIGHT - 34, x2: WIDTH - 18, y2: HEIGHT - 34, stroke: 'currentColor', 'stroke-width': 1.5 });
  const orangePath = svgElement('path', { fill: 'none', stroke: 'var(--accent-2)', 'stroke-width': 3 });
  const applePath = svgElement('path', { fill: 'none', stroke: 'var(--err)', 'stroke-width': 3 });
  const marker = svgElement('line', { y1: 24, y2: HEIGHT - 34, stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
  const orangeLabel = svgElement('text', { y: 18, fill: 'var(--accent-2)', 'font-size': 14, 'text-anchor': 'middle' });
  orangeLabel.textContent = 'Jeruk (μ = 6 cm)';
  const appleLabel = svgElement('text', { y: 18, fill: 'var(--err)', 'font-size': 14, 'text-anchor': 'middle' });
  appleLabel.textContent = 'Apel (μ = 8,5 cm)';
  const axisLabel = svgElement('text', { x: WIDTH / 2, y: HEIGHT - 7, fill: 'currentColor', 'font-size': 13, 'text-anchor': 'middle' });
  axisLabel.textContent = 'Diameter (cm)';
  chart.append(axis, orangePath, applePath, marker, orangeLabel, appleLabel, axisLabel);

  const result = document.createElement('p');
  result.className = 'fruit-likelihood-result notice';
  result.setAttribute('role', 'status');
  result.setAttribute('aria-live', 'polite');

  const xPosition = value => 34 + ((value - 2) / 10) * (WIDTH - 52);
  const yPosition = density => HEIGHT - 34 - (density / 0.38) * (HEIGHT - 64);
  const makeCurve = mean => {
    const points = [];
    for (let value = 2; value <= 12.001; value += 0.1) {
      points.push(`${points.length ? 'L' : 'M'}${xPosition(value).toFixed(1)} ${yPosition(normalDensity(value, mean, SIGMA)).toFixed(1)}`);
    }
    return points.join(' ');
  };
  orangePath.setAttribute('d', makeCurve(MEAN_ORANGE));
  applePath.setAttribute('d', makeCurve(MEAN_APPLE));

  function update() {
    const diameter = Number(slider.value);
    const orange = normalDensity(diameter, MEAN_ORANGE, SIGMA);
    const apple = normalDensity(diameter, MEAN_APPLE, SIGMA);
    marker.setAttribute('x1', xPosition(diameter));
    marker.setAttribute('x2', xPosition(diameter));
    orangeLabel.setAttribute('x', xPosition(MEAN_ORANGE));
    appleLabel.setAttribute('x', xPosition(MEAN_APPLE));
    const choice = Math.abs(orange - apple) < 0.005 ? 'hampir seri' : orange > apple ? 'jeruk' : 'apel';
    result.textContent = `Diameter ${diameter.toFixed(1)} cm — p(d | jeruk): ${orange.toFixed(3)}; p(d | apel): ${apple.toFixed(3)}. Nilai lebih tinggi: ${choice}.`;
    chart.setAttribute('aria-label', `Kurva kepadatan ilustratif. Diameter ${diameter.toFixed(1)} cm: jeruk ${orange.toFixed(3)}, apel ${apple.toFixed(3)}.`);
  }
  slider.addEventListener('input', update, { signal });
  root.append(heading, description, label, slider, chart, result);
  container.replaceChildren(root);
  update();
  return () => controller.abort();
}
