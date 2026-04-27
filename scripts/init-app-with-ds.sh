#!/usr/bin/env bash
# 908 Doha Design System — submodule-based starter bootstrap.
#
# Creates a new Vite + React + Tailwind project that consumes this
# design system as a Git submodule (no build step, no npm publish).
#
# Usage:
#   scripts/init-app-with-ds.sh <target-dir> [design-system-url]
#
# Examples:
#   scripts/init-app-with-ds.sh ../my-app
#   scripts/init-app-with-ds.sh ../my-app https://github.com/me/908-doha-workspace.git
#
# After it finishes:
#   cd <target-dir> && npm install && npm run dev

set -euo pipefail

TARGET="${1:-}"
DS_URL="${2:-https://github.com/openclaw4286-code/908-doha-workspace.git}"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <target-dir> [design-system-url]" >&2
  exit 1
fi

# Resolve to absolute path without requiring it to exist.
case "$TARGET" in
  /*) TARGET_ABS="$TARGET" ;;
  *)  TARGET_ABS="$(pwd)/$TARGET" ;;
esac

if [ -e "$TARGET_ABS" ] && [ -n "$(ls -A "$TARGET_ABS" 2>/dev/null)" ]; then
  echo "Error: $TARGET_ABS already exists and is not empty." >&2
  exit 1
fi

APP_NAME="$(basename "$TARGET_ABS")"

echo "→ Creating $TARGET_ABS"
mkdir -p "$TARGET_ABS"
cd "$TARGET_ABS"

echo "→ git init"
git init -q -b main

echo "→ Adding design-system submodule from $DS_URL"
git submodule add "$DS_URL" design-system >/dev/null

echo "→ Writing project files"

# ---- package.json --------------------------------------------------
cat > package.json <<EOF
{
  "name": "$APP_NAME",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^5.4.11"
  }
}
EOF

# ---- vite.config.js -------------------------------------------------
cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Aliases:
//   @ds       -> components & lib in design-system/app/src
//   @ds-css   -> raw CSS at the design-system root (tokens, dist bundles)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ds':      path.resolve(root, 'design-system/app/src'),
      '@ds-css':  path.resolve(root, 'design-system'),
    },
  },
});
EOF

# ---- tailwind.config.js ---------------------------------------------
cat > tailwind.config.js <<'EOF'
import preset from './design-system/tailwind.preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    // Scan design-system component sources so their Tailwind classes
    // make it into the final CSS bundle.
    './design-system/app/src/**/*.{js,jsx}',
  ],
};
EOF

# ---- postcss.config.js ----------------------------------------------
cat > postcss.config.js <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# ---- index.html -----------------------------------------------------
cat > index.html <<EOF
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>$APP_NAME</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ---- src/main.jsx ---------------------------------------------------
mkdir -p src
cat > src/main.jsx <<'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Tailwind base + design-system tokens. Order matters — tokens last so
// CSS variables are defined when component styles run.
import './index.css';
import '@ds-css/colors_and_type.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
EOF

# ---- src/index.css --------------------------------------------------
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body {
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-sans, system-ui, sans-serif);
}
EOF

# ---- src/App.jsx ----------------------------------------------------
cat > src/App.jsx <<'EOF'
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

// Components imported straight from the design-system submodule.
// These are pure presentational pieces (only depend on lucide-react).
import Button from '@ds/components/Button.jsx';
import IconButton from '@ds/components/IconButton.jsx';
import Modal from '@ds/components/Modal.jsx';
import FormField from '@ds/components/FormField.jsx';
import FormInput from '@ds/components/FormInput.jsx';

export default function App() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="t-heading1">Hello, 908 Doha</h1>
        <IconButton icon={Search} variant="clear" ariaLabel="검색" />
      </header>

      <p className="t-body1" style={{ color: 'var(--text-secondary)' }}>
        디자인 시스템을 submodule로 사용하는 스타터입니다. 토큰은
        <code> --accent-brand </code>처럼 CSS 변수로, 컴포넌트는
        <code> @ds/components/* </code>로 가져옵니다.
      </p>

      <div className="flex gap-2">
        <Button variant="primary" size="md" icon={Plus} onClick={() => setOpen(true)}>
          모달 열기
        </Button>
        <Button variant="secondary" size="md">취소</Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="안녕하세요"
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-md px-3.5 t-label"
              style={{ color: 'var(--text-secondary)' }}
            >
              닫기
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-md px-3.5 t-label"
              style={{ background: 'var(--accent-brand)', color: '#fff' }}
            >
              저장
            </button>
          </>
        }
      >
        <FormField label="이름">
          <FormInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </FormField>
      </Modal>
    </div>
  );
}
EOF

# ---- .gitignore -----------------------------------------------------
cat > .gitignore <<'EOF'
node_modules
dist
.DS_Store
*.log
.env
.env.local
EOF

# ---- README.md ------------------------------------------------------
cat > README.md <<EOF
# $APP_NAME

908 Doha Design System을 git submodule로 사용하는 스타터.

## 시작

\`\`\`bash
npm install
npm run dev
\`\`\`

## 디자인 시스템 업데이트

\`\`\`bash
git -C design-system pull origin main
git add design-system
git commit -m "chore: bump design-system"
\`\`\`

## 새 사람이 클론할 때

\`\`\`bash
git clone --recurse-submodules <repo-url>
# 이미 클론했다면
git submodule update --init --recursive
\`\`\`

## 컴포넌트 사용

- 토큰은 CSS 변수로: \`var(--accent-brand)\`, \`var(--text-primary)\`
- 컴포넌트는 \`@ds/components/Button.jsx\` 식으로 import
- Tailwind 유틸리티는 design-system preset에 정의된 클래스를 그대로 사용
EOF

echo "→ Initial commit"
git add -A
git commit -q -m "Initialize $APP_NAME with 908 Doha design-system submodule"

cat <<EOF

✓ Done. Project ready at:
    $TARGET_ABS

Next:
    cd $TARGET_ABS
    npm install
    npm run dev

EOF
