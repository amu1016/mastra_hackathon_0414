/**
 * Typeformフォーム作成の実行例
 * 
 * 使用方法:
 * 1. .envファイルに必要な環境変数を設定
 * 2. PDFファイルのパスを指定（デフォルト: このディレクトリ内のPDF）
 * 3. tsx src/mastra/examples/create-typeform-from-pdf.ts を実行
 */

// 環境変数を読み込む
import "dotenv/config";

import { mastra } from "../index.js";
import { createTypeformFormFromPdfWorkflow } from "../workflows/typeform/createFormFromPdf.js";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    // PDFファイルのパスを指定（デフォルト: このディレクトリ内の最初のPDFファイル）
    let pdfPath = process.argv[2];
    if (!pdfPath) {
      // デフォルトでこのディレクトリ内のPDFファイルを探す
      const files = readdirSync(__dirname);
      const pdfFile = files.find((f: string) => f.endsWith(".pdf"));
      if (pdfFile) {
        pdfPath = join(__dirname, pdfFile);
      } else {
        pdfPath = join(__dirname, "sample-questionnaire.pdf");
      }
    }

    console.log("📄 PDFファイルを読み込んでいます...");
    console.log(`   パス: ${pdfPath}`);

    // PDFファイルを読み込んでBase64に変換
    let pdfBase64: string;
    try {
      const pdfBuffer = readFileSync(pdfPath);
      pdfBase64 = pdfBuffer.toString("base64");
      console.log(`✅ PDF読み込み成功 (サイズ: ${pdfBuffer.length} bytes)`);
    } catch (error) {
      console.error("❌ PDFファイルの読み込みに失敗しました");
      console.error("   指定されたパスにファイルが存在するか確認してください");
      console.error(`   エラー: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // オプション: カスタムタイトルと説明を指定
    const formTitle = process.env.FORM_TITLE; // 環境変数から取得可能
    const formDescription = process.env.FORM_DESCRIPTION; // 環境変数から取得可能

    console.log("\n🤖 Mastra Workflowを実行しています...");
    console.log("   ワークフロー: create-typeform-form-from-pdf");

    // Workflowを実行
    const startTime = Date.now();
    const run = await createTypeformFormFromPdfWorkflow.createRun();
    const result = await run.start({
      triggerData: {
        pdfBase64Data: pdfBase64,
        ...(formTitle && { formTitle }),
        ...(formDescription && { formDescription }),
      },
    });
    const endTime = Date.now();

    // 結果を取得（MastraのWorkflowRunResultは results[stepId].output の形）
    const resultAny = result as any;
    
    // エラーチェック: 失敗したステップがあるか確認
    if (resultAny.results) {
      const failedSteps: Array<{ stepId: string; error: string }> = [];
      Object.keys(resultAny.results).forEach((key) => {
        const stepResult = resultAny.results[key];
        if (stepResult?.status === "failed") {
          const errorMessage = stepResult.error || stepResult.message || "不明なエラー";
          failedSteps.push({
            stepId: key,
            error: errorMessage,
          });
        }
      });
      
      if (failedSteps.length > 0) {
        console.error("\n❌ Workflowのステップでエラーが発生しました:");
        failedSteps.forEach(({ stepId, error }) => {
          console.error(`   ステップ "${stepId}": ${error}`);
        });
        // 最初のエラーを詳細に表示
        const firstError = failedSteps[0];
        throw new Error(
          `Workflow実行中にエラーが発生しました。ステップ "${firstError.stepId}": ${firstError.error}`
        );
      }
    }
    
    // デバッグ: resultsの構造を確認
    if (process.env.DEBUG || !resultAny.results?.["return-summary"]) {
      console.log("📋 デバッグ情報:");
      console.log("   results keys:", resultAny.results ? Object.keys(resultAny.results) : "none");
      if (resultAny.results) {
        Object.keys(resultAny.results).forEach((key) => {
          const stepResult = resultAny.results[key];
          console.log(`   ${key}:`, {
            status: stepResult?.status,
            hasOutput: !!stepResult?.output,
            outputKeys: stepResult?.output ? Object.keys(stepResult.output) : [],
            error: stepResult?.error,
          });
        });
      }
    }
    
    const returnSummaryStep = resultAny.results?.["return-summary"];
    let summary: { formId: string; formUrl: string; title: string; questionCount: number } | undefined =
      returnSummaryStep?.status === "success"
        ? returnSummaryStep.output?.summary
        : undefined;
    
    if (!summary) {
      // フォールバック: 他のステップから直接取得を試みる
      const createFormStep = resultAny.results?.["create-typeform-form"];
      if (createFormStep?.status === "success" && createFormStep.output) {
        // create-typeform-formステップの結果から直接取得
        summary = {
          formId: createFormStep.output.formId,
          formUrl: createFormStep.output.formUrl,
          title: createFormStep.output.title,
          questionCount: 0, // 後で取得
        };
        
        // 質問数を取得
        const validateStep = resultAny.results?.["validate-and-fix-json"];
        if (validateStep?.status === "success" && validateStep.output?.fixedFormData) {
          const questions = (validateStep.output.fixedFormData as any)?.questions;
          if (Array.isArray(questions)) {
            summary.questionCount = questions.length;
          }
        }
      } else {
        // 最後のフォールバック
        const fallback =
          resultAny.result?.summary ?? resultAny.outputs?.summary ?? resultAny.summary;
        if (!fallback) {
          throw new Error(
            "Workflowの実行結果が取得できませんでした。result構造: " +
              JSON.stringify(Object.keys(resultAny)) +
              ", results keys: " +
              (resultAny.results ? JSON.stringify(Object.keys(resultAny.results)) : "none")
          );
        }
        summary = fallback;
      }
    }
    if (!summary) {
      throw new Error("Workflowの実行結果が取得できませんでした");
    }

    // 結果を表示
    console.log("\n✅ フォーム作成成功！");
    console.log("\n📊 実行結果:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`フォームID:     ${summary.formId}`);
    console.log(`フォームURL:    ${summary.formUrl}`);
    console.log(`タイトル:       ${summary.title}`);
    console.log(`質問数:         ${summary.questionCount}`);
    console.log(`実行時間:       ${endTime - startTime}ms`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 抽出された質問の詳細を表示（オプション）
    const extractStep = resultAny.results?.["extract-questions-from-pdf"];
    const questionsOutput =
      extractStep?.status === "success" ? extractStep.output : undefined;
    const questionsJson = questionsOutput?.questionsJson;
    if (questionsJson && questionsJson.questions) {
      console.log("\n📝 抽出された質問:");
      questionsJson.questions.forEach((q: any, index: number) => {
        console.log(`   ${index + 1}. [${q.type}] ${q.title}${q.required ? " (必須)" : ""}`);
        if (q.properties?.choices) {
          q.properties.choices.forEach((choice: any) => {
            console.log(`      - ${choice.label}`);
          });
        }
      });
    }

    console.log("\n✨ 完了！Typeformでフォームを確認できます:");
    console.log(`   ${summary.formUrl}`);
  } catch (error) {
    console.error("\n❌ エラーが発生しました:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      console.error(`エラータイプ: ${error.constructor.name}`);

      // スタックトレースを表示（開発時のみ）
      if (process.env.DEBUG) {
        console.error("\nスタックトレース:");
        console.error(error.stack);
      }

      // よくあるエラーに対するヒント
      if (error.message.includes("TYPEFORM_CUSTOM_TOKEN")) {
        console.error("\n💡 ヒント: .envファイルにTYPEFORM_CUSTOM_TOKENを設定してください");
      } else if (error.message.includes("GOOGLE_API_KEY")) {
        console.error("\n💡 ヒント: .envファイルにGOOGLE_API_KEYを設定してください");
      } else if (error.message.includes("PDF")) {
        console.error("\n💡 ヒント: PDFファイルが正しく読み込めているか確認してください");
      } else if (error.message.includes("API")) {
        console.error("\n💡 ヒント: Typeform APIのトークンとURLを確認してください");
      }
    } else {
      console.error("予期しないエラー:", error);
    }

    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  }
}

// 実行
main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
