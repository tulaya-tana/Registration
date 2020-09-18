package com.tulaya.demo.bean.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GetUserResponse extends BaseResponse {

	private GetUserResponseInfo getUserResponse;

	public GetUserResponseInfo getGetUserResponse() {
		return getUserResponse;
	}

	public void setGetUserResponse(GetUserResponseInfo getUserResponse) {
		this.getUserResponse = getUserResponse;
	}
	
}
