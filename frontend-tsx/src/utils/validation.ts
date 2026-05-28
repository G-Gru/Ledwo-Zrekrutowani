const DRF_ERRORS: Record<string, string> = {
  'This field may not be blank.': 'To pole nie może być puste.',
  'This field is required.': 'To pole jest wymagane.',
  'Enter a valid number.': 'Podaj poprawną liczbę.',
  'A valid number is required.': 'Wymagana jest liczba.',
  'A valid integer is required.': 'Wymagana jest liczba całkowita.',
  'Enter a valid date.': 'Podaj poprawną datę.',
  'Enter a valid date/time.': 'Podaj poprawną datę i godzinę.',
  'Enter a valid URL.': 'Podaj poprawny adres URL.',
  'Ensure this value is greater than or equal to 0.': 'Wartość nie może być ujemna.',
}

export function parseFieldErrors(raw: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, msgs] of Object.entries(raw)) {
    result[key] = msgs.map(m => DRF_ERRORS[m] ?? m).join(', ')
  }
  return result
}
