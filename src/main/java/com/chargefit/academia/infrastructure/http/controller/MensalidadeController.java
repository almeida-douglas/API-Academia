package com.chargefit.academia.infrastructure.http.controller;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.model.Academia.Mensalidade;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mensalidades")
public class MensalidadeController {
    private final GerenciarAcademiaUseCase academia;

    public MensalidadeController(GerenciarAcademiaUseCase academia) {
        this.academia = academia;
    }

    @GetMapping
    public List<RegistroAcademia<Mensalidade>> listar() {
        return academia.listar(Mensalidade.class);
    }

    @GetMapping("/{id}")
    public RegistroAcademia<Mensalidade> consultar(@PathVariable UUID id) {
        return academia.consultar(Mensalidade.class, id);
    }

    @PostMapping
    public ResponseEntity<RegistroAcademia<Mensalidade>> cadastrar(@Valid @RequestBody Mensalidade dados) {
        var registro = academia.cadastrar(Mensalidade.class, dados);
        return ResponseEntity.created(URI.create("/api/mensalidades/" + registro.id())).body(registro);
    }

    @PutMapping("/{id}")
    public RegistroAcademia<Mensalidade> editar(@PathVariable UUID id, @Valid @RequestBody Mensalidade dados) {
        return academia.editar(Mensalidade.class, id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        academia.excluir(Mensalidade.class, id);
    }
}
