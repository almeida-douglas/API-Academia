package com.chargefit.academia.infrastructure.persistence.adapter;

import com.chargefit.academia.domain.model.RegistroAcademia;
import com.chargefit.academia.domain.model.Academia.Dados;
import com.chargefit.academia.domain.repository.AcademiaRepository;
import com.chargefit.academia.infrastructure.persistence.entity.RegistroAcademiaEntity;
import com.chargefit.academia.infrastructure.persistence.repository.SpringDataAcademiaRepository;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AcademiaRepositoryAdapter implements AcademiaRepository {
    private final SpringDataAcademiaRepository tabela;
    private final ObjectMapper json;

    public AcademiaRepositoryAdapter(SpringDataAcademiaRepository tabela, ObjectMapper json) {
        this.tabela = tabela;
        this.json = json;
    }

    @Override
    public <T extends Dados> List<RegistroAcademia<T>> listar(Class<T> tipo) {
        return tabela.findAllByTipoOrderByCriadoEmDescIdAsc(tipo.getSimpleName()).stream()
                .map(linha -> ler(linha, tipo)).toList();
    }

    @Override
    public <T extends Dados> Optional<RegistroAcademia<T>> buscar(Class<T> tipo, UUID id) {
        return tabela.findByTipoAndId(tipo.getSimpleName(), id).map(linha -> ler(linha, tipo));
    }

    @Override
    public <T extends Dados> RegistroAcademia<T> salvar(Class<T> tipo, RegistroAcademia<T> registro) {
        tabela.saveAndFlush(new RegistroAcademiaEntity(registro.id(), tipo.getSimpleName(),
                registro.criadoEm(), json.writeValueAsString(registro.dados())));
        return registro;
    }

    @Override
    public void excluir(UUID id) {
        tabela.deleteById(id);
    }

    private <T extends Dados> RegistroAcademia<T> ler(RegistroAcademiaEntity linha, Class<T> tipo) {
        return new RegistroAcademia<>(linha.getId(), linha.getCriadoEm(), json.readValue(linha.getDadosJson(), tipo));
    }
}
