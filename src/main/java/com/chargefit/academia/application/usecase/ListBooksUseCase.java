package com.chargefit.academia.application.usecase;

import com.chargefit.academia.application.output.BookOutput;
import com.chargefit.academia.domain.repository.BookRepository;

import java.util.List;
import java.util.Objects;

public class ListBooksUseCase {

    private final BookRepository bookRepository;

    public ListBooksUseCase(BookRepository bookRepository) {
        this.bookRepository = Objects.requireNonNull(bookRepository, "bookRepository nao pode ser nulo");
    }

    public List<BookOutput> execute() {
        return bookRepository.findAll().stream()
                .map(BookOutput::from)
                .toList();
    }
}
