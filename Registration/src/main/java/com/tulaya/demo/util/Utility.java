package com.tulaya.demo.util;

import java.security.Key;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.crypto.spec.SecretKeySpec;
import javax.xml.bind.DatatypeConverter;

import com.tulaya.demo.bean.request.RegisterRequestInfo;
import com.tulaya.demo.exception.RegistrationException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

public class Utility {
	
	private static String simpleDateFormat = "yyyyMMdd";
	
	public static String getCurrentDate() {
		String dateStr = null;
		
		SimpleDateFormat format = new SimpleDateFormat(simpleDateFormat);
		Date date = new Date();
		dateStr = format.format(date);
		
		return dateStr;
	}
	
	public static Timestamp getCurrentDateTime() {
		return new Timestamp(System.currentTimeMillis());
	}
	
	public static String getLastFourDigit(String mobile) {
		return mobile.substring(6,10);
	}
	
	public static String createJWT(RegisterRequestInfo request, String secretKey) {
		SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

	    byte[] apiKeySecretBytes = DatatypeConverter.parseBase64Binary(secretKey);
	    Key signingKey = new SecretKeySpec(apiKeySecretBytes, signatureAlgorithm.getJcaName());

	    JwtBuilder builder = Jwts.builder()
	            .setIssuedAt(getCurrentDateTime())
	            .claim("username", request.getUsername())
	            .claim("password", request.getPassword())
	            .claim("phone", request.getPhone())
	            .signWith(signatureAlgorithm, signingKey);
	  
	    return builder.compact();
	}
	
	public static Claims decodeJWT(String jwt, String secretKey) throws RegistrationException {
		try {
		    Claims claims = Jwts.parser()
		            .setSigningKey(DatatypeConverter.parseBase64Binary(secretKey))
		            .parseClaimsJws(jwt).getBody();
		    
		    return claims;
		} catch (Exception e) {
			throw new RegistrationException("101001", "Token is invalid");
		}
	}
	
	public static String getSecret() {
		return "dGhpc2lzc2VjcmV0a2V5MQ==";
	}
	
}
