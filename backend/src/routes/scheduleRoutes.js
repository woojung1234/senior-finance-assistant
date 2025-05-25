const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const WorkoutSchedule = require('../models/WorkoutSchedule');
const WorkoutRoutine = require('../models/WorkoutRoutine');

/**
 * @swagger
 * /api/v1/schedule:
 *   post:
 *     summary: 새 운동 일정 생성
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routineId
 *               - scheduledDate
 *             properties:
 *               routineId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               reminder:
 *                 type: object
 *                 properties:
 *                   isEnabled:
 *                     type: boolean
 *                   reminderTime:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: 운동 일정 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 운동 루틴을 찾을 수 없음
 */
router.post('/', [
  auth,
  [
    check('routineId', '운동 루틴 ID가 필요합니다').notEmpty(),
    check('scheduledDate', '일정 날짜가 필요합니다').isISO8601().toDate()
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      routineId, 
      scheduledDate, 
      startTime, 
      endTime, 
      notes, 
      reminder 
    } = req.body;

    // 운동 루틴 존재 확인
    const routine = await WorkoutRoutine.findById(routineId);
    if (!routine) {
      return res.status(404).json({ message: '운동 루틴을 찾을 수 없습니다' });
    }

    // 새 운동 일정 생성
    const workoutSchedule = new WorkoutSchedule({
      user: req.user.id,
      routineId,
      scheduledDate: new Date(scheduledDate),
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      notes,
      reminder: reminder || {
        isEnabled: false
      }
    });

    // 일정 저장
    const savedSchedule = await workoutSchedule.save();
    res.status(201).json(savedSchedule);
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
 * /api/v1/schedule:
 *   get:
 *     summary: 운동 일정 목록 조회
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 일정 상태 필터
 *     responses:
 *       200:
 *         description: 운동 일정 목록
 *       401:
 *         description: 인증 실패
 */
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // 필터 조건 구성
    const filter = { user: req.user.id };
    
    if (startDate || endDate) {
      filter.scheduledDate = {};
      
      if (startDate) {
        filter.scheduledDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.scheduledDate.$lte = new Date(endDate);
        // 종료일의 마지막 시간까지 포함
        filter.scheduledDate.$lte.setHours(23, 59, 59, 999);
      }
    }
    
    if (status) {
      filter.status = status;
    }

    // 운동 일정 조회
    const schedules = await WorkoutSchedule.find(filter)
      .sort({ scheduledDate: 1 })
      .populate({
        path: 'routineId',
        select: 'name type difficultyLevel duration'
      });
    
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/schedule/{id}:
 *   get:
 *     summary: 특정 운동 일정 조회
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 일정 ID
 *     responses:
 *       200:
 *         description: 운동 일정 정보
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 일정을 찾을 수 없음
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findById(req.params.id)
      .populate({
        path: 'routineId',
        select: 'name type difficultyLevel duration exercises'
      });
    
    if (!schedule) {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (schedule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/schedule/{id}:
 *   put:
 *     summary: 운동 일정 수정
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 일정 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *               reminder:
 *                 type: object
 *                 properties:
 *                   isEnabled:
 *                     type: boolean
 *                   reminderTime:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: 운동 일정 수정 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 일정을 찾을 수 없음
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (schedule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    const { 
      scheduledDate, 
      startTime, 
      endTime, 
      status, 
      notes, 
      reminder,
      completionData
    } = req.body;

    // 수정할 필드 업데이트
    if (scheduledDate) schedule.scheduledDate = new Date(scheduledDate);
    if (startTime !== undefined) schedule.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) schedule.endTime = endTime ? new Date(endTime) : null;
    if (status) schedule.status = status;
    if (notes !== undefined) schedule.notes = notes;
    if (reminder) schedule.reminder = reminder;
    if (completionData) schedule.completionData = completionData;

    // 일정 저장
    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/schedule/{id}/complete:
 *   put:
 *     summary: 운동 일정 완료 처리
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 일정 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualDuration:
 *                 type: number
 *               caloriesBurned:
 *                 type: number
 *               feedback:
 *                 type: object
 *               exercisesCompleted:
 *                 type: array
 *     responses:
 *       200:
 *         description: 운동 일정 완료 처리 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 일정을 찾을 수 없음
 */
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (schedule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    const { 
      actualDuration, 
      caloriesBurned, 
      feedback, 
      exercisesCompleted 
    } = req.body;

    // 운동 완료 상태로 업데이트
    schedule.status = 'completed';
    schedule.completionData = {
      actualDuration,
      caloriesBurned,
      feedback,
      exercisesCompleted
    };

    // 일정 저장
    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/schedule/{id}:
 *   delete:
 *     summary: 운동 일정 삭제
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 운동 일정 ID
 *     responses:
 *       200:
 *         description: 운동 일정 삭제 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 일정을 찾을 수 없음
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }

    // 권한 확인
    if (schedule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    // 일정 삭제
    await schedule.deleteOne();
    res.json({ message: '운동 일정이 삭제되었습니다' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '운동 일정을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
