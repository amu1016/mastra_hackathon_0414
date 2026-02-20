/**
 * Typeform質問JSONのバリデーションと自動修正を行うユーティリティ
 * 仕様: docs/typeform-json-validator-fixer-spec.md
 *
 * 重要: 出力の fixedJson は Typeform Create API 形式（fields + properties/validations）であり、
 * その fixedJson の中身のみを API に送信すること。
 *
 * 参照フォーム（千葉大学病院様 入院時問診）に合わせて、ref の推論・補足文・settings を適用する。
 *
 * ルール:
 * - ref: 参照フォームの ref と意味が重複する質問にのみ参照の ref を適用する（タイトルから推論）。それ以外は field_1, field_2, ... とする。
 * - 質問設計: yes_no → 詳細 の形式は抽出エージェント側で推奨しており、バリデータでは並び・type はそのまま保持する。
 */

import {
  inferRefFromTitle,
  getDescriptionForRef,
  REFERENCE_SETTINGS,
} from "./referenceFormPatterns";

/** AI が出力する質問の型（内部形式） */
export interface TypeformQuestion {
  type:
    | "short_text"
    | "long_text"
    | "multiple_choice"
    | "dropdown"
    | "yes_no"
    | "date"
    | "number"
    | "email"
    | "phone_number";
  title: string;
  /** 参照フォームに合わせた ref（任意。未指定時はタイトルから推論） */
  ref?: string;
  required?: boolean;
  properties?: {
    description?: string;
    choices?: Array<{ label: string; ref?: string }>;
    min?: number;
    max?: number;
  };
}

/** バリデータ入力用（AI 出力形式） */
export interface TypeformFormInput {
  title: string;
  description?: string;
  questions: TypeformQuestion[];
}

/** Typeform Create API の field 1件（送信用） */
export interface TypeformApiField {
  type: string;
  title: string;
  ref?: string;
  properties?: {
    choices?: Array<{ label: string; ref?: string }>;
    [key: string]: unknown;
  };
  validations?: {
    required?: boolean;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    [key: string]: unknown;
  };
}

/** Typeform Logic Action（条件分岐） */
export interface TypeformLogicAction {
  action: "jump";
  details: {
    to: {
      type: "field" | "thankyou";
      value: string;
    };
  };
  condition: {
    op: "is" | "is_not" | "equal" | "not_equal";
    vars: Array<{
      type: "field" | "constant";
      value: string | boolean | number;
    }>;
  };
}

/** Typeform Logic（フィールドごとの条件分岐ルール） */
export interface TypeformLogic {
  type: "field";
  ref: string;
  actions: TypeformLogicAction[];
}

/** Typeform Create API に送信するフォーム（fixedJson の型） */
export interface TypeformApiForm {
  title: string;
  fields: TypeformApiField[];
  logic?: TypeformLogic[];
  settings?: {
    is_public?: boolean;
    is_trial?: boolean;
    language?: string;
    [key: string]: unknown;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  /** Typeform API にそのまま送信可能な形式。fixedJson のみを API に送信すること。 */
  fixedJson: TypeformApiForm;
}

/**
 * yes_no質問とその後続質問の関係を分析し、「いいえ」の場合にスキップするロジックを生成する。
 * 
 * ルール（改善版）:
 * - yes_no質問の直後に続く非yes_no質問をすべてスキップ対象とする
 * - 次のyes_no質問が来たらスキップ範囲を終了
 * - これにより、キーワードに依存せず汎用的にロジックジャンプが適用される
 */
function generateYesNoSkipLogic(fields: TypeformApiField[]): TypeformLogic[] {
  const logic: TypeformLogic[] = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field.type !== "yes_no" || !field.ref) continue;

    // yes_no質問の直後から、次のyes_no質問（または終端）までをスキップ対象とする
    let skipCount = 0;
    for (let j = i + 1; j < fields.length; j++) {
      const nextField = fields[j];
      // 次のyes_no質問が来たらスキップ範囲終了
      if (nextField.type === "yes_no") {
        break;
      }
      skipCount++;
    }

    if (skipCount > 0 && i + skipCount + 1 <= fields.length) {
      const jumpToRef =
        i + skipCount + 1 < fields.length
          ? fields[i + skipCount + 1].ref
          : undefined;

      if (jumpToRef) {
        logic.push({
          type: "field",
          ref: field.ref,
          actions: [
            {
              action: "jump",
              details: {
                to: {
                  type: "field",
                  value: jumpToRef,
                },
              },
              condition: {
                op: "is",
                vars: [
                  { type: "field", value: field.ref },
                  { type: "constant", value: false },
                ],
              },
            },
          ],
        });
      }
    }
  }

  return logic;
}

/**
 * Typeform質問JSONをバリデーションし、必要に応じて自動修正する
 */
