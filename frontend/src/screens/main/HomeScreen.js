import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

const HomeScreen = ({ navigation }) => {
  const { user, userToken } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      if (!userToken) return;

      setIsLoading(true);
      setError(null);

      try {
        // 예정된 운동 일정 가져오기
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // 다음 7일간의 운동

        const scheduleResponse = await axios.get(
          `${API_URL}/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&status=scheduled`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`
            }
          }
        );

        setUpcomingWorkouts(scheduleResponse.data);

        // 최근 건강 지표 가져오기
        const healthResponse = await axios.get(
          `${API_URL}/health-metrics?limit=1`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`
            }
          }
        );

        if (healthResponse.data.length > 0) {
          setHealthMetrics(healthResponse.data[0]);
        }
      } catch (err) {
        console.error('홈 데이터 로딩 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [userToken]);

  const greeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return '좋은 아침이에요';
    } else if (hour < 18) {
      return '안녕하세요';
    } else {
      return '좋은 저녁이에요';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 섹션 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.profile?.name || '회원님'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* 건강 상태 요약 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>건강 상태</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthMetrics')}>
              <Text style={styles.viewAllText}>더보기</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : healthMetrics ? (
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {healthMetrics.bodyMetrics?.weight || '-'} kg
                </Text>
                <Text style={styles.metricLabel}>체중</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {healthMetrics.bodyMetrics?.bodyFatPercentage || '-'} %
                </Text>
                <Text style={styles.metricLabel}>체지방률</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {healthMetrics.cardioMetrics?.restingHeartRate || '-'} bpm
                </Text>
                <Text style={styles.metricLabel}>심박수</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {healthMetrics.bodyMetrics?.bmi || '-'}
                </Text>
                <Text style={styles.metricLabel}>BMI</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addMetricsButton}
              onPress={() => navigation.navigate('HealthMetrics')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
              <Text style={styles.addMetricsText}>건강 지표 추가하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 예정된 운동 */}
        <View style={styles.workoutsCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>예정된 운동</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.viewAllText}>일정 보기</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : upcomingWorkouts.length > 0 ? (
            upcomingWorkouts.slice(0, 3).map((workout, index) => (
              <TouchableOpacity
                key={workout._id}
                style={styles.workoutItem}
                onPress={() => navigation.navigate('ScheduleDetail', { id: workout._id })}
              >
                <View style={styles.workoutIconContainer}>
                  <Ionicons name="fitness-outline" size={24} color="#4F46E5" />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.routineId?.name || '운동 루틴'}</Text>
                  <Text style={styles.workoutTime}>
                    {formatDate(workout.scheduledDate)}{' '}
                    {workout.startTime ? `${formatTime(workout.startTime)}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity 
              style={styles.addWorkoutButton}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
              <Text style={styles.addWorkoutText}>운동 일정 추가하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI 코치 카드 */}
        <TouchableOpacity 
          style={styles.aiCoachCard}
          onPress={() => navigation.navigate('AI Coach')}
        >
          <View style={styles.aiCoachContent}>
            <Ionicons name="chatbubbles-outline" size={36} color="#FFFFFF" />
            <View style={styles.aiCoachInfo}>
              <Text style={styles.aiCoachTitle}>AI 헬스 코치와 대화하기</Text>
              <Text style={styles.aiCoachDescription}>
                맞춤형 운동 루틴, 건강 조언 및 모티베이션을 받아보세요
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 빠른 액션 버튼 */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Workouts')}
          >
            <Ionicons name="barbell-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>운동 루틴</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>일정 관리</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('HealthMetrics')}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>건강 지표</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  addMetricsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  addMetricsText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 8,
  },
  workoutsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  addWorkoutText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 8,
  },
  aiCoachCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiCoachContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiCoachInfo: {
    marginLeft: 16,
    flex: 1,
  },
  aiCoachTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiCoachDescription: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
});

export default HomeScreen;
