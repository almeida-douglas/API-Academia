package com.chargefit.academia.domain.exception;

import java.util.UUID;

public class RegistroAcademiaNaoEncontrado extends RuntimeException {
    public RegistroAcademiaNaoEncontrado(UUID id) {
        super("Registro não encontrado: " + id);
    }
}
