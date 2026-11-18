import { carregarAcademia, consultar, modoDados, mutacao, recursos } from './api.js';
import { hoje } from './demo.js';
import { contar, destruirGrafico } from './charts.js';
import { campos, crudForm, payload, niveis, turnos } from './forms.js';
import { paginas, radar, receita, situacao, renderPagina, renderGrafico, atualizarResumoPlano } from './views.js';
import {
  esc, button, date, dataCivil, money, decimal, field, formError, formatMetric, link, matches, selected, status, submit
} from './ui.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const toast = document.querySelector('#toast');
const workspace = document.querySelector('#workspace');
const onboarding = document.querySelector('#onboarding');
const video = document.querySelector('#welcome-video');
const videoControl = document.querySelector('#welcome-video-control');
document.querySelector('#welcome-location').textContent = document.querySelector('#default-unit').textContent;
let videoPausedByUser = false;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const navigation = document.querySelector('#navigation');
const defaults = () => ({
  query:'', month:hoje().slice(0,7), period:6, plan:'', status:'', page:1,
  sort:'asc', shift:'', start:'', end:'', editId:'', studentId:'', history:false,
  metric:'peso', trainingId:'', session:0, trainingDraft:null
});
let state = defaults();
let database;
let current;
let toastTimer;
let loading;
let problem;
let dialogSequence = 0;

navigation.innerHTML = Object.entries(paginas).filter(([, config]) => config[2])
  .map(([key,[label,,asset]]) => `<a class="nav-link" data-route="${key}" href="#${key}"><span class="nav-icon" style="--nav-icon:url('${new URL('../assets/' + asset + '.svg', import.meta.url).href}')" aria-hidden="true"></span><span class="nav-label">${label}</span></a>`).join('');

function updateVideoControl() {
  videoControl.hidden = onboarding.hidden || motion.matches || !!video.error || video.readyState < 2;
  videoControl.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
}

function refreshVideo() {
  const source = video.querySelector('source');
  if (onboarding.hidden || motion.matches) {
    video.pause();
    if (motion.matches && source.hasAttribute('src')) {
      source.removeAttribute('src');
      video.load();
    }
    updateVideoControl();
    return;
  }
  if (!source.hasAttribute('src')) {
    source.src = source.dataset.src;
    video.load();
  }
  if (!videoPausedByUser) video.play().catch(updateVideoControl);
  updateVideoControl();
}

for (const event of ['loadeddata', 'play', 'pause', 'error', 'emptied']) {
  video.addEventListener(event, updateVideoControl);
}
videoControl.addEventListener('click', () => {
  if (video.paused) {
    videoPausedByUser = false;
    video.play().catch(updateVideoControl);
  } else {
    videoPausedByUser = true;
    video.pause();
  }
  updateVideoControl();
});
motion.addEventListener('change',refreshVideo);

function showToast(message) {
  toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 4200);
}

function route() {
  const fragment = location.hash.slice(1);
  const [page, query = ''] = fragment.split('?');
  if (page && !Object.hasOwn(paginas,page)) { location.replace('#visao-geral'); return; }
  if (dialog.open) dialog.close();
  current = page || null;
  onboarding.hidden = !!current;
  workspace.hidden = !current;
  refreshVideo();
  destruirGrafico();
  if (!current) {
    document.title = 'ChargeFit · Gestão Fitness';
    window.scrollTo(0,0);
    return;
  }

  const params = new URLSearchParams(query);
  state = {
    ...defaults(), query: params.get('busca') ?? '', editId: params.get('editar') ?? '',
    status: ({mensalidades:['atraso'],treinos:['vencer'],avaliacoes:['renovar']}[page] ?? []).find(value => value === params.get('filtro')) ?? '',
    ...(page === 'mensalidades' && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('mes') ?? '') ? {month:params.get('mes')} : {}),
    ...(page === 'treinos' ? {trainingId:params.get('ficha') ?? ''} : {})
  };
  const nav = page === 'novo-aluno' ? 'alunos' : page;
  for (const link of navigation.querySelectorAll('a')) {
    if (link.dataset.route === nav) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  document.querySelector('#breadcrumb').textContent = page === 'novo-aluno' ? 'Alunos / Novo aluno' : paginas[page][0];
  document.title = paginas[page][0] + ' · ChargeFit';
  window.scrollTo(0,0);
  render();
  main.focus({preventScroll:true});
  if (!database && !loading) load();
}

