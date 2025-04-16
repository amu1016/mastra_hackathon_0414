export interface UploadPdfInput {
  encodeData: string;
}

export interface UploadPdfOutput {
  pdfUrl: string;
  pdfId: number;
}

export const uploadPdf = async (input: UploadPdfInput, token: string) => {
  console.log("input", input);
  const path = `https://doctor.contrea.net/api//v2/staff/consent/template/base_pdf`;
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
    throw new Error(res.message);
  }
  return res.data as UploadPdfOutput;
};
