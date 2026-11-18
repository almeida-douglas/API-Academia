# ChargeFit

O painel é servido pelo Spring Boot na mesma origem da API. Requer Java 25 e utiliza o Maven Wrapper do projeto.

```powershell
.\mvnw.cmd spring-boot:run
```

Abra [http://localhost:8080/](http://localhost:8080/) para o onboarding ou [a demonstração](http://localhost:8080/?modo=demo#visao-geral) para ver registros fictícios. A API começa com as tabelas da academia vazias e grava os registros em H2. Cadastre primeiro um plano e um professor, em seguida um aluno. A demonstração armazena suas alterações neste navegador. Se todos os endpoints estiverem indisponíveis, o painel sinaliza o modo demonstração. Erros parciais, de validação e de gravação aparecem na tela.

Rio de Janeiro é a unidade padrão exibida na navegação e em Configurações. A identidade exibida no cabeçalho é um elemento estático do Figma. O projeto atual não tem autenticação nem provisionamento de usuários ou unidades. O onboarding usa uma capa em grafite e âmbar com o vídeo fornecido. A reprodução pode ser pausada. O pôster local aparece quando o vídeo está indisponível ou quando o usuário prefere movimento reduzido. Chart.js carrega via CDN. Um gráfico Canvas local mantém a série visível se o CDN estiver indisponível.

## Tema visual atual

O ChargeFit usa fundo preto (`#0B0B0D`) e superfícies em grafite. O amarelo do onboarding (`#FFBF47`) é usado em ações primárias, métricas, navegação ativa e gráficos. O laranja existente (`#FF5400`) aparece nos destaques secundários. As cores de situação identificam pagamentos, alertas e erros.

## Mapeamento do Figma

| Nó | Tela | Componentes |
| --- | --- | --- |
| 213:38 | Onboarding | O frame original fornece o pôster. A versão atual usa vídeo, capa com entrada no painel, link de demonstração e atalhos para alunos, mensalidades e treinos. |
| 210:2 | Visão geral | Cabeçalho, seletor de competência, exportação, quatro KPIs, série de receita, barras por plano, alunos recentes e pendências |
| 210:87 | Alunos | Três KPIs, busca, filtros, abas de situação, tabela paginada e ações |
| 210:172 | Planos | Resumo, cartões de plano, benefícios, novo plano e aviso de valor |
| 210:257 | Mensalidades | Quatro KPIs, aviso de atraso, competência, filtros, tabela, recibo e baixa |
| 210:342 | Professores | Três KPIs, equipe, filtro por turno, perfis e formulário lateral |
| 210:427 | Treinos | Lista de fichas, resumo da ficha, sessões, tabela e edição de exercícios |
| 210:512 | Avaliações físicas | Seletor de aluno, KPIs, gráfico, histórico e formulário lateral |
| 210:597 | Novo aluno | Informações pessoais, matrícula, resumo do plano e ações |

Todos os frames de gestão compartilham navegação lateral, breadcrumb, busca, notificações e identidade da administradora. Os SVGs visíveis desses componentes e das ações ficam em `src/main/resources/static/assets`. O conteúdo do painel reflui em telas estreitas. Tabelas com muitas colunas têm rolagem horizontal própria.

| Propriedade | Tokens extraídos |
| --- | --- |
| Base | Fundo `#F7F8FA`, superfície `#FFFFFF`, texto `#191C20`, texto secundário `#525963`, texto auxiliar `#68717C`, borda `#E9EBEF`, divisor `#C4C8CE` |
| Marca | Navegação `#BE4100`, ação `#FF5400`, destaque suave `#FFF1E8`, planos `#FFC400`, `#FF8000`, `#FF5400` |
| Estados | Verde `#247859` sobre `#EAF5EF`, âmbar `#8C6800` sobre `#FFF7DA` e vermelho `#CC3900` sobre `#FFF0EB` |
| Tipografia | Inter 400, 500, 600 e 700. Corpo 12 px, títulos de tela 30 px, marca 34 px. No onboarding, 96 px, 36 px e 48 px. Entreletras 0, altura normal nos textos principais e 1,4 / 1 nas variantes de formulário. |
| Geometria | Frames 1440 × 1060 px, navegação 224 px, barra superior 80 px, margem principal 32 px, intervalos de 16 px entre métricas e 20 px entre painéis. Espaçamentos de formulário de 8, 12 e 16 px. |
| Raios e efeitos | Badges 6 px, controles e navegação 8 px, unidade 10 px, painéis 12 px. No onboarding, botão com raio de 24 px, desfoque de 3 px e sombra de 0 10px 30px rgba(0,0,0,.25). |

## Contrato da API

Cada linha pode ser listada por `GET /api/{recurso}` ou consultada em `GET /api/{recurso}/{id}`. A criação usa `POST`, a edição integral usa `PUT /api/{recurso}/{id}` e a exclusão usa `DELETE /api/{recurso}/{id}`. Uma exclusão que deixaria registros dependentes sem vínculo retorna 409. As respostas de leitura e escrita contêm `{id, criadoEm, dados}`. `id` é UUID, `criadoEm` é data e hora ISO com fuso e as datas de negócio usam `AAAA-MM-DD`. POST e PUT recebem o conteúdo de `dados`.

| Recurso | Propriedades de `dados` | Uso no painel |
| --- | --- | --- |
| `alunos` | `nome`, `cpf`, `nascimento`, `genero`, `email`, `celular`, `planoId`, `inicioMatricula`, `diaVencimento`, `professorId`, `ativo` | Cadastros, consulta, exclusão, alunos recentes, vínculos e indicadores de adesão. A data do cadastro vem de `criadoEm`. |
| `planos` | `nome`, `descricao`, `valorMensal`, `fidelidadeMeses`, `beneficios[]`, `ativo` | Cartões, valores no cadastro, opção de plano e distribuição de alunos ativos por `planoId`. |
| `mensalidades` | `alunoId`, `planoId`, `vencimento`, `valor`, `dataPagamento` | Tabela, registro de pagamento, recibo, inadimplência e série de receita. |
| `professores` | `nome`, `cref`, `email`, `especialidade`, `turno`, `ativo` | Equipe, perfis, vínculos e filtro de turno. Turnos `MANHA`, `TARDE`, `NOITE`, `INTEGRAL`. |
| `treinos` | `alunoId`, `professorId`, `objetivo`, `nivel`, `frequenciaSemanal`, `inicio`, `fim`, `ativo`, `sessoes[]` | Fichas, abas e treinos vigentes. Cada sessão contém `nome`, `titulo` e `exercicios[]`. Níveis `INICIANTE`, `INTERMEDIARIO`, `AVANCADO`. |
| `avaliacoes` | `alunoId`, `professorId`, `data`, `peso`, `altura`, `gordura`, `cintura`, `observacoes`, `objetivo`, `reavaliacao` | Histórico, peso, gordura, massa magra estimada e lembretes de reavaliação. |

Os exercícios contêm `nome`, `grupo`, `equipamento`, `series`, `repeticoes`, `carga` e `pausaSegundos`. Valores, medidas e contagens são números JSON. As relações usam UUID e campos opcionais aceitam `null`.

A receita soma `valor` pelo mês de `dataPagamento`. A taxa de pagamento conta mensalidades pagas na competência de `vencimento`. Cobranças sem pagamento ficam pendentes até o vencimento e em atraso depois dessa data. O painel usa a data civil do Rio de Janeiro para determinar vigência, atrasos e vencimentos próximos. A massa magra é calculada a partir de peso e percentual de gordura. Métricas históricas exigem datas registradas no próprio modelo.
