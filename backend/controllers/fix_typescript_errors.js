const fs = require('fs');
let content = fs.readFileSync('authController.ts', 'utf8');

// 1. register 함수의 User.create에 is_email_verified 추가
content = content.replace(
  /const newUser = await db\.User\.create\(\{[\s\S]*?theme_preference: 'system',\s*is_active: true\s*\}\);/,
  `const newUser = await db.User.create({
        username,
        email,
        password_hash: hashedPassword,
        nickname: nickname || username,
        profile_image_url: profile_image_url || null,
        theme_preference: 'system',
        is_active: true,
        is_email_verified: true
      });`
);

// 2. kakaoLogin의 User.create에 is_email_verified 추가
content = content.replace(
  /user = await db\.User\.create\(\{\s*username: `kakao_\$\{kakao_id\}`,[\s\S]*?is_active: true\s*\}\);/,
  `user = await db.User.create({
          username: \`kakao_\${kakao_id}\`,
          email: email,
          password_hash: randomPassword,
          nickname: profile?.nickname || \`kakao_\${kakao_id}\`,
          profile_image_url: profile?.profile_image || null,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });`
);

// 3. naverLogin의 User.create에 is_email_verified 추가
content = content.replace(
  /user = await db\.User\.create\(\{\s*username: `naver_\$\{naver_id\}`,[\s\S]*?is_active: true\s*\}\);/,
  `user = await db.User.create({
          username: \`naver_\${naver_id}\`,
          email: email,
          password_hash: randomPassword,
          nickname: profile?.nickname || \`naver_\${naver_id}\`,
          profile_image_url: profile?.profile_image || null,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });`
);

// 4. googleLogin의 User.create에 is_email_verified 추가
content = content.replace(
  /user = await db\.User\.create\(\{\s*username: `google_\$\{google_id\}`,[\s\S]*?is_active: true\s*\}\);/,
  `user = await db.User.create({
          username: \`google_\${google_id}\`,
          email: email,
          password_hash: randomPassword,
          nickname: name || \`google_\${google_id}\`,
          profile_image_url: picture || null,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });`
);

// 5. sendVerificationCode, verifyCode 함수의 타입 추가
content = content.replace(
  /sendVerificationCode: async \(req, res\) => \{/,
  'sendVerificationCode: async (req: Request, res: Response) => {'
);

content = content.replace(
  /verifyCode: async \(req, res\) => \{/,
  'verifyCode: async (req: Request, res: Response) => {'
);

fs.writeFileSync('authController.ts', content, 'utf8');
console.log('TypeScript 오류 수정 완료');
