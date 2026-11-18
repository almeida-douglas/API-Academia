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

## Testes automatizados

```powershell
.\mvnw.cmd clean verify
```

Os testes verificam a inicialização da aplicação, os fluxos de cadastro e consulta da academia, os vínculos entre registros e o retorno HTTP 404 para rotas inexistentes.

Os relatórios são gerados em `target/surefire-reports`. Os testes usam um banco em memória separado do banco da aplicação.

Para gerar e executar o JAR:

```powershell
.\mvnw.cmd package
java -jar target/academia-api-0.0.1-SNAPSHOT.jar
```

## Banco de dados

Por padrão, o H2 persiste os dados em `data/academiadb.mv.db`. Com a aplicação rodando na porta 8080, o [console local do H2](http://localhost:8080/h2-console) usa a URL JDBC `jdbc:h2:file:./data/academiadb`, usuário `sa` e senha vazia.