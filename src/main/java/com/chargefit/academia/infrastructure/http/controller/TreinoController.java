package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Treino;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/treinos")
public class TreinoController {
    private final GerenciarAcademiaUseCase academia;

    public TreinoController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Treino>> listar() {
        return academia.listar(Treino.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Treino> consultar(@PathVariable UUID id) {
        return academia.consultar(Treino.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Treino>> cadastrar(@Valid @RequestBody Treino dados) {
        var registro = academia.cadastrar(Treino.class, dados);
        return ResponseEntity.created(URI.create("/api/treinos/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Treino> editar(@PathVariable UUID id, @Valid @RequestBody Treino dados) {
        return academia.editar(Treino.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Treino.class, id);
    }
}
