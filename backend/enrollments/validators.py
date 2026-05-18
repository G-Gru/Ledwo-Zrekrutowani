import re
from datetime import date


def is_at_least_18(birthdate):
    if not birthdate:
        return False

    today = date.today()
    years = today.year - birthdate.year

    has_had_birthday = (
        (today.month, today.day) >= (birthdate.month, birthdate.day)
    )

    return years > 18 or (years == 18 and has_had_birthday)

def is_valid_pesel(pesel):
    if not pesel or len(pesel) != 11 or not pesel.isdigit():
        return False

    weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    digits = [int(d) for d in pesel]

    total = sum(w * d for w, d in zip(weights, digits[:10]))
    control = (10 - (total % 10)) % 10

    return control == digits[10]

def pesel_to_birthdate(pesel: str):
    year = int(pesel[0:2])
    month = int(pesel[2:4])
    day = int(pesel[4:6])

    if 80 <= month <= 92:
        year += 1800
        month -= 80
    elif 1 <= month <= 12:
        year += 1900
    elif 21 <= month <= 32:
        year += 2000
        month -= 20
    elif 41 <= month <= 52:
        year += 2100
        month -= 40
    elif 61 <= month <= 72:
        year += 2200
        month -= 60
    else:
        return None

    try:
        return date(year, month, day)
    except ValueError:
        return None


def is_valid_phone(phone):
    if not phone:
        return False

    phone = re.sub(r"[^\d+]", "", phone)
    return bool(re.fullmatch(r"\+?\d{9,15}", phone))

def is_valid_education_year(value):
    if not value:
        return False

    try:
        year = int(value)
    except (TypeError, ValueError):
        return False

    current_year = date.today().year
    return 1900 <= year <= current_year