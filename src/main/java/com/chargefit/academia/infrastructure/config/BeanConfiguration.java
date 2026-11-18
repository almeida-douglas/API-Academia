package com.chargefit.academia.infrastructure.config;

import com.chargefit.academia.application.usecase.CreateBookUseCase;
import com.chargefit.academia.application.usecase.DeleteBookUseCase;
import com.chargefit.academia.application.usecase.GetBookByIdUseCase;
import com.chargefit.academia.application.usecase.ListBooksUseCase;
import com.chargefit.academia.application.usecase.UpdateBookUseCase;
import com.chargefit.academia.domain.repository.BookRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfiguration {
    @Bean public CreateBookUseCase createBookUseCase(BookRepository repository) { return new CreateBookUseCase(repository); }
    @Bean public GetBookByIdUseCase getBookByIdUseCase(BookRepository repository) { return new GetBookByIdUseCase(repository); }
    @Bean public ListBooksUseCase listBooksUseCase(BookRepository repository) { return new ListBooksUseCase(repository); }
    @Bean public UpdateBookUseCase updateBookUseCase(BookRepository repository) { return new UpdateBookUseCase(repository); }
    @Bean public DeleteBookUseCase deleteBookUseCase(BookRepository repository) { return new DeleteBookUseCase(repository); }
}
