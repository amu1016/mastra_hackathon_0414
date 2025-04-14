interface UpdateConsentTemplateInput {
  name: string;
  fontSize: 16 | 24 | 32;
  description?: string;
  elements: {
    htmlType:
      | "TEXT"
      | "DATE"
      | "DATETIME"
      | "CHECK_BOX"
      | "NUMBER"
      | "BIRTHDAY"
      | "SELECT";
    plotType:
      | "CONSENT_DATE"
      | "CONSENT_DATETIME"
      | "INFORMED_DATE"
      | "PATIENT_ID"
      | "INFORMED_STAFF"
      | "STAFF_NAME"
      | "PATIENT_NAME"
      | "PATIENT_BIRTHDAY"
      | "MEDICAL_PRACTICE"
      | "CHECK_ELEMENT"
      | "SURGERY_DATE"
      | "FREE_TEXT_ELEMENT"
      | "FREE_DATE_ELEMENT"
      | "FREE_SELECT_ELEMENT"
      | "PATIENT_NAME_FROM_STAFF"
      | "FREE_HAND_ELEMENT";
    required: "REQUIRED" | "OPTIONAL";
    inputPosition: {
      top: number;
      left: number;
      page: number;
    };
    /** @description 入力項目名 */
    name: string;
    target: "PATIENT" | "STAFF";
  }[];
}
