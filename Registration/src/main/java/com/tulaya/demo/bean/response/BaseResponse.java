package com.tulaya.demo.bean.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse {

	private String statusCode;
    private String statusDesc;
    
	public String getStatusCode() {
		return statusCode;
	}
	
	public void setStatusCode(String statusCode) {
		this.statusCode = statusCode;
	}
	
	public String getStatusDesc() {
		return statusDesc;
	}
	
	public void setStatusDesc(String statusDesc) {
		this.statusDesc = statusDesc;
	}
    
}
