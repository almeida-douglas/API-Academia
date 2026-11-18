export function hoje() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

function diaRelativo(delta) {
  const day = new Date(hoje() + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + delta);
  return day.toISOString().slice(0, 10);
}

function mesRelativo(delta, dia) {
  const day = new Date(hoje().slice(0, 7) + '-01T12:00:00Z');
  day.setUTCMonth(day.getUTCMonth() + delta);
  day.setUTCDate(dia);
  return day.toISOString().slice(0, 10);
}

export function criarDemonstracao() {
  let id = 0;
  const row = (dados, date = hoje()) => ({
    id: 'cf670000-0000-4000-8000-' + String(++id).padStart(12, '0'),
    criadoEm: date + 'T09:00:00-03:00',
    dados
  });
  const planos = [
    row({ nome: 'Start', descricao: 'O essencial para começar', valorMensal: 99.9, fidelidadeMeses: 0,
      beneficios: ['Musculação em horário livre', 'Avaliação física inicial', 'Ficha de treino individual'], ativo: true }),
    row({ nome: 'Smart', descricao: 'Mais movimento, mais resultados', valorMensal: 129.9, fidelidadeMeses: 0,
      beneficios: ['Tudo do plano Start', 'Aulas coletivas ilimitadas', 'Reavaliação a cada 90 dias'], ativo: true }),
    row({ nome: 'Black', descricao: 'Sua melhor versão, sem limites', valorMensal: 149.9, fidelidadeMeses: 0,
      beneficios: ['Tudo do plano Smart', 'Acesso a todas as unidades', '5 convidados por mês'], ativo: true })
  ];
  const equipe = [
    ['Ricardo Mendes', 'Musculação', 'MANHA'], ['Fernanda Lima', 'Funcional', 'TARDE'],
    ['Bruno Martins', 'Musculação', 'NOITE'], ['Carolina Alves', 'Pilates', 'MANHA'],
    ['Diego Costa', 'Condicionamento', 'TARDE'], ['Patrícia Souza', 'Avaliação física', 'INTEGRAL']
  ];
  const professores = equipe.map(([nome, especialidade, turno], index) => row({
    nome, especialidade, turno, ativo: index < 5, cref: '00000' + (index + 1) + '-G/SP',
    email: 'professor' + (index + 1) + '@example.com'
  }));
  const nomes = ['Ana Carolina Silva', 'Lucas Oliveira', 'Beatriz Santos', 'Rafael Almeida',
    'Juliana Pereira', 'Pedro Henrique', 'Gabriela Fernandes'];
  const alunos = nomes.map((nome, index) => row({
    nome, cpf: String(index + 1).padStart(11, '0'), nascimento: '1997-04-12', genero: null,
    email: nome.toLowerCase().replaceAll(' ', '.') + '@example.com', celular: '(11) 90000-0000',
    planoId: planos[[2,1,2,0,1,2,2][index]].id, inicioMatricula: diaRelativo(-index),
    diaVencimento: 10, professorId: professores[index % professores.length].id, ativo: index !== 5
  }, diaRelativo(-index)));
  const mensalidades = Array.from({ length: 6 }, (_, month) => alunos
    .slice(0, month === 5 ? 5 : month + 2)
    .map((aluno, index) => {
      const plano = planos.find(value => value.id === aluno.dados.planoId);
      const vencimento = mesRelativo(month - 5, index < 3 ? 10 : 20);
      const dataPagamento = (month < 5 || index < 2) && vencimento <= hoje() ? vencimento : null;
      return row({ alunoId: aluno.id, planoId: plano.id, vencimento, valor: plano.dados.valorMensal, dataPagamento }, vencimento);
    })).flat().reverse();
  const exercicios = [
    ['Supino reto com barra','Peitoral','Barra livre',4,'10–12',30,60],
    ['Supino inclinado com halteres','Peitoral','Halteres',3,'12',12,60],
    ['Crucifixo na máquina','Peitoral','Máquina',3,'12–15',25,45],
    ['Desenvolvimento com halteres','Ombros','Halteres',3,'12',8,60],
    ['Elevação lateral','Ombros','Halteres',3,'15',5,45],
    ['Tríceps na polia','Tríceps','Cabo',3,'12–15',15,45]
  ].map(([nome,grupo,equipamento,series,repeticoes,carga,pausaSegundos]) => ({
    nome, grupo, equipamento, series, repeticoes, carga, pausaSegundos
  }));
  const treinos = alunos.slice(0, 5).map((aluno, index) => row({
    alunoId: aluno.id, professorId: professores[index].id,
    objetivo: ['Hipertrofia', 'Condicionamento', 'Hipertrofia', 'Adaptação', 'Resistência'][index],
    nivel: 'INTERMEDIARIO', frequenciaSemanal: 3, inicio: diaRelativo(-index * 3),
    fim: diaRelativo([53,51,10,4,58][index]), ativo: true,
    sessoes: [{ nome:'Treino A', titulo:'Peito, ombros e tríceps', exercicios },
      { nome:'Treino B', titulo:'Costas e bíceps', exercicios: [] },
      { nome:'Treino C', titulo:'Pernas e abdômen', exercicios: [] }]
  }));
  const avaliacoes = [68.4,70.1,71.8,73.2].map((peso,index) => row({
    alunoId: alunos.at(-1).id, professorId: professores[0].id, data: index ? mesRelativo(-index, 18) : hoje(),
    peso, altura: 165, gordura: [24.2,25.9,27.6,29.1][index], cintura: 74 + index,
    observacoes: null, objetivo: 'condicionamento e saúde', reavaliacao: index ? null : diaRelativo(30)
  }));
  return { alunos, planos, mensalidades, professores, treinos, avaliacoes };
}
