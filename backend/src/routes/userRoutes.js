const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: 새 사용자 등록
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: 사용자 등록 성공
 *       400:
 *         description: 입력 데이터 오류
 *       409:
 *         description: 이미 존재하는 사용자
 */
router.post('/register', [
  check('username', '사용자 이름은 필수입니다').notEmpty(),
  check('email', '유효한 이메일을 입력해주세요').isEmail(),
  check('password', '비밀번호는 6자 이상이어야 합니다').isLength({ min: 6 })
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // 이메일 중복 확인
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: '이미 등록된 이메일입니다' });
    }

    // 사용자 이름 중복 확인
    user = await User.findOne({ username });
    if (user) {
      return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다' });
    }

    // 새 사용자 생성
    user = new User({
      username,
      email,
      password
    });

    // 사용자 저장 (비밀번호는 모델의 pre save 훅에서 해싱)
    await user.save();

    // JWT 토큰 생성
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 로그인 실패
 */
router.post('/login', [
  check('email', '유효한 이메일을 입력해주세요').isEmail(),
  check('password', '비밀번호를 입력해주세요').exists()
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 사용자 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // JWT 토큰 생성
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 프로필 정보
 *       401:
 *         description: 인증 실패
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: 사용자 프로필 업데이트
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   age:
 *                     type: number
 *                   gender:
 *                     type: string
 *                   height:
 *                     type: number
 *                   weight:
 *                     type: number
 *                   targetWeight:
 *                     type: number
 *                   fitnessLevel:
 *                     type: string
 *                   preferredWorkouts:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile } = req.body;
    
    // 프로필 필드 유효성 검사
    if (profile.age && (profile.age < 12 || profile.age > 120)) {
      return res.status(400).json({ message: '유효한 나이를 입력해주세요 (12-120)' });
    }
    
    if (profile.height && (profile.height < 50 || profile.height > 300)) {
      return res.status(400).json({ message: '유효한 키를 입력해주세요 (50-300cm)' });
    }
    
    if (profile.weight && (profile.weight < 20 || profile.weight > 500)) {
      return res.status(400).json({ message: '유효한 체중을 입력해주세요 (20-500kg)' });
    }
    
    if (profile.targetWeight && (profile.targetWeight < 20 || profile.targetWeight > 500)) {
      return res.status(400).json({ message: '유효한 목표 체중을 입력해주세요 (20-500kg)' });
    }

    // 사용자 프로필 업데이트
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profile },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
