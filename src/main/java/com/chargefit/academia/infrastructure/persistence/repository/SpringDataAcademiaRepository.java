package com.chargefit.academia.infrastructure.persistence.repository;

import com.chargefit.academia.infrastructure.persistence.entity.RegistroAcademiaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataAcademiaRepository extends JpaRepository<RegistroAcademiaEntity, UUID> {
    List<RegistroAcademiaEntity> findAllByTipoOrderByCriadoEmDescIdAsc(String tipo);
    Optional<RegistroAcademiaEntity> findByTipoAndId(String tipo, UUID id);
}
