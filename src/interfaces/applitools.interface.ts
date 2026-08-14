export interface ApplitoolsVisualConfig {
  appName: string;
  testName: string;
  viewport: {
    width: number;
    height: number;
  };
  baselineEnvName?: string;
  ignoreDisplacement?: boolean;
  ignoreDisplacements?: boolean;
  branchName?: string;
  parentBranchName?: string;
}
