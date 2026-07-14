import { z } from "zod";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";

export const trainingLevels = ["WTE1", "WTE2", "WTE3"] as const;

export const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const unitSchema = z.object({
  name: z.string().trim().min(2, "Nome da unidade é obrigatório."),
  address: z.string().trim().min(5, "Endereço é obrigatório."),
});

export const professorSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório."),
  address: z.string().trim().min(5, "Endereço é obrigatório."),
  phone: z.string().trim().min(8, "Telefone é obrigatório."),
  email: z.string().email("Informe um email válido."),
  cref: z.string().trim().min(3, "Número do CREF é obrigatório."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").optional(),
});

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório."),
  address: z.string().trim().min(5, "Endereço é obrigatório."),
  phone: z.string().trim().min(8, "Telefone é obrigatório."),
  cpf: z
    .string()
    .trim()
    .transform(normalizeCpf)
    .refine((v) => isValidCpf(v), { message: "CPF inválido." }),
  email: z
    .string()
    .trim()
    .email("Informe um email válido.")
    .optional()
    .or(z.literal("")),
  trainingLevel: z.enum(trainingLevels, {
    error: "Selecione o nível de treinamento.",
  }),
  unitId: z.string().min(1, "Selecione a unidade."),
  guardianName: z.string().trim().optional().or(z.literal("")),
  guardianRelationship: z.string().trim().optional().or(z.literal("")),
  guardianAddress: z.string().trim().optional().or(z.literal("")),
  guardianPhone: z.string().trim().optional().or(z.literal("")),
});

export const classSessionSchema = z.object({
  unitId: z.string().min(1, "Selecione a unidade."),
  professorId: z.string().min(1, "Selecione o professor."),
  scheduledAt: z.string().min(1, "Informe a data e hora."),
  studentIds: z
    .array(z.string())
    .min(1, "Selecione ao menos 1 aluno.")
    .max(4, "No máximo 4 alunos por aula."),
});

export const changeRequestSchema = z
  .object({
    classSessionId: z.string().min(1),
    type: z.enum(["PROFESSOR_CHANGE", "TIME_CHANGE"]),
    proposedProfessorId: z.string().optional().or(z.literal("")),
    proposedScheduledAt: z.string().optional().or(z.literal("")),
    reason: z.string().trim().min(3, "Descreva o motivo da solicitação."),
  })
  .refine(
    (data) =>
      data.type !== "PROFESSOR_CHANGE" || !!data.proposedProfessorId,
    {
      message: "Selecione o professor proposto.",
      path: ["proposedProfessorId"],
    }
  )
  .refine(
    (data) => data.type !== "TIME_CHANGE" || !!data.proposedScheduledAt,
    {
      message: "Informe o novo horário proposto.",
      path: ["proposedScheduledAt"],
    }
  );
