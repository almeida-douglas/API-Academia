import { hoje } from './demo.js';
import { grafico } from './charts.js';
import {
  esc, integer, money, decimal, date, dataCivil, monthName, matches, field, status, link, button, submit, formError,
  empty, listOptions, selected, named, sub, table, search, selectFilter, tabs, paginate, metrics, panelHead,
  formPanel, notice, badge, download
} from './ui.js';
import { campos, crudForm, turnos, niveis } from './forms.js';

export const paginas = {
  'visao-geral': ['Visão geral', 'Tudo o que sua academia precisa, em um só lugar.', 'grid'],
  alunos: ['Alunos', 'Conexões que transformam resultados.', 'users'],
  planos: ['Planos', 'O plano certo para cada objetivo.', 'card'],
  mensalidades: ['Mensalidades', 'Sua saúde financeira, sempre em dia.', 'money'],
  professores: ['Professores', 'Um time que faz a diferença.', 'coach'],
  treinos: ['Treinos', 'Evolução começa com um bom planejamento.', 'dumbbell'],
  avaliacoes: ['Avaliações físicas', 'Acompanhe cada conquista dos seus alunos.', 'activity'],
  'novo-aluno': ['Novo aluno', 'O primeiro passo para uma nova transformação.']
};
const sortedBy = (values, key) => [...values].sort((a,b) => String(b.dados[key] ?? '').localeCompare(String(a.dados[key] ?? '')));
const byCreated = values => [...values].sort((a,b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));
const sum = (records, key) => records.reduce((total, row) => total + Number(row.dados[key] || 0), 0);
const active = rows => rows.filter(row => row.dados.ativo);
const localMonth = () => hoje().slice(0,7);
const distributionColors = ['var(--accent)', 'var(--orange)', 'var(--orange-text)'];
const dateAfter = days => {
  const now = new Date(hoje() + 'T12:00:00Z');
  now.setUTCDate(now.getUTCDate() + days);
  return now.toISOString().slice(0,10);
};
const nextUp = (day, days) => day && day >= hoje() && day <= dateAfter(days);
const treinamentoVigente = row => row.dados.ativo && row.dados.inicio <= hoje() && row.dados.fim >= hoje();
const treinamentoProximo = row => treinamentoVigente(row) && nextUp(row.dados.fim, 14);
export const situacao = d => d.dataPagamento ? 'paga' : d.vencimento < hoje() ? 'atraso' : 'pendente';
const cobrancaStatus = { paga: ['Paga','green'], atraso: ['Em atraso','red'], pendente: ['Pendente','amber'] };
const mesDe = dateValue => dateValue?.slice(0,7);
const regras = (rows, searchText, properties) => rows.filter(row => matches(searchText, ...properties(row)));
export function receita(mensalidades, month) {
  return sum(mensalidades.filter(row => mesDe(row.dados.dataPagamento) === month), 'valor');
}
function shiftMonth(month, delta) {
  const d = new Date(month + '-01T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0,7);
}
function monthFilter(state, db) {
  const used = db.mensalidades.flatMap(row => [mesDe(row.dados.vencimento),mesDe(row.dados.dataPagamento)]).filter(Boolean);
  const months = [...new Set([localMonth(),state.month,...used,...Array.from({length:12},(_,i) => shiftMonth(localMonth(),-i))])].sort().reverse();
  return selectFilter('month','Competência',months.map(month => [month,monthName(month)]),state.month);
}
function planosComAlunos(db) {
  const counts = new Map();
  for (const row of active(db.alunos)) {
    const id = row.dados.planoId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return db.planos.map(row => ({ row, count: counts.get(row.id) ?? 0 }));
}
function taxa(mensalidades, month) {
  const scope = mensalidades.filter(row => mesDe(row.dados.vencimento) === month);
  return scope.length ? scope.filter(row => row.dados.dataPagamento).length / scope.length * 100 : null;
}
function variation(value, previous, kind = '%') {
  if (previous == null || value == null || (kind === '%' && !previous)) return '';
  const delta = kind === '%' ? (value - previous) / previous * 100 : value - previous;
  return status((delta > 0 ? '+' : '') + decimal(delta) + (kind === 'int' ? '' : kind), delta >= 0 ? 'green' : 'red')
    + '<span>vs. mês anterior</span>';
}

export function radar(db) {
  const avaliacaoPorAluno = new Map();
  for (const row of sortedBy(db.avaliacoes,'data')) {
    if (!avaliacaoPorAluno.has(row.dados.alunoId)) avaliacaoPorAluno.set(row.dados.alunoId,row);
  }
  return [
    ['mensalidades?filtro=atraso',db.mensalidades.filter(row => row.dados.vencimento.startsWith(localMonth()) && situacao(row.dados) === 'atraso').length,'Mensalidades vencidas','Regularizar cobranças'],
    ['avaliacoes?filtro=renovar',[...avaliacaoPorAluno.values()].filter(row => nextUp(row.dados.reavaliacao,30)).length,'Avaliações para renovar','Agendar acompanhamento'],
    ['treinos?filtro=vencer',db.treinos.filter(treinamentoProximo).length,'Fichas próximas do fim','Revisar treinos']
  ];
}

function overview(db, state) {
  const month = state.month;
  const prev = shiftMonth(month,-1);
  const ativos = active(db.alunos);
  const paid = receita(db.mensalidades,month);
  const rate = taxa(db.mensalidades,month);
  const ativosTreino = db.treinos.filter(treinamentoVigente);
  const hasMonth = row => mesDe(row.dados.inicio) === month;
  const distribuicao = planosComAlunos(db).filter(item => item.count > 0).sort((a,b) => b.count-a.count);
  return `<div class="overview stack">
    ${metrics([
      {title:'Alunos ativos',value:ativos.length,accent:'var(--orange)'},
      {title:'Receita do mês',value:paid,format:'money',accent:'var(--accent)',note:variation(paid,receita(db.mensalidades,prev))},
      {title:'Mensalidades em dia',value:rate,format:'percent',accent:'var(--orange)',note:variation(rate,taxa(db.mensalidades,prev),' p.p.')},
      {title:'Treinos ativos',value:ativosTreino.length,accent:'var(--accent)',
        note:status('+' + ativosTreino.filter(hasMonth).length,'green') + '<span>iniciados no mês</span>'}
    ])}
    <div class="split">
      <section class="panel chart-panel">${panelHead('Receita em movimento','',
        selectFilter('period','Período do gráfico',[[3,'Últimos 3 meses'],[6,'Últimos 6 meses'],[12,'Últimos 12 meses']],state.period))}
        <div class="chart-body"><canvas id="revenue-chart" role="img" aria-label="Receita por mês"></canvas></div>
      </section>
      <section class="panel distribution">${panelHead('Distribuição dos alunos ativos')}
        ${distribuicao.length ? `<ul>${distribuicao.map(({row,count},index) => {
          const pct = count / ativos.length * 100;
          return `<li><div>${esc(row.dados.nome)}<small>${count} alunos · ${decimal(pct)}%</small></div>
            <div class="track" aria-hidden="true"><span style="--share:${pct}%;--bar:${distributionColors[index%distributionColors.length]}"></span></div></li>`;
        }).join('')}</ul>` : empty('Cadastre um aluno para acompanhar a distribuição.')}
        ${link('Ver planos e benefícios  →','planos')}
      </section>
    </div>
    <div class="split">
      <section class="panel">${panelHead('Últimos Alunos cadastrados','',link('Ver alunos  →','alunos'),true)}
        ${table(['Aluno','Plano','Cadastro','Situação'],byCreated(db.alunos).slice(0,3).map(row => [
          '<strong>' + esc(row.dados.nome) + '</strong>',named(db.planos,row.dados.planoId),date(row.criadoEm),
          status(row.dados.ativo ? 'Ativo' : 'Inativo',row.dados.ativo ? 'green' : '')
        ]),52)}
      </section>
      <section class="panel radar">${panelHead('Para verificar:','','',true)}
        <ul>${radar(db).map(([route,count,label,note]) => `<li><a href="#${route}"><strong>${String(count).padStart(2,'0')}</strong>
          <span>${label}<small>${note}</small></span><i aria-hidden="true">→</i></a></li>`).join('')}</ul>
      </section>
    </div></div>`;
}

function students(db, state) {
  const scope = byCreated(db.alunos);
  const ativa = active(scope).length;
  const current = scope.filter(row => mesDe(dataCivil(row.criadoEm)) === localMonth()).length;
  const previous = scope.filter(row => mesDe(dataCivil(row.criadoEm)) === shiftMonth(localMonth(),-1)).length;
  const filtered = regras(scope,state.query,row => [row.dados.nome,row.dados.email,row.dados.cpf])
    .filter(row => (!state.plan || row.dados.planoId === state.plan)
      && (!state.status || row.dados.ativo === (state.status === 'ativo'))
      && (!state.start || dataCivil(row.criadoEm) >= state.start)
      && (!state.end || dataCivil(row.criadoEm) <= state.end));
  const {data,footer} = paginate(filtered,state.page,6,'alunos');
  const labels = [['','Todos ('+scope.length+')'],['ativo','Ativos ('+ativa+')'],['inativo','Inativos ('+(scope.length-ativa)+')']];
  return `${metrics([
      {title:'Total de alunos',value:scope.length,aside:'Uma comunidade em movimento'},
      {title:'Alunos ativos',value:ativa,aside:scope.length ? decimal(ativa/scope.length*100)+'% da base total' : ''},
      {title:'Novos neste mês',value:current,aside:current === previous ? 'Igual ao mês anterior' : Math.abs(current-previous)+' a '+(current>previous?'mais':'menos')+' que no mês anterior'}
    ])}
    <section class="panel">${panelHead('Todos os alunos <small class="muted">'+scope.length+'</small>')}
    <div class="filters">${search('query','Buscar por nome, CPF ou e-mail',state.query)}
      ${selectFilter('plan','Plano',listOptions(db.planos,undefined,'Plano: todos'),state.plan)}
      ${selectFilter('status','Situação',[['','Situação: todas'],...labels.slice(1)],state.status)}
      ${button('≡  Mais filtros','extra','btn wide',state.start || state.end ? 'active' : '')}</div>
    ${tabs('status',labels,state.status)}
    ${table(['Aluno','Plano','Cadastro','Situação','Ações'],data.map(row => [
      sub(row.dados.nome,row.dados.email),status(selected(db.planos,row.dados.planoId)?.nome ?? '—','orange'),date(row.criadoEm),
      badge(row.dados.ativo),`<div class="inline">${button('Consultar aluno','view','icon-btn',row.id,'view')}
        ${button('Editar aluno','edit','icon-btn',row.id,'edit')}${button('Excluir aluno','delete','icon-btn',row.id,'delete')}</div>`
    ]),64)}${footer}</section>`;
}

function plans(db) {
  const distribution = planosComAlunos(db);
  const count = active(db.alunos).length;
  const max = Math.max(0,...distribution.map(item => item.count));
  return `<div class="stack">
    <section class="panel plans-summary"><strong>${active(db.planos).length} planos ativos</strong><p class="muted">Mais possibilidades para seus alunos. Mais recorrência para sua academia.</p>${status(count+' alunos vinculados','orange')}</section>
    <div class="plan-grid">${distribution.map(({row,count:students},index) => {
      const d = row.dados, favorite = students > 0 && students === max;
      return `<article class="panel plan reveal" style="--plan-color:${favorite ? 'var(--accent)' : 'var(--orange)'};--i:${index}">
        <header><h2>${esc(d.nome)}</h2>${status(students+' alunos')}</header>
        <p class="muted">${esc(d.descricao)}</p>
        <div class="plan-price"><span>R$</span> <strong>${esc(money(d.valorMensal).replace(/^R\$\s*/,''))}</strong> <span class="muted">/mês</span></div>
        <p class="muted">${d.fidelidadeMeses ? d.fidelidadeMeses+' meses de fidelidade' : 'Sem fidelidade'}${d.ativo ? '' : ' · Inativo'}</p>
        <ul>${d.beneficios.map(text => `<li><i>✓</i>${esc(text)}</li>`).join('')}</ul>
        ${favorite ? status('O favorito de '+decimal(students/count*100)+'% dos seus alunos','orange') : ''}
        ${button('Editar plano','edit',favorite?'btn primary full':'btn full',row.id)}</article>`;
    }).join('') || empty('Cadastre o primeiro plano da academia.')}</div>
    ${formPanel('Crie uma nova possibilidade','Defina os dados iniciais. Você poderá adicionar benefícios e regras na edição.',
      `<form id="quick-plan" data-save="planos">${campos('planos',null,db,{quick:true})}${formError}${submit('+  Criar plano')}</form>`)}
    ${notice('Regras claras. Relações duradouras.','Alterações de valor valem para novos lançamentos. Mensalidades já lançadas mantêm o valor registrado.')}
    </div>`;
}

function payments(db, state) {
  const month = state.month;
  const scope = sortedBy(db.mensalidades.filter(row => mesDe(row.dados.vencimento) === month),'vencimento').reverse();
  const overdue = scope.filter(row => situacao(row.dados) === 'atraso');
  const pending = scope.filter(row => situacao(row.dados) === 'pendente');
  const payRate = taxa(db.mensalidades,month);
  const code = row => '#MEN-' + row.dados.vencimento.slice(0,4) + '-' + row.id.replaceAll('-','').slice(-8).toUpperCase();
  const filtered = regras(scope,state.query,row => [selected(db.alunos,row.dados.alunoId)?.nome,code(row)])
    .filter(row => (!state.status || situacao(row.dados) === state.status)
      && (!state.start || row.dados.vencimento >= state.start)
      && (!state.end || row.dados.vencimento <= state.end));
  if (state.sort === 'desc') filtered.reverse();
  const {data,footer} = paginate(filtered,state.page,5,'mensalidades');
  const labels = [['','Todas'],['paga','Pagas'],['pendente','Pendentes'],['atraso','Em atraso']];
  return `${metrics([
    {title:'Recebido no mês',value:receita(db.mensalidades,month),format:'money',note:variation(receita(db.mensalidades,month),receita(db.mensalidades,shiftMonth(month,-1)))},
    {title:'A receber',value:sum(pending,'valor'),format:'money',note:esc(pending.length+' pendentes')},
    {title:'Em atraso',value:sum(overdue,'valor'),format:'currency',note:status(overdue.length+' mensalidades vencidas','red')},
    {title:'Taxa de adimplência',value:payRate,format:'percent',note:scope.length ? 'Da competência selecionada' : ''}
  ])}
  ${overdue.length ? `<aside class="alert"><strong>${String(overdue.length).padStart(2,'0')}</strong><div><strong>mensalidades precisam da sua atenção.</strong>
    <small>Confira as cobranças em atraso.</small></div>${button('Ver atrasadas  →','status','text-btn','atraso')}</aside>` : ''}
  <section class="panel">${panelHead('Mensalidades','Competência: '+monthName(month).toLowerCase(),monthFilter(state,db))}
  <div class="filters">${search('query','Buscar aluno ou número da cobrança',state.query,false)}
    ${selectFilter('status','Situação',[['','Situação: todas'],...labels.slice(1)],state.status)}
    ${selectFilter('sort','Ordem por vencimento',[['asc','Vencimento ↑'],['desc','Vencimento ↓']],state.sort)}
    ${button('Mais filtros','extra','btn wide')}</div>
    ${tabs('status',labels,state.status)}
    ${table(['Aluno / cobrança','Plano','Vencimento','Valor','Situação','Ação'],data.map(row => {
      const d = row.dados, s = situacao(d);
      return [sub(selected(db.alunos,d.alunoId)?.nome ?? '—',code(row)),named(db.planos,d.planoId),date(d.vencimento),
        '<strong>'+esc(money(d.valor))+'</strong>',status(...cobrancaStatus[s]),
        button(s === 'paga' ? 'Ver recibo  →' : s === 'atraso' ? 'Cobrar  →' : 'Dar baixa  →',
          s === 'paga' ? 'view' : 'pay','text-btn',row.id)];
    }),58)}${footer}</section>`;
}

function teachers(db,state) {
  const count = active(db.professores).length;
  const data = regras(db.professores,state.query,row => [row.dados.nome,row.dados.cref])
    .filter(row => !state.shift || row.dados.turno === state.shift);
  return `${metrics([
    {title:'Profissionais cadastrados',value:db.professores.length,aside:'Um time multidisciplinar'},
    {title:'Em atividade',value:count,aside:(db.professores.length-count)+' fora de atividade'},
    {title:'Alunos acompanhados',value:active(db.alunos).filter(row => row.dados.professorId).length,aside:'Cuidado em cada etapa'}
  ])}
  <div class="split"><section class="panel">${panelHead('Quem move a sua academia','Consulte perfis, especialidades e disponibilidade.')}
  <div class="filters">${search('query','Buscar por nome ou CREF',state.query,false)}
    ${selectFilter('shift','Turnos',[['','Todos os turnos'],...turnos],state.shift)}</div>
  ${table(['Professor','Especialidade','Turno','Perfil'],data.map(row => {
    const d = row.dados;
    return [sub(d.nome,'CREF '+d.cref),'<strong>'+esc(d.especialidade)+'</strong><small>'+status(d.ativo?'Em atividade':'Fora de atividade',d.ativo?'green':'amber')+'</small>',
      esc(turnos.find(([value]) => value === d.turno)?.[1]),button('→','view','btn',row.id)];
  }),68)}
  <footer class="table-foot">${data.length} profissionais encontrados</footer></section>
  ${formPanel('Novo professor','Talento novo para o seu time.',crudForm('professores',db,{title:'+  Cadastrar professor'}),'O perfil ficará disponível após o cadastro.')}</div>`;
}

function studentForm(db, record) {
  return `<div class="split new-student"><div class="stack">
    ${formPanel('Dados do aluno','Preencha os dados para começar. Campos com * são obrigatórios.',
      `<form id="student-form" data-save="alunos" data-id="${esc(record?.id)}">${campos('alunos',record?.dados,db,{edit:!!record})}${formError}</form>`)}
    <div class="form-actions"><small>${record ? 'As alterações serão aplicadas ao cadastro do aluno.' : 'Ao salvar, o aluno será incluído na base ativa da academia.'}</small>
      ${link('Cancelar','alunos','btn wide')}<button class="btn primary wide" type="submit" form="student-form">Salvar aluno  →</button></div></div>
    <div class="stack"><section class="panel summary"><h2>Uma nova jornada</h2><p class="muted">Tudo pronto para ir além.</p><div id="plan-summary"></div></section>
      ${notice('Dados protegidos','Os dados pessoais são usados para a gestão da academia.')}</div></div>`;
}

export function atualizarResumoPlano(root, db, id) {
  const target = root.querySelector('#plan-summary');
  if (!target) return;
  const plan = selected(db.planos,id);
  target.innerHTML = plan ? `<div class="summary-plan"><small>Plano ${esc(plan.nome)}</small><strong>${esc(money(plan.valorMensal))}</strong><p class="muted">por mês</p>
    <p>${esc(plan.descricao || plan.beneficios[0] || '')}</p></div>
    <div class="summary-line muted"><span>Fidelidade</span><strong>${plan.fidelidadeMeses ? plan.fidelidadeMeses+' meses' : 'Sem fidelidade'}</strong></div>
    <div class="summary-line"><strong>Total mensal</strong><strong>${esc(money(plan.valorMensal))}</strong></div>`
    : empty(db.planos.length ? 'Selecione um plano para ver os valores.' : 'Cadastre um plano antes de matricular um aluno.');
}

function trainings(db,state) {
  const valid = db.treinos.filter(treinamentoVigente).length;
  const expiring = db.treinos.filter(treinamentoProximo).length;
  const data = regras(db.treinos,state.query,row => [selected(db.alunos,row.dados.alunoId)?.nome,row.dados.objetivo])
    .filter(row => state.status === 'vencer' ? treinamentoProximo(row) : state.status === 'inativa' ? !treinamentoVigente(row) : true);
  const persisted = data.find(row => row.id === state.trainingId) ?? data[0];
  const row = state.trainingDraft?.id === persisted?.id ? state.trainingDraft : persisted;
  const d = row?.dados;
  const sessao = d?.sessoes[state.session] ?? d?.sessoes[0];
  const sessionIndex = sessao ? d.sessoes.indexOf(sessao) : 0;
  const actions = row ? button('Editar ficha','edit','btn',row.id) : '';
  return `<div class="split training">
    <section class="panel training-list"><h2>Fichas de treino</h2><p class="muted">${valid} ativas · ${expiring} para revisar</p>
    <div class="filters">${search('query','Buscar aluno ou objetivo',state.query,false)}</div>
    ${tabs('status',[['','Todas'],['vencer','A vencer ('+expiring+')'],['inativa','Inativas']],state.status)}
    <ul>${data.map((item,index) => `<li class="reveal" style="--i:${index}"><button class="ficha" type="button" data-action="training" data-value="${item.id}" aria-pressed="${item.id === row?.id}">
      <strong>${named(db.alunos,item.dados.alunoId)}</strong>
      <small>${esc(item.dados.objetivo)} · ${item.dados.sessoes.length} treinos</small><small>Válida até ${date(item.dados.fim)}</small></button></li>`).join('')}</ul>
    ${data.length ? '' : empty('Nenhuma ficha encontrada.')}</section>
    <div class="stack">${row ? `<section class="panel training-detail">
      <header class="panel-head"><div><span class="eyebrow">Ficha #TR-${row.id.slice(-8).toUpperCase()}</span>
      <h2>${named(db.alunos,d.alunoId)}</h2><p>${esc(d.objetivo)} / ${esc(niveis.find(([value]) => value === d.nivel)?.[1])} / ${d.frequenciaSemanal}× por semana</p></div>
      <div class="inline">${treinamentoVigente(row) ? status('Ativa','green') : status('Fora da vigência')}${actions}</div></header>
      <div class="details"><span>Professor: ${named(db.professores,d.professorId)}</span><span class="muted">${date(d.inicio)} → ${date(d.fim)}</span></div></section>
      <section class="panel training-sessions"><div class="tabs" role="group" aria-label="Treinos da ficha">
        ${d.sessoes.map((s,index) => `<button type="button" class="tab" data-action="session" data-value="${index}" aria-pressed="${index === sessionIndex}">${esc(s.nome)}</button>`).join('')}
        ${button('+  Treino','new-session','btn',row.id)}</div>
        ${sessao ? `${panelHead(esc(sessao.titulo),sessao.exercicios.length+' exercícios',
          button('↗  Duplicar treino','duplicate-session','text-btn',sessionIndex))}
          ${table(['Exercício','Séries','Reps.','Carga','Pausa','Editar'],sessao.exercicios.map((e,index) => [
            sub(e.nome,[e.grupo,e.equipamento].filter(Boolean).join(' · ')),e.series,esc(e.repeticoes),e.carga == null ? '—' : decimal(e.carga)+' kg',
            e.pausaSegundos == null ? '—' : integer(e.pausaSegundos)+' s',button('Editar exercício','exercise','icon-btn',index,'exercise')
          ]),47)}
          <footer class="table-foot">${button('+  Adicionar exercício','exercise','text-btn','new')}${button('Excluir treino','remove-session','text-btn',sessionIndex)}</footer>` : empty('Adicione um treino à ficha.')}
        <footer class="table-foot"><small>${state.trainingDraft?.id === row.id ? 'Alterações pendentes nesta ficha.' : 'Revise cargas e repetições antes de salvar.'}</small>
          ${button('Salvar alterações','save-training','btn primary',row.id)}</footer>
      </section>` : '<section class="panel">'+empty('Crie ou selecione uma ficha de treino.')+'</section>'}</div></div>`;
}

function assessments(db,state) {
  const toRenew = new Set();
  const seen = new Set();
  for (const row of sortedBy(db.avaliacoes,'data')) {
    if (seen.has(row.dados.alunoId)) continue;
    seen.add(row.dados.alunoId);
    if (nextUp(row.dados.reavaliacao,30)) toRenew.add(row.dados.alunoId);
  }
  const alunos = state.status === 'renovar' ? db.alunos.filter(row => toRenew.has(row.id)) : db.alunos;
  const defaultId = sortedBy(db.avaliacoes,'data')[0]?.dados.alunoId;
  const id = alunos.some(row => row.id === state.studentId) ? state.studentId
    : alunos.find(row => row.id === defaultId)?.id ?? alunos[0]?.id;
  const tests = sortedBy(db.avaliacoes.filter(row => row.dados.alunoId === id),'data');
  const current = tests[0]?.dados, first = tests.at(-1)?.dados;
  const history = state.history ? tests : tests.slice(0,3);
  const change = (key,suffix) => tests.length > 1 && current[key] != null && first[key] != null
    ? esc(decimal(current[key]-first[key])+suffix+' desde '+date(first.data)) : '';
  const lean = current?.gordura == null ? null : Number(current.peso)*(1-Number(current.gordura)/100);
  return `<div class="stack"><section class="panel assessment-title">
    <label class="field"><span>ALUNO EM ACOMPANHAMENTO</span>
    ${selectFilter('studentId','Aluno em acompanhamento',[['','Selecione'],...alunos.map(row => [row.id,row.dados.nome])],id)}</label>
    <p>${current?.objetivo ? 'Objetivo: '+esc(current.objetivo) : 'Acompanhamento do aluno'}${first ? '<small>Desde '+date(first.data)+'</small>' : ''}</p>
    ${current?.reavaliacao ? status('Reavaliação em '+date(current.reavaliacao),'amber') : ''}
    ${state.status ? button('Ver todos os alunos','status','text-btn','') : ''}</section>
    <div class="split"><div class="stack">
      ${metrics([{title:'Peso atual',value:current?.peso,format:'decimal',aside:'kg',note:change('peso',' kg')},
        {title:'Gordura corporal',value:current?.gordura,format:'decimal',aside:'%',note:change('gordura',' p.p.')},
        {title:'Massa magra',value:lean,format:'decimal',aside:'kg',
          note:current?.gordura == null ? '' : esc(decimal(100-current.gordura)+'% do peso corporal')}])}
      <section class="panel chart-panel">${panelHead('Cada etapa conta',state.metric === 'peso' ? 'Evolução do peso corporal' : 'Evolução do percentual de gordura',
        tabs('metric',[['peso','Peso (kg)'],['gordura','% gordura']],state.metric))}
        ${tests.some(row => row.dados[state.metric] != null) ? '<div class="chart-body"><canvas id="assessment-chart" role="img" aria-label="Evolução das avaliações físicas"></canvas></div>' : empty('Sem medições para este indicador.')}</section>
      <section class="panel">${panelHead('Histórico de avaliações','',button(state.history?'Mostrar recentes':'Ver todos  →','history','text-btn'))}
        ${table(['Data','Peso','Gordura','Avaliador','Relatório'],history.map(row => [
          date(row.dados.data),decimal(row.dados.peso)+' kg',row.dados.gordura == null ? '—' : decimal(row.dados.gordura)+'%',
          named(db.professores,row.dados.professorId),button('Consultar  →','view','text-btn',row.id)
        ]),39)}</section>
    </div>${formPanel('Nova avaliação','Registre o próximo passo dessa evolução.',id ?
      `<form data-save="avaliacoes" data-student="${id}">${campos('avaliacoes',null,db)}${formError}${submit('Salvar avaliação','btn primary full')}</form>`
      : empty('Selecione um aluno cadastrado para começar.'),'Os dados ficam no histórico do aluno.')}</div></div>`;
}

export function renderPagina(page, db, state) {
  const edit = page === 'novo-aluno' && db.alunos.find(row => row.id === state.editId);
  const [label,subtitle] = paginas[page];
  const actions = {
    'visao-geral': () => monthFilter(state,db) + download('visao-geral'),
    alunos: () => download('alunos') + link('+  Novo aluno','novo-aluno','btn primary wide'),
    planos: () => button('+  Novo plano','new','btn primary wide'),
    mensalidades: () => download('mensalidades') + button('+  Lançar mensalidade','new','btn primary wide'),
    professores: () => button('↓  Exportar equipe','export','btn wide','professores'),
    treinos: () => button('+  Nova ficha de treino','new','btn primary wide'),
    avaliacoes: () => button('↓  Exportar evolução','export','btn wide','avaliacoes'),
    'novo-aluno': () => link('←  Voltar para alunos','alunos','btn wide')
  };
  const content = {
    'visao-geral': overview, alunos: students, planos: plans, mensalidades: payments,
    professores: teachers, treinos: trainings, avaliacoes: assessments, 'novo-aluno': () => studentForm(db,edit)
  };
  return `<header class="page-header"><div><span class="eyebrow">${page === 'novo-aluno' ? (edit?'Matrícula':'Novo cadastro') : 'Painel da academia'}</span>
    <h1>${edit ? 'Editar aluno' : label}</h1><p>${esc(subtitle)}</p></div><div class="actions">${actions[page]()}</div></header>
    <div class="enter">${content[page](db,state)}</div>`;
}

export function renderGrafico(root,db,state,page) {
  if (page === 'visao-geral') {
    const months = Array.from({length:Number(state.period)},(_,i) => shiftMonth(state.month,i+1-Number(state.period)));
    const values = months.map(month => receita(db.mensalidades,month));
    const peak = Math.max(...values);
    const step = peak > 10000 ? 25000 : peak > 1000 ? 500 : peak > 100 ? 100 : 25;
    const labels = months.map(month => monthName(month,true));
    const canvas = root.querySelector('#revenue-chart');
    canvas.setAttribute('aria-label','Receita por mês. '+labels.map((label,i) => label+' '+money(values[i])).join(', '));
    grafico(canvas,labels,values,{min:0,max:Math.max(step*3,Math.ceil(peak/step)*step),step,
      format:value => value >= 1000 ? 'R$ '+decimal(value/1000)+' mil' : money(value,0),callout:true});
  }
  if (page === 'avaliacoes') {
    const canvas = root.querySelector('#assessment-chart');
    const id = root.querySelector('[data-filter="studentId"]')?.value;
    const rec = sortedBy(db.avaliacoes.filter(row => row.dados.alunoId === id && row.dados[state.metric] != null),'data').reverse();
    if (!canvas || !rec.length) return;
    const values = rec.map(row => Number(row.dados[state.metric]));
    const labels = rec.map(row => monthName(row.dados.data.slice(0,7),true));
    const unit = state.metric === 'peso' ? ' kg' : '%';
    canvas.setAttribute('aria-label','Evolução. '+labels.map((label,i) => label+' '+decimal(values[i])+unit).join(', '));
    grafico(canvas,labels,values,{min:Math.max(0,Math.floor(Math.min(...values)/2.5)*2.5),
      max:Math.ceil((Math.max(...values)+.01)/2.5)*2.5,step:2.5,format:value => decimal(value)+unit,pointLabels:true,secondary:state.metric === 'gordura'});
  }
}
