/**
 * Every word a person reads.
 *
 * A module rather than an internationalisation library: there is one language and a
 * second is not planned, so a provider and interpolation would be machinery with
 * nothing to carry. What this does buy is a rule with no exceptions - no Cyrillic
 * anywhere else in `src/` - which a test can check by reading the source.
 */
export const uk = {
  window: {
    close: 'Закрити',
  },
  taskbar: {
    label: 'Панель завдань',
    start: 'Пуск',
  },
  desktop: {
    title: 'Робочий стіл',
    welcome: 'Вітаємо у вашій шафі.',
  },
  signIn: {
    title: 'Вхід',
    email: 'Електронна пошта',
    password: 'Пароль',
    submit: 'Увійти',
    noAccount: 'Ще немає акаунта?',
    toSignUp: 'Зареєструватися',
  },
  signUp: {
    title: 'Реєстрація',
    email: 'Електронна пошта',
    username: "Ім'я користувача",
    password: 'Пароль',
    submit: 'Створити акаунт',
  },
  notFound: {
    title: 'Не знайдено',
    message: 'Такого екрана немає.',
    home: 'На робочий стіл',
  },
} as const;
