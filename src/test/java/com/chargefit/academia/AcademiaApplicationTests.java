package com.chargefit.academia;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class AcademiaApplicationTests {
    @Test
    void contextLoads() {}

    @Test
    void usaBancoAcademiaEmInstalacaoNova(@TempDir Path pasta) {
        assertEquals("academiadb", AcademiaApplication.nomeBancoLocal(pasta));
    }

    @Test
    void reutilizaBancoExistenteAteHaverUmBancoComONovoNome(@TempDir Path pasta) throws IOException {
        Files.createFile(pasta.resolve("booksdb.mv.db"));
        assertEquals("booksdb", AcademiaApplication.nomeBancoLocal(pasta));

        Files.createFile(pasta.resolve("academiadb.mv.db"));
        assertEquals("academiadb", AcademiaApplication.nomeBancoLocal(pasta));
    }
}
