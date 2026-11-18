package com.chargefit.academia.domain.repository;

import com.chargefit.academia.domain.model.Academia.Dados;
import com.chargefit.academia.domain.model.RegistroAcademia;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcademiaRepository {
    <T extends Dados> List<RegistroAcademia<T>> listar(Class<T> tipo);
    <T extends Dados> Optional<RegistroAcademia<T>> buscar(Class<T> tipo, UUID id);
    <T extends Dados> RegistroAcademia<T> salvar(Class<T> tipo, RegistroAcademia<T> registro);
    void excluir(UUID id);
}
