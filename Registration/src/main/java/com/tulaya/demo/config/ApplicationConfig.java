package com.tulaya.demo.config;

import javax.sql.DataSource;

import org.apache.tomcat.util.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class ApplicationConfig {
	
	@Autowired
	private Environment env;
	
	@Bean
	@ConfigurationProperties(prefix = "spring.datasource")
    public DataSource getDataSource() {
		byte[] temp = Base64.decodeBase64(env.getProperty("custom.datasource.password"));
		String pwd = new String(temp);
		
		return DataSourceBuilder
				.create()
				.password(pwd)
				.build();
    }
    
}
