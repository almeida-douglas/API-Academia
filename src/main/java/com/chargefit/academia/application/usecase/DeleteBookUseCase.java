package com.chargefit.academia.application.usecase;

import com.chargefit.academia.domain.exception.BookNotFoundException;
import com.chargefit.academia.domain.model.BookId;
import com.chargefit.academia.domain.repository.BookRepository;

import java.util.Objects;
import java.util.UUID;

public class DeleteBookUseCase {

    private final BookRepository bookRepository;

    public DeleteBookUseCase(BookRepository bookRepository) {
        this.bookRepository = Objects.requireNonNull(bookRepository, "bookRepository nao pode ser nulo");
    }

    public void execute(UUID id) {
        execute(new BookId(id));
    }

    public void execute(BookId id) {
        Objects.requireNonNull(id, "id nao pode ser nulo");

        if (bookRepository.findById(id).isEmpty()) {
            throw new BookNotFoundException(id);
        }

        bookRepository.deleteById(id);
    }
}
