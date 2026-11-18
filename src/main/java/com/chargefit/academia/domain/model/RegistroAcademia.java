package com.chargefit.academia.domain.model;

import com.chargefit.academia.domain.model.Academia.Dados;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RegistroAcademia<T extends Dados>(UUID id, OffsetDateTime criadoEm, T dados) {}
