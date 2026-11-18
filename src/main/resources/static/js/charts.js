let activeChart;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const font = () => getComputedStyle(document.body).fontFamily;
const easing = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

export function contar(root, format) {
  for (const label of root.querySelectorAll('[data-counter]')) {
    const value = Number(label.dataset.counter);
    const type = label.dataset.format;
    if (reduced()) { label.textContent = format(value, type); continue; }
    const start = performance.now();
    function frame(now) {
      if (!label.isConnected) return;
      const t = Math.min((now - start) / 620, 1);
      label.textContent = format(value * easing(t), type);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}

export function destruirGrafico() {
  activeChart?.destroy();
  activeChart = undefined;
}

export function grafico(canvas, labels, values, { format, min, max, step, callout = false, pointLabels = false, secondary = false }) {
  if (!canvas || !labels.length) return;
  const lineColor = token(secondary ? '--orange' : '--accent');
  const areaColor = token(secondary ? '--orange-soft' : '--accent-soft');
  const labelColor = token(secondary ? '--orange-text' : '--accent');
  const context = canvas.getContext('2d');
  if (!window.Chart) {
    desenharLocal(canvas, labels, values, { format, lineColor, areaColor, labelColor, min, max, step, callout, pointLabels });
    return;
  }
  const detail = {
    id: 'chargefitChartDetail',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      const points = chart.getDatasetMeta(0).data;
      ctx.save();
      ctx.font = '600 11px ' + font();
      if (pointLabels) points.forEach((point, index) => {
        if (values[index] === null) return;
        ctx.textAlign = 'center';
        ctx.fillStyle = labelColor;
        ctx.fillText(format(values[index]), point.x, point.y - 12);
      });
      if (callout && points.length) {
        const point = points.at(-1), text = format(values.at(-1));
        const width = Math.max(113, ctx.measureText(text).width + 24);
        const x = Math.max(chartArea.left, Math.min(point.x + 8 - width, chartArea.right - width));
        const y = Math.max(1, point.y - 43);
        ctx.fillStyle = token('--accent');
        ctx.beginPath();
        ctx.roundRect(x, y, width, 29, 6);
        ctx.fill();
        ctx.fillStyle = token('--canvas');
        ctx.textAlign = 'left';
        ctx.fillText(text, x + 12, y + 18);
      }
      ctx.restore();
    }
  };
  activeChart = new window.Chart(context, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: lineColor, backgroundColor: areaColor,
      fill: true, tension: 0, borderWidth: 3, pointRadius: 3.5, pointHoverRadius: 5, pointBackgroundColor: lineColor }] },
    plugins: [detail],
    options: {
      responsive: true, maintainAspectRatio: false, animation: reduced() ? false : { duration: 600, easing: 'easeInOutCubic' },
      layout: { padding: { top: 19, right: 5 } },
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: token('--canvas'), titleColor: token('--accent'), bodyColor: token('--text'), titleFont: { family: font() }, bodyFont: { family: font() },
        cornerRadius: 6, borderColor: token('--field-border'), borderWidth: 1, displayColors: false, callbacks: { label: item => format(item.parsed.y) }
      } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: token('--muted'), font: { family: font(), size: 10 } } },
        y: { min, max, border: { display: false }, grid: { color: token('--border') },
          ticks: { color: token('--muted'), stepSize: step, maxTicksLimit: 5, padding: 13,
            font: { family: font(), size: 10 }, callback: format } }
      }
    }
  });
}

function desenharLocal(canvas, labels, values, { format, lineColor, areaColor, labelColor, min, max, step, callout, pointLabels }) {
  const context = canvas.getContext('2d'), ratio = devicePixelRatio || 1;
  const minValue = min ?? Math.min(...values.filter(Number.isFinite));
  const maxValue = Math.max(max ?? Math.max(...values), minValue + 1);
  const started = performance.now();
  let frame;
  function draw(now) {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (width < 20 || height < 20) return;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    const left = Math.min(70, width / 4), right = width - 12, top = 24, bottom = height - 30;
    const x = index => labels.length === 1 ? (left + right) / 2 : left + index * (right - left) / (labels.length - 1);
    const progress = reduced() ? 1 : Math.min(Math.max(0, (now - started) / 500), 1);
    const y = value => bottom - (value - minValue) / (maxValue - minValue) * (bottom - top) * easing(progress);
    context.font = '10px ' + font();
    context.fillStyle = token('--muted');
    context.strokeStyle = token('--border');
    const count = step ? Math.min(6, Math.round((maxValue - minValue) / step)) : 3;
    for (let index = 0; index <= count; index++) {
      const py = bottom - index / Math.max(1, count) * (bottom - top);
      context.beginPath(); context.moveTo(left, py); context.lineTo(right, py); context.stroke();
      context.fillText(format(minValue + (maxValue - minValue) * index / Math.max(1, count)), 0, py + 4);
    }
    context.textAlign = 'center';
    labels.forEach((label, index) => context.fillText(label, x(index), height - 5));
    const points = values.flatMap((value, index) => Number.isFinite(value) ? [[x(index),y(value),value]] : []);
    if (!points.length) return;
    const line = () => { context.beginPath(); points.forEach(([px,py], index) => index ? context.lineTo(px,py) : context.moveTo(px,py)); };
    line(); context.lineTo(points.at(-1)[0], bottom); context.lineTo(points[0][0], bottom); context.closePath();
    context.fillStyle = areaColor; context.fill();
    line(); context.lineWidth = 3; context.strokeStyle = lineColor; context.stroke();
    points.forEach(([px,py,value]) => {
      context.fillStyle = lineColor; context.beginPath(); context.arc(px,py,3.5,0,Math.PI*2); context.fill();
      if (pointLabels) { context.fillStyle = labelColor; context.fillText(format(value),px,py-12); }
    });
    if (callout) {
      const [px,py,value] = points.at(-1), leftBox = Math.max(left,px-113), topBox = Math.max(0,py-43);
      context.fillStyle = token('--accent'); context.beginPath(); context.roundRect(leftBox,topBox,113,29,6); context.fill();
      context.fillStyle = token('--canvas'); context.textAlign = 'left'; context.fillText(format(value),leftBox+12,topBox+18);
    }
    if (progress < 1) frame = requestAnimationFrame(draw);
  }
  const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); });
  observer.observe(canvas.parentElement);
  frame = requestAnimationFrame(draw);
  activeChart = { destroy() { observer.disconnect(); cancelAnimationFrame(frame); } };
}
