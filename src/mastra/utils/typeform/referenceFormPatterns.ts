/**
 * 参照フォーム（千葉大学病院様 入院時問診 jVyfkV0x）に基づく
 * ref 命名・補足文・settings のパターン定義。
 * 他病院の問診票を変換する際に、意味が近い質問ではこの ref を流用し、
 * 患者が単独で見ても分かりやすいよう title / description を補足する。
 */

/** 意味が近い質問に対応する参照フォームの ref 一覧（キーワードでマッチさせる） */
export const REF_BY_SEMANTIC: Array<{
  keywords: string[];
  ref: string;
  description?: string;
}> = [
  { keywords: ["生年月日", "誕生日", "birth"], ref: "patientBirthDate" },
  {
    keywords: ["年齢", "歳"],
    ref: "patientAge",
    description: "数字のみ入力ください</br>\n例）20歳→20",
  },
  {
    keywords: ["職業", "仕事"],
    ref: "patientOccupation",
    description: "無職の方は以前の職業を教えてください",
  },
  { keywords: ["住所", "住まい"], ref: "patientAddress" },
  {
    keywords: ["電話", "連絡先", "携帯", "固定"],
    ref: "patientPhoneNumber",
    description: "携帯電話、固定電話どちらでも問題ありません。",
  },
  {
    keywords: ["家族", "ご家族"],
    ref: "hasFamily_1",
    description: "別居の家族も含みます",
  },
  {
    keywords: ["お名前", "氏名", "名前"],
    ref: "familyMemberName_1",
    description:
      "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["ご年齢", "年齢"],
    ref: "familyMemberAge_1",
    description:
      "複数人いる場合は、1名ずつ情報をご入力ください。数字のみ入力ください。例）20歳→20",
  },
  {
    keywords: ["続柄", "関係"],
    ref: "familyMemberRelationship_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["職業を教えて"],
    ref: "familyMemberOccupation_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["居住", "同居", "別居"],
    ref: "familyMemberResidenceStatus_1",
  },
  {
    keywords: ["健康状態"],
    ref: "familyMemberHealthStatus_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["緊急連絡先", "緊急連絡"],
    ref: "emergencyContactName_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["ご関係を教えて", "関係を教えて"],
    ref: "emergencyContactRelation_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["住所を教えて"],
    ref: "emergencyContactAddress_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["電話番号を教えて"],
    ref: "emergencyContactPhoneNumber_1",
    description: "複数人いる場合は、1名ずつ情報をご入力ください",
  },
  {
    keywords: ["連絡が可能な時間帯", "時間帯を選択"],
    ref: "emergencyContactPreferredContactTime_1",
  },
  {
    keywords: ["身の回り", "手伝う方", "相談できる方", "入院中"],
    ref: "hasSupportPersonDuringHospitalization_1",
  },
  {
    keywords: ["お子さま", "子供", "子どもの身の回り"],
    ref: "hasSupportPersonForChildDuringHospitalization_1",
  },
  {
    keywords: ["その方のお名前"],
    ref: "supportPersonName_1",
  },
  {
    keywords: ["その方とのご関係"],
    ref: "supportPersonRelationship_1",
  },
  {
    keywords: ["依頼できる内容", "当てはまるものをすべて選択"],
    ref: "supportTasksAvailable_1",
  },
  {
    keywords: ["病気はいつ頃", "症状がありましたか", "入院の経緯"],
    ref: "hospitalizationProgress",
  },
  {
    keywords: ["どのような症状", "症状でしたか"],
    ref: "hospitalizationTriggerSymptoms",
  },
  {
    keywords: ["つらいこと", "今つらい"],
    ref: "currentDistress",
  },
  {
    keywords: ["医師から", "病気について", "説明を受けていますか"],
    ref: "doctorExplanationOfIllness",
  },
  {
    keywords: ["入院生活", "治療に対する", "ご希望"],
    ref: "hospitalizationAndTreatmentPreferences",
    description: "特になければ「なし」とご記入ください",
  },
  {
    keywords: ["かかった病気", "既往歴", "病歴"],
    ref: "diseasesHistory_1",
  },
  {
    keywords: ["病名を教えて"],
    ref: "typeOfDiseasesHistory_1",
    description: "複数ある場合は、一つずつ入力してください",
  },
  {
    keywords: ["何歳の時", "年齢の時"],
    ref: "ageOfDiseaseHistory_1",
    description: "数値のみの入力項目です。例）16歳→16",
  },
  {
    keywords: ["受けた治療"],
    ref: "treatmentDetailOfDiseasesHistory_1",
  },
  {
    keywords: ["かかった病院名"],
    ref: "treatedHospitalOfDiseasesHistory_1",
  },
  {
    keywords: ["金属", "人工物", "インプラント", "ペースメーカー"],
    ref: "hasImplantedMetals",
    description: "例）インプラント、ペースメーカーなど",
  },
  {
    keywords: ["どのような人工物"],
    ref: "typeOfImplantedMetals",
    description: "例）インプラント、ペースメーカーなど",
  },
  {
    keywords: ["医療処置", "現在行っている"],
    ref: "currentMedicalTreatments",
    description:
      "例）創の処置、自己注射、シーパップなど。特にない場合は「なし」とご記入ください",
  },
  {
    keywords: ["使用している薬", "現在使用している薬"],
    ref: "usingMedication",
    description: "飲薬、目薬、貼り薬、坐薬、塗り薬、市販薬、健康食品、サプリメントなど",
  },
  {
    keywords: ["お薬手帳"],
    ref: "hasMedicationNotebook",
  },
  {
    keywords: ["お薬手帳の画像", "画像をアップロード"],
    ref: "medicationNotebookImage",
    description:
      "現在定期的に飲んでいるお薬のページを撮影してください。お薬手帳の撮影が難しい場合はお薬の写真でも構いません。",
  },
  {
    keywords: ["使用している薬の名前", "薬の名前"],
    ref: "currentMedicationDetail",
    description:
      "飲薬、目薬、貼り薬、坐薬、塗り薬、市販薬、健康食品、サプリメントなど",
  },
  {
    keywords: ["アレルギー"],
    ref: "hasAllergies",
  },
  {
    keywords: ["アレルギーで当てはまる"],
    ref: "typeOfAllergies",
  },
  {
    keywords: ["薬品名を教えて", "薬品名"],
    ref: "detailOfDrugAllergies",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「薬品」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["症状を教えて"],
    ref: "drugAllergySymptoms",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「薬品」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["食品名を教えて"],
    ref: "detailOfFoodAllergies",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「食品」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["食品", "アレルギー症状"],
    ref: "foodAllergySymptoms",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「食品」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["その他の詳細", "その他（絆創膏"],
    ref: "otherDetailOfAllergies",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「その他」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["その他", "アレルギー症状"],
    ref: "otherAllergySymptoms",
    description:
      "「アレルギーで当てはまるものをすべて選択してください」の設問で「その他」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["飲酒", "お酒"],
    ref: "drinksAlcohol",
  },
  {
    keywords: ["お酒の種類"],
    ref: "preferredAlcoholType",
  },
  {
    keywords: ["1日に飲む量", "飲む量"],
    ref: "alcoholQuantityPerDay",
    description: "杯数を数字のみでご入力ください",
  },
  {
    keywords: ["何年間お酒"],
    ref: "yearsOfAlcoholConsumption",
    description: "数字のみでご入力ください",
  },
  {
    keywords: ["喫煙", "たばこ", "吸っていますか"],
    ref: "hasSmokingHabit",
  },
  {
    keywords: ["何本吸っていますか", "1日あたり"],
    ref: "dailyCigaretteConsumption",
    description: "過去に吸っていた方は当時の本数をご入力ください",
  },
  {
    keywords: ["何年間吸っていますか"],
    ref: "yearsOfSmoking",
    description: "過去に吸っていた方は何年間吸っていたのかをご入力ください",
  },
  {
    keywords: ["禁煙の意思"],
    ref: "willingToQuitSmoking",
  },
  {
    keywords: ["食欲"],
    ref: "hasAppetite",
  },
  {
    keywords: ["食事制限"],
    ref: "hasDietaryRestrictions",
  },
  {
    keywords: ["痩せた", "体重"],
    ref: "perceivedRecentWeightLoss",
  },
  {
    keywords: ["入れ歯"],
    ref: "usesDentures",
  },
  {
    keywords: ["食事形態", "特殊な場合"],
    ref: "specialDietaryRequirements",
    description: "例）きざみ、流動食、ミルク、母乳の量と回数など",
  },
  {
    keywords: ["ムセる", "食事中"],
    ref: "experiencesChokingDuringMeals",
  },
  {
    keywords: ["ご自身で食べられますか"],
    ref: "canEatIndependently",
  },
  {
    keywords: ["排尿の回数", "1日あたりの排尿"],
    ref: "timesUrinatePerDay",
    description:
      "数字のみ入力ください。おおよその平均的な1日の回数を記載ください。例）1日5回→5",
  },
  {
    keywords: ["夜間の排尿"],
    ref: "timesNightlyUrinatePerDay",
    description:
      "数字のみ入力ください。おおよその平均的な夜間の回数を記載ください。例）1日1回→1",
  },
  {
    keywords: ["使用しているもので当てはまる", "排尿"],
    ref: "urinaryAidsUsed",
  },
  {
    keywords: ["その他の詳細を教えて", "排尿のその他"],
    ref: "otherUrinaryAidsDetails",
    description:
      "「使用しているもので当てはまるものをすべて選択してください」の設問で「その他」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["排尿のことで", "お困りのこと"],
    ref: "hasUrinaryConcerns",
  },
  {
    keywords: ["お困りの内容を教えて", "排尿のお困り"],
    ref: "urinaryConcernsDetails",
  },
  {
    keywords: ["排便の回数", "1日あたりの排便"],
    ref: "timesDefecatePerDay",
    description:
      "数字のみ入力ください。おおよその平均的な1日の回数を記載ください。例）1日5回→5",
  },
  {
    keywords: ["夜間の排便"],
    ref: "timesNightlyDefecatePerDay",
    description:
      "数字のみ入力ください。おおよその平均的な夜間の回数を記載ください。例）1日1回→1",
  },
  {
    keywords: ["排便", "使用しているもの"],
    ref: "bowelAidsUsed",
  },
  {
    keywords: ["その他の詳細を教えて", "排便のその他"],
    ref: "otherBowelAidsDetails",
    description:
      "「使用しているもので当てはまるものをすべて選択してください」の設問で「その他」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["排便のことで", "お困り"],
    ref: "hasBowelConcerns",
  },
  {
    keywords: ["お困りの内容を教えて", "排便のお困り"],
    ref: "bowelConcernsDetails",
  },
  {
    keywords: ["身体を清潔にする", "入浴", "シャワー", "清拭"],
    ref: "bodyCleaningMethods",
  },
  {
    keywords: ["おくちを清潔にする", "うがい", "歯磨き"],
    ref: "oralCleaningHabits",
  },
  {
    keywords: ["おくちを清潔にする回数"],
    ref: "dailyOralCleaningFrequency",
    description: "数字のみ入力ください。例）1日3回の場合→3",
  },
  {
    keywords: ["着替え", "不便", "不都合"],
    ref: "hasDressingDifficulties",
  },
  {
    keywords: ["不便や不都合について詳しく"],
    ref: "dressingDifficultiesDetails",
  },
  {
    keywords: ["皮膚の状態", "皮膚の問題"],
    ref: "hasSkinIssues",
  },
  {
    keywords: ["皮膚の問題を詳しく"],
    ref: "skinIssuesDetails",
    description: "問題がある部位、状況を詳しく記載ください。",
  },
  {
    keywords: ["床ずれ"],
    ref: "hasHadPressureUlcers",
  },
  {
    keywords: ["骨があたるところ"],
    ref: "hasPressurePointsDueToUlcers",
  },
  {
    keywords: ["むくみ"],
    ref: "hasSwelling",
  },
  {
    keywords: ["目・耳", "不自由", "メガネ", "補聴器"],
    ref: "hasVisionOrHearingImpairment",
    description:
      "メガネやコンタクト、補聴器を使用されている場合も該当の部位を選択してください",
  },
  {
    keywords: ["目に対して使用している", "眼鏡", "コンタクト"],
    ref: "visualAidDevices",
  },
  {
    keywords: ["補聴器を使用していますか"],
    ref: "usesHearingAid",
  },
  {
    keywords: ["会話で困ること"],
    ref: "hasConversationDifficulties",
  },
  {
    keywords: ["物忘れ"],
    ref: "hasMemoryIssues",
  },
  {
    keywords: ["睡眠時間", "何時から何時"],
    ref: "sleepSchedule",
    description: "例）22時頃〜6時頃など",
  },
  {
    keywords: ["いびき"],
    ref: "hasSnoring",
  },
  {
    keywords: ["移動", "不自由"],
    ref: "hasMobilityIssues",
  },
  {
    keywords: ["つまずき"],
    ref: "proneToTripping",
  },
  {
    keywords: ["杖", "装具", "移動時"],
    ref: "requiresMobilityAid",
  },
  {
    keywords: ["屋内で使用している"],
    ref: "indoorMobilityAidsUsed",
  },
  {
    keywords: ["屋外で使用している"],
    ref: "outdoorMobilityAidsUsed",
  },
  {
    keywords: ["転んだこと", "半年以内"],
    ref: "hasFallenInLastSixMonths",
  },
  {
    keywords: ["普段の活動", "外出"],
    ref: "activityLevel",
  },
  {
    keywords: ["医師から療養", "生活のこと", "説明を受けていますか"],
    ref: "hasReceivedMedicalGuidance",
  },
  {
    keywords: ["当てはまるものを選択", "説明されたことは守れている"],
    ref: "adherenceToMedicalGuidance",
    description:
      "「医師から療養や生活のことについて説明を受けていますか？」の設問で「はい」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["普段の運動", "おすわり", "つかまり立ち"],
    ref: "typeOfExercisesRegularly",
  },
  {
    keywords: ["好きな遊び"],
    ref: "favoritePlayActivities",
  },
  {
    keywords: ["予防接種", "月齢・年齢"],
    ref: "ageAppropriateVaccinationsCompleted",
  },
  {
    keywords: ["介護保険", "要支援", "要介護"],
    ref: "longTermCareInsuranceApplicationStatus",
  },
  {
    keywords: ["ケアマネジャー", "訪問看護師", "事業所"],
    ref: "hasCareManagerOrHomeNurse_1",
  },
  {
    keywords: ["事業所を教えて", "ケアマネ"],
    ref: "careServiceProviderName_1",
    description: "事業所を複数利用している場合は一つずつ入力してください",
  },
  {
    keywords: ["担当者名を教えて"],
    ref: "careServiceProviderContactPersonName_1",
  },
  {
    keywords: ["利用しているサービスの内容"],
    ref: "longTermCareServicesUsed",
  },
  {
    keywords: ["障害者手帳", "指定難病", "小児慢性", "利用中", "申請中"],
    ref: "nonLongTermCareProgramsUsed",
  },
  {
    keywords: ["障害者手帳の制度", "申請状況"],
    ref: "disabilityCertificateApplicationStatus",
    description:
      "「利用している制度で当てはまるものをすべて選択してください？」の設問で「障害者手帳」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["障害者手帳の等級"],
    ref: "disabilityCertificateGrade",
    description: "数字のみを入力してください",
  },
  {
    keywords: ["指定難病の制度"],
    ref: "specifiedDiseaseApplicationStatus",
    description:
      "「利用している制度で当てはまるものをすべて選択してください？」の設問で「指定難病」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["病気の種類を教えて", "小児慢性"],
    ref: "pediatricChronicSpecifiedDiseaseType",
    description:
      "「利用している制度で当てはまるものをすべて選択してください？」の設問で「小児慢性特定疾患」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["その他に利用している制度"],
    ref: "otherSupportProgramsUsed",
    description:
      "「利用している制度で当てはまるものをすべて選択してください？」の設問で「その他」をご選択された方にお伺いしています。",
  },
  {
    keywords: ["選択された制度", "サービスの内容"],
    ref: "serviceDetailsForSelectedPrograms",
  },
  {
    keywords: ["担当者の氏名"],
    ref: "contactPersonForSelectedPrograms",
  },
  {
    keywords: ["担当者の連絡先"],
    ref: "contactDetailsForSelectedPrograms",
  },
  {
    keywords: ["エレベーター", "2階以上"],
    ref: "hasElevatorAccess",
    description: "住居が2階以上でない場合は、「いいえ」を選択してください",
  },
  {
    keywords: ["退院後", "療養先", "過ごし方"],
    ref: "postDischargeCarePreferences",
  },
  {
    keywords: ["社会福祉", "詳しい話"],
    ref: "wantsSocialWelfareInformation",
  },
  {
    keywords: ["お子さまの性格"],
    ref: "selfDescribedPersonality",
    description: "例）明るい、我慢強い、神経質、短期、その他",
  },
  {
    keywords: ["信仰", "宗教", "治療上の制限"],
    ref: "hasReligiousTreatmentRestrictions",
  },
  {
    keywords: ["宗教上の制限"],
    ref: "religiousTreatmentRestrictionDetails",
    description: "例）食事、輸血など",
  },
  {
    keywords: ["大切にしてきた", "ものごと"],
    ref: "cherishedValuesAndActivities",
    description:
      "例）趣味、旅行、家族との時間、思い出のある自宅での生活など",
  },
  {
    keywords: ["もしもの時", "望む医療", "話し合っている"],
    ref: "hasDiscussedMedicalPreferences",
  },
  {
    keywords: ["心配なこと", "相談したいこと", "入院に際して"],
    ref: "hospitalizationConcernsAndRequests",
  },
];

/** 参照フォームと同様の settings（日本語・進捗バー等） */
export const REFERENCE_SETTINGS = {
  language: "ja",
  progress_bar: "proportion" as const,
  show_progress_bar: true,
  show_typeform_branding: false,
  show_question_number: false,
  show_key_hint_on_choices: true,
  autosave_progress: true,
  meta: { allow_indexing: false },
};

/**
 * タイトルまたは質問文から、意味が近い参照 ref を1つ返す。
 * 複数マッチした場合は最初のマッチを返す。
 */
export function inferRefFromTitle(title: string): string | undefined {
  const t = title.trim();
  for (const { keywords, ref } of REF_BY_SEMANTIC) {
    if (keywords.some((k) => t.includes(k))) {
      return ref;
    }
  }
  return undefined;
}

/**
 * 参照フォームで使われている ref に対応する補足文（properties.description）を返す。
 */
export function getDescriptionForRef(ref: string): string | undefined {
  const entry = REF_BY_SEMANTIC.find((e) => e.ref === ref);
  return entry?.description;
}
