// 데이터베이스 시드 데이터 스크립트
require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./db');
const logger = require('../utils/logger');

// 시드 데이터 추가
const seed = async () => {
  try {
    // 테스트 사용자 추가
    const hashedPassword = await bcrypt.hash('password123', 10);
    await query(
      'INSERT INTO user (user_id, user_pw, user_name, phone) VALUES (?, ?, ?, ?)',
      ['testuser', hashedPassword, '테스트 사용자', '01012345678']
    );
    
    // 사용자 프로필 추가
    await query(
      'INSERT INTO user_profile (user_no, age, gender, residence, income) VALUES (?, ?, ?, ?, ?)',
      [1, 65, '남성', '서울시 강남구', 2500000]
    );
    
    // 복지 서비스 샘플 데이터 추가
    const welfareServices = [
      {
        title: '기초연금',
        content: '65세 이상 어르신 중 소득인정액이 선정기준액 이하인 어르신께 매월 일정 금액을 지급하는 제도입니다.',
        category: '노인복지',
        target: '65세 이상 저소득층',
        amount: 300000
      },
      {
        title: '노인 일자리 및 사회활동 지원',
        content: '노인이 활기차고 건강한 노후생활을 영위할 수 있도록 다양한 일자리와 사회활동을 지원하는 제도입니다.',
        category: '노인복지',
        target: '65세 이상',
        amount: 500000
      },
      {
        title: '노인장기요양보험',
        content: '고령이나 노인성 질병 등으로 인하여 6개월 이상 동안 혼자서 일상생활을 수행하기 어려운 노인에게 신체활동 및 가사지원 등의 서비스를 제공하는 제도입니다.',
        category: '노인복지',
        target: '65세 이상 또는 노인성 질병이 있는 자',
        amount: 0
      },
      {
        title: '노인 안전확인 서비스',
        content: '홀로 사는 어르신의 안전 확인과 정서적 지원을 위해 정기적인 전화 및 방문 서비스를 제공합니다.',
        category: '노인복지',
        target: '65세 이상 독거노인',
        amount: 0
      },
      {
        title: '노인 건강검진 비용 지원',
        content: '노인의 건강 유지와 질병 예방을 위해 정기 건강검진 비용을 지원하는 제도입니다.',
        category: '노인복지',
        target: '65세 이상',
        amount: 100000
      }
    ];
    
    for (const welfare of welfareServices) {
      await query(
        'INSERT INTO welfare (welfare_title, welfare_content, welfare_category, welfare_target, welfare_amount) VALUES (?, ?, ?, ?, ?)',
        [welfare.title, welfare.content, welfare.category, welfare.target, welfare.amount]
      );
    }
    
    // 소비내역 샘플 데이터 추가
    const consumptionRecords = [
      { date: '2025-05-01', amount: 35000, category: '식비', description: '마트 장보기' },
      { date: '2025-05-03', amount: 15000, category: '의료/건강', description: '약국' },
      { date: '2025-05-05', amount: 50000, category: '생활용품', description: '생필품 구매' },
      { date: '2025-05-10', amount: 25000, category: '식비', description: '식당' },
      { date: '2025-05-15', amount: 120000, category: '의료/건강', description: '병원비' },
      { date: '2025-05-18', amount: 30000, category: '교통', description: '택시' },
      { date: '2025-05-20', amount: 45000, category: '식비', description: '마트' }
    ];
    
    for (const record of consumptionRecords) {
      await query(
        'INSERT INTO consumption (user_no, consumption_date, amount, category, description) VALUES (?, ?, ?, ?, ?)',
        [1, record.date, record.amount, record.category, record.description]
      );
    }
    
    // 알림 샘플 데이터 추가
    const notifications = [
      { title: '5월 기초연금 지급 안내', content: '5월 25일에 기초연금이 입금될 예정입니다.', category: '복지서비스' },
      { title: '건강검진 일정 안내', content: '예약하신 건강검진 일정이 다음 주 월요일입니다.', category: '의료/건강' },
      { title: '소비 패턴 분석 결과', content: '이번 달 의료비 지출이 평소보다 30% 증가했습니다.', category: '소비내역' }
    ];
    
    for (const notification of notifications) {
      await query(
        'INSERT INTO notification (user_no, notification_title, notification_content, notification_category) VALUES (?, ?, ?, ?)',
        [1, notification.title, notification.content, notification.category]
      );
    }
    
    logger.info('시드 데이터 추가 완료');
  } catch (error) {
    logger.error('시드 데이터 추가 오류:', error.message);
    throw error;
  }
};

// 스크립트로 직접 실행될 경우 시드 데이터 추가 수행
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
