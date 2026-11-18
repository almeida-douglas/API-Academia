@echo off
setlocal

if not exist "%~dp0mvnw.cmd" (
    echo Coloque este script junto de mvnw.cmd na pasta API Academia.
    exit /b 1
)

pushd "%~dp0" || exit /b 1
echo ChargeFit de validacao: http://127.0.0.1:8081/
echo O banco em memoria comeca vazio. Feche a instancia com Ctrl+C para descarta-lo.
call mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081 --server.address=127.0.0.1 --spring.datasource.url=jdbc:h2:mem:chargefit-validacao;DB_CLOSE_DELAY=-1 --spring.jpa.hibernate.ddl-auto=create-drop"
set "CHARGEFIT_VALIDACAO_EXIT=%ERRORLEVEL%"
popd
exit /b %CHARGEFIT_VALIDACAO_EXIT%
