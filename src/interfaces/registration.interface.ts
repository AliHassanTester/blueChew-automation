export interface RegistrationDetails {
  devGateURL: string;
  loginURL: string;
  registrationURL: string;
  state: string;
  email: string;
  password: string;
  postRegistrationURL: string;
  /** 0-based answer index for each quiz question, in order */
  quizAnswers: number[];
}
