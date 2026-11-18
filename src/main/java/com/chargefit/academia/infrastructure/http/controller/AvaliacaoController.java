package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Avaliacao;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {
    private final GerenciarAcademiaUseCase academia;

    public AvaliacaoController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Avaliacao>> listar() {
        return academia.listar(Avaliacao.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Avaliacao> consultar(@PathVariable UUID id) {
        return academia.consultar(Avaliacao.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Avaliacao>> cadastrar(@Valid @RequestBody Avaliacao dados) {
        var registro = academia.cadastrar(Avaliacao.class, dados);
        return ResponseEntity.created(URI.create("/api/avaliacoes/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Avaliacao> editar(@PathVariable UUID id, @Valid @RequestBody Avaliacao dados) {
        return academia.editar(Avaliacao.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Avaliacao.class, id);
    }
}
