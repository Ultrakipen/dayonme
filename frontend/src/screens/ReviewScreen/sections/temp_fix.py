with open("WeeklyGoal.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# 수정할 인덱스 (0-based)
modifications = []

# 1. X 버튼 추가 (177번 라인 다음, 인덱스 177)
close_button = """                  {/* X 닫기 버튼 */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>

"""
lines.insert(177, close_button)

# 2. 헤더에 marginTop 추가 (이제 인덱스가 변경됨, 원래 178 -> 187)
lines[187] = lines[187].replace('marginBottom: 12 * scale }', 'marginBottom: 12 * scale, marginTop: 8 * scale }')

# 3. targetLabel에 flexShrink: 0 추가 (라인 변경으로 조정 필요)
for i, line in enumerate(lines):
    if 'styles.targetLabel' in line and 'flexShrink' not in line:
        lines[i] = line.replace('FONT_SIZES.bodySmall * scale }', 'FONT_SIZES.bodySmall * scale, flexShrink: 0 }')
    if 'styles.targetUnit' in line and 'flexShrink' not in line:
        lines[i] = line.replace('FONT_SIZES.bodySmall * scale }', 'FONT_SIZES.bodySmall * scale, flexShrink: 0 }')

# 4. targetRow에 flexWrap 추가
for i, line in enumerate(lines):
    if '  targetRow: {' in line:
        # 다음 몇 라인을 확인하여 flexWrap이 없으면 추가
        if 'flexWrap' not in ''.join(lines[i:i+5]):
            for j in range(i, min(i+5, len(lines))):
                if 'marginBottom: 8 * scale,' in lines[j]:
                    lines[j] = lines[j].replace('marginBottom: 8 * scale,', 'marginBottom: 8 * scale,\n    flexWrap: \'nowrap\',')
                    break

# 5. closeButton 스타일 추가
for i, line in enumerate(lines):
    if '  modalCloseText: {' in line:
        # modalCloseText 블록의 끝을 찾아서 그 다음에 추가
        for j in range(i, min(i+10, len(lines))):
            if lines[j].strip() == '},':
                lines[j] = lines[j].replace('},', '},\n  closeButton: {\n    position: \'absolute\',\n    top: 12 * scale,\n    right: 12 * scale,\n    width: 32 * scale,\n    height: 32 * scale,\n    borderRadius: 16 * scale,\n    alignItems: \'center\',\n    justifyContent: \'center\',\n    zIndex: 10,\n  },\n  closeButtonText: {\n    fontSize: 24 * scale,\n    fontFamily: \'Pretendard-Medium\',\n    lineHeight: 24 * scale,\n  },')
                break
        break

with open("WeeklyGoal.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)

print("수정 완료")
