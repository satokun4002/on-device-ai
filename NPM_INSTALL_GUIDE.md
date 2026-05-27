# npm install が遅い場合の対処法

## ⚡ 高速化ステップ

### ステップ 1: 実行中の npm install を停止
```bash
# Ctrl+C を押して停止
```

### ステップ 2: キャッシュをクリア（推奨）
```bash
npm cache clean --force
```

### ステップ 3: package-lock.json を確認
```bash
# 以下のファイルが存在することを確認
ls -la package-lock.json
```

### ステップ 4: npm ci で高速インストール
```bash
# npm install の代わりに npm ci を使用
npm ci
```

**`npm ci` の利点:**
- `package-lock.json` を使用して正確なバージョンをインストール
- 通常の `npm install` より 30-50% 高速
- より確実で予測可能
- CI/CD 環境でも推奨

## 📊 進捗確認

インストール中に以下のように表示されます：
```
added 127 packages in 45s
```

## 🐌 もし npm ci でも遅い場合

### オプション A: yarn を使用（代替方法）
```bash
# yarn のインストール
npm install -g yarn

# キャッシュクリア
yarn cache clean

# 高速インストール
yarn install
```

### オプション B: npm 自体をアップデート
```bash
npm install -g npm@latest
npm ci
```

### オプション C: プロキシ設定（会社のネットワークの場合）
```bash
npm config set registry https://registry.npmjs.org/
npm config set proxy http://proxy:port
npm config set https-proxy http://proxy:port
npm ci
```

## ✅ インストール完了確認

インストール後、以下を実行：
```bash
# 依存関係のバージョン確認
npm ls | head -20

# TypeScript がインストールされているか確認
npm list typescript

# node_modules フォルダサイズ確認
du -sh node_modules
```

## 🎯 その後のコマンド

```bash
# TypeScript をコンパイル
npm run build

# テスト実行
npm test

# 実行
npm start
```

## 💡 Tips

- **ネットワークが遅い場合**: 深夜や朝早い時間帯の実行を試してください
- **SSD が遅い場合**: ファイアウォールやアンチウイルスが干渉していないか確認
- **完全なリセット**: `rm -rf node_modules && npm ci` でクリーンインストール
