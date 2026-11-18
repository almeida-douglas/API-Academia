package com.chargefit.academia.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "academia_registros", indexes = @Index(columnList = "tipo,criado_em"))
public class RegistroAcademiaEntity {
    @Id
    private UUID id;

    @Column(nullable = false, updatable = false)
    private String tipo;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Lob
    @Column(nullable = false)
    private String dadosJson;

    protected RegistroAcademiaEntity() {}

    public RegistroAcademiaEntity(UUID id, String tipo, OffsetDateTime criadoEm, String dadosJson) {
        this.id = id;
        this.tipo = tipo;
        this.criadoEm = criadoEm;
        this.dadosJson = dadosJson;
    }

    public UUID getId() { return id; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public String getDadosJson() { return dadosJson; }
}
