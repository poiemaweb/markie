# Markdown Preview Companion

마크다운 텍스트를 즉시 예쁘게 렌더링해주는 초경량 컴패니언.
현재 저장소는 **웹 MVP(v0.1)** 단계이며, 이후 단계에서 Tauri 또는 Electron 래퍼를 씌워 트레이 상주 + 전역 단축키 앱으로 확장됩니다.

---

## 빠른 시작

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 정적 번들 (dist/)

# 데스크탑 앱 (Node 18+ / Rust 1.77+ 필요)
npm run tauri:dev    # 트레이 상주 + 전역 단축키
npm run tauri:build  # .dmg / .msi / .AppImage 번들
```

> 웹 렌더러는 Node 16 + vite 4 조합으로도 동작하도록 고정. Tauri 래퍼를 실제로 빌드하려면 Node 18+·Rust 1.77+·OS별 WebView 툴체인이 필요합니다.

---

## 무엇이 들어있나

- **렌더러 코어** (`src/renderer-core/`)
  - `markdown.ts` · markdown-it(GFM) + highlight.js
  - `exporter.ts` · PNG(html-to-image), PDF(jsPDF), .md 다운로드
  - `importer.ts` · 텍스트 정규화, 클립보드 및 파일 임포트
- **UI** (`src/components/`)
  - Light/Dark/Sepia 테마, 폰트 스케일 80~160%
  - 좌측 원본 · 우측 렌더 2분할
  - 히스토리 50개(localStorage) + 설정 패널 + 단축키 (Cmd/Ctrl+Enter 등)

---

## 단축키 (웹 MVP 기준)

| 단축키 | 동작 |
| --- | --- |
| `Cmd/Ctrl` + `Enter` | 클립보드에서 불러와 렌더 |
| `Cmd/Ctrl` + `P` | PDF 내보내기 |
| `Cmd/Ctrl` + `Shift` + `P` | PNG 내보내기 |
| `Cmd/Ctrl` + `S` | Markdown 파일로 저장 |
| `Cmd/Ctrl` + `H` | 히스토리 패널 토글 |
| `Cmd/Ctrl` + `,` | 설정 패널 토글 |
| `Esc` | 열린 패널 닫기 |

데스크탑 래퍼(다음 단계)에서는 **전역** `Cmd/Ctrl+Shift+V` 로 창에 포커스가 없어도 호출 가능하게 확장됩니다.

---

## 아키텍처 메모

```
markdown-preview-companion/
├── package.json
├── tsconfig.json · tsconfig.node.json
├── vite.config.ts
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
    ├── types.ts                  # Settings, HistoryEntry 공용 타입
    ├── tauri-bridge.ts           # Tauri IPC 어댑터 (웹 폴백 내장)
    ├── components/               # Toolbar, HistoryPanel, SettingsPanel, EmptyState, DownloadFlyout
    ├── renderer-core/
    │   ├── markdown.ts           # markdown-it + highlight.js
    │   ├── exporter.ts           # PNG / PDF / .md 내보내기
    │   └── importer.ts           # 텍스트 정규화, 클립보드/파일 임포트
    ├── store/
    │   └── history.ts · settings.ts
    └── styles/                   # global + markdown + highlight.css
```

---

## 다음 마일스톤

- **M3 (스캐폴드 완료)**: `src-tauri/` Rust 백엔드 — 트레이, 전역 단축키, 클립보드 IPC
  - `tauri-bridge.ts`가 `window.__TAURI__` 존재 여부로 웹/데스크탑을 자동 분기
  - 실제 실행은 Node 18+ · Rust 1.77+ 환경에서 `npm run tauri:dev`
- **M5**: KaTeX · Mermaid · SQLite 히스토리 전환

---

## 라이선스

내부 프로젝트. 외부 공개 시 라이선스 결정 필요.
