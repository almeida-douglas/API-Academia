package com.chargefit.academia.application.usecase;

import com.chargefit.academia.application.input.UpdateBookInput;
import com.chargefit.academia.application.output.BookOutput;
import com.chargefit.academia.domain.exception.BookNotFoundException;
import com.chargefit.academia.domain.model.Book;
import com.chargefit.academia.domain.model.BookId;
import com.chargefit.academia.domain.repository.BookRepository;

import java.util.Objects;
import java.util.UUID;

public class UpdateBookUseCase {

    private final BookRepository bookRepository;

    public UpdateBookUseCase(BookRepository bookRepository) {
        this.bookRepository = Objects.requireNonNull(bookRepository, "bookRepository nao pode ser nulo");
    }

    public BookOutput execute(UUID id, UpdateBookInput input) {
        return execute(new BookId(id), input);
    }

    public BookOutput execute(BookId id, UpdateBookInput input) {
        Objects.requireNonNull(id, "id nao pode ser nulo");
        Objects.requireNonNull(input, "input nao pode ser nulo");

        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException(id));

        book.update(
                input.titulo(),
                input.autor(),
                input.anoPublicacao(),
                input.genero(),
                input.statusLeitura()
        );

        return BookOutput.from(bookRepository.save(book));
    }
}
