package com.example.demo.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.example.demo.repository.teacher",
        entityManagerFactoryRef = "teacherEntityManagerFactory",
        transactionManagerRef = "teacherTransactionManager"
)
public class TeacherDataSourceConfig {

    private final JpaProperties jpaProperties;

    public TeacherDataSourceConfig(JpaProperties jpaProperties) {
        this.jpaProperties = jpaProperties;
    }

    @Primary
    @Bean(name = "teacherDataSource")
    @ConfigurationProperties(prefix = "spring.teacher-datasource")
    public DataSource teacherDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean(name = "teacherEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean teacherEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("teacherDataSource") DataSource dataSource) {

        // This correctly applies settings like ddl-auto and show-sql
        Map<String, String> properties = jpaProperties.getProperties();

        return builder
                .dataSource(dataSource)
                .packages("com.example.demo.entity")
                .persistenceUnit("teacher")
                .properties(properties)
                .build();
    }

    @Primary
    @Bean(name = "teacherTransactionManager")
    public PlatformTransactionManager teacherTransactionManager(
            @Qualifier("teacherEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}