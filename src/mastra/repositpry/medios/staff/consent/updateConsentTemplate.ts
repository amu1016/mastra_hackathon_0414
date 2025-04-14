export interface UpdateConsentTemplateInput {
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

export const updateConsentTemplate = async (
  input: UpdateConsentTemplateInput,
  id: number,
  token: string
) => {
  const idStr = id.toString();
  const path = `https://doctor.contrea.net/api/v2/staff/consent/template/${idStr}/updateConsentTemplate`;
  try {
    const response = await fetch(path, {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await response.json();
    if (!res.data) {
      throw new Error("同意書の更新に失敗しました");
    }
    return res.data;
  } catch (error) {
    console.error(error);
    throw new Error("同意書の更新に失敗しました");
  }
};
