const auth = {
  missingFields: 'Enter email and password',
  signUpSuccess: 'Account created! Check your email to confirm, then sign in.',
  subtitle: 'Sign in to sync across devices',
  emailLabel: 'Email',
  emailPlaceholder: 'your@email.com',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm password',
  invalidEmail: 'Enter a valid email',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordMismatch: 'Passwords do not match',
  showPassword: 'Show',
  hidePassword: 'Hide',
  signIn: 'Sign in',
  createAccount: 'Create account',
  noAccountPrompt: "Don't have an account? Sign up",
  hasAccountPrompt: 'Already have an account? Sign in',
} as const;

export default auth;
