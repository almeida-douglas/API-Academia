package com.chargefit.academia.domain.exception;

public class RegistroAcademiaVinculado extends RuntimeException {
    public RegistroAcademiaVinculado() {
        super("Este registro possui vínculos. Remova os vínculos antes de excluir.");
    }
}
