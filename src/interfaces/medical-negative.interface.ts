import { TestCaseData } from './testcase.data.interface';
import { RegistrationDetails } from './signup-to-approved-order.interface';

export interface MedicalNegativeStepDetails {
  reasons: string[];
  lifestyleOptions: string[];
  lifestyleOtherExplanation: string;
  bloodPressureDrugName: string;
  bloodPressureDrugReason: string;
  supplements: string[];
  nitricOxideDenyWarning: string;
  contraindicatedMeds: string[];
  contraindicatedExplanation: string;
  nitrateCustomMed: { name: string; reason: string };
  nauseaMeds: string[];
  nauseaReason: string;
  otherCustomMed: { name: string; reason: string };
  allergies: string[];
  faintingDetails: {
    explanation: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Rarely';
    causes: string;
    diagnosed: boolean;
    takingMedication: boolean;
    medName: string;
    medReason: string;
    isMonitoredByProvider: boolean;
    hospitalVisitPast12Months: boolean;
    hospitalExplanation: string;
  };
  otherMedicationsChoice: 'none' | 'add';
  providerNotes: string;
  oversizedFilePath: string;
  fileSizeExceededError: string;
}

export interface MedicalNegativeDetails {
  registration: RegistrationDetails;
  nonPatientWarningText: string;
  offLabelDenyWarningText: string;
  steps: MedicalNegativeStepDetails;
}

export interface MedicalNegativeTestCaseData {
  testCaseData: TestCaseData;
  details: MedicalNegativeDetails;
}
