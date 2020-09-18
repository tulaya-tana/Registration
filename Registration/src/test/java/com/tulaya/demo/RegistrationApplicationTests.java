package com.tulaya.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;

import javax.annotation.Resource;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import com.tulaya.demo.bean.request.GetUserRequest;
import com.tulaya.demo.bean.request.GetUserRequestInfo;
import com.tulaya.demo.bean.request.RegisterRequest;
import com.tulaya.demo.bean.request.RegisterRequestInfo;
import com.tulaya.demo.bean.response.GetUserResponse;
import com.tulaya.demo.bean.response.RegisterResponse;
import com.tulaya.demo.controller.RegisterController;

@SpringBootTest
class RegistrationApplicationTests {
	
	@Resource
	@InjectMocks
    RegisterController controller;
		
	@Test
    public void testRegisterSuccess() {
		RegisterRequest registeRequest = new RegisterRequest();
		RegisterRequestInfo registeInfo = new RegisterRequestInfo();
		
		registeInfo.setUsername("RegisterSuccess");
		registeInfo.setPassword("Tulaya1234");
		registeInfo.setAddress("Bangkok, Thailand");
		registeInfo.setPhone("0968349494");
		registeInfo.setSalary(45000L);
		registeRequest.setRegisterRequest(registeInfo);
				
		ResponseEntity<RegisterResponse> response = controller.register(registeRequest);
				
		String actual = response.getBody().getStatusCode();
		assertEquals("000000", actual);
	}

	@Test
    public void testRegisterSalaryReject() {
		RegisterRequest registeRequest = new RegisterRequest();
		RegisterRequestInfo registeInfo = new RegisterRequestInfo();
		
		registeInfo.setUsername("SalaryReject");
		registeInfo.setPassword("Tulaya1234");
		registeInfo.setAddress("Bangkok, Thailand");
		registeInfo.setPhone("0968349494");
		registeInfo.setSalary(14000L);
		registeRequest.setRegisterRequest(registeInfo);
		
		ResponseEntity<RegisterResponse> response = controller.register(registeRequest);
		
		String actual = response.getBody().getStatusCode();
		assertEquals("100001", actual);
	}
	
	@Test
    public void testGetUserSuccess() {
		RegisterRequest registeRequest = new RegisterRequest();
		RegisterRequestInfo registeInfo = new RegisterRequestInfo();
		
		registeInfo.setUsername("GetUserSuccess");
		registeInfo.setPassword("Tulaya1234");
		registeInfo.setAddress("Bangkok, Thailand");
		registeInfo.setPhone("0968349494");
		registeInfo.setSalary(45000L);
		registeRequest.setRegisterRequest(registeInfo);
		
		//Register
		ResponseEntity<RegisterResponse> registerResponse = controller.register(registeRequest);
		
		GetUserRequest getUserRequest = new GetUserRequest();
		GetUserRequestInfo getUserRequestInfo = new GetUserRequestInfo();
		
		getUserRequestInfo.setToken(registerResponse.getBody().getRegisterResponse().getToken());
		getUserRequest.setGetUserRequest(getUserRequestInfo);
		
		//GetUser
		ResponseEntity<GetUserResponse> getUserResponse = controller.getUserInfo(getUserRequest);
		
		String actual = getUserResponse.getBody().getStatusCode();
		assertEquals("000000", actual);
	}
	
	@Test
    public void testGetUserInvalidToken() {
		RegisterRequest registeRequest = new RegisterRequest();
		RegisterRequestInfo registeInfo = new RegisterRequestInfo();
		
		registeInfo.setUsername("InvalidToken");
		registeInfo.setPassword("Tulaya1234");
		registeInfo.setAddress("Bangkok, Thailand");
		registeInfo.setPhone("0968349494");
		registeInfo.setSalary(45000L);
		registeRequest.setRegisterRequest(registeInfo);
		
		///Register
		ResponseEntity<RegisterResponse> registerResponse = controller.register(registeRequest);
		
		GetUserRequest getUserRequest = new GetUserRequest();
		GetUserRequestInfo getUserRequestInfo = new GetUserRequestInfo();
		
		getUserRequestInfo.setToken(registerResponse.getBody().getRegisterResponse().getToken() + "abc");
		getUserRequest.setGetUserRequest(getUserRequestInfo);
		
		//GetUser
		ResponseEntity<GetUserResponse> getUserResponse = controller.getUserInfo(getUserRequest);
		
		String actual = getUserResponse.getBody().getStatusCode();
		assertEquals("101001", actual);
	}
	
}
