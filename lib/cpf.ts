export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) {
      total += Number(digit) * factor;
      factor--;
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstCheck = calcCheckDigit(digits.slice(0, 9), 10);
  const secondCheck = calcCheckDigit(digits.slice(0, 10), 11);

  return (
    firstCheck === Number(digits[9]) && secondCheck === Number(digits[10])
  );
}
