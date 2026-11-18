# ChargeFit Academia

Sistema de gestão de academia com painel web e API REST para alunos, planos, mensalidades, professores, treinos e avaliações físicas. Utiliza Java 25, Spring Boot 4.1.1, Maven, Spring MVC, Bean Validation, Spring Data JPA e H2.

## Executar


```powershell
.\mvnw.cmd spring-boot:run
```
O painel fica em [http://localhost:8080/](http://localhost:8080/), com Rio de Janeiro como unidade padrão. Consulte [CHARGEFIT.md](CHARGEFIT.md) para os endpoints da academia, o modo de demonstração e o mapeamento das telas.

## Validar a população em um banco vazio no Windows

Na pasta do projeto, inicie a instância de validação:

```powershell
.\limpar-banco-validacao.cmd
```

O script inicia o ChargeFit na porta **8081** com um banco H2 em memória. Aguarde a [rota de planos](http://127.0.0.1:8081/api/planos) responder com JSON. Uma base vazia retorna `[]`.

Com essa instância em execução, abra outro PowerShell na pasta do projeto e carregue os dados fictícios:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\popular-demonstracao.ps1 -BaseUrl http://127.0.0.1:8081
```

Em um banco vazio, o script cria **104 registros**: 3 planos, 4 professores, 12 alunos, 37 mensalidades, 12 treinos e 36 avaliações. Ele reutiliza registros de demonstração que já encontra no banco. Sem `-BaseUrl`, o script aponta para a instância padrão na porta **8080**.

Abra o [painel de validação](http://127.0.0.1:8081/). Para repetir o teste com um banco vazio, encerre a instância da porta 8081 com **Ctrl+C** e execute `limpar-banco-validacao.cmd` novamente. Os dados da apresentação ficam no banco persistente da instância padrão.

## API de livros (legado)

O endpoint `/books` permanece disponível para clientes da aplicação original.

| Método | Caminho | Funcionalidade | Sucesso |
| --- | --- | --- | --- |
| POST | `/books` | Cadastrar livro | 201 e cabeçalho Location |
| GET | `/books` | Listar todos os livros | 200 e lista JSON |
| GET | `/books/{id}` | Consultar por UUID | 200 |
| PUT | `/books/{id}` | Atualizar todos os campos | 200 |
| DELETE | `/books/{id}` | Excluir livro | 204 sem corpo |

O identificador é um UUID gerado pelo sistema. Consulta, atualização e exclusão de um identificador inexistente retornam 404. Dados inválidos retornam 400. Uma biblioteca vazia retorna `[]`.

Corpo JSON para cadastro e atualização:

```json
{
  "titulo": "Dom Casmurro",
  "autor": "Machado de Assis",
  "genero": "Romance",
  "anoPublicacao": 1899,
  "statusLeitura": "NAO_LIDO"
}
```

Todos os campos são obrigatórios. Título, autor e gênero não podem estar em branco e aceitam até 200, 150 e 80 caracteres, respectivamente. O ano deve estar entre 1 e o ano atual. Os valores de status aceitos são `NAO_LIDO`, `LENDO` e `LIDO` (em maiúsculas). O PUT exige o objeto completo.

### Demonstração do legado no PowerShell

Com a aplicação em execução, abra outro terminal:

```powershell
$base = 'http://localhost:8080/books'
$dados = @{
    titulo = 'Dom Casmurro'
    autor = 'Machado de Assis'
    genero = 'Romance'
    anoPublicacao = 1899
    statusLeitura = 'NAO_LIDO'
}

# Cadastrar e guardar o identificador retornado
$livro = Invoke-RestMethod -Method Post -Uri $base -ContentType 'application/json; charset=utf-8' -Body ($dados | ConvertTo-Json)
$livro

# Listar e consultar
Invoke-RestMethod -Uri $base
Invoke-RestMethod -Uri "$base/$($livro.id)"

# Atualizar o status de leitura
$dados.statusLeitura = 'LIDO'
Invoke-RestMethod -Method Put -Uri "$base/$($livro.id)" -ContentType 'application/json; charset=utf-8' -Body ($dados | ConvertTo-Json)

# Excluir e confirmar que a lista voltou a ficar vazia
Invoke-RestMethod -Method Delete -Uri "$base/$($livro.id)"
Invoke-RestMethod -Uri $base
```

## Testes automatizados

```powershell
.\mvnw.cmd clean verify
```

Os testes cobrem regras do domínio, os cinco casos de uso, inicialização da aplicação e integração dos endpoints com o banco H2: fluxo completo de cadastro a exclusão, persistência dos três status, consultas inexistentes, UUID inválido, campos ausentes, limites de texto, ano inválido, JSON malformado e atualização inválida sem alteração dos dados.

Os relatórios são gerados em `target/surefire-reports`. Os testes usam um banco em memória separado do banco da aplicação.

Para gerar e executar o JAR:

```powershell
.\mvnw.cmd package
java -jar target/academia-api-0.0.1-SNAPSHOT.jar
```

## Organização do módulo legado

- `domain`: classe `Book` com atributos privados, construtores, métodos de consulta e atualização; `BookId` como objeto de valor; enum `ReadingStatus`; contrato do repositório e exceção de livro inexistente.
- `application`: casos de uso de cadastrar, listar, consultar, atualizar e excluir, com objetos de entrada e saída.
- `infrastructure`: controller REST, validação das requisições, tratamento padronizado de erros, entidade JPA, mapeadores, adaptador do repositório e configuração da injeção de dependências.

O domínio valida suas regras independentemente do Spring. Os casos de uso dependem da interface `BookRepository`; o adaptador implementa essa interface utilizando Spring Data JPA.

## Banco de dados

O H2 grava os dados novos em `data/academiadb.mv.db`. Se houver um banco `data/booksdb.mv.db` da versão anterior e ainda não existir `data/academiadb.mv.db`, a aplicação abre o arquivo anterior e preserva os registros existentes. O console local fica em [http://localhost:8080/h2-console](http://localhost:8080/h2-console). Use a URL JDBC do arquivo em uso, com usuário `sa` e senha vazia.