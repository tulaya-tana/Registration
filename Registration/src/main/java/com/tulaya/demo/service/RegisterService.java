package com.tulaya.demo.service;

import javax.validation.Valid;

import com.tulaya.demo.bean.request.GetUserRequest;
import com.tulaya.demo.bean.request.RegisterRequest;
import com.tulaya.demo.bean.response.GetUserResponse;
import com.tulaya.demo.bean.response.RegisterResponse;

public interface RegisterService {

	public RegisterResponse registerService(@Valid RegisterRequest request);
	public GetUserResponse getUserInfoService(@Valid GetUserRequest request);
	
}
