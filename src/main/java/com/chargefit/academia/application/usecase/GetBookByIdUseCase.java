package com.chargefit.academia.application.usecase;

import com.chargefit.academia.application.output.BookOutput;
import com.chargefit.academia.domain.exception.BookNotFoundException;
import com.chargefit.academia.domain.model.BookId;
import com.chargefit.academia.domain.repository.BookRepository;

import java.util.Objects;
import java.util.UUID;

public class GetBookByIdUseCase {

    private final BookRepository bookRepository;

    public GetBookByIdUseCase(BookRepository bookRepository) {
        this.bookRepository = Objects.requireNonNull(bookRepository, "bookRepository nao pode ser nulo");
    }

    public BookOutput execute(UUID id) {
        return execute(new BookId(id));
    }

    public BookOutput execute(BookId id) {
        Objects.requireNonNull(id, "id nao pode ser nulo");

        return bookRepository.findById(id)
                .map(BookOutput::from)
                .orElseThrow(() -> new BookNotFoundException(id));
    }
}
