package com.chargefit.academia.domain.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class Academia {
    private Academia() {}

    public sealed interface Dados permits Aluno, Plano, Mensalidade, Professor, Treino, Avaliacao {}
    public enum Turno { MANHA, TARDE, NOITE, INTEGRAL }
    public enum Nivel { INICIANTE, INTERMEDIARIO, AVANCADO }

    public record Aluno(
            @NotBlank String nome,
            @NotBlank String cpf,
            @NotNull @Past LocalDate nascimento,
            String genero,
            @NotBlank @Email String email,
            @NotBlank String celular,
            @NotNull UUID planoId,
            @NotNull LocalDate inicioMatricula,
            @NotNull @Min(1) @Max(31) Integer diaVencimento,
            UUID professorId,
            @NotNull Boolean ativo
    ) implements Dados {}

    public record Plano(
            @NotBlank String nome,
            String descricao,
            @NotNull @DecimalMin("0.01") BigDecimal valorMensal,
            @NotNull @Min(0) Integer fidelidadeMeses,
            @NotNull List<@NotBlank String> beneficios,
            @NotNull Boolean ativo
    ) implements Dados {}

    public record Mensalidade(
            @NotNull UUID alunoId,
            @NotNull UUID planoId,
            @NotNull LocalDate vencimento,
            @NotNull @DecimalMin("0.01") BigDecimal valor,
            @PastOrPresent LocalDate dataPagamento
    ) implements Dados {}

    public record Professor(
            @NotBlank String nome,
            @NotBlank String cref,
            @NotBlank @Email String email,
            @NotBlank String especialidade,
            @NotNull Turno turno,
            @NotNull Boolean ativo
    ) implements Dados {}

    public record Treino(
            @NotNull UUID alunoId,
            @NotNull UUID professorId,
            @NotBlank String objetivo,
            @NotNull Nivel nivel,
            @NotNull @Min(1) @Max(7) Integer frequenciaSemanal,
            @NotNull LocalDate inicio,
            @NotNull LocalDate fim,
            @NotNull Boolean ativo,
            @NotNull List<@NotNull @Valid Sessao> sessoes
    ) implements Dados {}

    public record Avaliacao(
            @NotNull UUID alunoId,
            @NotNull UUID professorId,
            @NotNull @PastOrPresent LocalDate data,
            @NotNull @Positive BigDecimal peso,
            @NotNull @Positive BigDecimal altura,
            @DecimalMin("0") @DecimalMax("100") BigDecimal gordura,
            @Positive BigDecimal cintura,
            String observacoes,
            String objetivo,
            LocalDate reavaliacao
    ) implements Dados {}

    public record Sessao(@NotBlank String nome, @NotBlank String titulo,
                         @NotNull List<@NotNull @Valid Exercicio> exercicios) {}

    public record Exercicio(@NotBlank String nome, String grupo, String equipamento,
                            @NotNull @Positive Integer series, @NotBlank String repeticoes,
                            @PositiveOrZero BigDecimal carga, @PositiveOrZero Integer pausaSegundos) {}
}
