const { query } = require('../database/db');
const logger = require('../utils/logger');

// 클라이언트 연결 저장소
const clients = new Map();

// SSE 알림 구독
const subscribe = (req, res) => {
  try {
    const userNo = req.userNo;
    
    // SSE 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 클라이언트에게 연결 성공 메시지 전송
    res.write(`data: ${JSON.stringify({ message: '알림 구독 성공' })}\n\n`);
    
    // 클라이언트 정보 저장
    clients.set(userNo, res);
    
    // 연결 종료 시 클라이언트 제거
    req.on('close', () => {
      clients.delete(userNo);
      res.end();
    });
  } catch (error) {
    logger.error('알림 구독 오류:', error.message);
    res.status(500).end();
  }
};

// 특정 사용자에게 알림 전송
const sendNotification = async (req, res) => {
  try {
    const { userNo, notificationTitle, notificationContent, notificationCategory } = req.body;
    
    // 알림 데이터베이스에 저장
    const result = await query(
      'INSERT INTO notification (user_no, notification_title, notification_content, notification_category) VALUES (?, ?, ?, ?)',
      [userNo, notificationTitle, notificationContent, notificationCategory]
    );
    
    // 실시간 알림 전송
    const notification = {
      notificationNo: result.insertId,
      notificationTitle,
      notificationContent,
      notificationCategory,
      isRead: 0,
      createdAt: new Date()
    };
    
    // 사용자가 연결되어 있는 경우 실시간 알림 전송
    const client = clients.get(parseInt(userNo));
    if (client) {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
    
    return res.status(201).json({
      notificationNo: result.insertId,
      message: '알림이 성공적으로 전송되었습니다.'
    });
  } catch (error) {
    logger.error('알림 전송 오류:', error.message);
    return res.status(500).json({
      message: '알림 전송 중 서버 오류가 발생했습니다.'
    });
  }
};

// 사용자 알림 전체 조회
const getNotifications = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    const notifications = await query(
      'SELECT * FROM notification WHERE user_no = ? ORDER BY created_at DESC',
      [userNo]
    );
    
    return res.status(200).json(notifications);
  } catch (error) {
    logger.error('알림 조회 오류:', error.message);
    return res.status(500).json({
      message: '알림 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 특정 알림 상세 조회
const getNotificationById = async (req, res) => {
  try {
    const { notificationNo } = req.params;
    
    const notifications = await query(
      'SELECT * FROM notification WHERE notification_no = ?',
      [notificationNo]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({
        message: '해당 알림을 찾을 수 없습니다.'
      });
    }
    
    // 알림 읽음 상태로 업데이트
    await query(
      'UPDATE notification SET is_read = 1 WHERE notification_no = ?',
      [notificationNo]
    );
    
    return res.status(200).json(notifications[0]);
  } catch (error) {
    logger.error('알림 상세 조회 오류:', error.message);
    return res.status(500).json({
      message: '알림 상세 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 읽지 않은 알림 개수 조회
const getUnreadCount = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    const result = await query(
      'SELECT COUNT(*) as count FROM notification WHERE user_no = ? AND is_read = 0',
      [userNo]
    );
    
    return res.status(200).json({
      count: result[0].count
    });
  } catch (error) {
    logger.error('읽지 않은 알림 개수 조회 오류:', error.message);
    return res.status(500).json({
      message: '읽지 않은 알림 개수 조회 중 서버 오류가 발생했습니다.'
    });
  }
};

// 알림 전체 읽기
const markAllAsRead = async (req, res) => {
  try {
    const userNo = req.userNo;
    
    await query(
      'UPDATE notification SET is_read = 1 WHERE user_no = ?',
      [userNo]
    );
    
    return res.status(200).json({
      message: '모든 알림이 읽음 처리되었습니다.'
    });
  } catch (error) {
    logger.error('알림 전체 읽기 오류:', error.message);
    return res.status(500).json({
      message: '알림 전체 읽기 중 서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  subscribe,
  sendNotification,
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAllAsRead
};
