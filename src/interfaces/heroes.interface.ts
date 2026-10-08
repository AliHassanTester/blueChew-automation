import { TestCaseData } from './testcase.data.interface';
import { RegistrationDetails } from './signup-to-approved-order.interface';
import { ApplitoolsVisualConfig } from './applitools.interface';

export interface HeroesTestCaseData {
  testCaseData: TestCaseData;
  homeURL: string;
  heroesURL: string;
  heroBranch: string;
  quizAnswers?: number[];
  visualConfig?: ApplitoolsVisualConfig;
  registrationDetails: RegistrationDetails;
}
