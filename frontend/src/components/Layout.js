import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { userState } from '../atoms/userState';
import { FiHome, FiList, FiHeart, FiMessageCircle, FiUser, FiMenu, FiX, FiBell } from 'react-icons/fi';
import './Layout.css';

const Layout = ({ children }) => {
  const [user] = useRecoilState(userState);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  
  useEffect(() => {
    // 알림 개수 조회 API 호출
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/v1/notification/read/count', {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('알림 개수 조회 오류:', error);
      }
    };
    
    if (user?.token) {
      fetchUnreadCount();
      // 1분마다 알림 개수 새로고침
      const interval = setInterval(fetchUnreadCount, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // 현재 페이지에 따라 활성화된 메뉴 표시
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      {/* 모바일 헤더 */}
      <header className="mobile-header">
        <div className="header-title">
          <h1>금복</h1>
        </div>
        <div className="header-actions">
          <Link to="/notifications" className="notification-icon">
            <FiBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </Link>
          <button className="menu-toggle" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>
      
      {/* 사이드바 (데스크톱) */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>금복</h1>
        </div>
        <ul className="nav-links">
          <li className={isActive('/')}>
            <Link to="/">
              <FiHome />
              <span>홈</span>
            </Link>
          </li>
          <li className={isActive('/consumption')}>
            <Link to="/consumption">
              <FiList />
              <span>소비내역</span>
            </Link>
          </li>
          <li className={isActive('/welfare')}>
            <Link to="/welfare">
              <FiHeart />
              <span>복지서비스</span>
            </Link>
          </li>
          <li className={isActive('/chatbot')}>
            <Link to="/chatbot">
              <FiMessageCircle />
              <span>챗봇</span>
            </Link>
          </li>
          <li className={isActive('/mypage')}>
            <Link to="/mypage">
              <FiUser />
              <span>마이페이지</span>
            </Link>
          </li>
        </ul>
        <div className="sidebar-footer">
          <p>© 2025 금복</p>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          <li>
            <Link to="/" onClick={closeMobileMenu}>
              <FiHome />
              <span>홈</span>
            </Link>
          </li>
          <li>
            <Link to="/consumption" onClick={closeMobileMenu}>
              <FiList />
              <span>소비내역</span>
            </Link>
          </li>
          <li>
            <Link to="/welfare" onClick={closeMobileMenu}>
              <FiHeart />
              <span>복지서비스</span>
            </Link>
          </li>
          <li>
            <Link to="/chatbot" onClick={closeMobileMenu}>
              <FiMessageCircle />
              <span>챗봇</span>
            </Link>
          </li>
          <li>
            <Link to="/mypage" onClick={closeMobileMenu}>
              <FiUser />
              <span>마이페이지</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
