import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { userState } from '../atoms/userState';
import axios from 'axios';
import './Welfare.css';
import { FiHeart, FiSearch, FiMic } from 'react-icons/fi';

const Welfare = () => {
  const [user] = useRecoilState(userState);
  const [welfareList, setWelfareList] = useState([]);
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    fetchWelfareData();
  }, []);
  
  const fetchWelfareData = async () => {
    try {
      setLoading(true);
      
      // 복지 서비스 데이터 불러오기
      const welfareResponse = await axios.get('/api/v1/welfare', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      // 복지 서비스 추천 불러오기
      const recommendationsResponse = await axios.get('/api/v1/welfare/recommendations', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      setWelfareList(welfareResponse.data);
      setRecommendations(recommendationsResponse.data.recommendations);
      setLoading(false);
    } catch (error) {
      console.error('복지 서비스 데이터 불러오기 오류:', error);
      setError('복지 서비스 데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };
  
  // 카테고리 별 복지 서비스 필터링
  const filteredWelfareList = welfareList.filter(welfare => {
    const matchesSearch = 
      welfare.welfare_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      welfare.welfare_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      welfare.welfare_target.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || welfare.welfare_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // 음성 검색 관련 함수
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
      setSearchTerm('기초연금');
    }, 2000);
  };
  
  const stopListening = () => {
    setIsListening(false);
  };
  
  // 카테고리 목록 생성
  const categories = ['all', ...new Set(welfareList.map(welfare => welfare.welfare_category))];
  
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="welfare-container">
      <h1>복지 서비스</h1>
      
      {/* 음성 검색 버튼 */}
      <button 
        className={`voice-search-button ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
      >
        <FiMic />
        <span>음성으로 검색</span>
      </button>
      
      {/* 검색 및 필터 */}
      <div className="welfare-search">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="복지 서비스 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      </div>
      
      {/* 추천 복지 서비스 */}
      {recommendations && (
        <div className="welfare-recommendations">
          <h2><FiHeart /> 추천 복지 서비스</h2>
          <div className="recommendations-content">
            {recommendations}
          </div>
        </div>
      )}
      
      {/* 복지 서비스 목록 */}
      <div className="welfare-list">
        <h2>복지 서비스 목록</h2>
        
        {filteredWelfareList.length === 0 ? (
          <div className="empty-message">검색 결과가 없습니다.</div>
        ) : (
          filteredWelfareList.map(welfare => (
            <div key={welfare.welfare_no} className="welfare-card">
              <h3 className="welfare-title">{welfare.welfare_title}</h3>
              <div className="welfare-category">{welfare.welfare_category}</div>
              <p className="welfare-content">{welfare.welfare_content}</p>
              <div className="welfare-details">
                <div className="welfare-target">
                  <strong>대상:</strong> {welfare.welfare_target}
                </div>
                {welfare.welfare_amount > 0 && (
                  <div className="welfare-amount">
                    <strong>지원금액:</strong> {welfare.welfare_amount.toLocaleString()}원
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Welfare;
