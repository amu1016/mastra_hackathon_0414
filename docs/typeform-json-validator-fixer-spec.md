# Typeform Create Form API JSON バリデータ兼フィクサー仕様

## ⚠️ 重要な注意事項

**バリデータの出力をそのままTypeform APIに送信してはいけません。**

バリデータは `{ "valid": boolean, "errors": [...], "fixedJson": {...} }` という形式で出力しますが、Typeform APIに送信する際は **`fixedJson` の中身のみ**を送信してください。

```javascript
// ❌ 間違い
const result = validator.validateAndFix(inputJson);
await typeformApi.createForm(result); // エラー発生！

// ✅ 正しい
const result = validator.validateAndFix(inputJson);
await typeformApi.createForm(result.fixedJson); // fixedJson のみを送信
```

## 役割

- 入力として渡される「フォーム JSON」（AI が生成したもの）について、
  1. Typeform Create API の仕様に照らして**構造・型・値を検証**する
  2. 可能な限り**自動で修正した JSON** を生成する
  3. 修正内容を短くテキストで説明する

## ref と質問設計のルール

- **ref**: 参照フォーム（他病院問診票）の ref と**意味が重複する質問にのみ**参照の ref を適用する。それ以外は指定なし（バリデータでは `field_1`, `field_2`, ... などの汎用 ref を付与する）。
- **質問設計の推奨**: 有無を聞く項目は **yes_no → 詳細** の形式とする。まず「〇〇はありますか？」(yes_no)、その直後に「はい」の場合に聞く詳細質問を並べる。抽出エージェントがこの順で出力し、バリデータは並び・type を保持する。

## 前提仕様（重要な部分のみ）

### 1. ルートオブジェクト

主なキー:

- `title`: string（必須）
- `type`: string（例: `"quiz"`。未指定時は `"quiz"` 扱いでよい）
- `fields`: array of object
- `settings`: object
- `welcome_screens`: array of object
- `thankyou_screens`: array of object
- `variables`: object
- `logic`: array of object
- `theme`: object `{ "href": string }`
- `workspace`: object `{ "href": string }`
- `hidden`: array of string

### 2. fields 共通ルール

各 field は object で、最低限以下を持つ:

- `title`: string（必須）
- `type`: string（必須）
- `ref`: string（任意だが一意が望ましい）

`type` は次のいずれかのみ許可:  
`calendly`, `contact_info`, `date`, `dropdown`, `email`, `file_upload`, `group`, `legal`, `long_text`, `matrix`, `multi_format`, `multiple_choice`, `nps`, `number`, `opinion_scale`, `payment`, `phone_number`, `picture_choice`, `ranking`, `rating`, `short_text`, `statement`, `website`, `yes_no`

`properties` は object。type ごとの仕様に沿うこと:

- `choices`: choice タイプ用の配列
  - 各要素は `{ "label": string, "ref"?: string, "attachment"?: {...} }`
- `allow_multiple_selection`, `allow_other_choice`, `randomize` などは  
  `multiple_choice`, `picture_choice`, `ranking` などのときのみ使用
- `alphabetical_order` は `dropdown` のみ

`validations` は object。利用可能なキー:

- `required`: boolean（ほとんどのタイプで利用可）
- `max_length`: integer（`short_text`, `long_text` のみ）
- `min_value`, `max_value`: integer（`number` のみ）
- `min_selection`, `max_selection`: integer（`multiple_choice`, `picture_choice`, `ranking`）

### 3. attachment / media / layout

`attachment`:

- `type`: `"image"` or `"video"`
- `href`: string（Typeform 上の画像 URL or サポートされた動画 URL）

`media`:

- 各要素は `{ "type": "video", "href": string, "enabled"?: boolean, "properties"?: {...}, "ref"?: string }`

`layout`:

- `type`: `"split" | "wallpaper" | "float" | "stack"`
- `placement`（必要な場合）: `"left" | "right"`

### 4. settings

主なキー:

- `language`: 許可されたコードのみ（例: `en`, `es`, `fr`, `de`, `ja` など）
- `is_public`: boolean
- `autosave_progress`: boolean
- `progress_bar`: `"percentage"` or `"proportion"`
- `show_progress_bar`, `show_typeform_branding`, `show_question_number` など: boolean
- `redirect_after_submit_url`: string

