package com.tulaya.demo.controller;

import java.util.Set;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.google.gson.Gson;
import com.tulaya.demo.bean.response.BaseResponse;

public class AdvideController {

	private Logger log = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	Gson gson;

	@ExceptionHandler(Exception.class)
	public ResponseEntity<?> handlerException(Exception ex) {
		log.debug("In handlerException...");
		
		BaseResponse response = new BaseResponse();
		
		if (ex instanceof ConstraintViolationException) {
			log.error("parameter is invalid with: " + ex.getMessage(), ex);
			Set<ConstraintViolation<?>> err = ((ConstraintViolationException) ex).getConstraintViolations();
				for ( ConstraintViolation<?> temp: err) {
					response.setStatusDesc("Invalid " + temp.getMessage());
					response.setStatusCode("900002");
					break;
				}
		} else {
			log.error("Technical error with: " + ex.getMessage(), ex);

			response.setStatusDesc("Technical Error");
			response.setStatusCode("900001");
		}
		
		log.debug("handlerException with response: " + gson.toJson(response));
	    return new ResponseEntity<>(response, new HttpHeaders(), HttpStatus.BAD_REQUEST);
	}
	
}
