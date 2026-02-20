# クイックスタートガイド

このガイドでは、Typeformフォーム作成機能を最短で試す方法を説明します。

## 1. 環境変数の設定

`.env`ファイルに以下を設定してください：

```env
GOOGLE_API_KEY=your_google_api_key
TYPEFORM_CUSTOM_TOKEN=your_typeform_token
```

## 2. PDFファイルの準備

問診票のPDFファイルを用意してください。**PDFファイルは任意の場所に配置できます。**

推奨配置場所：
- `src/mastra/examples/` ディレクトリ（実行例スクリプトと同じ場所、デフォルトで自動検出）
- プロジェクトルート直下
- 任意の場所（パスを指定して使用）

## 3. 実行

### 方法1: 実行例スクリプトを使用（推奨）

```bash
# PDFファイルのパスを指定
npx tsx src/mastra/examples/create-typeform-from-pdf.ts path/to/your/questionnaire.pdf

# 例:
npx tsx src/mastra/examples/create-typeform-from-pdf.ts ./questionnaire.pdf
npx tsx src/mastra/examples/create-typeform-from-pdf.ts src/mastra/examples/受診にあたってのご質問-患者支援センター・入院用-.pdf
npx tsx src/mastra/examples/create-typeform-from-pdf.ts /Users/username/Documents/questionnaire.pdf

# パスを指定しない場合、デフォルトで src/mastra/examples/ ディレクトリ内のPDFファイルを自動検出します
npx tsx src/mastra/examples/create-typeform-from-pdf.ts
```

### 方法2: コードから直接実行

```typescript
import { mastra } from "./src/mastra";
import { readFileSync } from "fs";

const pdfBuffer = readFileSync("./questionnaire.pdf");
const pdfBase64 = pdfBuffer.toString("base64");

const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
  pdfBase64Data: pdfBase64,
});

console.log("フォームURL:", result.summary.formUrl);
```

## 4. 結果の確認

実行が成功すると、以下の情報が表示されます：

```
✅ フォーム作成成功！

📊 実行結果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
フォームID:     abc123def456
フォームURL:    https://form.typeform.com/to/abc123def456
タイトル:       問診票
質問数:         15
実行時間:       3500ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

フォームURLをブラウザで開いて、作成されたフォームを確認できます。

## トラブルシューティング

### エラー: TYPEFORM_CUSTOM_TOKEN環境変数が設定されていません

→ `.env`ファイルに`TYPEFORM_CUSTOM_TOKEN`を設定してください。

### エラー: PDFファイルの読み込みに失敗しました

→ PDFファイルのパスが正しいか確認してください。

### エラー: Agentからの応答が空です

→ PDFの内容が正しく読み取れていない可能性があります。PDFの品質を確認してください。

詳細は [TYPEFORM_USAGE.md](TYPEFORM_USAGE.md) を参照してください。