async function load({ quiet = false } = {}) {
  if (loading) return loading;
  problem = null;
  loading = carregarAcademia();
  if (!quiet) render();
  try { database = await loading; }
  catch (error) { problem = error; }
  finally { loading = null; }
  if (!quiet) render();
  return database;
}

function render({ preserveFocus = false, animate = true } = {}) {
  if (!current) return;
  const focused = preserveFocus ? document.activeElement : null;
  const filter = focused?.dataset.filter;
  const buttonAction = focused?.dataset.action;
  const buttonValue = focused?.dataset.value;
  const selection = filter && focused.tagName === 'INPUT' ? [focused.selectionStart,focused.selectionEnd] : null;
  destruirGrafico();
  if (problem) {
    main.removeAttribute('aria-busy');
    main.innerHTML = `<section class="panel form-panel"><h1>Não foi possível carregar os dados</h1>
      <p class="muted" role="alert">${esc(problem.message)}</p><div class="actions">
      ${button('Tentar novamente','retry')}${link('Abrir demonstração','visao-geral','btn demo-link')}</div></section>`;
    const demoLink = main.querySelector('.demo-link');
    demoLink.href = '?modo=demo#' + current;
    return;
  }
  if (!database) {
    main.setAttribute('aria-busy','true');
    main.innerHTML = '<p class="empty" role="status">Carregando dados da academia…</p><div class="metrics loading"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div><div class="skeleton"></div>';
    return;
  }
  main.removeAttribute('aria-busy');
  const { fonte, motivo } = modoDados();
  const banner = fonte === 'demo' ? `<aside class="notice banner" role="status">${esc(motivo)}Modo de demonstração. Alterações ficam neste navegador.
    <a class="text-btn" href="./#${current}"> Acessar a API</a></aside>` : '';

  main.innerHTML = banner + renderPagina(current,database,state);
  if (!animate) main.querySelectorAll('.enter,.reveal').forEach(node => node.classList.remove('enter','reveal'));
  else contar(main,formatMetric);
  renderGrafico(main,database,state,current);
  if (current === 'novo-aluno') atualizarResumoPlano(main,database,main.querySelector('[name="planoId"]')?.value);

  let next;
  if (filter) next = Array.from(main.querySelectorAll('[data-filter]')).find(el => el.dataset.filter === filter);
  else if (buttonAction) next = Array.from(main.querySelectorAll('[data-action]'))
    .find(el => el.dataset.action === buttonAction && el.dataset.value === buttonValue);
  if (next) {
    next.focus({preventScroll:true});
    if (selection) next.setSelectionRange(...selection);
  }
}

