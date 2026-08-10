export interface ApplitoolsVisualConfig {
  appName: string;
  testName: string;
  viewport: {
    width: number;
    height: number;
  };
  baselineEnvName?: string;
  ignoreDisplacements?: boolean;
}
