const { query } = require('../database/db');
const logger = require('../utils/logger');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 챗봇 메시지 전송
const sendMessage = async (req, res) => {
  try {
    const userNo = req.userNo;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        message: '메시지 내용을 입력해주세요.'
      });
    }
    
    // 사용자 정보 가져오기
    const users = await query('SELECT * FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const user = users[0];
    
    // GPT API 호출
    let botResponse = "";
    if (process.env.OPENAI_API_KEY) {
      // 최근 채팅 기록 5개 가져오기
      const chatHistory = await query(
        'SELECT * FROM chat_history WHERE user_no = ? ORDER BY created_at DESC LIMIT 5',
        [userNo]
      );
      
      // 최근 소비 내역 가져오기
      const recentConsumption = await query(
        'SELECT * FROM consumption WHERE user_no = ? ORDER BY consumption_date DESC LIMIT 5',
        [userNo]
      );
      
      // 복지 서비스 정보 가져오기
      const welfareServices = await query('SELECT * FROM welfare WHERE is_deleted = 0 LIMIT 5');
      
      // GPT 프롬프트 구성
      let systemPrompt = `당신은 고령자를 위한 음성 기반 금융 도우미 '금복'입니다. 금융, 소비내역, 복지서비스에 대한 질문에 상세하게 대답하세요. 다음 정보를 바탕으로 응답해주세요:\n\n`;
      
      systemPrompt += `사용자 정보:\n`;
      systemPrompt += `- 이름: ${user.user_name}\n`;
      
      if (recentConsumption.length > 0) {
        systemPrompt += `\n최근 소비 내역:\n`;
        recentConsumption.forEach(item => {
          systemPrompt += `- ${item.consumption_date}: ${item.category} - ${item.amount}원 (${item.description})\n`;
        });
      }
      
      if (welfareServices.length > 0) {
        systemPrompt += `\n이용 가능한 복지 서비스:\n`;
        welfareServices.forEach(service => {
          systemPrompt += `- ${service.welfare_title}: ${service.welfare_content}\n`;
        });
      }
      
      // 최신 채팅 기록을 추가
      let chatMessages = [{ role: "system", content: systemPrompt }];
      
      // 최근 순서대로 정렬 (오래된 대화가 먼저)
      chatHistory.reverse().forEach(chat => {
        chatMessages.push({ role: "user", content: chat.user_message });
        chatMessages.push({ role: "assistant", content: chat.bot_response });
      });
      
      // 현재 대화 추가
      chatMessages.push({ role: "user", content: message });
      
      const completion = await openai.createCompletion({
        model: "gpt-4",
        messages: chatMessages,
      });
      
      botResponse = completion.data.choices[0].message.content;
    } else {
      // API 키가 없는 경우 더미 데이터 사용
      botResponse = "OpenAI API 키가 설정되지 않아 응답을 생성할 수 없습니다. API 키를 설정한 후 다시 시도해주세요.";
    }
    
    // 대화 기록 저장
    await query(
      'INSERT INTO chat_history (user_no, user_message, bot_response) VALUES (?, ?, ?)',
      [userNo, message, botResponse]
    );
    
    return res.status(200).json({
      response: botResponse
    });
  } catch (error) {
    logger.error('챗봇 응답 오류:', error.message);
    return res.status(500).json({
      message: '챗봇 응답 중 서버 오류가 발생했습니다.'
    });
  }
};

// 채팅 기록 조회
const getChatHistory = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    const chatHistory = await query(
      'SELECT * FROM chat_history WHERE user_no = ? ORDER BY created_at DESC LIMIT 20',
      [userNo]
    );
    
    return res.status(200).json(chatHistory);
  } catch (error) {
    logger.error('채팅 기록 조회 오류:', error.message);
    return res.status(500).json({
      message: '채팅 기록 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 채팅 기록 삭제
const clearChatHistory = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    await query('DELETE FROM chat_history WHERE user_no = ?', [userNo]);
    
    return res.status(200).json({
      message: '채팅 기록이 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('채팅 기록 삭제 오류:', error.message);
    return res.status(500).json({
      message: '채팅 기록 삭제 중 서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory
};
