import { atom } from 'recoil';

// 사용자 상태 저장
// token, userNo, userName 등 정보 포함
export const userState = atom({
  key: 'userState',
  default: null,
});
