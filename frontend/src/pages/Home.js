import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { userState } from '../atoms/userState';
import axios from 'axios';
import './Home.css';
import { FiMessageCircle, FiList, FiHeart, FiMic } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Home = () => {
  const [user] = useRecoilState(userState);
  const [notifications, setNotifications] = useState([]);
  const [recentConsumption, setRecentConsumption] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 알림 조회
        const notificationsResponse = await axios.get('/api/v1/notification/read', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        // 최근 소비내역 조회
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const startDate = oneMonthAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const consumptionResponse = await axios.get(`/api/v1/consumption/${startDate}/${endDate}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        setNotifications(notificationsResponse.data.slice(0, 5));  // 최근 5개만 표시
        setRecentConsumption(consumptionResponse.data.slice(0, 5));  // 최근 5개만 표시
        setLoading(false);
      } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // 음성 인식 시작/종료 함수
  const toggleListening = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };
  
  const startListening = () => {
    setIsListening(true);
    // 실제로는 음성 인식 API 연동 필요
    // 테스트 버전에서는 시연용
    setTimeout(() => {
      stopListening();
      // 챗봇 페이지로 이동
      window.location.href = '/chatbot';
    }, 3000);
  };
  
  const stopListening = () => {
    setIsListening(false);
  };
  
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home-container">
      <h1>안녕하세요, {user.userName}님!</h1>
      <p className="welcome-text">오늘도 금복이 함께하겠습니다.</p>
      
      <div className="dashboard">
        <div className="dashboard-column">
          <div className="card">
            <div className="card-title">
              <FiList /> 최근 소비내역
            </div>
            <div className="card-body">
              {recentConsumption.length > 0 ? (
                <ul className="consumption-list">
                  {recentConsumption.map(item => (
                    <li key={item.consumption_no} className="consumption-item">
                      <div className="consumption-date">{new Date(item.consumption_date).toLocaleDateString()}</div>
                      <div className="consumption-info">
                        <span className="consumption-category">{item.category}</span>
                        <span className="consumption-amount">{item.amount.toLocaleString()}원</span>
                      </div>
                      <div className="consumption-description">{item.description}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">최근 소비내역이 없습니다.</p>
              )}
              <Link to="/consumption" className="view-more">
                더 보기
              </Link>
            </div>
          </div>
        </div>
        
        <div className="dashboard-column">
          <div className="card">
            <div className="card-title">
              <FiBell /> 알림
            </div>
            <div className="card-body">
              {notifications.length > 0 ? (
                <ul className="notification-list">
                  {notifications.map(notification => (
                    <li key={notification.notification_no} className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}>
                      <div className="notification-title">{notification.notification_title}</div>
                      <div className="notification-content">{notification.notification_content}</div>
                      <div className="notification-time">{new Date(notification.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">새 알림이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="quick-actions">
        <Link to="/chatbot" className="quick-action-button">
          <FiMessageCircle />
          <span>챗봇 대화하기</span>
        </Link>
        <Link to="/welfare" className="quick-action-button">
          <FiHeart />
          <span>복지서비스 보기</span>
        </Link>
      </div>
      
      <button 
        className={`speech-button ${isListening ? 'recording' : ''}`}
        onClick={toggleListening}
      >
        <FiMic />
      </button>
    </div>
  );
};

export default Home;
