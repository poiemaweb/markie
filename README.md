# Markdown Preview Companion

메신저(Telegram · Slack · Discord)에서 받은 **깨진 마크다운** 답변을 즉시 예쁘게 렌더링해주는 초경량 컴패니언.
현재 저장소는 **웹 MVP(v0.1)** 단계이며, 이후 단계에서 Tauri 또는 Electron 래퍼를 씌워 트레이 상주 + 전역 단축키 앱으로 확장됩니다.

---

## 빠른 시작

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 전처리 엔진 유닛 테스트 (21 케이스)
npm run build        # 정적 번들 (dist/)

# 데스크탑 앱 (Node 18+ / Rust 1.77+ 필요)
npm run tauri:dev    # 트레이 상주 + 전역 단축키
npm run tauri:build  # .dmg / .msi / .AppImage 번들
```

> 웹 렌더러는 Node 16 + vite 4 + vitest 0.34 조합으로도 동작하도록 고정. Tauri 래퍼를 실제로 빌드하려면 Node 18+·Rust 1.77+·OS별 WebView 툴체인이 필요합니다.

---

## 무엇이 들어있나

- **전처리 엔진** (`src/renderer/preprocessors/`) — 제품의 해자.
  - `slack.ts` · 단일 별표 → `**bold**`, `<URL|label>` → 표준 링크, 물결 → 취소선
  - `telegram.ts` · MarkdownV2 이스케이프 복원(`\*`, `\_`, `\.` 등), 이중 언더스코어 → 볼드
  - `discord.ts` · `||스포일러||`, `-# subtext`, 이스케이프 정리
  - `common.ts` · 코드펜스·인라인 코드 보호 유틸, 파이프 테이블 구분선 자동 삽입
  - `detect.ts` · 점수 기반 플랫폼 자동 감지 (수동 오버라이드 가능)
- **렌더러 코어** (`src/renderer/renderer-core/`)
  - `markdown.ts` · markdown-it(GFM) + highlight.js
  - `exporter.ts` · PNG(html2canvas), PDF(브라우저 print), .md 다운로드
- **UI** (`src/renderer/components/`)
  - Light/Dark/Sepia 테마, 폰트 스케일 80~160%
  - 좌측 원본 · 우측 렌더 2분할, 상태바에 감지 점수 노출
  - 히스토리 50개(localStorage) + 설정 패널 + 단축키 (Cmd/Ctrl+Enter 등)
- **테스트** (`tests/preprocessors/`) — 4 파일 / 21 케이스

---

## 단축키 (웹 MVP 기준)

| 단축키 | 동작 |
| --- | --- |
| `Cmd/Ctrl` + `Enter` | 클립보드에서 불러와 렌더 |
| `Cmd/Ctrl` + `P` | PDF 내보내기 |
| `Cmd/Ctrl` + `Shift` + `P` | PNG 내보내기 |
| `Cmd/Ctrl` + `S` | 전처리된 Markdown 파일로 저장 |
| `Cmd/Ctrl` + `H` | 히스토리 패널 토글 |
| `Cmd/Ctrl` + `,` | 설정 패널 토글 |
| `Cmd/Ctrl` + `1~4` | 플랫폼 수동 지정(Telegram/Slack/Discord/Raw) |
| `Esc` | 열린 패널 닫기 |

데스크탑 래퍼(다음 단계)에서는 **전역** `Cmd/Ctrl+Shift+V` 로 창에 포커스가 없어도 호출 가능하게 확장됩니다.

---

## 아키텍처 메모

```
markdown-preview-companion/
├── package.json
├── tsconfig.json · tsconfig.node.json
├── vite.config.ts · vitest.config.ts
├── tailwind.config.js · postcss.config.js
├── index.html · README.md
├── public/
│   └── vite.svg
├── src-tauri/                    # Rust 백엔드 (Tauri 2 스캐폴드)
│   ├── Cargo.toml · build.rs · tauri.conf.json
│   ├── capabilities/default.json
│   └── src/
│       ├── main.rs               # 앱 진입점 + 윈도우 라이프사이클
│       ├── clipboard.rs          # read/write_clipboard_text IPC
│       ├── shortcut.rs           # Cmd/Ctrl+Shift+V 전역 단축키
│       └── tray.rs               # 트레이 아이콘 + 컨텍스트 메뉴
└── src/                          # React 프론트엔드
    ├── main.tsx · App.tsx
    ├── types.ts                  # Platform, Settings, HistoryEntry 공용 타입
    ├── tauri-bridge.ts           # Tauri IPC 어댑터 (웹 폴백 내장)
    ├── components/               # Toolbar, HistoryPanel, SettingsPanel, EmptyState
    ├── preprocessors/            # 순수 함수 (raw: string) => string
    │   ├── common.ts             #   코드펜스/인라인 보호, 공통 후처리
    │   ├── slack.ts telegram.ts discord.ts raw.ts
    │   ├── detect.ts             #   점수 기반 자동 감지
    │   └── index.ts              #   preprocessFor / preprocessAuto 파사드
    ├── renderer-core/
    │   ├── markdown.ts           # markdown-it + highlight.js
    │   └── exporter.ts           # PNG / PDF / .md 내보내기
    ├── store/
    │   └── history.ts · settings.ts
    └── styles/                   # global + markdown + highlight.css
tests/preprocessors/              # vitest 스냅샷 테스트 (21 케이스)
```

설계 원칙 (기획안 §11.3 반영):
- 전처리기는 React 비의존 순수 TS 함수 — 테스트와 재사용이 쉽도록.
- 실패 시 **원본 텍스트 그대로 렌더** — 빈 화면을 띄우지 않음.
- 코드블록/인라인 코드 내부는 모든 전처리에서 건드리지 않음.

---

## 다음 마일스톤 (기획안 §7 대응)

- **M2 확장**: 전처리 엔진 스냅샷을 실제 메신저 복사 샘플로 20개 이상 확보
- **M3 (스캐폴드 완료)**: `src-tauri/` Rust 백엔드 — 트레이, 전역 단축키, 클립보드 IPC
  - `tauri-bridge.ts`가 `window.__TAURI__` 존재 여부로 웹/데스크탑을 자동 분기
  - 실제 실행은 Node 18+ · Rust 1.77+ 환경에서 `npm run tauri:dev`
- **M5**: KaTeX · Mermaid · SQLite 히스토리 전환

---

## 라이선스

내부 프로젝트. 외부 공개 시 라이선스 결정 필요.
