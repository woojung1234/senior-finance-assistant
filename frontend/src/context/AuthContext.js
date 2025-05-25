import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API 기본 URL 설정
const API_URL = 'http://localhost:3000/api/v1';

// 인증 컨텍스트 생성
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // 토큰으로 사용자 정보 가져오기
  const getUserProfile = async (token) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      setError('프로필을 가져오는데 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 함수
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/users/login`, {
        email,
        password
      });
      
      const { token } = response.data;
      
      // 토큰 저장
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);
      
      // 사용자 정보 가져오기
      await getUserProfile(token);
      
      return true;
    } catch (error) {
      console.error('로그인 오류:', error);
      
      if (error.response) {
        // 서버 응답 오류 처리
        if (error.response.status === 401) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError(error.response.data.message || '로그인에 실패했습니다.');
        }
      } else if (error.request) {
        // 서버 응답이 없는 경우
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.');
      } else {
        // 기타 오류
        setError('로그인 요청 중 오류가 발생했습니다.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 함수
  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/users/register`, {
        username,
        email,
        password
      });
      
      const { token } = response.data;
      
      // 토큰 저장
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);
      
      // 사용자 정보 가져오기
      await getUserProfile(token);
      
      return true;
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      if (error.response) {
        // 서버 응답 오류 처리
        if (error.response.status === 409) {
          setError('이미 사용 중인 이메일 또는 사용자 이름입니다.');
        } else {
          setError(error.response.data.message || '회원가입에 실패했습니다.');
        }
      } else if (error.request) {
        // 서버 응답이 없는 경우
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.');
      } else {
        // 기타 오류
        setError('회원가입 요청 중 오류가 발생했습니다.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      setIsLoading(true);
      setUserToken(null);
      setUser(null);
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 프로필 업데이트 함수
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.put(`${API_URL}/users/profile`, {
        profile: profileData
      }, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      
      if (error.response) {
        setError(error.response.data.message || '프로필 업데이트에 실패했습니다.');
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.');
      } else {
        setError('프로필 업데이트 요청 중 오류가 발생했습니다.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드시 토큰 확인
  useEffect(() => {
    async function loadToken() {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          setUserToken(token);
          await getUserProfile(token);
        }
      } catch (error) {
        console.error('토큰 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        user,
        error,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
