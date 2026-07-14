"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { unitSchema } from "@/lib/validations";

export type UnitFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseUnit(formData: FormData) {
  return unitSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });
}

export async function createUnit(
  _prevState: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  await requireUser("ADMIN");

  const parsed = parseUnit(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.unit.create({ data: parsed.data });
  revalidatePath("/admin/unidades");
  return undefined;
}

export async function updateUnit(
  unitId: string,
  _prevState: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  await requireUser("ADMIN");

  const parsed = parseUnit(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.unit.update({ where: { id: unitId }, data: parsed.data });
  revalidatePath("/admin/unidades");
  return undefined;
}
