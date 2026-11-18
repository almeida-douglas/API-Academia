import { hoje } from './demo.js';
import { field, columns, listOptions, money, submit, formError, esc } from './ui.js';

export const turnos = [['MANHA','Manhã'],['TARDE','Tarde'],['NOITE','Noite'],['INTEGRAL','Integral']];
export const niveis = [['INICIANTE','Iniciante'],['INTERMEDIARIO','Intermediário'],['AVANCADO','Avançado']];
const generos = [['','Selecione'],['Feminino','Feminino'],['Masculino','Masculino'],['Outro','Outro'],['Prefiro não informar','Prefiro não informar']];

export function campos(recurso, dados, base, contexto = {}) {
  const d = dados ?? {};
  const required = true;
  const text = (key, label, placeholder, extra = {}) => field(key,label,{value:d[key],placeholder,required,...extra});
  const num = (key, label, min, extra = {}) => field(key,label,{type:'number',value:d[key],min,required,...extra});
  const day = (key, label, value, extra = {}) => field(key,label,{type:'date',value:d[key] ?? value,required,...extra});
  const select = (key, label, choices, value, extra = {}) => field(key,label,{choices,value:d[key] ?? value,required,...extra});
  const active = label => field('ativo',label,{type:'checkbox',value:d.ativo ?? true});
  const students = listOptions(base.alunos);
  const coaches = listOptions(base.professores);
  switch (recurso) {
    case 'alunos': {
      const planos = listOptions(base.planos.filter(row => row.dados.ativo || row.id === d.planoId),
        row => row.dados.nome + ' · ' + money(row.dados.valorMensal) + '/mês');
      const due = Array.from({length:31},(_,index) => [index+1,'Todo dia '+(index+1)]);
      return `<section><h3><span>01</span> Informações pessoais</h3>
        ${columns(3, text('nome','Nome completo','Nome e sobrenome',{wide:true})
          + text('cpf','CPF','000.000.000-00')
          + day('nascimento','Data de nascimento',undefined,{max:hoje()})
          + select('genero','Gênero',generos,undefined,{required:false}))}</section>
        ${columns(2,text('email','E-mail','aluno@email.com',{type:'email'})
          + text('celular','Celular','(11) 90000-0000',{type:'tel'}))}
        <hr><section><h3><span>02</span> Plano e matrícula</h3>
        ${columns(2,select('planoId','Plano escolhido',planos)
          + day('inicioMatricula','Início da matrícula',hoje())
          + select('diaVencimento','Data de vencimento',due,10)
          + select('professorId','Professor(a) responsável',coaches,undefined,{required:false})
          + (contexto.edit ? active('Aluno ativo') : ''))}</section>`;
    }
    case 'planos': return columns(contexto.quick ? 3 : 2,
      text('nome','Nome do plano','Ex.: Performance')
      + num('valorMensal','Valor mensal (R$)',.01,{step:'.01',placeholder:'R$ 0,00'})
      + select('fidelidadeMeses','Fidelidade',[[0,'Sem fidelidade'],[3,'3 meses'],[6,'6 meses'],[12,'12 meses'],...(d.fidelidadeMeses && ![3,6,12].includes(d.fidelidadeMeses) ? [[d.fidelidadeMeses,d.fidelidadeMeses+' meses']] : [])],0)
      + (contexto.quick ? '' : text('descricao','Descrição','',{required:false})
        + field('beneficios','Benefícios, um por linha',{type:'textarea',value:d.beneficios?.join('\n'),wide:true})
        + active('Plano ativo')));
    case 'professores': return text('nome','Nome completo','Nome e sobrenome')
      + text('cref','Registro profissional (CREF)','000000-G/SP')
      + text('email','E-mail','professor@email.com',{type:'email'})
      + text('especialidade','Especialidade','Ex.: Musculação')
      + select('turno','Turno de atuação',[['','Selecione'],...turnos])
      + (contexto.edit ? active('Em atividade') : '');
    case 'mensalidades': return columns(2,select('alunoId','Aluno',students,contexto.alunoId)
      + select('planoId','Plano',listOptions(base.planos))
      + day('vencimento','Vencimento',hoje())
      + num('valor','Valor (R$)',.01,{step:'.01'})
      + day('dataPagamento','Data de pagamento',undefined,{required:false,max:hoje()}));
    case 'treinos': return columns(2,select('alunoId','Aluno',students)
      + select('professorId','Professor(a)',coaches)
      + text('objetivo','Objetivo','Ex.: Hipertrofia')
      + select('nivel','Nível',niveis,'INICIANTE')
      + num('frequenciaSemanal','Frequência semanal',1,{value:d.frequenciaSemanal ?? 3,max:7})
      + day('inicio','Início',hoje()) + day('fim','Validade')
      + active('Ficha ativa'));
    case 'avaliacoes': return day('data','Data da avaliação',hoje(),{max:hoje()})
      + select('professorId','Profissional responsável',coaches)
      + columns(2,num('peso','Peso (kg)',.01,{step:'.01',placeholder:'68,4'})
        + num('altura','Altura (cm)',.01,{step:'.01',placeholder:'165'})
        + num('gordura','Gordura (%)',0,{step:'.01',max:100,required:false})
        + num('cintura','Cintura (cm)',.01,{step:'.01',required:false}))
      + field('observacoes','Observações',{type:'textarea',value:d.observacoes,placeholder:'Adicione informações relevantes para o acompanhamento do aluno.'})
      + text('objetivo','Objetivo','Ex.: condicionamento e saúde',{required:false})
      + day('reavaliacao','Próxima avaliação',undefined,{required:false});
    case 'sessao': return text('nome','Nome da aba','Treino A') + text('titulo','Título do treino','Ex.: Peito e tríceps');
    case 'exercicio': return columns(2,text('nome','Exercício','Ex.: Supino reto',{wide:true})
      + text('grupo','Grupo muscular','',{required:false}) + text('equipamento','Equipamento','',{required:false})
      + num('series','Séries',1) + text('repeticoes','Repetições','Ex.: 10–12')
      + num('carga','Carga (kg)',0,{step:'.01',required:false}) + num('pausaSegundos','Pausa (s)',0,{required:false}));
    default: return '';
  }
}

const numbers = new Set(['diaVencimento','valorMensal','fidelidadeMeses','valor','frequenciaSemanal',
  'peso','altura','gordura','cintura','series','carga','pausaSegundos']);
export function payload(form, defaults) {
  const data = { ...defaults };
  for (const input of form.elements) {
    if (!input.name || input.disabled) continue;
    const raw = input.value.trim();
    if (input.type === 'checkbox') data[input.name] = input.checked;
    else if (input.name === 'beneficios') data.beneficios = raw.split('\n').map(value => value.trim()).filter(Boolean);
    else if (numbers.has(input.name)) data[input.name] = raw === '' ? null : Number(raw);
    else data[input.name] = raw || null;
  }
  return data;
}

export function crudForm(recurso, base, { record, title, context = {}, buttonClass = 'btn primary full' } = {}) {
  return `<form class="dialog-form" data-save="${recurso}" data-id="${esc(record?.id)}">
    ${campos(recurso,record?.dados,base,{...context,edit:!!record})}
    ${formError}${submit(title ?? 'Salvar alterações',buttonClass)}</form>`;
}
