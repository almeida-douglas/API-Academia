import { criarDemonstracao, hoje } from './demo.js';

export const recursos = ['alunos', 'planos', 'mensalidades', 'professores', 'treinos', 'avaliacoes'];
const storageKey = 'chargefit-demo-v1';
let fonte = new URLSearchParams(location.search).get('modo') === 'demo' ? 'demo' : 'api';
let motivo = '';

export function modoDados() { return { fonte, motivo }; }

class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(recurso, { method = 'GET', id, dados } = {}) {
  const url = './api/' + recurso + (id ? '/' + encodeURIComponent(id) : '');
  let response;
  try {
    response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json', ...(dados ? { 'Content-Type': 'application/json' } : {}) },
      body: dados ? JSON.stringify(dados) : undefined
    });
  } catch {
    throw new ApiError('A API da academia está indisponível.');
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.message ?? 'Falha ao consultar a API.', response.status, payload?.fields);
  if (payload === null) throw new ApiError('A API da academia não respondeu em JSON.', 404);
  return payload;
}

function readDemo() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && recursos.every(key => Array.isArray(saved[key]))) return saved;
  } catch { /* recria o conjunto de demonstração */ }
  return criarDemonstracao();
}

function updateDemo(recurso, { method, id, dados }) {
  const db = readDemo();
  const index = db[recurso].findIndex(row => row.id === id);
  if (id && index < 0) throw new ApiError('Registro não encontrado.', 404);
  if (method === 'DELETE') {
    const removeStudents = studentIds => {
      db.alunos = db.alunos.filter(row => !studentIds.includes(row.id));
      for (const key of ['mensalidades', 'treinos', 'avaliacoes']) {
        db[key] = db[key].filter(row => !studentIds.includes(row.dados.alunoId));
      }
    };
    if (recurso === 'alunos') removeStudents([id]);
    if (recurso === 'planos') {
      removeStudents(db.alunos.filter(row => row.dados.planoId === id).map(row => row.id));
      db.mensalidades = db.mensalidades.filter(row => row.dados.planoId !== id);
    }
    if (recurso === 'professores') {
      db.alunos.filter(row => row.dados.professorId === id).forEach(row => { row.dados.professorId = null; });
      for (const key of ['treinos', 'avaliacoes']) {
        db[key] = db[key].filter(row => row.dados.professorId !== id);
      }
    }
    if (recurso !== 'alunos') db[recurso].splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(db));
    return null;
  }
  if (recurso === 'alunos') {
    const cpf = dados.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) throw new ApiError('O CPF deve ter 11 dígitos.', 400);
    if (db.alunos.some(row => row.id !== id && row.dados.cpf.replace(/\D/g, '') === cpf)) {
      throw new ApiError('Já existe um aluno com este CPF.', 400);
    }
  }
  if (recurso === 'professores' && db.professores.some(row => row.id !== id
      && row.dados.cref.trim().toLowerCase() === dados.cref.trim().toLowerCase())) {
    throw new ApiError('Já existe um professor com este CREF.', 400);
  }
  if (recurso === 'treinos' && dados.fim < dados.inicio) throw new ApiError('Confira as datas da ficha.', 400);
  if (recurso === 'avaliacoes' && dados.reavaliacao && dados.reavaliacao < dados.data) {
    throw new ApiError('A reavaliação deve ser igual ou posterior à avaliação.', 400);
  }
  if ((dados.dataPagamento && dados.dataPagamento > hoje()) || (recurso === 'avaliacoes' && dados.data > hoje())) {
    throw new ApiError('A data informada deve ser igual ou anterior a hoje.', 400);
  }
  const record = { id: id ?? crypto.randomUUID(), criadoEm: db[recurso][index]?.criadoEm ?? new Date().toISOString(), dados };
  if (index < 0) db[recurso].unshift(record);
  else db[recurso][index] = record;
  localStorage.setItem(storageKey, JSON.stringify(db));
  return record;
}

export async function carregarAcademia() {
  if (fonte === 'demo') return readDemo();
  const responses = await Promise.allSettled(recursos.map(key => request(key)));
  const failures = responses.filter(result => result.status === 'rejected');
  if (failures.length) {
    if (failures.length === recursos.length && failures.every(result => [0, 404, 503].includes(result.reason.status))) {
      fonte = 'demo';
      motivo = 'API indisponível. ';
      return readDemo();
    }
    throw failures[0].reason;
  }
  return Object.fromEntries(recursos.map((key, index) => [key, responses[index].value]));
}

export function mutacao(recurso, options) {
  return fonte === 'demo' ? Promise.resolve().then(() => updateDemo(recurso, options)) : request(recurso, options);
}

export function consultar(recurso, id) {
  if (fonte !== 'demo') return request(recurso, { id });
  return Promise.resolve(readDemo()[recurso].find(row => row.id === id) ?? null);
}
