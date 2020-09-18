package com.tulaya.demo.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;
import com.tulaya.demo.bean.request.GetUserRequest;
import com.tulaya.demo.bean.request.RegisterRequest;
import com.tulaya.demo.bean.response.GetUserResponse;
import com.tulaya.demo.bean.response.RegisterResponse;
import com.tulaya.demo.service.RegisterService;

@RestController
public class RegisterController extends AdvideController {

	private Logger log = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	RegisterService service;
	
	@Autowired
	Gson gson;
	
	@PostMapping("/register")
	public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
		RegisterResponse response = null;
		
		String pwdTmp = request.getRegisterRequest().getPassword();
		request.getRegisterRequest().setPassword("****");
		log.debug("Request is: " + gson.toJson(request));
		request.getRegisterRequest().setPassword(pwdTmp);
		
		response = service.registerService(request);
		
		log.debug("Finish register.");
		
		return ResponseEntity.ok(response);
	}
	
	@PostMapping("/getUser")
	public ResponseEntity<GetUserResponse> getUserInfo(@RequestBody GetUserRequest request) {
		GetUserResponse response = null;
		
		log.debug("In GetUserInfo.");
		response = service.getUserInfoService(request);
		log.debug("Response is: " + gson.toJson(response));
		
		return ResponseEntity.ok(response);
	}
	
}
