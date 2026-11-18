package com.chargefit.academia.application.usecase;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.domain.exception.RegistroAcademiaNaoEncontrado;
import com.chargefit.academia.domain.exception.RegistroAcademiaVinculado;
import com.chargefit.academia.domain.model.Academia.*;
import com.chargefit.academia.domain.repository.AcademiaRepository;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

public class GerenciarAcademiaUseCase {
    private final AcademiaRepository repositorio;

    public GerenciarAcademiaUseCase(AcademiaRepository repositorio) {
        this.repositorio = repositorio;
    }

    public <T extends Dados> List<RegistroAcademia<T>> listar(Class<T> tipo) {
        return repositorio.listar(tipo);
    }

    public <T extends Dados> RegistroAcademia<T> consultar(Class<T> tipo, UUID id) {
        return repositorio.buscar(tipo, id).orElseThrow(() -> new RegistroAcademiaNaoEncontrado(id));
    }

    public synchronized <T extends Dados> RegistroAcademia<T> cadastrar(Class<T> tipo, T dados) {
        return salvar(tipo, UUID.randomUUID(), OffsetDateTime.now(ZoneOffset.UTC), dados);
    }

    public synchronized <T extends Dados> RegistroAcademia<T> editar(Class<T> tipo, UUID id, T dados) {
        return salvar(tipo, id, consultar(tipo, id).criadoEm(), dados);
    }

    public synchronized <T extends Dados> void excluir(Class<T> tipo, UUID id) {
        consultar(tipo, id);
        if (possuiVinculos(tipo, id)) {
            throw new RegistroAcademiaVinculado();
        }
        repositorio.excluir(id);
    }

    private <T extends Dados> RegistroAcademia<T> salvar(Class<T> tipo, UUID id,
                                                        OffsetDateTime criadoEm, T dados) {
        validar(id, dados);
        return repositorio.salvar(tipo, new RegistroAcademia<>(id, criadoEm, dados));
    }

    private void validar(UUID id, Dados dados) {
        switch (dados) {
            case Aluno aluno -> {
                exigirVinculo(Plano.class, aluno.planoId(), "plano");
                exigirVinculo(Professor.class, aluno.professorId(), "professor");
                String cpf = digitos(aluno.cpf());
                if (cpf.length() != 11) throw new IllegalArgumentException("O CPF deve ter 11 dígitos.");
                if (listar(Aluno.class).stream().anyMatch(r -> !r.id().equals(id) && digitos(r.dados().cpf()).equals(cpf))) {
                    throw new IllegalArgumentException("Já existe um aluno com este CPF.");
                }
            }
            case Mensalidade mensalidade -> {
                exigirVinculo(Aluno.class, mensalidade.alunoId(), "aluno");
                exigirVinculo(Plano.class, mensalidade.planoId(), "plano");
            }
            case Treino treino -> {
                exigirVinculo(Aluno.class, treino.alunoId(), "aluno");
                exigirVinculo(Professor.class, treino.professorId(), "professor");
                if (treino.fim().isBefore(treino.inicio())) {
                    throw new IllegalArgumentException("O fim da ficha deve ser igual ou posterior ao início.");
                }
            }
            case Avaliacao avaliacao -> {
                exigirVinculo(Aluno.class, avaliacao.alunoId(), "aluno");
                exigirVinculo(Professor.class, avaliacao.professorId(), "professor");
                if (avaliacao.reavaliacao() != null && avaliacao.reavaliacao().isBefore(avaliacao.data())) {
                    throw new IllegalArgumentException("A reavaliação deve ser igual ou posterior à avaliação.");
                }
            }
            case Professor professor -> {
                if (listar(Professor.class).stream().anyMatch(r -> !r.id().equals(id)
                        && r.dados().cref().strip().equalsIgnoreCase(professor.cref().strip()))) {
                    throw new IllegalArgumentException("Já existe um professor com este CREF.");
                }
            }
            case Plano plano -> { }
        }
    }

    private void exigirVinculo(Class<? extends Dados> tipo, UUID id, String nome) {
        if (id != null && repositorio.buscar(tipo, id).isEmpty()) {
            throw new IllegalArgumentException("Selecione um " + nome + " cadastrado.");
        }
    }

    private boolean possuiVinculos(Class<? extends Dados> tipo, UUID id) {
        if (tipo == Aluno.class) {
            return listar(Mensalidade.class).stream().anyMatch(r -> id.equals(r.dados().alunoId()))
                    || listar(Treino.class).stream().anyMatch(r -> id.equals(r.dados().alunoId()))
                    || listar(Avaliacao.class).stream().anyMatch(r -> id.equals(r.dados().alunoId()));
        }
        if (tipo == Plano.class) {
            return listar(Aluno.class).stream().anyMatch(r -> id.equals(r.dados().planoId()))
                    || listar(Mensalidade.class).stream().anyMatch(r -> id.equals(r.dados().planoId()));
        }
        if (tipo == Professor.class) {
            return listar(Aluno.class).stream().anyMatch(r -> id.equals(r.dados().professorId()))
                    || listar(Treino.class).stream().anyMatch(r -> id.equals(r.dados().professorId()))
                    || listar(Avaliacao.class).stream().anyMatch(r -> id.equals(r.dados().professorId()));
        }
        return false;
    }

    private static String digitos(String cpf) {
        return cpf.replaceAll("[^0-9]", "");
    }
}
