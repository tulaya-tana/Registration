package com.tulaya.demo.bean.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegisterResponse extends BaseResponse {

	private RegisterResponseInfo registerResponse;

	public RegisterResponseInfo getRegisterResponse() {
		return registerResponse;
	}

	public void setRegisterResponse(RegisterResponseInfo registerResponse) {
		this.registerResponse = registerResponse;
	}
	
}
