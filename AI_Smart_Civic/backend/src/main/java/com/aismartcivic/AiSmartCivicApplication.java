package com.aismartcivic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AiSmartCivicApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiSmartCivicApplication.class, args);
    }
}
