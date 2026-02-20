# Typeformフォーム作成自動化機能 利用手順

このドキュメントでは、Mastraを使用して問診票PDFからTypeformフォームを自動生成する機能の使い方を説明します。

## 目次

1. [前提条件](#前提条件)
2. [環境変数の設定](#環境変数の設定)
3. [基本的な使い方](#基本的な使い方)
4. [コード例](#コード例)
5. [PDFのBase64エンコード方法](#pdfのbase64エンコード方法)
6. [実行結果](#実行結果)
7. [エラーハンドリング](#エラーハンドリング)

## 前提条件

- Node.jsがインストールされていること
- TypeformアカウントとAPIトークンを持っていること
- Google API Key（Gemini使用のため）が設定されていること

## 環境変数の設定

`.env`ファイルに以下の環境変数を設定してください：

```env
# Google Gemini API（必須）
GOOGLE_API_KEY=your_google_api_key

# Typeform API（必須）
TYPEFORM_CUSTOM_TOKEN=your_typeform_token

# Typeform API URL（オプション、デフォルト: https://api.typeform.com）
TYPEFORM_API_URL=https://api.typeform.com
```

### Typeform APIトークンの取得方法

1. [Typeform](https://www.typeform.com/)にログイン
2. アカウント設定 > API > Personal tokens に移動
3. 「Generate new token」をクリック
4. 生成されたトークンをコピーして`.env`に設定

## 基本的な使い方

### 1. Mastraインスタンスのインポート

```typescript
import { mastra } from "./src/mastra";
```

### 2. PDFをBase64に変換

問診票PDFファイルをBase64エンコードされた文字列に変換します（方法は後述）。

### 3. Workflowの実行

`create-typeform-form-from-pdf`ワークフローを実行します。

```typescript
const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
  pdfBase64Data: "...", // PDFのBase64文字列
});
```

## コード例

### 基本的な使用例

```typescript
import { mastra } from "./src/mastra";
import { readFileSync } from "fs";

async function createTypeformFromPdf() {
  try {
    // PDFファイルを読み込んでBase64に変換
    const pdfBuffer = readFileSync("./path/to/questionnaire.pdf");
    const pdfBase64 = pdfBuffer.toString("base64");

    // Workflowを実行
    const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
      pdfBase64Data: pdfBase64,
    });

    // 結果を表示
    console.log("フォーム作成成功！");
    console.log("フォームID:", result.summary.formId);
    console.log("フォームURL:", result.summary.formUrl);
    console.log("タイトル:", result.summary.title);
    console.log("質問数:", result.summary.questionCount);
  } catch (error) {
    console.error("エラー:", error);
  }
}

createTypeformFromPdf();
```

### カスタムタイトルと説明を指定する例

```typescript
const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
  pdfBase64Data: pdfBase64,
  formTitle: "2024年度 健康診断問診票", // カスタムタイトル
  formDescription: "健康診断のための問診票です。", // カスタム説明
});
```

### 病院メタデータを含める例（将来の拡張用）

```typescript
const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
  pdfBase64Data: pdfBase64,
  formTitle: "問診票",
  hospitalMeta: {
    name: "○○病院",
    code: "HOSPITAL001",
  },
});
```

## PDFファイルの配置場所

**PDFファイルは任意の場所に配置できます。** 実行時にファイルパスを指定してください。

### 推奨配置場所

- `examples/` ディレクトリ: 実行例スクリプトのデフォルトパス
- プロジェクトルート: 簡単にアクセスできる場所
- 任意の場所: 絶対パスまたは相対パスで指定可能

### 実行例スクリプトを使用する場合

実行例スクリプト（`examples/create-typeform-from-pdf.ts`）を使用する場合：

**パスを指定しない場合（デフォルト）:**
```bash
npx tsx src/mastra/examples/create-typeform-from-pdf.ts
# → src/mastra/examples/ ディレクトリ内のPDFファイルを自動検出します
```

**パスを指定する場合:**
```bash
# 相対パス
npx tsx src/mastra/examples/create-typeform-from-pdf.ts ./questionnaire.pdf
npx tsx src/mastra/examples/create-typeform-from-pdf.ts src/mastra/examples/受診にあたってのご質問-患者支援センター・入院用-.pdf

# 絶対パス
npx tsx src/mastra/examples/create-typeform-from-pdf.ts /Users/username/Documents/questionnaire.pdf
```

## PDFのBase64エンコード方法

### Node.jsでの方法

```typescript
import { readFileSync } from "fs";

// 任意のパスを指定可能
const pdfBuffer = readFileSync("./questionnaire.pdf");
// または
const pdfBuffer = readFileSync("/absolute/path/to/questionnaire.pdf");
// または
const pdfBuffer = readFileSync("../documents/questionnaire.pdf");

const pdfBase64 = pdfBuffer.toString("base64");
```

### ブラウザでの方法

```typescript
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]; // data:application/pdf;base64, の部分を除去
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 使用例
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const base64 = await fileToBase64(file);
  // base64を使用
}
```

### コマンドラインでの方法（macOS/Linux）

```bash
base64 -i questionnaire.pdf | tr -d '\n' > pdf_base64.txt
```

## 実行結果

Workflowの実行結果は以下の形式で返されます：

```typescript
{
  summary: {
    formId: "abc123def456",           // TypeformフォームID
    formUrl: "https://form.typeform.com/to/abc123def456", // フォームの公開URL
    title: "問診票",                   // フォームタイトル
    questionCount: 15                  // 抽出された質問数
  }
}
```

### 各ステップの結果にアクセスする

Workflowの各ステップの結果にもアクセスできます：

```typescript
const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
  pdfBase64Data: pdfBase64,
});

// 抽出された質問JSON
const questionsJson = result["extract-questions-from-pdf"]?.questionsJson;

// バリデーション済みのフォームデータ
const fixedFormData = result["validate-and-fix-json"]?.fixedFormData;

// 作成されたフォーム情報
const formInfo = result["create-typeform-form"];
```

## エラーハンドリング

### よくあるエラーと対処法

#### 1. 環境変数が設定されていない

```
Error: TYPEFORM_CUSTOM_TOKEN環境変数が設定されていません
```

**対処法**: `.env`ファイルに`TYPEFORM_CUSTOM_TOKEN`を設定してください。

#### 2. PDFが読み取れない

```
Error: Agentからの応答が空です
```

**対処法**: 
- PDFが正しくBase64エンコードされているか確認
- PDFが破損していないか確認
- PDFがテキストベース（OCR可能）か確認

#### 3. Typeform APIエラー

```
Error: Typeform APIエラー: 401 Unauthorized
```

**対処法**: 
- APIトークンが正しいか確認
- トークンの有効期限を確認

#### 4. 質問が抽出できない

```
Error: 致命的なバリデーションエラー: questionsは配列である必要があります
```

**対処法**: 
- PDFの内容が問診票として認識できる形式か確認
- PDFの品質を向上させる（スキャン品質、解像度など）

### エラーハンドリングの例

```typescript
try {
  const result = await mastra.runWorkflow("create-typeform-form-from-pdf", {
    pdfBase64Data: pdfBase64,
  });
  console.log("成功:", result.summary);
} catch (error) {
  if (error instanceof Error) {
    console.error("エラーメッセージ:", error.message);
    
    // 特定のエラータイプに応じた処理
    if (error.message.includes("TYPEFORM_CUSTOM_TOKEN")) {
      console.error("環境変数を確認してください");
    } else if (error.message.includes("PDF")) {
      console.error("PDFファイルを確認してください");
    }
  } else {
    console.error("予期しないエラー:", error);
  }
}
```

## ワークフローの処理フロー

1. **PDFから質問抽出** (`extract-questions-from-pdf`)
   - Gemini AIを使用してPDFの内容を解析
   - 問診票の質問項目を抽出
   - Typeform互換のJSON形式に変換

2. **JSONバリデーション・修正** (`validate-and-fix-json`)
   - 抽出されたJSONの構造を検証
   - Typeform仕様に合わせて自動修正
   - エラーがあれば報告

3. **Typeformフォーム作成** (`create-typeform-form`)
   - Typeform Create APIを呼び出し
   - フォームを作成
   - フォームIDとURLを取得

4. **結果サマリ返却** (`return-summary`)
   - 作成されたフォームの情報をまとめて返却

## サポートされている質問タイプ

抽出された質問は以下のTypeformタイプにマッピングされます：

- `short_text`: 短いテキスト入力（氏名、電話番号など）
- `long_text`: 長いテキスト入力（主訴、症状の詳細など）
- `multiple_choice`: 複数選択肢から1つ選ぶ
- `dropdown`: ドロップダウン選択
- `yes_no`: はい/いいえの選択
- `date`: 日付入力
- `number`: 数値入力
- `email`: メールアドレス入力
- `phone_number`: 電話番号入力

## トラブルシューティング

### PDFが正しく処理されない場合

1. PDFが画像ベース（スキャン）の場合は、OCRの精度が低い可能性があります
2. PDFのテキストが抽出可能か確認してください
3. PDFのサイズが大きすぎる場合は、分割することを検討してください

### 質問が正しく抽出されない場合

1. PDFの構造が明確か確認してください
2. 質問文が明確に記載されているか確認してください
3. 選択肢が正しく認識されているか確認してください

### Typeform APIの制限

- APIレート制限に注意してください
- 無料プランでは制限がある場合があります
- エラーが発生した場合は、しばらく待ってから再試行してください

## 関連ファイル

- Workflow実装: `src/mastra/workflows/typeform/createFormFromPdf.ts`
- Agent実装: `src/mastra/agents/typeform/questionExtractionAgent.ts`
- Tool実装: `src/mastra/tools/typeform/createForm.ts`
- Validator実装: `src/mastra/utils/typeform/questionValidator.ts`
- 実行例スクリプト: `src/mastra/examples/create-typeform-from-pdf.ts`
- サンプルPDF: `src/mastra/examples/` ディレクトリ内

## ディレクトリ構造

```
src/mastra/
├── agents/              # Mastra Agent実装
│   ├── typeform/       # Typeform関連Agent
│   ├── medios/         # MediOS関連Agent
│   └── sample/         # サンプルAgent
├── tools/              # Mastra Tool実装
│   ├── typeform/      # Typeform関連Tool
│   ├── medios/        # MediOS関連Tool
│   └── sample/        # サンプルTool
├── workflows/          # Mastra Workflow実装
│   ├── typeform/      # Typeform関連Workflow
│   ├── medios/        # MediOS関連Workflow
│   └── sample/        # サンプルWorkflow
├── utils/              # ユーティリティ関数
│   └── typeform/      # Typeform関連ユーティリティ
├── examples/           # 実行例とサンプルPDF
│   ├── create-typeform-from-pdf.ts  # 実行例スクリプト
│   └── *.pdf          # サンプルPDFファイル
├── models/             # AIモデル設定
├── plugins/            # プラグイン設定
├── repositpry/         # リポジトリ層（外部API連携）
└── index.ts            # Mastraエントリポイント
```
