package com.chargefit.academia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@SpringBootApplication
public class AcademiaApplication {
    public static void main(String[] args) {
        var application = new SpringApplication(AcademiaApplication.class);
        application.setDefaultProperties(Map.of("academia.banco", nomeBancoLocal(Path.of("data"))));
        application.run(args);
    }

    static String nomeBancoLocal(Path diretorio) {
        if (Files.notExists(diretorio.resolve("academiadb.mv.db"))
                && Files.isRegularFile(diretorio.resolve("booksdb.mv.db"))) {
            return "booksdb";
        }
        return "academiadb";
    }
}
