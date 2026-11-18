package com.chargefit.academia.infrastructure.http;

import com.chargefit.academia.infrastructure.persistence.repository.SpringDataAcademiaRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AcademiaIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private SpringDataAcademiaRepository repository;

    @BeforeEach
    void prepare() {
        repository.deleteAll();
    }

    @Test
    void retorna404ParaUmaRotaInexistente() throws Exception {
        mvc.perform(get("/lunos"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.path").value("/lunos"));

        mvc.perform(get("/api/alunos"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void persisteOSchemaCompartilhadoEAceitaOsFluxosDaAcademia() throws Exception {
        String plano = criar("planos", """
                {"nome":"Black","valorMensal":149.90,"fidelidadeMeses":0,"beneficios":["Musculação"],"ativo":true}
                """);
        String professor = criar("professores", """
                {"nome":"Professor Teste","cref":"000000-G/SP","email":"professor@example.com",
                 "especialidade":"Musculação","turno":"MANHA","ativo":true}
                """);
        String aluno = criar("alunos", """
                {"nome":"Aluno Teste","cpf":"00000000001","nascimento":"1997-04-12",
                 "email":"aluno@example.com","celular":"11900000000","planoId":"%s","professorId":"%s",
                 "inicioMatricula":"2024-01-01","diaVencimento":10,"ativo":true}
                """.formatted(plano, professor));
        String mensalidade = criar("mensalidades", """
                {"alunoId":"%s","planoId":"%s","vencimento":"2024-01-10","valor":149.90,"dataPagamento":null}
                """.formatted(aluno, plano));
        String pagamento = LocalDate.now().toString();
        mvc.perform(put("/api/mensalidades/{id}", mensalidade).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"alunoId":"%s","planoId":"%s","vencimento":"2024-01-10","valor":149.90,"dataPagamento":"%s"}
                                """.formatted(aluno, plano, pagamento)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dados.dataPagamento").value(pagamento));
        String treino = criar("treinos", """
                {"alunoId":"%s","professorId":"%s","objetivo":"Hipertrofia","nivel":"INTERMEDIARIO",
                 "frequenciaSemanal":3,"inicio":"2024-01-01","fim":"2024-04-01","ativo":true,
                 "sessoes":[{"nome":"Treino A","titulo":"Peito","exercicios":[
                 {"nome":"Supino","series":3,"repeticoes":"10–12","carga":30,"pausaSegundos":60}]}]}
                """.formatted(aluno, professor));
        mvc.perform(get("/api/treinos/{id}", treino))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dados.sessoes[0].exercicios[0].repeticoes").value("10–12"));

        String avaliacao = criar("avaliacoes", """
                {"alunoId":"%s","professorId":"%s","data":"2024-01-02","peso":68.4,"altura":165,"gordura":24.2}
                """.formatted(aluno, professor));
        mvc.perform(get("/api/avaliacoes")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(avaliacao))
                .andExpect(jsonPath("$[0].dados.peso").value(68.4));

        mvc.perform(delete("/api/alunos/{id}", aluno)).andExpect(status().isNoContent());
        mvc.perform(get("/api/alunos/{id}", aluno)).andExpect(status().isNotFound());
        mvc.perform(get("/api/mensalidades/{id}", mensalidade)).andExpect(status().isNotFound());
        mvc.perform(get("/api/treinos/{id}", treino)).andExpect(status().isNotFound());
        mvc.perform(get("/api/avaliacoes/{id}", avaliacao)).andExpect(status().isNotFound());
        mvc.perform(get("/api/planos/{id}", plano)).andExpect(status().isOk());
        mvc.perform(get("/api/professores/{id}", professor)).andExpect(status().isOk());
        mvc.perform(get("/")).andExpect(status().isOk());
        mvc.perform(get("/index.html")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(
                        "<strong id=\"default-unit\">Rio de Janeiro</strong>")));
    }

    @Test
    void excluiPlanoESeusAlunosEDependencias() throws Exception {
        String plano = criar("planos", """
                {"nome":"Start","valorMensal":99.90,"fidelidadeMeses":0,"beneficios":[],"ativo":true}
                """);
        String aluno = criar("alunos", """
                {"nome":"Aluno Teste","cpf":"00000000002","nascimento":"1997-04-12",
                 "email":"aluno@example.com","celular":"11900000000","planoId":"%s",
                 "inicioMatricula":"2024-01-01","diaVencimento":10,"ativo":true}
                """.formatted(plano));
        String mensalidade = criar("mensalidades", """
                {"alunoId":"%s","planoId":"%s","vencimento":"2024-01-10","valor":99.90}
                """.formatted(aluno, plano));

        mvc.perform(delete("/api/planos/{id}", plano)).andExpect(status().isNoContent());
        mvc.perform(get("/api/alunos/{id}", aluno)).andExpect(status().isNotFound());
        mvc.perform(get("/api/mensalidades/{id}", mensalidade)).andExpect(status().isNotFound());
    }

    @Test
    void excluiProfessorSemExcluirAluno() throws Exception {
        String plano = criar("planos", """
                {"nome":"Start","valorMensal":99.90,"fidelidadeMeses":0,"beneficios":[],"ativo":true}
                """);
        String professor = criar("professores", """
                {"nome":"Professor Teste","cref":"000001-G/SP","email":"professor@example.com",
                 "especialidade":"Musculação","turno":"MANHA","ativo":true}
                """);
        String aluno = criar("alunos", """
                {"nome":"Aluno Teste","cpf":"00000000003","nascimento":"1997-04-12",
                 "email":"aluno@example.com","celular":"11900000000","planoId":"%s","professorId":"%s",
                 "inicioMatricula":"2024-01-01","diaVencimento":10,"ativo":true}
                """.formatted(plano, professor));
        String treino = criar("treinos", """
                {"alunoId":"%s","professorId":"%s","objetivo":"Hipertrofia","nivel":"INTERMEDIARIO",
                 "frequenciaSemanal":3,"inicio":"2024-01-01","fim":"2024-04-01","ativo":true,"sessoes":[]}
                """.formatted(aluno, professor));

        mvc.perform(delete("/api/professores/{id}", professor)).andExpect(status().isNoContent());
        mvc.perform(get("/api/alunos/{id}", aluno)).andExpect(status().isOk())
                .andExpect(jsonPath("$.dados.professorId").value(org.hamcrest.Matchers.nullValue()));
        mvc.perform(get("/api/treinos/{id}", treino)).andExpect(status().isNotFound());
    }

    private String criar(String recurso, String dados) throws Exception {
        var criacao = mvc.perform(post("/api/" + recurso).contentType(MediaType.APPLICATION_JSON).content(dados))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.criadoEm").isString())
                .andExpect(jsonPath("$.dados").isMap())
                .andReturn();
        String id = JsonPath.read(criacao.getResponse().getContentAsString(), "$.id");
        mvc.perform(get("/api/" + recurso + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
        return id;
    }
}
