import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 인증 화면
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import OnboardingScreen from './screens/auth/OnboardingScreen';

// 메인 화면
import HomeScreen from './screens/main/HomeScreen';
import WorkoutScreen from './screens/main/WorkoutScreen';
import CalendarScreen from './screens/main/CalendarScreen';
import ProfileScreen from './screens/main/ProfileScreen';
import AICoachScreen from './screens/main/AICoachScreen';

// 세부 화면
import WorkoutDetailScreen from './screens/details/WorkoutDetailScreen';
import ScheduleDetailScreen from './screens/details/ScheduleDetailScreen';
import HealthMetricsScreen from './screens/details/HealthMetricsScreen';
import AICoachChatScreen from './screens/details/AICoachChatScreen';

// Context
import { AuthProvider } from './context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 네비게이션
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AI Coach') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="AI Coach" component={AICoachScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    // 초기 인증 상태 및 최초 실행 확인
    async function checkAuthState() {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);

        const appLaunched = await AsyncStorage.getItem('appLaunched');
        if (appLaunched === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('appLaunched', 'true');
        }
      } catch (e) {
        console.log('Authentication check failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthState();
  }, []);

  if (isLoading) {
    // 로딩 상태 처리
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator>
            {userToken === null ? (
              // 인증되지 않은 사용자를 위한 스택
              <>
                {isFirstLaunch && (
                  <Stack.Screen 
                    name="Onboarding" 
                    component={OnboardingScreen} 
                    options={{ headerShown: false }}
                  />
                )}
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Register" 
                  component={RegisterScreen} 
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              // 인증된 사용자를 위한 스택
              <>
                <Stack.Screen 
                  name="Main" 
                  component={TabNavigator} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="WorkoutDetail" 
                  component={WorkoutDetailScreen} 
                  options={{ title: 'Workout Details' }}
                />
                <Stack.Screen 
                  name="ScheduleDetail" 
                  component={ScheduleDetailScreen} 
                  options={{ title: 'Schedule Details' }}
                />
                <Stack.Screen 
                  name="HealthMetrics" 
                  component={HealthMetricsScreen} 
                  options={{ title: 'Health Metrics' }}
                />
                <Stack.Screen 
                  name="AICoachChat" 
                  component={AICoachChatScreen} 
                  options={{ title: 'AI Coach Chat' }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
