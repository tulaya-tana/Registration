package com.tulaya.demo.bean.request;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegisterRequest {

	@Valid
    @NotNull(message = "registerRequest")
	private RegisterRequestInfo registerRequest;

	public RegisterRequestInfo getRegisterRequest() {
		return registerRequest;
	}

	public void setRegisterRequest(RegisterRequestInfo registerRequest) {
		this.registerRequest = registerRequest;
	}
		
}
