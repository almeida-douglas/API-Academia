package com.chargefit.academia.domain.repository;

import com.chargefit.academia.domain.model.Book;
import com.chargefit.academia.domain.model.BookId;

import java.util.List;
import java.util.Optional;

public interface BookRepository {

    Book save(Book book);

    Optional<Book> findById(BookId id);

    List<Book> findAll();

    void deleteById(BookId id);
}
