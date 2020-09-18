package com.tulaya.demo.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.tulaya.demo.repository.model.UserInfo;

@Repository
public interface UserInfoRepository extends CrudRepository<UserInfo, Long> {

	UserInfo findByUsernameAndPassword(String username, String password);

}
