const htmlCharacters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => htmlCharacters[char]);
export const integer = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
export const decimal = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
export const money = (value, digits = 2) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits
}).format(value);
export function dataCivil(value) {
  if (!value) return '';
  if (value.length === 10) return value;
  return new Date(value).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
}
export const date = value => value ? new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric'
}).format(new Date(dataCivil(value) + 'T12:00:00Z')).replaceAll(' de ', ' ') : '—';
export function monthName(month, short = false) {
  const label = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: short ? 'short' : 'long',
    ...(short ? {} : { year: 'numeric' }) }).format(new Date(month + '-01T12:00:00Z')).replace('.', '');
  return label[0].toUpperCase() + label.slice(1);
}
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const matches = (phrase, ...fields) => fields.some(value => normalize(value).includes(normalize(phrase.trim())));
export const formatMetric = (value, format) => ({
  money: () => money(value, 0), currency: () => money(value), percent: () => decimal(value) + '%',
  decimal: () => decimal(value)
}[format] ?? (() => integer(value)))();

export function options(items, selected = '') {
  return items.map(([value, label]) => `<option value="${esc(value)}"${String(value) === String(selected ?? '') ? ' selected' : ''}>${esc(label)}</option>`).join('');
}

export function field(name, label, config = {}) {
  const { type = 'text', value, placeholder, required, min, max, step, choices, wide } = config;
  const constraints = [required ? 'required' : '', min != null ? `min="${esc(min)}"` : '',
    max != null ? `max="${esc(max)}"` : '', step ? `step="${esc(step)}"` : ''].join(' ');
  const caption = `<span>${esc(label)}${required ? ' *' : ''}</span>`;
  const attrs = `name="${esc(name)}" ${constraints} placeholder="${esc(placeholder)}"`;
  const control = choices ? `<select ${attrs}>${options(choices, value)}</select>`
    : type === 'textarea' ? `<textarea ${attrs}>${esc(value)}</textarea>`
    : type === 'checkbox' ? `<input type="checkbox" ${attrs} ${value ? 'checked' : ''}>`
    : `<input type="${type}" ${attrs} value="${esc(value)}">`;
  return `<label class="field ${wide ? 'span' : ''} ${type === 'checkbox' ? 'check' : ''}">${type === 'checkbox' ? control + caption : caption + control}</label>`;
}

export const status = (text, color = '') => `<span class="pill ${color}">${esc(text)}</span>`;
export const icon = name => `<img src="assets/${name}.svg" alt="">`;
export const link = (text, hash, css = 'text-btn') => `<a class="${css}" href="#${hash}">${esc(text)}</a>`;
export function button(text, action, css = 'btn', value = '', asset = '') {
  return `<button type="button" class="${css}" data-action="${action}" data-value="${esc(value)}"${asset ? ` aria-label="${esc(text)}" title="${esc(text)}"` : ''}>${asset ? icon(asset) : esc(text)}</button>`;
}
export const submit = (text, css = 'btn primary') => `<button class="${css}" type="submit">${esc(text)}</button>`;
export const formError = '<p class="form-error" role="alert"></p>';
export const empty = text => `<p class="empty">${esc(text)}</p>`;
export const columns = (count, content) => `<div class="fields" style="--fields:${count}">${content}</div>`;
export const listOptions = (records, text = row => row.dados.nome, prompt = 'Selecione') =>
  [['', prompt], ...records.map(record => [record.id, text(record)])];
export const selected = (list, id) => list.find(record => record.id === id)?.dados;
export const named = (list, id) => esc(selected(list, id)?.nome ?? '—');
export const sub = (text, detail) => `<strong>${esc(text)}</strong><small>${esc(detail)}</small>`;

export function table(headers, rows, rowHeight = 58) {
  const body = rows.length ? rows.map((row, index) => `<tr class="reveal" style="--i:${index}">
    ${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('') :
    `<tr><td colspan="${headers.length}">Nenhum registro encontrado.</td></tr>`;
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabela de resultados"><table style="--row-height:${rowHeight}px">
    <thead><tr>${headers.map(label => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function search(name, placeholder, value, showIcon = true) {
  return `<label class="search">${showIcon ? icon('search') : ''}<input type="search" data-filter="${name}"
    aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" value="${esc(value)}"></label>`;
}
export function selectFilter(name, label, choices, value) {
  return `<select class="btn" data-filter="${name}" aria-label="${esc(label)}">${options(choices, value)}</select>`;
}
export function tabs(name, items, current) {
  return `<div class="tabs" role="group" aria-label="Filtros">
    ${items.map(([value, label]) => `<button type="button" class="tab" data-action="${name}" data-value="${esc(value)}"
      aria-pressed="${String(value) === String(current)}">${esc(label)}</button>`).join('')}</div>`;
}

export function paginate(rows, page, limit, unit) {
  const pages = Math.max(1, Math.ceil(rows.length / limit));
  const safe = Math.max(1, Math.min(page, pages));
  const offset = (safe - 1) * limit;
  const data = rows.slice(offset, offset + limit);
  const pageBtn = (target, label, aria, disabled = false, current = false) =>
    `<button type="button" data-action="page" data-value="${target}" aria-label="${aria}" ${disabled ? 'disabled' : ''} ${current ? 'aria-current="page"' : ''}>${label}</button>`;
  const first = Math.min(Math.max(1, safe - 1), Math.max(pages - 2, 1));
  const labels = Array.from({ length: Math.min(pages, 3) }, (_, index) => {
    const target = first + index;
    return pageBtn(target, target, 'Página ' + target, false, target === safe);
  }).join('');
  return { data, footer: `<footer class="table-foot"><span>${rows.length ? `Mostrando ${offset + 1}–${offset + data.length} de ${rows.length} ${unit}` : '0 ' + unit}</span>
    ${pages > 1 ? `<div class="pagination">${pageBtn(safe - 1, '←', 'Página anterior', safe === 1)}${labels}
    ${pageBtn(safe + 1, '→', 'Próxima página', safe === pages)}</div>` : ''}</footer>` };
}

export function metrics(items) {
  return `<div class="metrics" style="--cols:${items.length}">${items.map(({title,value,format,note,aside,accent}, index) =>
    `<article class="metric panel reveal" style="--i:${index};--metric-color:${accent ?? 'var(--orange)'}"><span class="label">${accent ? '<i></i>' : ''}${esc(title)}</span>
    ${value == null ? '<strong>—</strong>' : `<strong data-counter="${value}" data-format="${format ?? ''}">${formatMetric(value, format)}</strong>`}
    ${aside ? `<small>${esc(aside)}</small>` : ''}<small class="metric-note">${note ?? ''}</small></article>`).join('')}</div>`;
}

export function panelHead(title, subtitle = '', action = '', large = false) {
  return `<header class="panel-head"><div><h2${large ? ' class="large"' : ''}>${title}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${action}</header>`;
}
export function formPanel(title, subtitle, contents, note = '') {
  return `<section class="panel form-panel"><header><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></header>
    ${contents}${note ? `<footer>${esc(note)}</footer>` : ''}</section>`;
}
export const notice = (title, body) => `<aside class="notice"><strong>${esc(title)}</strong>${esc(body)}</aside>`;
export const badge = active => status(active ? 'Ativo' : 'Inativo', active ? 'green' : '');
export const download = recurso => button('↓  Exportar', 'export', 'btn wide', recurso);