function openDialog(title, body) {
  dialogSequence++;
  dialog.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2>
    <form method="dialog"><button class="icon-btn" aria-label="Fechar">×</button></form></header>${body}`;
  if (!dialog.open) dialog.showModal();
  return dialogSequence;
}

function showCrud(recurso, record) {
  if (recurso === 'alunos') {
    location.hash = record ? 'novo-aluno?editar=' + encodeURIComponent(record.id) : 'novo-aluno';
    return;
  }
  const labels = {
    planos:['Novo plano','Editar plano'], professores:['Novo professor','Editar professor'],
    mensalidades:['Lançar mensalidade','Editar mensalidade'], treinos:['Nova ficha de treino','Editar ficha de treino'],
    avaliacoes:['Nova avaliação','Editar avaliação']
  };
  const context = { alunoId:database.alunos[0]?.id };
  openDialog(labels[recurso][Number(!!record)],crudForm(recurso,database,{record,title:record?'Salvar alterações':'Cadastrar',context}));
  if (recurso === 'mensalidades' && !record) fillPaymentPlan(dialog.querySelector('form[data-save]'));
}

function definition(items) {
  return `<dl class="dialog-details">${items.map(([name,value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value ?? '—')}</dd></div>`).join('')}</dl>`;
}
const nameOf = (key,id) => selected(database[key],id)?.nome ?? '—';
const humanStatus = value => ({paga:'Paga',atraso:'Em atraso',pendente:'Pendente'})[value];

function details(recurso,row) {
  const d = row.dados;
  const entries = {
    alunos: () => [['Nome',d.nome],['CPF',d.cpf],['E-mail',d.email],['Celular',d.celular],['Nascimento',date(d.nascimento)],
      ['Gênero',d.genero],['Plano',nameOf('planos',d.planoId)],['Professor',nameOf('professores',d.professorId)],
      ['Matrícula',date(d.inicioMatricula)],['Vencimento','Todo dia '+d.diaVencimento],['Situação',d.ativo?'Ativo':'Inativo']],
    mensalidades: () => [['Aluno',nameOf('alunos',d.alunoId)],['Plano',nameOf('planos',d.planoId)],
      ['Valor',money(d.valor)],['Vencimento',date(d.vencimento)],['Pagamento',date(d.dataPagamento)],['Situação',humanStatus(situacao(d))]],
    professores: () => [['Nome',d.nome],['CREF',d.cref],['E-mail',d.email],['Especialidade',d.especialidade],
      ['Turno',turnos.find(([value])=>value===d.turno)?.[1]],['Situação',d.ativo?'Em atividade':'Fora de atividade']],
    avaliacoes: () => [['Aluno',nameOf('alunos',d.alunoId)],['Professor',nameOf('professores',d.professorId)],['Data',date(d.data)],
      ['Peso',decimal(d.peso)+' kg'],['Altura',decimal(d.altura)+' cm'],['Gordura',d.gordura != null ? decimal(d.gordura)+'%' : '—'],
      ['Cintura',d.cintura != null ? decimal(d.cintura)+' cm' : '—'],['Objetivo',d.objetivo],['Reavaliação',date(d.reavaliacao)],['Observações',d.observacoes]]
  };
  return definition(entries[recurso]());
}

async function viewRecord(id) {
  const recurso = current;
  const sequence = openDialog('Consultando registro','<p role="status">Carregando…</p>');
  try {
    const row = await consultar(recurso,id);
    if (!row) throw new Error('Registro não encontrado.');
    if (!dialog.open || sequence !== dialogSequence) return;
    const title = { alunos:'Dados do aluno', professores:'Perfil profissional', mensalidades:'Recibo de mensalidade', avaliacoes:'Relatório de avaliação' }[recurso];
    openDialog(title,details(recurso,row) + '<div class="actions">'
      + button('Editar','edit','btn',id)
      + (recurso === 'mensalidades' ? button('Exportar recibo','receipt','btn',id) : '')
      + '</div>');
  } catch (error) {
    if (dialog.open && sequence === dialogSequence) openDialog('Falha na consulta','<p role="alert">'+esc(error.message)+'</p>');
  }
}

function confirmDeletion(id) {
  const record = database.alunos.find(row => row.id === id);
  if (!record) return;
  openDialog('Excluir aluno',`<form class="dialog-form" data-save="delete" data-id="${id}">
    <p>Deseja excluir o cadastro de <strong>${esc(record.dados.nome)}</strong>?</p>${formError}
    <div class="actions">${button('Cancelar','close')}${submit('Excluir aluno','btn danger')}</div></form>`);
}

function payment(id) {
  const row = database.mensalidades.find(record => record.id === id);
  if (!row) return;
  const d = row.dados;
  openDialog('Registrar pagamento',
    details('mensalidades',row) + `<form class="dialog-form" data-save="pagamento" data-id="${id}">
      ${field('dataPagamento','Data de pagamento',{type:'date',required:true,value:hoje(),max:hoje()})}
      ${formError}${submit('Confirmar pagamento')}</form>`);
}

function fillPaymentPlan(form) {
  const aluno = selected(database.alunos,form.elements.alunoId.value);
  form.elements.planoId.value = aluno?.planoId ?? '';
  form.elements.valor.value = selected(database.planos,aluno?.planoId)?.valorMensal ?? '';
}

function chosenTraining() {
  const active = main.querySelector('.ficha[aria-pressed="true"]');
  const id = active?.dataset.value;
  return state.trainingDraft?.id === id && state.trainingDraft ? state.trainingDraft
    : database.treinos.find(row => row.id === id);
}

function makeDraft() {
  const row = chosenTraining();
  if (!row) return null;
  state.trainingId = row.id;
  if (state.trainingDraft?.id !== row.id) state.trainingDraft = structuredClone(row);
  const sessions = state.trainingDraft.dados.sessoes;
  if (state.session >= sessions.length) state.session = 0;
  return state.trainingDraft;
}

function newSession() {
  openDialog('Novo treino',`<form class="dialog-form" data-save="sessao">${campos('sessao',null,database)}${formError}${submit('Adicionar treino')}</form>`);
}

function exercise(value) {
  const row = chosenTraining();
  const items = (row?.dados.sessoes[state.session] ?? row?.dados.sessoes[0])?.exercicios;
  if (!items) return;
  const currentExercise = items[Number(value)];
  openDialog(currentExercise ? 'Editar exercício' : 'Adicionar exercício',
    `<form class="dialog-form" data-save="exercicio" data-id="${esc(value)}">
    ${campos('exercicio',currentExercise,database)}${formError}<div class="actions">${submit('Aplicar na ficha')}
    ${currentExercise ? button('Excluir exercício','remove-exercise','btn',value) : ''}</div></form>`);
}

function exportCsv(resource, id) {
  const rows = database[resource] ?? [];
  let values;
  if (resource === 'visao-geral') values = [
    ['Indicador','Valor'],['Mês',state.month],['Receita',receita(database.mensalidades,state.month)],
    ['Alunos ativos',database.alunos.filter(row => row.dados.ativo).length],
    ...radar(database).map(([,count,title]) => [title,count])
  ];
  else if (resource === 'alunos') values = [['Nome','E-mail','Plano','Cadastro','Situação'],
    ...rows.filter(row => matches(state.query,row.dados.nome,row.dados.cpf,row.dados.email)
      && (!state.plan || row.dados.planoId === state.plan) && (!state.status || row.dados.ativo === (state.status==='ativo'))
      && (!state.start || dataCivil(row.criadoEm)>=state.start) && (!state.end || dataCivil(row.criadoEm)<=state.end))
      .map(row => [row.dados.nome,row.dados.email,nameOf('planos',row.dados.planoId),date(row.criadoEm),row.dados.ativo?'Ativo':'Inativo'])
  ];
  else if (resource === 'mensalidades') values = [['Aluno','Plano','Vencimento','Pagamento','Valor','Situação'],
    ...rows.filter(row => id ? row.id === id : row.dados.vencimento.startsWith(state.month)
      && (!state.status || state.status === situacao(row.dados)))
      .map(({dados:d}) => [nameOf('alunos',d.alunoId),nameOf('planos',d.planoId),date(d.vencimento),date(d.dataPagamento),money(d.valor),humanStatus(situacao(d))])
  ];
  else if (resource === 'professores') values = [['Professor','CREF','E-mail','Especialidade','Turno','Situação'],
    ...rows.filter(({dados:d}) => (!state.shift || d.turno===state.shift) && matches(state.query,d.nome,d.cref))
      .map(({dados:d}) => [d.nome,d.cref,d.email,d.especialidade,turnos.find(([value])=>value===d.turno)?.[1],d.ativo?'Em atividade':'Fora de atividade'])
  ];
  else values = [['Aluno','Avaliador','Data','Peso (kg)','Altura (cm)','Gordura (%)','Cintura (cm)','Observações'],
    ...rows.filter(row => row.dados.alunoId === main.querySelector('[data-filter="studentId"]')?.value)
      .map(({dados:d}) => [nameOf('alunos',d.alunoId),nameOf('professores',d.professorId),date(d.data),d.peso,d.altura,d.gordura,d.cintura,d.observacoes])
  ];
  const csvCell = value => {
    const raw = String(value ?? '');
    return '"' + (/^[\s]*[=+\-@]/.test(raw) && typeof value !== 'number' ? "'" : '') + raw.replaceAll('"','""') + '"';
  };
  const csv = '\ufeff' + values.map(row => row.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'chargefit-' + (id ? 'recibo' : resource) + '.csv';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}

function filter(name,value) {
  state[name] = value;
  if (name !== 'page') state.page = 1;
  if (name === 'studentId') state.history = false;
  render({preserveFocus:true,animate:['month','period','metric','studentId','session','trainingId'].includes(name)});
}

function extraFilters() {
  openDialog('Mais filtros',`<form class="dialog-form" data-save="filtros">
    ${field('start','Data inicial',{type:'date',value:state.start})}
    ${field('end','Data final',{type:'date',value:state.end})}
    ${formError}${submit('Aplicar filtros')}</form>`);
}

function globalSearch(event) {
  event.preventDefault();
  if (!database) return;
  const query = event.currentTarget.elements.query.value.trim();
  const studentRows = database.alunos.filter(({dados:d}) => matches(query,d.nome,d.email,d.cpf));
  const professors = database.professores.filter(({dados:d}) => matches(query,d.nome,d.cref,d.especialidade));
  const plans = database.planos.filter(({dados:d}) => matches(query,d.nome,d.descricao));
  const items = [
    ...studentRows.slice(0,5).map(row => [row.dados.nome,'Alunos','alunos?busca='+encodeURIComponent(row.dados.nome)]),
    ...professors.slice(0,5).map(row => [row.dados.nome,'Professores','professores?busca='+encodeURIComponent(row.dados.nome)]),
    ...plans.slice(0,5).map(row => [row.dados.nome,'Planos','planos'])
  ];
  openDialog('Resultados da busca',items.length ? '<ul class="search-results">'+items.map(([name,type,hash]) =>
    `<li>${link(name,hash)} <span class="muted">· ${type}</span></li>`).join('')+'</ul>' : '<p>Nenhum resultado encontrado.</p>');
}

document.querySelector('#global-search').addEventListener('submit',globalSearch);
main.addEventListener('input',event => {
  const input = event.target;
  if (input.matches('input[data-filter="query"]')) filter('query',input.value);
});
document.addEventListener('change',event => {
  const input = event.target;
  if (input.dataset.filter) filter(input.dataset.filter,input.value);
  if (input.name === 'planoId' && current === 'novo-aluno') atualizarResumoPlano(main,database,input.value);
  if (input.form?.dataset.save !== 'mensalidades') return;
  if (input.name === 'alunoId') fillPaymentPlan(input.form);
  if (input.name === 'planoId') input.form.elements.valor.value = selected(database.planos,input.value)?.valorMensal ?? '';
});

document.addEventListener('click',event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, value } = target.dataset;
  if (!database && !['retry','close'].includes(action)) return;
  switch (action) {
    case 'retry': load(); break;
    case 'close': dialog.close(); break;
    case 'new': showCrud(current); break;
    case 'edit': {
      const selectedRecord = database[current]?.find(r => r.id === value);
      if (selectedRecord) showCrud(current,selectedRecord);
      break;
    }
    case 'view': viewRecord(value); break;
    case 'delete': confirmDeletion(value); break;
    case 'pay': payment(value); break;
    case 'extra': extraFilters(); break;
    case 'export': exportCsv(value); break;
    case 'receipt': exportCsv('mensalidades',value); break;
    case 'status': filter('status',value); break;
    case 'metric': filter('metric',value); break;
    case 'history': filter('history',!state.history); break;
    case 'page': filter('page',Number(value)); break;
    case 'training':
      state.session = 0;
      filter('trainingId',value);
      break;
    case 'session': filter('session',Number(value)); break;
    case 'new-session': newSession(); break;
    case 'exercise': exercise(value); break;
    case 'duplicate-session': {
      const draft = makeDraft();
      if (!draft) break;
      const duplicated = structuredClone(draft.dados.sessoes[Number(value)]);
      duplicated.nome += ' (cópia)';
      draft.dados.sessoes.push(duplicated);
      filter('session',draft.dados.sessoes.length-1);
      break;
    }
    case 'remove-session': {
      const draft = makeDraft();
      if (!draft) break;
      draft.dados.sessoes.splice(Number(value),1);
      filter('session',0);
      break;
    }
    case 'remove-exercise': {
      const draft = makeDraft();
      draft?.dados.sessoes[state.session]?.exercicios.splice(Number(value),1);
      dialog.close();
      render({animate:false});
      break;
    }
    case 'save-training': saveTraining(target); break;
    case 'notifications': openDialog('Para verificar',`<ul class="search-results">${radar(database).map(([hash,count,title]) =>
      `<li>${link(title,hash)} ${status(count,'orange')}</li>`).join('')}</ul>`); break;
    case 'help': openDialog('Central de ajuda','<p>Use a navegação lateral para consultar cadastros e lançamentos. Os filtros e os botões de exportação ficam em cada módulo.</p>'); break;
    case 'settings': openDialog('Configurações','<p>Unidade exibida: ' + esc(document.querySelector('#default-unit').textContent) + '</p><p>Fonte dos dados: '
      + (modoDados().fonte === 'api' ? 'API da academia' : 'Demonstração neste navegador') + '</p>'); break;
  }
});

dialog.addEventListener('click',event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && anchor.hash === location.hash) dialog.close();
});

