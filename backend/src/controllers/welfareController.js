const { query } = require('../database/db');
const logger = require('../utils/logger');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 전체 복지 서비스 목록 조회
const getAllWelfare = async (req, res) => {
  try {
    const welfareList = await query('SELECT * FROM welfare WHERE is_deleted = 0');
    
    return res.status(200).json(welfareList);
  } catch (error) {
    logger.error('복지 서비스 목록 조회 오류:', error.message);
    return res.status(500).json({
      message: '복지 서비스 목록 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 특정 복지 서비스 상세 조회
const getWelfareById = async (req, res) => {
  try {
    const { welfareNo } = req.params;
    
    const welfareList = await query('SELECT * FROM welfare WHERE welfare_no = ? AND is_deleted = 0', [welfareNo]);
    
    if (welfareList.length === 0) {
      return res.status(404).json({
        message: '해당 복지 서비스를 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json(welfareList[0]);
  } catch (error) {
    logger.error('복지 서비스 상세 조회 오류:', error.message);
    return res.status(500).json({
      message: '복지 서비스 상세 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 카테고리별 복지 서비스 조회
const getWelfareByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const welfareList = await query('SELECT * FROM welfare WHERE welfare_category = ? AND is_deleted = 0', [category]);
    
    return res.status(200).json(welfareList);
  } catch (error) {
    logger.error('카테고리별 복지 서비스 조회 오류:', error.message);
    return res.status(500).json({
      message: '카테고리별 복지 서비스 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 사용자 맞춤형 복지 서비스 추천
const getRecommendations = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    // 사용자 정보 조회
    const users = await query('SELECT * FROM user WHERE user_no = ? AND is_deleted = 0', [userNo]);
    
    if (users.length === 0) {
      return res.status(404).json({
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const user = users[0];
    
    // 사용자 프로필 정보 조회
    const profiles = await query('SELECT * FROM user_profile WHERE user_no = ?', [userNo]);
    const profile = profiles.length > 0 ? profiles[0] : {};
    
    // 모든 복지 서비스 조회
    const welfareList = await query('SELECT * FROM welfare WHERE is_deleted = 0');
    
    // GPT API를 활용한 맞춤형 복지 서비스 추천
    let recommendationPrompt = `다음은 사용자 정보입니다:\n`;
    recommendationPrompt += `- 이름: ${user.user_name}\n`;
    recommendationPrompt += `- 나이: ${profile.age || '정보 없음'}\n`;
    recommendationPrompt += `- 소득: ${profile.income || '정보 없음'}\n`;
    recommendationPrompt += `- 거주지역: ${profile.residence || '정보 없음'}\n\n`;
    
    recommendationPrompt += `다음은 이용 가능한 복지 서비스 목록입니다:\n`;
    welfareList.forEach(welfare => {
      recommendationPrompt += `- ${welfare.welfare_title}: ${welfare.welfare_content}\n`;
      recommendationPrompt += `  대상: ${welfare.welfare_target}, 금액: ${welfare.welfare_amount}\n\n`;
    });
    
    recommendationPrompt += `\n위 정보를 바탕으로 이 사용자에게 가장 적합한 복지 서비스 3가지를 추천하고, 각각의 서비스가 이 사용자에게 어떤 도움이 될 수 있는지 설명해주세요.`;
    
    // ChatGPT API 호출 구현 (실제 API 키 필요)
    let aiRecommendations = "";
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.createCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "당신은 복지 서비스 전문가입니다. 고령자가 이해하기 쉽게 복지 서비스를 설명하고 추천해주세요." },
          { role: "user", content: recommendationPrompt }
        ],
      });
      
      aiRecommendations = completion.data.choices[0].message.content;
    } else {
      // API 키가 없는 경우 더미 데이터 사용
      aiRecommendations = "API 키가 설정되지 않아 실제 추천을 생성할 수 없습니다. 서비스에서 제공하는 모든 복지 서비스를 확인하시기 바랍니다.";
    }
    
    // 추천 서비스와 함께 전체 서비스 목록 반환
    return res.status(200).json({
      allServices: welfareList,
      recommendations: aiRecommendations
    });
  } catch (error) {
    logger.error('복지 서비스 추천 오류:', error.message);
    return res.status(500).json({
      message: '복지 서비스 추천 중 서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getAllWelfare,
  getWelfareById,
  getWelfareByCategory,
  getRecommendations
};
