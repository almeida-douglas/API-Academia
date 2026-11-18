package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Plano;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/planos")
public class PlanoController {
    private final GerenciarAcademiaUseCase academia;

    public PlanoController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Plano>> listar() {
        return academia.listar(Plano.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Plano> consultar(@PathVariable UUID id) {
        return academia.consultar(Plano.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Plano>> cadastrar(@Valid @RequestBody Plano dados) {
        var registro = academia.cadastrar(Plano.class, dados);
        return ResponseEntity.created(URI.create("/api/planos/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Plano> editar(@PathVariable UUID id, @Valid @RequestBody Plano dados) {
        return academia.editar(Plano.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Plano.class, id);
    }
}
