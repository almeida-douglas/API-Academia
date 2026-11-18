# Popula o ChargeFit por HTTP. Execute com a aplicação em execução.
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$today = (Get-Date).Date
$currentMonth = $today.AddDays(1 - $today.Day)

function Invoke-Academia {
    param([string]$Resource, [ValidateSet('GET','POST')][string]$Method = 'GET', [hashtable]$Data)

    $url = "$BaseUrl/api/$Resource"
    $request = @{ Uri=$url; Method=$Method; TimeoutSec=15 }
    if ($Method -eq 'POST') {
        $request.ContentType = 'application/json; charset=utf-8'
        $request.Body = [Text.Encoding]::UTF8.GetBytes(($Data | ConvertTo-Json -Depth 12 -Compress))
    }
    try {
        $response = Invoke-WebRequest @request -UseBasicParsing
        # O Windows PowerShell pode usar outra codificação quando a resposta JSON omite o charset.
        $json = [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
        return (ConvertFrom-Json -InputObject $json)
    } catch {
        $detail = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
        throw "Falha em $Method $url. $detail"
    }
}

function Format-Day([datetime]$Date) {
    $Date.ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
}

$resources = @('planos','professores','alunos','mensalidades','treinos','avaliacoes')
$existing = @{}
$created = [ordered]@{}
$reused = [ordered]@{}

foreach ($resource in $resources) {
    $existing[$resource] = @(Invoke-Academia -Resource $resource | Where-Object { $null -ne $_ })
    $created[$resource] = 0
    $reused[$resource] = 0
}

function Get-OrCreate {
    param([string]$Resource, [hashtable]$Data, [scriptblock]$Match)

    foreach ($record in $existing[$Resource]) {
        if (& $Match $record.dados) {
            $reused[$Resource]++
            return $record
        }
    }

    $record = Invoke-Academia -Resource $Resource -Method POST -Data $Data
    $existing[$Resource] += $record
    $created[$Resource]++
    return $record
}

$plans = @(
    @{ nome='Essencial (Demo)'; descricao='Musculação em horário livre'; valorMensal=99.90; fidelidadeMeses=0; beneficios=@('Musculação', 'Área de cardio'); ativo=$true },
    @{ nome='Performance (Demo)'; descricao='Musculação e aulas em grupo'; valorMensal=139.90; fidelidadeMeses=3; beneficios=@('Musculação', 'Aulas em grupo', 'Avaliação inicial'); ativo=$true },
    @{ nome='Completo (Demo)'; descricao='Acompanhamento físico periódico'; valorMensal=179.90; fidelidadeMeses=6; beneficios=@('Musculação', 'Aulas em grupo', 'Reavaliação periódica'); ativo=$true }
)

$coaches = @(
    @{ nome='Marina Teixeira (Demo)'; cref='DEMO-001'; email='marina.demo@example.com'; especialidade='Musculação'; turno='MANHA'; ativo=$true },
    @{ nome='Rafael Duarte (Demo)'; cref='DEMO-002'; email='rafael.demo@example.com'; especialidade='Treinamento funcional'; turno='TARDE'; ativo=$true },
    @{ nome='Camila Siqueira (Demo)'; cref='DEMO-003'; email='camila.demo@example.com'; especialidade='Condicionamento físico'; turno='NOITE'; ativo=$true },
    @{ nome='Felipe Nunes (Demo)'; cref='DEMO-004'; email='felipe.demo@example.com'; especialidade='Avaliação física'; turno='INTEGRAL'; ativo=$true }
)

$studentNames = @(
    'Ana Ribeiro','Bruno Moura','Carolina Alves','Diego Lima',
    'Elaine Castro','Fernando Rocha','Gabriela Dias','Henrique Costa',
    'Isabela Freitas','João Barbosa','Larissa Mendes','Mateus Vieira'
)
$dueDays = @(5, 10, 15, 25)
$goals = @('Hipertrofia','Condicionamento físico','Fortalecimento')
$levels = @('INICIANTE','INTERMEDIARIO','AVANCADO')

# Confira os CPFs reservados antes de criar qualquer registro.
for ($i = 0; $i -lt $studentNames.Count; $i++) {
    $number = $i + 1
    $cpf = '0000001{0:D4}' -f $number
    $email = "aluno$number.chargefit-demo@example.com"
    $collision = $existing.alunos | Where-Object {
        ($_.dados.cpf -replace '\D','') -eq $cpf -and $_.dados.email -ne $email
    } | Select-Object -First 1
    if ($collision) {
        throw "O CPF de demonstração $cpf já pertence a outro cadastro. Nenhum registro foi criado."
    }
}

$planRecords = @(foreach ($plan in $plans) {
    Get-OrCreate -Resource planos -Data $plan -Match { param($d) $d.nome -eq $plan.nome }
})
$coachRecords = @(foreach ($coach in $coaches) {
    Get-OrCreate -Resource professores -Data $coach -Match { param($d) $d.cref -eq $coach.cref }
})

for ($i = 0; $i -lt $studentNames.Count; $i++) {
    $number = $i + 1
    $plan = $planRecords[$i % $planRecords.Count]
    $coach = $coachRecords[$i % $coachRecords.Count]
    $dueDay = $dueDays[$i % $dueDays.Count]
    $isActive = $i -lt ($studentNames.Count - 1)
    $studentData = @{
        nome = "$($studentNames[$i]) (Demo)"
        cpf = '0000001{0:D4}' -f $number
        nascimento = Format-Day ($today.AddYears(-(22 + $i)).AddDays(-30))
        email = "aluno$number.chargefit-demo@example.com"
        celular = '2190000{0:D4}' -f $number
        planoId = $plan.id
        professorId = $coach.id
        inicioMatricula = Format-Day ($currentMonth.AddMonths(-3).AddDays($i))
        diaVencimento = $dueDay
        ativo = $isActive
    }
    $student = Get-OrCreate -Resource alunos -Data $studentData -Match { param($d) $d.email -eq $studentData.email }
    $billingPlan = $existing.planos | Where-Object { $_.id -eq $student.dados.planoId } | Select-Object -First 1
    if (-not $billingPlan) { throw "Plano cadastrado do aluno de demonstração $number não encontrado." }
    $dueDay = [int]$student.dados.diaVencimento

    # Três competências, mais uma cobrança futura para mostrar o estado pendente.
    for ($offset = -2; $offset -le 1; $offset++) {
        if ($offset -eq 1 -and $i -ne 0) { continue }
        $month = $currentMonth.AddMonths($offset)
        $day = [Math]::Min($dueDay, [datetime]::DaysInMonth($month.Year, $month.Month))
        $dueDate = $month.AddDays($day - 1)
        $period = $month.ToString('yyyy-MM')
        $payDate = $null
        if ($offset -lt 0 -and (($i + $offset) % 5 -ne 0)) {
            $payDate = Format-Day ($dueDate.AddDays(-1))
        } elseif ($offset -eq 0 -and $i % 3 -eq 0) {
            $payDate = Format-Day $(if ($dueDate -gt $today) { $today } else { $dueDate })
        }
        $bill = @{
            alunoId=$student.id
            planoId=$billingPlan.id
            vencimento=Format-Day $dueDate
            valor=$billingPlan.dados.valorMensal
            dataPagamento=$payDate
        }
        $null = Get-OrCreate -Resource mensalidades -Data $bill -Match {
            param($d)
            $d.alunoId -eq $student.id -and $d.vencimento.StartsWith($period)
        }
    }

    $goal = "$($goals[$i % $goals.Count]) (Demo)"
    $training = @{
        alunoId=$student.id; professorId=$coach.id; objetivo=$goal
        nivel=$levels[$i % $levels.Count]; frequenciaSemanal=3
        inicio=Format-Day ($today.AddDays(-14)); fim=Format-Day ($today.AddDays(45)); ativo=$isActive
        sessoes=@(
            @{ nome='Treino A'; titulo='Peito e tríceps'; exercicios=@(
                @{ nome='Supino reto'; grupo='Peito'; equipamento='Barra'; series=3; repeticoes='10-12'; carga=20; pausaSegundos=75 },
                @{ nome='Tríceps na polia'; grupo='Tríceps'; equipamento='Polia'; series=3; repeticoes='12'; carga=12; pausaSegundos=60 }
            ) },
            @{ nome='Treino B'; titulo='Pernas'; exercicios=@(
                @{ nome='Agachamento'; grupo='Pernas'; equipamento='Halter'; series=3; repeticoes='10'; carga=14; pausaSegundos=90 },
                @{ nome='Leg press'; grupo='Pernas'; equipamento='Máquina'; series=3; repeticoes='12'; carga=60; pausaSegundos=90 }
            ) }
        )
    }
    $null = Get-OrCreate -Resource treinos -Data $training -Match {
        param($d) $d.alunoId -eq $student.id -and $d.objetivo -eq $goal
    }

    for ($round = 0; $round -lt 3; $round++) {
        $assessmentDate = $today.AddDays(-60 + 30 * $round)
        $note = "ChargeFit Demo - avaliação $($round + 1)"
        $assessment = @{
            alunoId=$student.id; professorId=$coach.id; data=Format-Day $assessmentDate
            peso=[Math]::Round((66.5 + 1.7 * $i - 0.8 * $round), 1)
            altura=161 + $i
            gordura=[Math]::Round((21.5 + 0.6 * $i - 0.7 * $round), 1)
            cintura=71 + $i - $round
            observacoes=$note
            objetivo='Acompanhar a evolução física'
            reavaliacao=Format-Day ($assessmentDate.AddDays(30))
        }
        $null = Get-OrCreate -Resource avaliacoes -Data $assessment -Match {
            param($d) $d.alunoId -eq $student.id -and $d.observacoes -eq $note
        }
    }
}

foreach ($resource in $resources) {
    [pscustomobject]@{ Recurso=$resource; Criados=$created[$resource]; Reutilizados=$reused[$resource] }
}