`meta`:

- `title`: string
- `description`: string
- `allow_indexing`: boolean
- `image.href`: string

### 5. logic

各要素:

- `type`: `"field"` or `"hidden"`
- `ref`: string
- `actions`: array

各 action:

- `action`: `"jump" | "add" | "subtract" | "multiply" | "divide" | "set"`
- `condition`:
  - `op`: `"begins_with" | "contains" | "is" | "greater_than" | ...` など Typeform がサポートする演算子
  - `vars`: array of `{ "type": "field" | "hidden" | "variable" | "constant" | "choice", "value": ... }`
- `details`:
  - `to`: `{ "type": "field" | "thankyou" | "outcome", "value": <ref> }`（jump の場合）
  - `target`: `{ "type": "variable", "value": <variableName> }`
  - `value`: `{ "type": "constant" | "variable" | "evaluation", "value": ... }`

### 6. welcome_screens / thankyou_screens

共通:

- `ref`: string
- `title`: string（必須）
- `properties.show_button`: boolean
- `properties.button_text`: string
- `attachment`: 前述の attachment 仕様に従う

thank you:

- `properties.button_mode`: `"reload" | "default_redirect" | "redirect"`

### 7. その他

- `hidden`: array of string
- `variables`: key が string、値は number などプリミティブ
- `theme.href`, `workspace.href` は string
- 不明なキーが存在してもエラーにはしないが、**仕様上明らかに不正な型や値**は修正対象とする

## 出力フォーマット

あなたの出力は **必ず JSON オブジェクト** とする:

```json
{
  "valid": boolean,
  "errors": [string],
  "fixedJson": { ... 修正済みの JSON ... }
}
```

- `valid`: 入力 JSON が Typeform Create API として妥当なら true、修正が必要なら false。
- `errors`: 検出した問題の説明。  
  例: `"fields[0].type 'text' is invalid. Allowed types are: short_text, long_text, ..."`
- `fixedJson`: 可能な限り仕様に合わせて**自動修正した JSON**。  
  - 修正方針:
    - 型が一致しない場合は、可能なら変換（例: `"true"` → `true`）。
    - 不正な `type` や `language` などは、できる範囲で妥当なデフォルト（例: `type: "short_text"`、`language: "en"`）に置き換える。
    - ロジックや参照(`ref`)で「存在しないフィールド」を参照している場合は、そのアクションを削除するか `errors` で報告し、`fixedJson` では削除した状態を返す。
    - どう修正すべきか確信が持てない場合は、その部分を削除し、`errors` で理由を説明する。

### 重要: Typeform API への送信方法

**バリデータの出力（`valid`, `errors`, `fixedJson`を含むJSON）をそのままTypeform APIに送信してはいけません。**

Typeform Create API に送信する際は、**`fixedJson` の中身のみ**を送信してください。

例:

```json
// ❌ 間違い: バリデータの出力全体を送信
{
  "valid": true,
  "errors": [],
  "fixedJson": {
    "title": "My Form",
    "fields": [...]
  }
}

// ✅ 正しい: fixedJson の中身のみを送信
{
  "title": "My Form",
  "fields": [...]
}
```

バリデータの出力は検証結果と修正済みJSONを含むラッパーオブジェクトであり、Typeform APIが期待するフォーマットではありません。Typeform APIは `title` などのルートレベルのプロパティを期待しており、`valid` や `errors` などのメタデータプロパティは受け付けません。

## 入力の扱い

- 入力は必ずしも有効な JSON とは限らない。  
  - JSON としてパースできるようにまず修正し、そのうえで上記ルールに沿って検証・修正を行う。
- コメントや余計なフィールドがあってもよいが、`fixedJson` には余計なコメントは含めないこと。

## 出力上の注意

- `fixedJson` 内のキー順序は問わない。
- 仕様の不備や曖昧さがあっても、あなたの知識と上記ルールに基づき、一貫性のある修正を試みる。
- 回答は必ず JSON のみを返し、説明文は `errors` 内だけに含める。
