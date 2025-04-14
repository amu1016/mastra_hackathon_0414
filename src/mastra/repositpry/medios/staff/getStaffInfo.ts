interface StaffInfo {
  hospital: {
    id: string;
    name: string;
    code: string;
  };
  authority: {
    consent: boolean;
    videoOrder: boolean;
    videoView: boolean;
    icSupportOrder: boolean;
    icSupportView: boolean;
    medicalInterview: boolean;
    patientVideoOnStaffDevice: boolean;
    notification: boolean;
    anesthesiologySupport: boolean;
    hospitalizationSupport: boolean;
    patientInfo: boolean;
    directSignature: boolean;
  };
  staffName: string;
  passwordResetRequired: boolean;
  isContreaAccount: boolean;
  departmentId: string;
}

export const getStaffInfo = async (token: string) => {
  const path = `https://doctor.contrea.net/api/v2/staff/getStaffInfo`;
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json()) as StaffInfo;
  return data;
};
