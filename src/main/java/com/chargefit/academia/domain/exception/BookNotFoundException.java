package com.chargefit.academia.domain.exception;

import com.chargefit.academia.domain.model.BookId;

public class BookNotFoundException extends RuntimeException {

    private final BookId bookId;

    public BookNotFoundException(BookId bookId) {
        super(buildMessage(bookId));
        this.bookId = bookId;
    }

    public BookId getBookId() {
        return bookId;
    }

    private static String buildMessage(BookId bookId) {
        if (bookId == null) {
            throw new IllegalArgumentException("O identificador do livro não pode ser nulo");
        }

        return "Livro com identificador " + bookId.id() + " não encontrado";
    }
}
