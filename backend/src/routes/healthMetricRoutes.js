const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const HealthMetric = require('../models/HealthMetric');

/**
 * @swagger
 * /api/v1/health-metrics:
 *   post:
 *     summary: 새 건강 측정 데이터 추가
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               bodyMetrics:
 *                 type: object
 *               cardioMetrics:
 *                 type: object
 *               nutritionMetrics:
 *                 type: object
 *               sleepMetrics:
 *                 type: object
 *               otherMetrics:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 건강 측정 데이터 추가 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 */
router.post('/', [
  auth,
  [
    check('date', '날짜는 유효한 형식이어야 합니다').optional().isISO8601().toDate()
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      date, 
      bodyMetrics, 
      cardioMetrics, 
      nutritionMetrics, 
      sleepMetrics, 
      otherMetrics, 
      notes 
    } = req.body;

    // 체중 데이터 유효성 검증
    if (bodyMetrics?.weight && (bodyMetrics.weight < 20 || bodyMetrics.weight > 500)) {
      return res.status(400).json({ message: '유효한 체중을 입력해주세요 (20-500kg)' });
    }

    // 체지방률 데이터 유효성 검증
    if (bodyMetrics?.bodyFatPercentage && (bodyMetrics.bodyFatPercentage < 1 || bodyMetrics.bodyFatPercentage > 70)) {
      return res.status(400).json({ message: '유효한 체지방률을 입력해주세요 (1-70%)' });
    }

    // 새 건강 측정 데이터 생성
    const healthMetric = new HealthMetric({
      user: req.user.id,
      date: date || new Date(),
      bodyMetrics,
      cardioMetrics,
      nutritionMetrics,
      sleepMetrics,
      otherMetrics,
      notes
    });

    // 저장
    const savedHealthMetric = await healthMetric.save();
    res.status(201).json(savedHealthMetric);
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
 * /api/v1/health-metrics:
 *   get:
 *     summary: 건강 측정 데이터 목록 조회
 *     tags: [Health Metrics]
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
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 결과 제한 수
 *     responses:
 *       200:
 *         description: 건강 측정 데이터 목록
 *       401:
 *         description: 인증 실패
 */
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    // 필터 조건 구성
    const filter = { user: req.user.id };
    
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.date.$lte = new Date(endDate);
        // 종료일의 마지막 시간까지 포함
        filter.date.$lte.setHours(23, 59, 59, 999);
      }
    }

    // 건강 측정 데이터 조회
    let query = HealthMetric.find(filter).sort({ date: -1 });
    
    // 결과 제한
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const healthMetrics = await query;
    res.json(healthMetrics);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/health-metrics/{id}:
 *   get:
 *     summary: 특정 건강 측정 데이터 조회
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 건강 측정 데이터 ID
 *     responses:
 *       200:
 *         description: 건강 측정 데이터 정보
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 데이터를 찾을 수 없음
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const healthMetric = await HealthMetric.findById(req.params.id);
    
    if (!healthMetric) {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (healthMetric.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    res.json(healthMetric);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/health-metrics/{id}:
 *   put:
 *     summary: 건강 측정 데이터 수정
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 건강 측정 데이터 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               bodyMetrics:
 *                 type: object
 *               cardioMetrics:
 *                 type: object
 *               nutritionMetrics:
 *                 type: object
 *               sleepMetrics:
 *                 type: object
 *               otherMetrics:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 건강 측정 데이터 수정 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 데이터를 찾을 수 없음
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const healthMetric = await HealthMetric.findById(req.params.id);
    
    if (!healthMetric) {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (healthMetric.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    const { 
      date, 
      bodyMetrics, 
      cardioMetrics, 
      nutritionMetrics, 
      sleepMetrics, 
      otherMetrics, 
      notes 
    } = req.body;

    // 수정할 필드 업데이트
    if (date) healthMetric.date = new Date(date);
    if (bodyMetrics) healthMetric.bodyMetrics = bodyMetrics;
    if (cardioMetrics) healthMetric.cardioMetrics = cardioMetrics;
    if (nutritionMetrics) healthMetric.nutritionMetrics = nutritionMetrics;
    if (sleepMetrics) healthMetric.sleepMetrics = sleepMetrics;
    if (otherMetrics) healthMetric.otherMetrics = otherMetrics;
    if (notes !== undefined) healthMetric.notes = notes;

    // 저장
    const updatedHealthMetric = await healthMetric.save();
    res.json(updatedHealthMetric);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/health-metrics/{id}:
 *   delete:
 *     summary: 건강 측정 데이터 삭제
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 건강 측정 데이터 ID
 *     responses:
 *       200:
 *         description: 건강 측정 데이터 삭제 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 데이터를 찾을 수 없음
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const healthMetric = await HealthMetric.findById(req.params.id);
    
    if (!healthMetric) {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (healthMetric.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    // 삭제
    await healthMetric.deleteOne();
    res.json({ message: '건강 측정 데이터가 삭제되었습니다' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '건강 측정 데이터를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/health-metrics/stats/weight:
 *   get:
 *     summary: 체중 변화 통계 조회
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *         description: 조회 기간 (기본값: month)
 *     responses:
 *       200:
 *         description: 체중 변화 통계
 *       401:
 *         description: 인증 실패
 */
router.get('/stats/weight', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 조회 기간 설정
    const startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        // 전체 기간이므로 시작일을 설정하지 않음
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // 필터 조건 구성
    const filter = { 
      user: req.user.id,
      'bodyMetrics.weight': { $exists: true }
    };
    
    if (period !== 'all') {
      filter.date = { $gte: startDate };
    }
    
    // 체중 데이터 조회
    const weightData = await HealthMetric.find(filter)
      .select('date bodyMetrics.weight')
      .sort({ date: 1 });
    
    // 통계 계산
    let stats = {
      data: weightData.map(item => ({
        date: item.date,
        weight: item.bodyMetrics.weight
      })),
      count: weightData.length
    };
    
    if (weightData.length > 0) {
      const weights = weightData.map(item => item.bodyMetrics.weight);
      const latestWeight = weights[weights.length - 1];
      const firstWeight = weights[0];
      
      stats.latest = latestWeight;
      stats.change = latestWeight - firstWeight;
      stats.changePercentage = ((latestWeight - firstWeight) / firstWeight) * 100;
      stats.min = Math.min(...weights);
      stats.max = Math.max(...weights);
      stats.avg = weights.reduce((sum, val) => sum + val, 0) / weights.length;
    }
    
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/health-metrics/trends:
 *   get:
 *     summary: 건강 지표 트렌드 조회
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *         description: 조회할 지표들 (콤마로 구분)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *         description: 조회 기간 (기본값: month)
 *     responses:
 *       200:
 *         description: 건강 지표 트렌드
 *       401:
 *         description: 인증 실패
 */
router.get('/trends', auth, async (req, res) => {
  try {
    const { metrics = 'weight', period = 'month' } = req.query;
    
    // 조회할 지표 목록
    const metricsList = metrics.split(',').map(m => m.trim());
    
    // 조회 기간 설정
    const startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        // 전체 기간이므로 시작일을 설정하지 않음
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // 필터 조건 구성
    const filter = { user: req.user.id };
    
    if (period !== 'all') {
      filter.date = { $gte: startDate };
    }
    
    // 선택할 필드 구성
    const select = 'date';
    metricsList.forEach(metric => {
      // 지표 경로 매핑
      const metricMapping = {
        weight: 'bodyMetrics.weight',
        bodyFat: 'bodyMetrics.bodyFatPercentage',
        bmi: 'bodyMetrics.bmi',
        restingHeartRate: 'cardioMetrics.restingHeartRate',
        systolicBP: 'cardioMetrics.bloodPressure.systolic',
        diastolicBP: 'cardioMetrics.bloodPressure.diastolic',
        sleepDuration: 'sleepMetrics.duration',
        sleepQuality: 'sleepMetrics.quality',
        calories: 'nutritionMetrics.caloriesConsumed',
        water: 'nutritionMetrics.water',
        stress: 'otherMetrics.stressLevel',
        energy: 'otherMetrics.energyLevel'
      };
      
      if (metricMapping[metric]) {
        select += ` ${metricMapping[metric]}`;
      }
    });
    
    // 데이터 조회
    const data = await HealthMetric.find(filter)
      .select(select)
      .sort({ date: 1 });
    
    // 응답 데이터 구성
    const trends = {};
    
    metricsList.forEach(metric => {
      const metricPath = {
        weight: item => item.bodyMetrics?.weight,
        bodyFat: item => item.bodyMetrics?.bodyFatPercentage,
        bmi: item => item.bodyMetrics?.bmi,
        restingHeartRate: item => item.cardioMetrics?.restingHeartRate,
        systolicBP: item => item.cardioMetrics?.bloodPressure?.systolic,
        diastolicBP: item => item.cardioMetrics?.bloodPressure?.diastolic,
        sleepDuration: item => item.sleepMetrics?.duration,
        sleepQuality: item => item.sleepMetrics?.quality,
        calories: item => item.nutritionMetrics?.caloriesConsumed,
        water: item => item.nutritionMetrics?.water,
        stress: item => item.otherMetrics?.stressLevel,
        energy: item => item.otherMetrics?.energyLevel
      };
      
      if (metricPath[metric]) {
        trends[metric] = data
          .filter(item => metricPath[metric](item) !== undefined)
          .map(item => ({
            date: item.date,
            value: metricPath[metric](item)
          }));
      }
    });
    
    res.json(trends);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
