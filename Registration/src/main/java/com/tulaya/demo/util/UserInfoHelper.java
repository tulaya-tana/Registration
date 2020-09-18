package com.tulaya.demo.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tulaya.demo.bean.request.RegisterRequestInfo;
import com.tulaya.demo.exception.RegistrationException;
import com.tulaya.demo.repository.UserInfoRepository;
import com.tulaya.demo.repository.model.UserInfo;

@Component
public class UserInfoHelper {
	
	private Logger log = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	UserInfoRepository repo;
	
	public void insertUserInfo(RegisterRequestInfo request, String memberType, String refCode) throws RegistrationException {
		log.debug("Start insertUserInfo.");
		UserInfo userInfo = new UserInfo();
		
		if (selectUserInfo(request.getUsername(), request.getPassword()) == null) {
			userInfo.setUsername(request.getUsername());
			userInfo.setPassword(request.getPassword());
			userInfo.setAddress(request.getAddress());
			userInfo.setPhone(request.getPhone());
			userInfo.setMemberType(memberType);
			userInfo.setRefCode(refCode);
			userInfo.setLastUpdDtm(Utility.getCurrentDateTime());
			
			repo.save(userInfo);			
		} else {
			throw new RegistrationException("100002", "Duplicate data");
		}
	}
	
	public UserInfo selectUserInfo(String username, String password) {
		UserInfo userInfo = new UserInfo();
		
		userInfo = repo.findByUsernameAndPassword(username, password);
		
		return userInfo;
	}

}
