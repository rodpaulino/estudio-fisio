"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import {
  setAttendancePresence,
  signAttendance,
} from "@/app/professor/aulas/[id]/actions";

type Attendance = {
  studentId: string;
  studentName: string;
  present: boolean;
  signedByName: string | null;
};

export function AttendanceRow({
  classSessionId,
  attendance,
  disabled,
}: {
  classSessionId: string;
  attendance: Attendance;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function togglePresent(next: boolean) {
    startTransition(async () => {
      await setAttendancePresence(classSessionId, attendance.studentId, next);
    });
  }

  async function handleSign(signedByName: string, signatureDataUrl: string) {
    await signAttendance(classSessionId, attendance.studentId, signedByName, signatureDataUrl);
    setOpen(false);
    toast.success("Presença confirmada.");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="font-medium">{attendance.studentName}</p>
        <p className="text-xs text-slate-500">
          {attendance.signedByName
            ? `Assinado por ${attendance.signedByName}`
            : attendance.present
              ? "Presente, assinatura pendente"
              : "Ausente"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={attendance.present ? "default" : "secondary"}>
          {attendance.present ? "Presente" : "Ausente"}
        </Badge>
        {!disabled && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => togglePresent(!attendance.present)}
            >
              {attendance.present ? "Marcar ausente" : "Marcar presente"}
            </Button>
            {attendance.present && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button type="button" size="sm" />}>
                  {attendance.signedByName ? "Reassinar" : "Assinar"}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assinatura — {attendance.studentName}</DialogTitle>
                  </DialogHeader>
                  <SignaturePad onConfirm={handleSign} />
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
}
