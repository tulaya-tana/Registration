package com.tulaya.demo.repository.model;

import java.sql.Timestamp;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "USER_INFO")
public class UserInfo {

	@Id
	@GeneratedValue
	private Long userId;
	private String username;
	private String password;
	private String address;
	private String phone;
	private String refCode;
	private String memberType;
	private Timestamp lastUpdDtm;
	
	public Long getUserId() {
		return userId;
	}
	
	public void setUserId(Long userId) {
		this.userId = userId;
	}
	
	public String getUsername() {
		return username;
	}
	
	public void setUsername(String username) {
		this.username = username;
	}
	
	public String getPassword() {
		return password;
	}
	
	public void setPassword(String password) {
		this.password = password;
	}
	
	public String getAddress() {
		return address;
	}
	
	public void setAddress(String address) {
		this.address = address;
	}
	
	public String getPhone() {
		return phone;
	}
	
	public void setPhone(String phone) {
		this.phone = phone;
	}
	
	public String getRefCode() {
		return refCode;
	}
	
	public void setRefCode(String refCode) {
		this.refCode = refCode;
	}
	
	public String getMemberType() {
		return memberType;
	}
	
	public void setMemberType(String memberType) {
		this.memberType = memberType;
	}
	
	public Timestamp getLastUpdDtm() {
		return lastUpdDtm;
	}
	
	public void setLastUpdDtm(Timestamp lastUpdDtm) {
		this.lastUpdDtm = lastUpdDtm;
	}
	
}
