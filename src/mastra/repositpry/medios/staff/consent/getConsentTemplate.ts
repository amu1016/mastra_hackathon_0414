interface ConsentTemplate {
  staffId: string;
  id: number;
  templateHistoryId: number;
  pdfBase64Data: string;
  title: string;
  description?: string;
  isArchived: boolean;
  fontSize: 16 | 24 | 32;
  consentTemplatePlots: ConsentTemplatePlot[];
}

interface ConsentTemplatePlot {
  id: number;
  htmlInputType:
    | "TEXT"
    | "DATE"
    | "DATETIME"
    | "CHECK_BOX"
    | "NUMBER"
    | "BIRTHDAY"
    | "SELECT";
  inputPosition: {
    /** @description PDFの上からの割合 */
    top: number;
    /** @description PDFの左からの割合 */
    left: number;
    /** @description PDFのページ番号 */
    page: number;
  };
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
  target: "PATIENT" | "STAFF";
  title: string;
}

export const getConsentTemplate = async (token: string, id: number) => {
  const path = `https://doctor.contrea.net/api/v2/staff/consent/template/${id}`;
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json()) as ConsentTemplate;
  return data;
};
