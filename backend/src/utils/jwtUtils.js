const jwt = require('jsonwebtoken');

// JWT 토큰 생성
const generateToken = (userNo) => {
  return jwt.sign(
    { userNo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// JWT 토큰 검증
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// 인증 미들웨어
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.userNo = decoded.userNo;
    next();
  } catch (error) {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateJWT
};
