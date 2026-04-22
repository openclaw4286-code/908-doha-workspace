# 908doha Workspace · app

내부 업무 통합 툴. 명세서 v1.1을 구현하기 위한 React 셸.

## 개발

```bash
cd app
npm install
npm run dev   # http://localhost:5173
```

## 현재 상태 (v0.1 — 셸)

탭 레이아웃 + 플레이스홀더 뷰만 있음. 실제 기능은 반복마다 추가.

- **Board** — F-TASK / F-BOARD. 칸반 보드 미구현
- **Notes** — F-NOTE. 블록 에디터 미통합 (TipTap 예정)
- **Files** — F-FILE. 업로더 미구현
- **Vault** — F-VAULT. 잠금 화면 + 해제 스텁. 암호화 헬퍼 `src/lib/crypto.js`에 완성

## 고정된 아키텍처 기본값

명세에서 미결정 항목에 대한 v1 기본값:

| 항목 | 결정 |
|---|---|
| 저장 레이어 | localStorage (단일 브라우저). `lib/storage.js` 추상화로 이후 Supabase/Drive 등 원격 KV 스왑 가능 |
| Vault 키 모델 | 단일 팀 마스터 패스워드. 사용자별 키 래핑은 v1.2+ |
| 파일 저장 | Base64 임베드, ≤5MB (명세 3.4 옵션 A) |
| Notes 에디터 | TipTap (v0.2에서 통합) |
| 프레임워크 | React 18 + Vite 5 + Tailwind 3 |
| 디자인 토큰 | 루트 `colors_and_type.css` + `../tailwind.preset.js` |

## 디자인 시스템과의 관계

이 앱은 부모 디렉터리의 **908 Doha Design System** 위에서 동작합니다.

- `index.html`이 `../colors_and_type.css`를 직접 링크 (CSS variable 전파)
- `tailwind.config.js`가 `../tailwind.preset.js`를 preset으로 사용
- 컴포넌트는 semantic token (`var(--text-primary)` 등)으로 스타일링. 원시 hex 사용 금지.
