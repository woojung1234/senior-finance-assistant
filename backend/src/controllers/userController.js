const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { query } = require('../database/db');
const { generateToken } = require('../utils/jwtUtils');
const logger = require('../utils/logger');

// 임시 문자 인증 저장소
const verificationCodes = new Map();

// 임의의 번호 생성 (실제 구현은 SMS API 연동 필요)
const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 아이디 중복 확인
const checkDuplicateId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const users = await query('SELECT * FROM user WHERE user_id = ? AND is_deleted = 0', [userId]);
    
    const isAvailable = users.length === 0;
    
    return res.status(200).json({
      result: isAvailable,
      message: isAvailable ? '사용가능한 아이디입니다.' : '이미 사용중인 아이디입니다.'
    });
  } catch (error) {
    logger.error('아이디 중복 확인 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 인증 문자 발송 (SMS API 연동 필요)
const sendVerificationSMS = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // 전화번호 형식 검사
    if (!/^\d{10,11}$/.test(phone)) {
      return res.status(400).json({
        result: false,
        message: '유효한 휴대폰 번호 형식이 아닙니다.'
      });
    }
    
    // 전화번호 중복 확인
    const users = await query('SELECT * FROM user WHERE phone = ? AND is_deleted = 0', [phone]);
    if (users.length > 0) {
      return res.status(400).json({
        result: false,
        message: '이미 가입된 전화번호입니다.'
      });
    }
    
    // 인증번호 생성
    const verificationCode = generateRandomCode();
    verificationCodes.set(phone, verificationCode);
    
    // 인증번호 5분 후 만료
    setTimeout(() => {
      verificationCodes.delete(phone);
    }, 5 * 60 * 1000);
    
    // 실제 SMS 발송은 외부 API 연동 필요
    // 테스트 버전에서는 로그만 출력
    logger.info(`인증번호 발송: ${phone} -> ${verificationCode}`);
    
    return res.status(200).json({
      result: true,
      message: '인증번호 전송이 완료되었습니다.'
    });
  } catch (error) {
    logger.error('SMS 전송 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 인증번호 확인
const verifyPhoneNumber = async (req, res) => {
  try {
    const { phone, validationNum } = req.body;
    
    const storedCode = verificationCodes.get(phone);
    
    if (!storedCode) {
      return res.status(400).json({
        result: false,
        message: '인증번호가 만료되었습니다. 다시 시도해주세요.'
      });
    }
    
    if (storedCode === validationNum) {
      // 인증 성공 시 인증번호 삭제
      verificationCodes.delete(phone);
      
      return res.status(200).json({
        result: true,
        message: '인증이 완료되었습니다.'
      });
    } else {
      return res.status(200).json({
        result: false,
        message: '잘못된 인증번호입니다.'
      });
    }
  } catch (error) {
    logger.error('인증번호 확인 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 회원가입
const createUser = async (req, res) => {
  try {
    // 유효성 검사 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, userPw, userName, phone } = req.body;
    
    // 아이디 중복 확인
    const existingUsers = await query('SELECT * FROM user WHERE user_id = ? AND is_deleted = 0', [userId]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        result: false,
        message: '이미 사용중인 아이디입니다.'
      });
    }
    
    // 휴대폰 번호 중복 확인
    const existingPhones = await query('SELECT * FROM user WHERE phone = ? AND is_deleted = 0', [phone]);
    if (existingPhones.length > 0) {
      return res.status(409).json({
        result: false,
        message: '이미 가입된 휴대폰 번호입니다.'
      });
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(userPw, 10);
    
    // 사용자 추가
    const result = await query(
      'INSERT INTO user (user_id, user_pw, user_name, phone) VALUES (?, ?, ?, ?)',
      [userId, hashedPassword, userName, phone]
    );
    
    return res.status(201).json({
      userNo: result.insertId,
      message: '회원가입에 성공하였습니다.'
    });
  } catch (error) {
    logger.error('회원가입 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { userId, userPw } = req.body;
    
    // 사용자 조회
    const users = await query('SELECT * FROM user WHERE user_id = ? AND is_deleted = 0', [userId]);
    
    if (users.length === 0) {
      return res.status(401).json({
        result: false,
        message: '아이디 또는 비밀번호가 일치하지 않습니다.'
      });
    }
    
    const user = users[0];
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(userPw, user.user_pw);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        result: false,
        message: '아이디 또는 비밀번호가 일치하지 않습니다.'
      });
    }
    
    // JWT 토큰 생성
    const token = generateToken(user.user_no);
    
    return res.status(200).json({
      result: true,
      token,
      userNo: user.user_no,
      userName: user.user_name,
      message: '로그인에 성공하였습니다.'
    });
  } catch (error) {
    logger.error('로그인 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 회원 정보 조회
const getUserInfo = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    const users = await query('SELECT user_no, user_id, user_name, phone FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        result: false,
        message: '해당 회원을 찾을 수 없습니다.'
      });
    }
    
    // 사용자 프로필 정보 조회
    const profiles = await query('SELECT * FROM user_profile WHERE user_no = ?', [userNo]);
    const profile = profiles.length > 0 ? profiles[0] : null;
    
    return res.status(200).json({
      ...users[0],
      profile,
      result: true
    });
  } catch (error) {
    logger.error('회원 정보 조회 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 회원 정보 수정
const updateUser = async (req, res) => {
  try {
    const userNo = req.userNo;
    const { userName, phone } = req.body;
    
    // 기존 사용자 조회
    const users = await query('SELECT * FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        result: false,
        message: '해당 회원을 찾을 수 없습니다.'
      });
    }
    
    // 전화번호 중복 확인 (변경되는 경우만)
    if (phone && phone !== users[0].phone) {
      const existingPhones = await query('SELECT * FROM user WHERE phone = ? AND user_no != ? AND is_deleted = 0', [phone, userNo]);
      if (existingPhones.length > 0) {
        return res.status(409).json({
          result: false,
          message: '이미 사용중인 휴대폰 번호입니다.'
        });
      }
    }
    
    // 사용자 정보 업데이트
    await query(
      'UPDATE user SET user_name = ?, phone = ? WHERE user_no = ?',
      [userName || users[0].user_name, phone || users[0].phone, userNo]
    );
    
    // 업데이트된 사용자 정보 조회
    const updatedUsers = await query('SELECT user_no, user_id, user_name, phone FROM user WHERE user_no = ?', [userNo]);
    
    return res.status(200).json({
      ...updatedUsers[0],
      result: true,
      message: '회원 정보가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    logger.error('회원 정보 수정 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 회원 탈퇴 (논리적 삭제)
const withdrawUser = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    // 기존 사용자 조회
    const users = await query('SELECT * FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        result: false,
        message: '해당 회원을 찾을 수 없습니다.'
      });
    }
    
    // 사용자 비활성화 (논리적 삭제)
    await query('UPDATE user SET is_deleted = 1 WHERE user_no = ?', [userNo]);
    
    return res.status(200).json({
      result: true,
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error) {
    logger.error('회원 탈퇴 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 간편 결제 비밀번호 등록 여부 조회
const checkSimplePayment = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    const users = await query('SELECT simple_payment_pw FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        result: false,
        message: '해당 회원을 찾을 수 없습니다.'
      });
    }
    
    const isRegistered = users[0].simple_payment_pw !== null;
    
    return res.status(200).json({
      result: isRegistered,
      message: isRegistered ? '간편 결제 비밀번호가 등록되어 있습니다.' : '간편 결제 비밀번호가 등록되어 있지 않습니다.'
    });
  } catch (error) {
    logger.error('간편 결제 비밀번호 조회 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 간편 결제 비밀번호 등록/변경
const setSimplePayment = async (req, res) => {
  try {
    const userNo = req.userNo;
    const { paymentPw } = req.body;
    
    // 비밀번호 형식 검사 (6자리 숫자)
    if (!/^\d{6}$/.test(paymentPw)) {
      return res.status(400).json({
        result: false,
        message: '간편 결제 비밀번호는 6자리 숫자만 가능합니다.'
      });
    }
    
    // 비밀번호 해싱
    const hashedPaymentPw = await bcrypt.hash(paymentPw, 10);
    
    // 간편 결제 비밀번호 업데이트
    await query('UPDATE user SET simple_payment_pw = ? WHERE user_no = ?', [hashedPaymentPw, userNo]);
    
    return res.status(200).json({
      result: true,
      message: '간편 결제 비밀번호가 성공적으로 등록되었습니다.'
    });
  } catch (error) {
    logger.error('간편 결제 비밀번호 등록 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 간편 결제 비밀번호 검증
const verifySimplePayment = async (req, res) => {
  try {
    const userNo = req.userNo;
    const { paymentPw } = req.body;
    
    // 사용자 조회
    const users = await query('SELECT simple_payment_pw FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        result: false,
        message: '해당 회원을 찾을 수 없습니다.'
      });
    }
    
    const user = users[0];
    
    if (!user.simple_payment_pw) {
      return res.status(400).json({
        result: false,
        message: '간편 결제 비밀번호가 등록되어 있지 않습니다.'
      });
    }
    
    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(paymentPw, user.simple_payment_pw);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        result: false,
        message: '잘못된 비밀번호입니다.'
      });
    }
    
    return res.status(200).json({
      result: true,
      message: '비밀번호 인증에 성공하였습니다.'
    });
  } catch (error) {
    logger.error('간편 결제 비밀번호 검증 오류:', error.message);
    return res.status(500).json({
      result: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  checkDuplicateId,
  sendVerificationSMS,
  verifyPhoneNumber,
  createUser,
  login,
  getUserInfo,
  updateUser,
  withdrawUser,
  checkSimplePayment,
  setSimplePayment,
  verifySimplePayment
};
