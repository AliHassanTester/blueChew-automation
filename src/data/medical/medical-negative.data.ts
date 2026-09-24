import { MedicalNegativeTestCaseData } from '@interfaces/medical-negative.interface';
import { getEnvVars } from '@utilities/env.utils';
import { buildTestAccount } from '@utilities/testData.generate.utils';

const env = getEnvVars({
  password:           null,
  LOGIN_URL:          '/log-in',
  QUIZ_URL:           '/quiz',
  STRIPE_CARD_NUMBER: '5555555555554444',
  STRIPE_CARD_EXP:    '12/28',
  STRIPE_CARD_CVV:    '737',
  ADMIN_URL:          null,
  ADMIN_EMAIL:        'ali@meds.com',
  ADMIN_PASSWORD:     null,
});

export function getMedicalNegativeData(testCase = 'AQ-09-Medical-Negative-Flow'): MedicalNegativeTestCaseData {
  const account = buildTestAccount('med-neg');

  const medicalNegativeTestData: { [key: string]: MedicalNegativeTestCaseData } = {
    'AQ-09-Medical-Negative-Flow': {
      testCaseData: {
        tags: '@regression @functional @medical @negative @safety',
        testCase: 'AQ-09-Medical-Negative-Flow',
        testDescription: 'Medical intake flow negative validations and exact Jam recording step-by-step walkthrough',
        testSummary:
          'Step-by-step reproduction of Jam recording 4f66d4e9-9946-4a2a-bef0-0c0a2cf4bcf0 verifying non-patient alerts, reasons, exercise disclosures, medications, supplements, nitrates/poppers safety, nausea meds, fainting/neuro symptoms, notes, and file upload.',
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
        offLabelDenyWarningText: 'We cannot proceed',
        steps: {
          reasons: [
            'I want to avoid taking pills',
            "Pills like Viagra™ & Cialis™ don't work",
            "ED medicines like Viagra™ & Cialis™ take too long to work",
            "I prefer medications that don't require water to take",
          ],
          lifestyleOptions: ['Diet', 'Exercise', 'Other'],
          lifestyleOtherExplanation: 'test',
          bloodPressureDrugName: 'High Blood Pressure',
          bloodPressureDrugReason: 'High Blood Pressure',
          supplements: [
            "Multi-vitamin (e.g. Centrum, Men's Daily)",
            'Workout/weight lifting (e.g. whey, protein, creatine)',
            'Nitric Oxide',
          ],
          nitricOxideDenyWarning: 'We cannot proceed',
          contraindicatedMeds: [
            'Amyl Nitrite or "Poppers"',
            'Isosorbide Mononitrate/Dinitrate',
            'Riociguat',
            'Other Nitrate Medications',
            'Medications for nausea or IBS',
            'Other medication',
          ],
          contraindicatedExplanation: 'Test',
          nitrateCustomMed: { name: 'PARSIDOL', reason: 'Test' },
          nauseaMeds: ['Granisetron (Kytril)', 'Palonosetron (Aloxi)'],
          nauseaReason: 'Test',
          otherCustomMed: { name: 'TESTIM', reason: 'Test' },
          allergies: ['Seasonal (e.g. pollen, hay fever)'],
          faintingDetails: {
            explanation: 'Test',
            frequency: 'Weekly',
            causes: 'Test',
            diagnosed: false,
            takingMedication: true,
            medName: 'Test',
            medReason: 'Test',
            isMonitoredByProvider: false,
            hospitalVisitPast12Months: true,
            hospitalExplanation: 'Test',
          },
          otherMedicationsChoice: 'none',
          providerNotes: 'Test',
          oversizedFilePath: 'scratch/oversized-test-file.pdf',
          fileSizeExceededError: 'File size exceeds the limit of 5 MB.',
        },
      },
    },
  };

  const data = medicalNegativeTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
