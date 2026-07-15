const auth = {
  missingFields: 'Введіть email та пароль',
  signUpSuccess: 'Акаунт створено! Перевірте пошту для підтвердження, потім увійдіть.',
  subtitle: 'Увійдіть, щоб синхронізувати дані між пристроями',
  emailLabel: 'Email',
  emailPlaceholder: 'your@email.com',
  passwordLabel: 'Пароль',
  confirmPasswordLabel: 'Повторіть пароль',
  invalidEmail: 'Введіть коректний email',
  passwordTooShort: 'Пароль має містити щонайменше 6 символів',
  passwordMismatch: 'Паролі не збігаються',
  showPassword: 'Показати',
  hidePassword: 'Сховати',
  signIn: 'Увійти',
  createAccount: 'Створити акаунт',
  noAccountPrompt: 'Немає акаунта? Зареєструватись',
  hasAccountPrompt: 'Вже є акаунт? Увійти',
} as const;

export default auth;
