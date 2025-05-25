const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const WorkoutRoutine = require('../models/WorkoutRoutine');
const User = require('../models/User');

/**
 * @swagger
 * /api/v1/workouts:
 *   post:
 *     summary: 새 운동 루틴 생성
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - difficultyLevel
 *               - type
 *               - duration
 *               - exercises
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               difficultyLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               type:
 *                 type: string
 *               duration:
 *                 type: number
 *               caloriesBurn:
 *                 type: number
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 운동 루틴 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 */
router.post('/', [
  auth,
  [
    check('name', '루틴 이름은 필수입니다').notEmpty(),
    check('difficultyLevel', '난이도는 필수입니다').isIn(['beginner', 'intermediate', 'advanced']),
    check('type', '루틴 유형은 필수입니다').notEmpty(),
    check('duration', '운동 시간(분)은 필수입니다').isNumeric(),
    check('exercises', '하나 이상의 운동을 추가해야 합니다').isArray({ min: 1 })
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      name, 
      description, 
      difficultyLevel, 
      type, 
      duration, 
      caloriesBurn, 
      exercises,
      tags,
      isAIGenerated
    } = req.body;

    // 새 운동 루틴 생성
    const workoutRoutine = new WorkoutRoutine({
      user: req.user.id,
      name,
      description,
      difficultyLevel,
      type,
      duration,
      caloriesBurn,
      exercises: exercises.map((ex, index) => ({
        exercise: ex,
        order: index + 1,
        notes: ex.notes || ''
      })),
      tags,
      isAIGenerated: isAIGenerated || false
    });

    // 루틴 저장
    const savedRoutine = await workoutRoutine.save();
    res.status(201).json(savedRoutine);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/workouts:
 *   get:
 *     summary: 사용자의 운동 루틴 목록 조회
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *         description: 난이도 필터
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 루틴 유형 필터
 *       - in: query
 *         name: isAIGenerated
 *         schema:
 *           type: boolean
 *         description: AI 생성 여부 필터
 *     responses:
 *       200:
 *         description: 운동 루틴 목록
 *       401:
 *         description: 인증 실패
 */
router.get('/', auth, async (req, res) => {
  try {
    const { difficultyLevel, type, isAIGenerated } = req.query;
    
    // 필터 조건 구성
    const filter = { user: req.user.id };
    
    if (difficultyLevel) {
      filter.difficultyLevel = difficultyLevel;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (isAIGenerated !== undefined) {
      filter.isAIGenerated = isAIGenerated === 'true';
    }

    // 운동 루틴 조회
    const workoutRoutines = await WorkoutRoutine.find(filter).sort({ createdAt: -1 });
    res.json(workoutRoutines);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/workouts/{id}:
 *   get:
 *     summary: 특정 운동 루틴 조회
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 루틴 ID
 *     responses:
 *       200:
 *         description: 운동 루틴 정보
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 루틴을 찾을 수 없음
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const workoutRoutine = await WorkoutRoutine.findById(req.params.id);
    
    if (!workoutRoutine) {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (workoutRoutine.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    res.json(workoutRoutine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/workouts/{id}:
 *   put:
 *     summary: 운동 루틴 수정
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 루틴 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               difficultyLevel:
 *                 type: string
 *               type:
 *                 type: string
 *               duration:
 *                 type: number
 *               exercises:
 *                 type: array
 *     responses:
 *       200:
 *         description: 운동 루틴 수정 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 루틴을 찾을 수 없음
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const workoutRoutine = await WorkoutRoutine.findById(req.params.id);
    
    if (!workoutRoutine) {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (workoutRoutine.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    const { 
      name, 
      description, 
      difficultyLevel, 
      type, 
      duration, 
      caloriesBurn, 
      exercises,
      tags
    } = req.body;

    // 수정할 필드 업데이트
    if (name) workoutRoutine.name = name;
    if (description !== undefined) workoutRoutine.description = description;
    if (difficultyLevel) workoutRoutine.difficultyLevel = difficultyLevel;
    if (type) workoutRoutine.type = type;
    if (duration) workoutRoutine.duration = duration;
    if (caloriesBurn !== undefined) workoutRoutine.caloriesBurn = caloriesBurn;
    if (tags) workoutRoutine.tags = tags;
    
    if (exercises && exercises.length > 0) {
      workoutRoutine.exercises = exercises.map((ex, index) => ({
        exercise: ex,
        order: index + 1,
        notes: ex.notes || ''
      }));
    }

    // 루틴 저장
    const updatedRoutine = await workoutRoutine.save();
    res.json(updatedRoutine);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/workouts/{id}:
 *   delete:
 *     summary: 운동 루틴 삭제
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 루틴 ID
 *     responses:
 *       200:
 *         description: 운동 루틴 삭제 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 루틴을 찾을 수 없음
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const workoutRoutine = await WorkoutRoutine.findById(req.params.id);
    
    if (!workoutRoutine) {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (workoutRoutine.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    // 루틴 삭제
    await workoutRoutine.deleteOne();
    res.json({ message: '운동 루틴이 삭제되었습니다' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
