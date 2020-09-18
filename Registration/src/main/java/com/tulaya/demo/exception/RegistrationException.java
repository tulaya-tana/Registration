package com.tulaya.demo.exception;

public class RegistrationException extends Exception {

	private static final long serialVersionUID = -1055408059150711609L;

	private String errorCode = null;
	private String errorMsg = null;
	
	public RegistrationException(String errorCode) {
		super(errorCode);
		this.errorCode = errorCode;
	}
	
	public RegistrationException(String errorCode, String errorMsg){
		super();
		this.errorCode = errorCode;
		this.errorMsg = errorMsg;
	}

	public String getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(String errorCode) {
		this.errorCode = errorCode;
	}

	public String getErrorMsg() {
		return errorMsg;
	}

	public void setErrorMsg(String errorMsg) {
		this.errorMsg = errorMsg;
	}
	
}
