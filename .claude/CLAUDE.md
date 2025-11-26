# 모든 파일 작업에 드라이브 문자와 백슬래시를 포함한 완전한 절대 Windows 경로를 사용하세요.
# 2026년 모바일 예상 트랜드와 인스타그램의 수준 등급으로 실제 서비스를 디자인과 구성,코드등 구현할것.
# 앱 화면의 라이트모드,다크모드를 구분하여 구현해야함.
# 해상도의 기준은 s25의 해상도  1080(가로) * 2340 (세로) (fhd+).
# 모든 구성과 폰트의 크기는 2340 x 1080(fhd+) 기준으로 대부분의 모바일 모델에서 알맞게 나올 수 있게 반응형으로 제작할것.
# 인스타그램 스타일,2026년 모바일 앱 예상 트랜드에 알맞게 디자인과 구성을 할것.
# 모든 파일 작업에 드라이브 문자와 백슬래시를 포함한 완전한 절대 Windows 경로를 사용하세요.
# 무조건 한국어로 설명할것.
# 토큰 절약 할것.
# node.exe 를 종료하면 현재의 대화 창도 졸료가 됨. 주의할것
# 실제 서비스를 개발할것.
# 에뮬레이터에서는 최적의 크기로 보이지만 모바일에서는 최적이 아님,
# 모바일에서도 화면의 크기,폰트의 크기등.. 최적화가 될 수 있도록 앱을 제작할것.
# 현재 이 앱의 개발은 마무리 단계이며 추가 필요한 기능과 구성,디자인을 하고 있음.
# 백앤드 서버는 3001 port , 프론트앤드 서버는 8081 port 를 사용할것.다른 포트가 사용 중이면 종료하고 지정한 포트로 사용할것.
# 앱의 구성과 디자인과 보안,폰트의 구성은 인스타그램 스타일,2026년 모바일 앱의 예상 트랜드에 알맞게 제작할것.
# 이 앱에서 사용되는 폰트의 적절한 크기,가독성,시안성 좋게 하고 흐릿하게 하지 말것.
# 모바일에 최적화 되닌 ux/ui로 제작할것.
# 폴더의 구조는  루트 iexist/ , 프론트앤드 iexist/frontend/  , 백앤드 iexist/backend/ 
# 구현 코드의 안정화.
# 사용자의 트래픽 발생 최소화.데이터베이스 쿼리 최적화,api 응답시간 개선,캐싱 최적.이미지 최적화
 # 데이터베이스 최적화.
 # 보안 강화. A. 프로덕션 환경 설정
 # 관리자 페이지 dashboard를 기획,개발해야함.
#  실제 테스트 용 에뮬레이터의 해상도는  1080(가로) * 2340 (세로) (fhd+)이며/ 2025년   갤럭시 S25 기본모델  1080(가로) * 2340 (세로) (fhd+), 갤럭시 S25 플러스,  1440(가로) * 3120 (qhd), 갤럭시 S25 울트라 1440(가로) * 3120 (qhd+)
# 실제 서비스 전에 ux/ui 최적화를 해줘.\사용 빈도는 모바일이 비중이 높을거야.\  에물레이터 해상도의 갤럭시 s25의 해상도  2340 x 1080(fhd+) 맞췄어.\ 이 앱이 다른 모바일 기기 해상도에서 최적으로 맞게 나올 수 있는 방안도 추천해줘.\디자인,구성,폰트,보안,트래픽의 사용등등..\2026년 모바일 예상 트랜드의 수준으로 이 앱에 어울리는 개선을 해줘. 
# path-configuration
- Working directory: C:\app_build\Iexist
- Frontend source path: C:\app_build\Iexist\frontend\src
- Backend source path: C:\app_build\Iexist\backend

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

# 폰트비율 참고할것.
  const BASE_WIDTH = 360; // 논리적 픽셀 (DP)
  const scale = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.9), 1.3); 
# React Native 0.80 호환성을 위한 Best Practices

  1. 절대로 모듈 레벨에서 Dimensions.get() 호출 금지
  // ❌ 금지
  const { width } = Dimensions.get('window');

  // ✅ 권장
  const getWidth = () => Dimensions.get('window').width;
  2. Proxy 패턴 사용 금지
    - React Native 렌더러와 호환되지 않음
    - 대신 초기화 함수 + Object.assign() 사용
  3. SafeAppWrapper에서 오류 객체 직접 로그 금지
    - 오류 메시지만 문자열로 변환하여 로그
    - 무한 루프 방지
  4. View/Box 컴포넌트에 원시 타입 children 방지
    - 원시 타입은 자동 필터링
    - 또는 Text 컴포넌트로 감싸기
  5. 초기화 타이밍 조심
    - InteractionManager 사용
    - 여러 Provider 초기화 충돌 방지