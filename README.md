# mastra_hackathon_0414

Mastraを使用したワークフローとエージェントの実装プロジェクトです。

## 機能

### Typeformフォーム作成自動化

問診票PDFからTypeformフォームを自動生成する機能を提供します。

**詳細な利用手順**: [docs/TYPEFORM_USAGE.md](docs/TYPEFORM_USAGE.md)

**クイックスタート**:

```bash
# 環境変数を設定
cp .env.example .env
# .envファイルを編集して必要なAPIキーを設定

# 実行例スクリプトを実行
npx tsx src/mastra/examples/create-typeform-from-pdf.ts path/to/questionnaire.pdf

# または、src/mastra/examples/ ディレクトリ内のPDFを自動検出
npx tsx src/mastra/examples/create-typeform-from-pdf.ts
```

### その他のワークフロー

- `weather-workflow`: 天気予報に基づいたアクティビティ提案
- `cleanup-consent-template`: 同意書テンプレートの整形
- `create-consent-template`: PDFから同意書テンプレートを作成

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
```bash
cp .env.example .env
# .envファイルを編集
```

3. 開発サーバーの起動:
```bash
npm run dev
```

## 環境変数

- `GOOGLE_API_KEY`: Google Gemini APIキー（必須）
- `TYPEFORM_CUSTOM_TOKEN`: Typeform APIトークン（Typeform機能を使用する場合）
- `TYPEFORM_API_URL`: Typeform API URL（オプション、デフォルト: https://api.typeform.com）
- `OPENAI_API_KEY`: OpenAI APIキー（OpenRouter経由でClaudeを使用する場合）

## ドキュメント

- [Typeformフォーム作成機能の利用手順](docs/TYPEFORM_USAGE.md)