export function validateAndFixTypeformJson(
  input: unknown
): ValidationResult {
  const errors: string[] = [];
  let formInput: TypeformFormInput;

  // 基本的な構造チェック
  if (!input || typeof input !== "object") {
    return {
      valid: false,
      errors: ["入力がオブジェクトではありません"],
      fixedJson: {
        title: "問診票",
        fields: [],
        settings: { is_public: false, is_trial: false },
      },
    };
  }

  const inputObj = input as Record<string, unknown>;

  // titleのチェックと修正
  if (!inputObj.title || typeof inputObj.title !== "string") {
    errors.push("titleが必須です");
    inputObj.title = "問診票";
  }

  // descriptionのチェック（任意）
  if (inputObj.description && typeof inputObj.description !== "string") {
    errors.push("descriptionは文字列である必要があります");
    delete inputObj.description;
  }

  // questionsのチェック
  if (!Array.isArray(inputObj.questions)) {
    errors.push("questionsは配列である必要があります");
    inputObj.questions = [];
  }

  // 各質問のバリデーションと修正
  const fixedQuestions: TypeformQuestion[] = [];
  const validTypes = [
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "yes_no",
    "date",
    "number",
    "email",
    "phone_number",
  ];

  for (let i = 0; i < (inputObj.questions as unknown[]).length; i++) {
    const question = (inputObj.questions as unknown[])[i];
    if (!question || typeof question !== "object") {
      errors.push(`質問${i + 1}が無効です`);
      continue;
    }

    const q = question as Record<string, unknown>;
    const fixedQuestion: TypeformQuestion = {
      type: "short_text",
      title: "",
      required: false,
    };

    // typeのチェックと修正
    if (!q.type || typeof q.type !== "string") {
      errors.push(`質問${i + 1}: typeが必須です`);
      fixedQuestion.type = "short_text";
    } else if (!validTypes.includes(q.type)) {
      errors.push(`質問${i + 1}: 無効なtype "${q.type}"を"short_text"に修正しました`);
      fixedQuestion.type = "short_text";
    } else {
      fixedQuestion.type = q.type as TypeformQuestion["type"];
    }

    // titleのチェックと修正
    if (!q.title || typeof q.title !== "string") {
      errors.push(`質問${i + 1}: titleが必須です`);
      fixedQuestion.title = `質問${i + 1}`;
    } else {
      fixedQuestion.title = q.title;
    }

    // requiredのチェックと修正
    if (q.required !== undefined) {
      fixedQuestion.required = Boolean(q.required);
    }

    // refの受け取り（AIが指定している場合）
    if (q.ref != null && typeof q.ref === "string" && q.ref.trim()) {
      fixedQuestion.ref = q.ref.trim();
    }

    // properties.description の受け取り
    if (q.properties && typeof q.properties === "object") {
      const props = q.properties as Record<string, unknown>;
      if (props.description != null && typeof props.description === "string") {
        fixedQuestion.properties = fixedQuestion.properties ?? {};
        fixedQuestion.properties.description = props.description.trim();
      }
    }

    // propertiesのチェックと修正
    if (q.properties && typeof q.properties === "object") {
      const props = q.properties as Record<string, unknown>;
      fixedQuestion.properties = {};

      // multiple_choice/dropdownで「あり/なし」系の2択の場合はyes_noに変換
      if (
        (fixedQuestion.type === "multiple_choice" ||
          fixedQuestion.type === "dropdown") &&
        Array.isArray(props.choices) &&
        props.choices.length === 2
      ) {
        // choicesの形式を正規化（オブジェクト形式・文字列形式両方に対応）
        const labels = props.choices
          .map((c) => {
            if (typeof c === "string") {
              return c.trim().toLowerCase();
            }
            if (c && typeof c === "object" && "label" in c) {
              return String((c as { label: unknown }).label).trim().toLowerCase();
            }
            return "";
          })
          .filter((l) => l);

        // 肯定・否定を表すキーワードパターン（部分一致で判定）
        const positiveKeywords = ["あり", "ある", "はい", "有", "する", "します", "できる", "持っている", "いる", "yes"];
        const negativeKeywords = ["なし", "ない", "いいえ", "無", "しない", "しません", "できない", "持っていない", "いない", "no"];

        const hasPositive = labels.some((label) =>
          positiveKeywords.some((kw) => label.includes(kw))
        );
        const hasNegative = labels.some((label) =>
          negativeKeywords.some((kw) => label.includes(kw))
        );

        // 両方のキーワードが含まれている場合、yes_noに変換
        if (hasPositive && hasNegative) {
          errors.push(
            `質問${i + 1}: "${fixedQuestion.type}"の選択肢が「あり/なし」系のため"yes_no"に変換しました`
          );
          fixedQuestion.type = "yes_no";
          delete fixedQuestion.properties;
        }
      }

      // choicesのチェック（multiple_choiceまたはdropdownの場合）
      if (
        (fixedQuestion.type === "multiple_choice" ||
          fixedQuestion.type === "dropdown") &&
        Array.isArray(props.choices)
      ) {
        const fixedChoices: Array<{ label: string }> = [];
        const seenLabels = new Set<string>();

        for (const choice of props.choices) {
          if (choice && typeof choice === "object") {
            const choiceObj = choice as Record<string, unknown>;
            if (choiceObj.label && typeof choiceObj.label === "string") {
              const label = choiceObj.label.trim();
              if (label && !seenLabels.has(label)) {
                fixedChoices.push({ label });
                seenLabels.add(label);
              }
            }
          }
        }

        if (fixedChoices.length > 0) {
          fixedQuestion.properties = fixedQuestion.properties ?? {};
          fixedQuestion.properties.choices = fixedChoices;
        } else {
          errors.push(
            `質問${i + 1}: ${fixedQuestion.type}タイプには有効なchoicesが必要です`
          );
        }
      }

      // min/maxのチェック（numberタイプの場合）
      if (fixedQuestion.type === "number") {
        fixedQuestion.properties = fixedQuestion.properties ?? {};
        if (props.min !== undefined && typeof props.min === "number") {
          fixedQuestion.properties.min = props.min;
        }
        if (props.max !== undefined && typeof props.max === "number") {
          fixedQuestion.properties.max = props.max;
        }
      }
    } else if (
      fixedQuestion.type === "multiple_choice" ||
      fixedQuestion.type === "dropdown"
    ) {
      errors.push(
        `質問${i + 1}: ${fixedQuestion.type}タイプにはproperties.choicesが必要です`
      );
    }

    fixedQuestions.push(fixedQuestion);
  }

  formInput = {
    title: inputObj.title as string,
    description: inputObj.description as string | undefined,
    questions: fixedQuestions,
  };

  // 致命的なエラーがあるかチェック
  const hasCriticalErrors =
    !formInput.title || formInput.questions.length === 0;

  // ref ルール: 参照フォームの ref と意味が重複する場合のみ参照の ref を適用し、それ以外は汎用 ref（field_N）とする。ref は一意である必要がある。
  const refCount = new Map<string, number>();
  function resolveRef(q: TypeformQuestion, idx: number): string {
    const inferred = inferRefFromTitle(q.title);
    if (inferred == null) {
      return `field_${idx + 1}`;
    }
    const base = inferred.replace(/_?\d+$/, "");
    const count = refCount.get(base) ?? 0;
    refCount.set(base, count + 1);
    if (count === 0) return inferred;
    return `${base}_${count + 1}`;
  }

  // 仕様: fixedJson は Typeform Create API 形式（fields + properties/validations）
  const fixedJson: TypeformApiForm = {
    title: formInput.title,
    fields: formInput.questions.map((q, idx) => {
      const ref = resolveRef(q, idx);
      const base = ref.replace(/_?\d+$/, "");
      const field: TypeformApiField = {
        type: q.type,
        title: q.title,
        ref,
      };
      const validations: TypeformApiField["validations"] = {};
      if (q.required !== undefined) {
        validations.required = q.required;
      }
      if (q.type === "number" && q.properties) {
        // Typeform API: min_value は 0 以上である必要がある
        if (q.properties.min !== undefined) {
          validations.min_value = Math.max(0, q.properties.min);
        }
        if (q.properties.max !== undefined) {
          let maxVal = q.properties.max;
          if (validations.min_value !== undefined && maxVal < validations.min_value) {
            maxVal = validations.min_value;
          }
          validations.max_value = maxVal;
        }
      }
      if (Object.keys(validations).length > 0) {
        field.validations = validations;
      }
      const properties: TypeformApiField["properties"] = {};
      // 補足文: 入力の description を優先。なければ参照フォームのパターン（_1 の ref で登録されている）から取得
      const descRef = ref.includes("_") ? `${base}_1` : ref;
      const description =
        q.properties?.description ?? getDescriptionForRef(descRef);
      if (description) {
        properties.description = description;
      }
      if (
        (q.type === "multiple_choice" || q.type === "dropdown") &&
        q.properties?.choices?.length
      ) {
        properties.choices = q.properties.choices.map((c) => ({
          label: c.label,
          ...(c.ref != null && { ref: c.ref }),
        }));
      }
      if (Object.keys(properties).length > 0) {
        field.properties = properties;
      }
      return field;
    }),
    settings: {
      ...REFERENCE_SETTINGS,
      is_public: false,
      is_trial: false,
    },
  };

  // yes_no質問の「いいえ」でスキップするロジックを生成
  const generatedLogic = generateYesNoSkipLogic(fixedJson.fields);
  if (generatedLogic.length > 0) {
    fixedJson.logic = generatedLogic;
  }

  return {
    valid: !hasCriticalErrors && errors.length === 0,
    errors,
    fixedJson,
  };
}
