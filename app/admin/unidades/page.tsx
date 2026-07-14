import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnitFormDialog } from "@/components/forms/unit-form-dialog";
import { prisma } from "@/lib/prisma";

export default async function UnidadesPage() {
  const units = await prisma.unit.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Unidades</h1>
        <UnitFormDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell>{unit.address}</TableCell>
              <TableCell>
                <UnitFormDialog unit={unit} />
              </TableCell>
            </TableRow>
          ))}
          {units.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-slate-500">
                Nenhuma unidade cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
