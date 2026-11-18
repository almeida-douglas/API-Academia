package com.chargefit.academia.infrastructure.config;

import com.chargefit.academia.application.usecase.GerenciarAcademiaUseCase;
import com.chargefit.academia.domain.repository.AcademiaRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AcademiaConfiguration {
    @Bean
    GerenciarAcademiaUseCase gerenciarAcademia(AcademiaRepository repositorio) {
        return new GerenciarAcademiaUseCase(repositorio);
    }
}
