export const MAX_STUDENTS_PER_CLASS = 4;

const PRICE_PER_HOUR_BY_STUDENT_COUNT: Record<number, number> = {
  1: 40,
  2: 45,
  3: 50,
  4: 55,
};

export function priceForStudentCount(studentCount: number): number {
  if (studentCount < 1 || studentCount > MAX_STUDENTS_PER_CLASS) {
    throw new Error(
      `Número de alunos inválido para o cálculo do preço: ${studentCount}. Deve ser entre 1 e ${MAX_STUDENTS_PER_CLASS}.`
    );
  }
  return PRICE_PER_HOUR_BY_STUDENT_COUNT[studentCount];
}
