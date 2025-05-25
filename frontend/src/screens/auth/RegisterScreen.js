import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, isLoading, error } = useContext(AuthContext);

  const validateInputs = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return false;
    }
    
    if (username.length < 3) {
      Alert.alert('입력 오류', '사용자 이름은 3자 이상이어야 합니다.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('입력 오류', '유효한 이메일 주소를 입력해주세요.');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }
    
    const success = await register(username, email, password);
    
    if (!success && error) {
      Alert.alert('회원가입 실패', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>회원가입</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>피트니스 코치와 함께 건강한 생활을 시작하세요</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#4F46E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="사용자 이름"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#4F46E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#4F46E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#4F46E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.termsText}>
              회원가입을 완료하면 서비스의{' '}
              <Text style={styles.termsLink}>이용약관</Text>과{' '}
              <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의하게 됩니다.
            </Text>
            
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>회원가입</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    padding: 10,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
