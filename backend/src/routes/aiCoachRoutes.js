const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const AICoachConversation = require('../models/AICoachConversation');
const User = require('../models/User');
const WorkoutRoutine = require('../models/WorkoutRoutine');
const HealthMetric = require('../models/HealthMetric');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

/**
 * @swagger
 * /api/v1/ai-coach/conversation:
 *   post:
 *     summary: 새 AI 코치 대화 시작
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: 대화 시작 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 */
router.post('/conversation', [
  auth,
  [
    check('message', '메시지는 필수입니다').notEmpty()
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message, title } = req.body;

    // 사용자 정보 조회
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 사용자의 최근 건강 지표 조회
    const latestHealthMetrics = await HealthMetric.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(1);

    // 시스템 프롬프트 구성
    const systemPrompt = `당신은 개인 헬스 트레이너 AI 코치입니다. 사용자의 건강 목표 달성을 돕고, 맞춤형 운동 루틴을 제안하며, 건강한 생활 습관에 대한 조언을 제공합니다.
    
사용자 정보:
- 이름: ${user.profile?.name || '사용자'}
- 나이: ${user.profile?.age || '정보 없음'}
- 성별: ${user.profile?.gender || '정보 없음'}
- 키: ${user.profile?.height || '정보 없음'} cm
- 현재 체중: ${user.profile?.weight || '정보 없음'} kg
- 목표 체중: ${user.profile?.targetWeight || '정보 없음'} kg
- 피트니스 레벨: ${user.profile?.fitnessLevel || 'beginner'}
- 선호하는 운동 유형: ${user.profile?.preferredWorkouts?.join(', ') || '정보 없음'}

${latestHealthMetrics.length > 0 ? `최근 건강 지표:
- 측정일: ${new Date(latestHealthMetrics[0].date).toLocaleDateString()}
- 체중: ${latestHealthMetrics[0].bodyMetrics?.weight || '정보 없음'} kg
- 체지방률: ${latestHealthMetrics[0].bodyMetrics?.bodyFatPercentage || '정보 없음'} %
- 안정시 심박수: ${latestHealthMetrics[0].cardioMetrics?.restingHeartRate || '정보 없음'} bpm` : '최근 건강 지표 정보가 없습니다.'}

사용자에게 친절하고 전문적으로 응답하며, 맞춤형 피트니스 조언을 제공하세요. 사용자가 운동 루틴을 요청하면 상세한 루틴을 제안하세요.`;

    // 새 대화 생성
    const conversation = new AICoachConversation({
      user: req.user.id,
      title: title || '새 대화',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      context: {
        userProfile: user.profile,
        healthMetrics: latestHealthMetrics.length > 0 ? latestHealthMetrics[0] : null
      }
    });

    // GPT API 호출
    const gptResponse = await openai.createChatCompletion({
      model: process.env.GPT_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // AI 응답 추가
    conversation.messages.push({
      role: 'assistant',
      content: gptResponse.data.choices[0].message.content
    });

    // 대화 저장
    const savedConversation = await conversation.save();
    res.status(201).json(savedConversation);
  } catch (err) {
    console.error(err.message);
    if (err.response && err.response.data) {
      console.error('OpenAI API 오류:', err.response.data);
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/ai-coach/conversation/{id}/message:
 *   post:
 *     summary: 기존 대화에 메시지 추가
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 대화 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: 메시지 추가 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 대화를 찾을 수 없음
 */
router.post('/conversation/:id/message', [
  auth,
  [
    check('message', '메시지는 필수입니다').notEmpty()
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message } = req.body;

    // 대화 조회
    const conversation = await AICoachConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    // 사용자 메시지 추가
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // GPT API 메시지 구성
    const apiMessages = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // GPT API 호출
    const gptResponse = await openai.createChatCompletion({
      model: process.env.GPT_MODEL || 'gpt-4',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    // AI 응답 추가
    conversation.messages.push({
      role: 'assistant',
      content: gptResponse.data.choices[0].message.content,
      timestamp: new Date()
    });

    // 마지막 상호작용 시간 업데이트
    conversation.lastInteractionAt = new Date();

    // 대화 저장
    const updatedConversation = await conversation.save();
    res.json(updatedConversation);
  } catch (err) {
    console.error(err.message);
    if (err.response && err.response.data) {
      console.error('OpenAI API 오류:', err.response.data);
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/ai-coach/conversation:
 *   get:
 *     summary: 사용자의 AI 코치 대화 목록 조회
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대화 목록
 *       401:
 *         description: 인증 실패
 */
router.get('/conversation', auth, async (req, res) => {
  try {
    const conversations = await AICoachConversation.find({ user: req.user.id })
      .select('-messages')
      .sort({ lastInteractionAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/ai-coach/conversation/{id}:
 *   get:
 *     summary: 특정 AI 코치 대화 조회
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 대화 ID
 *     responses:
 *       200:
 *         description: 대화 정보
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 대화를 찾을 수 없음
 */
router.get('/conversation/:id', auth, async (req, res) => {
  try {
    const conversation = await AICoachConversation.findById(req.params.id)
      .populate({
        path: 'generatedRoutines',
        select: 'name type difficultyLevel duration'
      });
    
    if (!conversation) {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/ai-coach/generate-routine:
 *   post:
 *     summary: AI가 운동 루틴 생성
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               conversationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 운동 루틴 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 *       401:
 *         description: 인증 실패
 */
router.post('/generate-routine', [
  auth,
  [
    check('prompt', '루틴 생성을 위한 설명이 필요합니다').notEmpty()
  ]
], async (req, res) => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { prompt, conversationId } = req.body;

    // 사용자 정보 조회
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 시스템 프롬프트 구성
    const systemPrompt = `당신은 개인 헬스 트레이너 AI 코치입니다. 사용자의 요청에 따라 맞춤형 운동 루틴을 생성해야 합니다.
    
사용자 정보:
- 이름: ${user.profile?.name || '사용자'}
- 나이: ${user.profile?.age || '정보 없음'}
- 성별: ${user.profile?.gender || '정보 없음'}
- 키: ${user.profile?.height || '정보 없음'} cm
- 현재 체중: ${user.profile?.weight || '정보 없음'} kg
- 피트니스 레벨: ${user.profile?.fitnessLevel || 'beginner'}
- 선호하는 운동 유형: ${user.profile?.preferredWorkouts?.join(', ') || '정보 없음'}

다음 정보를 포함한 JSON 형식의 운동 루틴을 생성하세요:
1. name: 루틴 이름
2. description: 루틴 설명
3. difficultyLevel: 난이도 (beginner, intermediate, advanced 중 하나)
4. type: 루틴 유형 (full_body, upper_body, lower_body, push, pull, legs, cardio, hiit, custom 중 하나)
5. duration: 예상 소요 시간(분)
6. caloriesBurn: 예상 소모 칼로리
7. exercises: 운동 목록 배열 (각 운동은 name, type, description, targetMuscles, difficulty, cardioSpecific/strengthSpecific 등의 정보 포함)
8. tags: 관련 태그 배열

JSON 응답만 제공하세요. 설명이나 다른 텍스트는 포함하지 마세요.`;

    // GPT API 호출
    const gptResponse = await openai.createChatCompletion({
      model: process.env.GPT_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // AI 응답 파싱
    const responseContent = gptResponse.data.choices[0].message.content;
    let routineData;

    try {
      // JSON 응답 파싱
      routineData = JSON.parse(responseContent);
    } catch (parseError) {
      // JSON 파싱 실패 시 정규식으로 JSON 부분만 추출 시도
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        routineData = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(400).json({ message: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' });
      }
    }

    // 운동 루틴 생성
    const workoutRoutine = new WorkoutRoutine({
      user: req.user.id,
      name: routineData.name,
      description: routineData.description,
      difficultyLevel: routineData.difficultyLevel,
      type: routineData.type,
      duration: routineData.duration,
      caloriesBurn: routineData.caloriesBurn,
      exercises: routineData.exercises.map((ex, index) => ({
        exercise: ex,
        order: index + 1,
        notes: ex.notes || ''
      })),
      tags: routineData.tags,
      isAIGenerated: true
    });

    // 루틴 저장
    const savedRoutine = await workoutRoutine.save();

    // 대화에 생성된 루틴 연결 (대화 ID가 제공된 경우)
    if (conversationId) {
      const conversation = await AICoachConversation.findById(conversationId);
      if (conversation && conversation.user.toString() === req.user.id) {
        conversation.generatedRoutines.push(savedRoutine._id);
        await conversation.save();
      }
    }

    res.status(201).json(savedRoutine);
  } catch (err) {
    console.error(err.message);
    if (err.response && err.response.data) {
      console.error('OpenAI API 오류:', err.response.data);
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/v1/ai-coach/conversation/{id}:
 *   delete:
 *     summary: AI 코치 대화 삭제
 *     tags: [AI Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 대화 ID
 *     responses:
 *       200:
 *         description: 대화 삭제 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 대화를 찾을 수 없음
 */
router.delete('/conversation/:id', auth, async (req, res) => {
  try {
    const conversation = await AICoachConversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }

    // 권한 확인
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    // 대화 삭제
    await conversation.deleteOne();
    res.json({ message: '대화가 삭제되었습니다' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
