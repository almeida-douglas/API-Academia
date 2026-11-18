package com.chargefit.academia.infrastructure.http.request;

import com.chargefit.academia.domain.model.ReadingStatus;

import com.chargefit.academia.application.input.UpdateBookInput;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateBookRequest(
        @NotBlank @Size(max = 200) String titulo,
        @NotBlank @Size(max = 150) String autor,
        @NotNull @Positive Integer anoPublicacao,
        @NotBlank @Size(max = 80) String genero,
        @NotNull ReadingStatus statusLeitura
) {
    public UpdateBookInput toInput() {
        return new UpdateBookInput(titulo, autor, anoPublicacao, genero, statusLeitura);
    }
}
