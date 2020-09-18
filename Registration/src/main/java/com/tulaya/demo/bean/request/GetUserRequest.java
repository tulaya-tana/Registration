package com.tulaya.demo.bean.request;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GetUserRequest {

	@Valid
    @NotNull(message = "getUserRequest")
	private GetUserRequestInfo getUserRequest;

	public GetUserRequestInfo getGetUserRequest() {
		return getUserRequest;
	}

	public void setGetUserRequest(GetUserRequestInfo getUserRequest) {
		this.getUserRequest = getUserRequest;
	}
	
}
