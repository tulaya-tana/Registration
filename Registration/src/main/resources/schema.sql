CREATE TABLE USER_INFO (
  user_id INT AUTO_INCREMENT  PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(250) NOT NULL,
  address VARCHAR(250),
  phone VARCHAR(10) NOT NULL,
  ref_code VARCHAR(10) NOT NULL,
  member_type VARCHAR(20) NOT NULL,
  last_upd_dtm TIMESTAMP(3)
);