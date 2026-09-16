import { TestCaseData } from './testcase.data.interface';
import { MedicalDetails, RegistrationDetails } from './signup-to-approved-order.interface';

export interface MedicalSymptomDetails {
  explainSymptoms: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Rarely';
  takingMedications: boolean;
  drugName?: string;
  reason?: string;
  isMonitoredByProvider: boolean;
}

export interface MedicalEdgeCasesDetails {
  /** Registration info to reach /medical funnel */
  registration: RegistrationDetails;
  /** Disqualification negative test */
  nonPatientWarningText: string;
  /** Physical activity chest pain reason */
  chestPainExplanation: string;
  /** Blood pressure medication details */
  bloodPressureDrugName: string;
  bloodPressureDrugReason: string;
  /** Nitrates & contraindicated meds */
  nitratesSafetyWarningText: string;
  nitrateDrugReason: string;
  /** Nausea / IBS medication details */
  nauseaMedDrugReason: string;
  /** Symptoms assessment */
  symptomDetails: MedicalSymptomDetails;
  /** Additional provider notes & file upload */
  additionalProviderNotes: string;
  fileSizeExceededErrorText: string;
}

export interface MedicalEdgeCasesTestCaseData {
  testCaseData: TestCaseData;
  details: MedicalEdgeCasesDetails;
}