async function saveTraining(button) {
  const draft = state.trainingDraft;
  if (!draft || draft.id !== button.dataset.value) { showToast('A ficha está atualizada.'); return; }
  button.disabled = true;
  try {
    const saved = await mutacao('treinos',{method:'PUT',id:draft.id,dados:draft.dados});
    updateDatabase('treinos',saved);
    state.trainingDraft = null;
    showToast('Ficha atualizada.');
    render();
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
}

function updateDatabase(recurso,saved,id) {
  const records = database[recurso];
  if (!saved) database[recurso] = records.filter(row => row.id !== id);
  else if (records.some(row => row.id === saved.id)) database[recurso] = records.map(row => row.id === saved.id ? saved : row);
  else database[recurso] = [saved,...records];
}

function draftChange(type,form,id) {
  const draft = makeDraft();
  if (!draft) throw new Error('Selecione uma ficha.');
  if (type === 'sessao') {
    const data = payload(form,{exercicios:[]});
    draft.dados.sessoes.push(data);
    state.session = draft.dados.sessoes.length-1;
  } else {
    const items = draft.dados.sessoes[state.session].exercicios;
    const data = payload(form,{});
    if (id === 'new') items.push(data);
    else items[Number(id)] = data;
  }
  dialog.close();
  render();
}

document.addEventListener('submit',async event => {
  const form = event.target;
  const type = form.dataset.save;
  if (!type) return;
  event.preventDefault();
  if (form.dataset.saving) return;
  const errorBox = form.querySelector('.form-error');
  errorBox.textContent = '';
  const id = form.dataset.id || null;
  const page = current;
  const submitter = event.submitter;
  const sequence = dialogSequence;
  form.dataset.saving = 'true';
  if (submitter) submitter.disabled = true;
  try {
    if (type === 'sessao' || type === 'exercicio') { draftChange(type,form,id); return; }
    if (type === 'filtros') {
      const { start, end } = payload(form,{});
      if (start && end && start > end) throw new Error('A data final deve ser igual ou posterior à inicial.');
      Object.assign(state,{start:start ?? '',end:end ?? '',page:1});
      dialog.close();
      render();
      return;
    }

    const recurso = type === 'delete' ? 'alunos' : type === 'pagamento' ? 'mensalidades' : type;
    if (!recursos.includes(recurso)) throw new Error('Recurso inválido.');
    const record = id ? database[recurso].find(row => row.id === id) : undefined;
    const seed = { alunos:{ativo:true}, professores:{ativo:true}, planos:{ativo:true,beneficios:[],descricao:null},
      treinos:{sessoes:[]}, avaliacoes:{alunoId:form.dataset.student}, mensalidades:{} };
    const dados = type === 'delete' ? undefined : payload(form,record?.dados ?? seed[recurso]);
    const saved = await mutacao(recurso,{method:type === 'delete' ? 'DELETE' : id ? 'PUT' : 'POST',id,dados});
    updateDatabase(recurso,saved,id);
    if (dialog.open && sequence === dialogSequence) dialog.close();
    if (saved && recurso === 'treinos' && page === current) {
      state.trainingId = saved.id;
      state.trainingDraft = null;
      state.session = 0;
    }
    if (saved && recurso === 'mensalidades' && page === current) state.month = saved.dados.vencimento.slice(0,7);
    if (recurso === 'alunos' && page === 'novo-aluno' && current === page) location.hash = 'alunos';
    else render();
    showToast(type === 'delete' ? 'Aluno excluído.' : type === 'pagamento' ? 'Pagamento registrado.' : 'Registro salvo.');
  } catch (error) {
    const fields = Object.values(error.fields ?? {});
    if (form.isConnected) errorBox.textContent = [error.message,...fields].join(' ');
    else showToast(error.message);
  } finally {
    delete form.dataset.saving;
    if (submitter) submitter.disabled = false;
  }
});

window.addEventListener('hashchange',route);
route();
