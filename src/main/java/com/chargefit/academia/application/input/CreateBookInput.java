package com.chargefit.academia.application.input;

import com.chargefit.academia.domain.model.ReadingStatus;

public record CreateBookInput(
        String titulo,
        String autor,
        Integer anoPublicacao,
        String genero,
        ReadingStatus statusLeitura
) {
}
