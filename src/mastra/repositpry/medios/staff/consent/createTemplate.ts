export interface CreateTemplateInput {
  pdfId: number;
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
    name: string;
    target: "PATIENT" | "STAFF";
  }[];
}

export const createConsentTemplate = async (
  createTemplateInput: CreateTemplateInput,
  token: string
) => {
  const path = `https://doctor.contrea.net/api/v2/staff/consent/template/createConsentTemplate`;
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(createTemplateInput),
  });
  const res = await response.json();
  if (!res.data) {
    throw new Error(res.message);
  }
  return res.data;
};
