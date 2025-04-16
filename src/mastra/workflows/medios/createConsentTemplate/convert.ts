// base64をbinaryに変換する
export const convertBase64ToBinary = (pdfBase64Data: string) => {
  const buffer = Buffer.from(pdfBase64Data, "base64");
  return Buffer.from(buffer).toString("binary");
};
