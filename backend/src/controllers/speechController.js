const { query } = require('../database/db');
const logger = require('../utils/logger');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 임시 파일 저장 경로
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// 파일 저장 경로가 존재하지 않으면 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// STT (Speech-to-Text)
const speechToText = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    // 음성 파일이 없는 경우
    if (!req.file) {
      return res.status(400).json({
        message: '음성 파일을 업로드해주세요.'
      });
    }
    
    // STT API 호출
    // 실제 애플리케이션에서는 Google Cloud Speech API 또는 다른 STT API 사용
    // 테스트 버전에서는 더미 데이터 사용
    const transcription = '안녕하세요. 저의 소비 내역을 알려주세요.';
    
    // 파일 삭제
    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({
      text: transcription
    });
  } catch (error) {
    logger.error('STT 오류:', error.message);
    
    // 파일 삭제 시도
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      message: 'STT 처리 중 서버 오류가 발생했습니다.'
    });
  }
};

// TTS (Text-to-Speech)
const textToSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: '텍스트를 입력해주세요.'
      });
    }
    
    // TTS API 호출
    // 실제 애플리케이션에서는 Google Cloud Text-to-Speech API 또는 다른 TTS API 사용
    // 테스트 버전에서는 더미 데이터 사용
    const audioFilename = `tts_${uuidv4()}.mp3`;
    const audioPath = path.join(UPLOAD_DIR, audioFilename);
    
    // 더미 오디오 파일 생성 (실제로는 TTS API에서 받은 데이터를 저장)
    fs.writeFileSync(audioPath, 'dummy audio content');
    
    return res.status(200).json({
      audio: `/api/v1/speech/audio/${audioFilename}`,
      message: 'TTS 변환이 완료되었습니다.'
    });
  } catch (error) {
    logger.error('TTS 오류:', error.message);
    return res.status(500).json({
      message: 'TTS 처리 중 서버 오류가 발생했습니다.'
    });
  }
};

// 음성 입력 기반 챗봇 대화
const audioConversation = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    // 음성 파일이 없는 경우
    if (!req.file) {
      return res.status(400).json({
        message: '음성 파일을 업로드해주세요.'
      });
    }
    
    // 1. STT API로 음성을 텍스트로 변환
    // 실제로는 Google Cloud Speech API 또는 다른 STT API 사용
    // 테스트 버전에서는 더미 데이터 사용
    const transcription = '내 복지혜택은 어떠한 것들이 있나요?';
    
    // 음성 파일 삭제
    fs.unlinkSync(req.file.path);
    
    // 2. ChatGPT API로 응답 생성
    // 사용자 정보 가져오기
    const users = await query('SELECT * FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const user = users[0];
    
    // 복지 서비스 정보 가져오기
    const welfareServices = await query('SELECT * FROM welfare WHERE is_deleted = 0 LIMIT 5');
    
    let botResponse = "";
    if (process.env.OPENAI_API_KEY) {
      let systemPrompt = `당신은 고령자를 위한 음성 기반 금융 도우미 습니다. 사용자에게 복지서비스, 소비내역 등에 대해 다음 정보를 바탕으로 상세하게 안내해주세요:\n\n`;
      
      if (welfareServices.length > 0) {
        systemPrompt += `이용 가능한 복지 서비스:\n`;
        welfareServices.forEach(service => {
          systemPrompt += `- ${service.welfare_title}: ${service.welfare_content}\n`;
        });
      }
      
      const completion = await openai.createCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcription }
        ],
      });
      
      botResponse = completion.data.choices[0].message.content;
    } else {
      // API 키가 없는 경우 더미 데이터 사용
      botResponse = '기본적으로 기초연금, 노인일자리 및 사회활동 지원, 노인장기요양보험, 노인 안전확인 서비스, 노인 건강검진 비용 지원 등이 있습니다. 구체적인 상담을 원하시면 복지사나 동사무소를 방문해보세요.';
    }
    
    // 3. 생성된 응답을 TTS로 변환
    const audioFilename = `tts_${uuidv4()}.mp3`;
    const audioPath = path.join(UPLOAD_DIR, audioFilename);
    
    // 더미 오디오 파일 생성 (실제로는 TTS API에서 받은 데이터를 저장)
    fs.writeFileSync(audioPath, 'dummy audio content');
    
    // 대화 기록 저장
    await query(
      'INSERT INTO chat_history (user_no, user_message, bot_response) VALUES (?, ?, ?)',
      [userNo, transcription, botResponse]
    );
    
    return res.status(200).json({
      text: transcription,
      response: botResponse,
      audio: `/api/v1/speech/audio/${audioFilename}`
    });
  } catch (error) {
    logger.error('음성 대화 오류:', error.message);
    
    // 파일 삭제 시도
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      message: '음성 대화 처리 중 서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  speechToText,
  textToSpeech,
  audioConversation
};
