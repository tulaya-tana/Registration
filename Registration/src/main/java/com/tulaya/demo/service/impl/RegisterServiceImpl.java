package com.tulaya.demo.service.impl;

import javax.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.tulaya.demo.bean.request.GetUserRequest;
import com.tulaya.demo.bean.request.RegisterRequest;
import com.tulaya.demo.bean.response.GetUserResponse;
import com.tulaya.demo.bean.response.GetUserResponseInfo;
import com.tulaya.demo.bean.response.RegisterResponse;
import com.tulaya.demo.bean.response.RegisterResponseInfo;
import com.tulaya.demo.exception.RegistrationException;
import com.tulaya.demo.repository.model.UserInfo;
import com.tulaya.demo.service.RegisterService;
import com.tulaya.demo.util.CryptoUtil;
import com.tulaya.demo.util.UserInfoHelper;
import com.tulaya.demo.util.Utility;

@Service
@Validated
public class RegisterServiceImpl implements RegisterService {

	private Logger log = LoggerFactory.getLogger(this.getClass());

	@Autowired
	UserInfoHelper helper;
	
	@Override
	public RegisterResponse registerService(@Valid RegisterRequest request) {
		log.debug("Start [registerService] with username: " + request.getRegisterRequest().getUsername());
		
		RegisterResponse response = new RegisterResponse();
		RegisterResponseInfo info = new RegisterResponseInfo();
		
		Long salary = null;
		String token = null;
		String secret = null;
		String refCode = null;
		String memberType = null;
		
		try {
			salary = request.getRegisterRequest().getSalary();
			
			if (salary > 50000) {
				memberType = "Platinum";
			} else if (salary <= 50000 && salary >= 30000) {
				memberType = "Gold";
			} else if (salary < 30000 && salary >= 15000) {
				memberType = "Silver";
			} else {
				response.setStatusDesc("Salary less than 15,000 ฿");
				response.setStatusCode("100001");
				
				return response;
			}
			
			secret = Utility.getSecret();
			
			//Encrypt password
			request.getRegisterRequest().setPassword(CryptoUtil.encrypt(request.getRegisterRequest().getPassword(), secret));
			
			//Generate Token
			token = Utility.createJWT(request.getRegisterRequest(), secret);
			
			//Get Reference code
			refCode = Utility.getCurrentDate() + Utility.getLastFourDigit(request.getRegisterRequest().getPhone());
		
			helper.insertUserInfo(request.getRegisterRequest(), memberType, refCode);
			
			info.setRefCode(refCode);
			info.setToken(token);
			
			response.setStatusDesc("Success");
			response.setStatusCode("000000");
			response.setRegisterResponse(info);
		} catch (RegistrationException e) {
			log.error("[registerService] validate error with: " + e.getMessage(), e);
			
			response.setStatusDesc(e.getErrorMsg());
			response.setStatusCode(e.getErrorCode());
		} catch (Exception e) {
			log.error("[registerService] error with: " + e.getMessage(), e);
			
			response.setStatusDesc("Technical Error");
			response.setStatusCode("900001");
		} finally {
			log.debug("Finsh [registerService]");
		}
		
		return response;
	}

	@Override
	public GetUserResponse getUserInfoService(@Valid GetUserRequest request) {
		log.debug("Start [getUserInfoService]");
		
		GetUserResponse response = new GetUserResponse();
		GetUserResponseInfo info = new GetUserResponseInfo();
		
		String secret = null;
		
		String username = null;
		String pwdTmp = null;
		String pwd = null;
		
		UserInfo userInfo = new UserInfo();
		
		try {
			secret = Utility.getSecret();
			
			pwdTmp = (String) Utility.decodeJWT(request.getGetUserRequest().getToken(), secret).get("password");
			username = (String) Utility.decodeJWT(request.getGetUserRequest().getToken(), secret).get("username");
			
			if (pwdTmp != null || username != null) {		
				pwd = CryptoUtil.decrypt(pwdTmp, secret);
								
				userInfo = helper.selectUserInfo(username, pwdTmp);
								
				if (userInfo != null) {
					if (pwd.equals(CryptoUtil.decrypt(userInfo.getPassword(), secret))) {
						info.setAddress(userInfo.getAddress());
						info.setMemberType(userInfo.getMemberType());
						info.setPhone(userInfo.getPhone());
						info.setUsername(userInfo.getUsername());
						
						response.setStatusDesc("Success");
						response.setStatusCode("000000");
						response.setGetUserResponse(info);
					} else {
						response.setStatusDesc("Token is invalid");
						response.setStatusCode("101001");
					}
				} else {
					response.setStatusDesc("Token is invalid");
					response.setStatusCode("101001");
				}
			} else {
				response.setStatusDesc("Token is invalid");
				response.setStatusCode("101001");
			}
		} catch (RegistrationException e) {
			log.error("[getUserInfoService] validate error with: " + e.getMessage(), e);
			
			response.setStatusDesc(e.getErrorMsg());
			response.setStatusCode(e.getErrorCode());
		} catch (Exception e) {
			log.error("[getUserInfoService] error with: " + e.getMessage(), e);
			
			response.setStatusDesc("Technical Error");
			response.setStatusCode("900001");
		} finally {
			log.debug("Finsh [getUserInfoService]");
		}
		
		return response;
	}

}
