import { TestCaseData } from './testcase.data.interface';

export interface FooterRedirectItem {
  id: string;
  name: string;
  section: 'HELP' | 'LEARN' | 'LEGAL';
  linkSelector: string;
  href: string;
  isNewTab: boolean;
  expectedUrlPattern: string | RegExp;
  expectedTitlePattern: string | RegExp;
  primaryLocatorSelector: string;
  primaryLocatorDescription: string;
  secondaryLocatorSelector: string;
  secondaryLocatorDescription: string;
  description: string;
}

export interface FooterRedirectsData {
  homeURL: string;
  footerLinks: FooterRedirectItem[];
}

export interface FooterRedirectsTestCaseData {
  footerRedirectsData: FooterRedirectsData;
  testCaseData: TestCaseData;
}
