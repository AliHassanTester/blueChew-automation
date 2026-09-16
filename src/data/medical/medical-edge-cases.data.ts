import { MedicalEdgeCasesTestCaseData } from '@interfaces/medical-edge-cases.interface';
import { getEnvVars } from '@utilities/env.utils';
import { buildTestAccount } from '@utilities/testData.generate.utils';

const env = getEnvVars({
  password:           null,   // required — registration + login password
  LOGIN_URL:          '/log-in',
  QUIZ_URL:           '/quiz',
  STRIPE_CARD_NUMBER: '5555555555554444',
  STRIPE_CARD_EXP:    '12/28',
  STRIPE_CARD_CVV:    '737',
  ADMIN_URL:          null,
  ADMIN_EMAIL:        'ali@meds.com',
  ADMIN_PASSWORD:     null,
});

const account = buildTestAccount('stripe');

const medicalEdgeCasesTestData: { [key: string]: MedicalEdgeCasesTestCaseData } = {
  'AQ-08-Medical-Negative-And-Edge-Cases': {
    testCaseData: {
      tags: '@regression @functional @medical @negative @edge-cases',
      testCase: 'AQ-08-Medical-Negative-And-Edge-Cases',
      testDescription: 'Medical flow questionnaire negative validations, conditional disclosures, and file limit edge cases',
      testSummary:
        'Verify that the medical intake flow strictly enforces non-patient disqualification warnings, mandates conditional physical activity & blood pressure medication explanations, validates Nitric Oxide safety acknowledgments, displays dangerous drug combination alerts for Poppers/nitrates, and rejects oversized file uploads (>5MB).',
    },
    details: {
      registration: {
        loginURL: env.LOGIN_URL,
        quizURL: env.QUIZ_URL,
        adminURL: env.ADMIN_URL,
        adminEmail: env.ADMIN_EMAIL,
        adminPassword: env.ADMIN_PASSWORD,
        state: 'New York',
        email: account.email,
        password: env.password,
        quizAnswers: [2, 0, 1],
        medical: account.medical,
        shipping: account.shipping,
        payment: {
          cardNumber: env.STRIPE_CARD_NUMBER,
          expiry: env.STRIPE_CARD_EXP,
          cvv: env.STRIPE_CARD_CVV,
        },
      },
      nonPatientWarningText: 'This medical profile must be completed by the patient to ensure safe and effective care.',
      chestPainExplanation: 'Occasional mild tightness during strenuous workouts only',
      bloodPressureDrugName: 'Lisinopril',
      bloodPressureDrugReason: 'High Blood Pressure',
      nitratesSafetyWarningText: "The combination of AMYL NITRITE ('POPPERS') with treatments offered through BlueChew can cause a dangerous drop in blood pressure, which could cause serious harm or death.",
      nitrateDrugReason: 'Occasional chest tightness treatment',
      nauseaMedDrugReason: 'Prescribed for occasional motion sickness',
      symptomDetails: {
        explainSymptoms: 'Mild lightheadedness when standing up too quickly after intense exercise',
        frequency: 'Rarely',
        takingMedications: false,
        isMonitoredByProvider: true,
      },
      additionalProviderNotes: 'No other known allergies or active medical conditions to report.',
      fileSizeExceededErrorText: 'File size exceeds the limit of 5 MB.',
    },
  },
};

export function getMedicalEdgeCasesData(testCase: string): MedicalEdgeCasesTestCaseData {
  const data = medicalEdgeCasesTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
