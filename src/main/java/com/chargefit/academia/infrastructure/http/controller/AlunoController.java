package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Aluno;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alunos")
public class AlunoController {
    private final GerenciarAcademiaUseCase academia;

    public AlunoController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Aluno>> listar() {
        return academia.listar(Aluno.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Aluno> consultar(@PathVariable UUID id) {
        return academia.consultar(Aluno.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Aluno>> cadastrar(@Valid @RequestBody Aluno dados) {
        var registro = academia.cadastrar(Aluno.class, dados);
        return ResponseEntity.created(URI.create("/api/alunos/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Aluno> editar(@PathVariable UUID id, @Valid @RequestBody Aluno dados) {
        return academia.editar(Aluno.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Aluno.class, id);
    }
}
