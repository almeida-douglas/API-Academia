package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Professor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/professores")
public class ProfessorController {
    private final GerenciarAcademiaUseCase academia;

    public ProfessorController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Professor>> listar() {
        return academia.listar(Professor.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Professor> consultar(@PathVariable UUID id) {
        return academia.consultar(Professor.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Professor>> cadastrar(@Valid @RequestBody Professor dados) {
        var registro = academia.cadastrar(Professor.class, dados);
        return ResponseEntity.created(URI.create("/api/professores/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Professor> editar(@PathVariable UUID id, @Valid @RequestBody Professor dados) {
        return academia.editar(Professor.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Professor.class, id);
    }
}
