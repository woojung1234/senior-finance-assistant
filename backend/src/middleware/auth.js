const jwt = require('jsonwebtoken');

// JWT 인증 미들웨어
module.exports = function(req, res, next) {
  // 헤더에서 토큰 가져오기
  const token = req.header('Authorization');

  // 토큰이 없는 경우
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 없습니다. 접근이 거부되었습니다.' });
  }

  // Bearer 접두사 제거
  const jwtToken = token.substring(7);

  try {
    // 토큰 검증
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'defaultsecret');
    
    // 요청 객체에 사용자 정보 추가
    req.user = decoded.user;
    next();
  } catch (err) {
    // 토큰이 유효하지 않은 경우
    res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
  }
};
