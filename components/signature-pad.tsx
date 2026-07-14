"use client";

import { useRef, useState, useTransition } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignaturePad({
  onConfirm,
}: {
  onConfirm: (signedByName: string, signatureDataUrl: string) => Promise<void>;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signedByName, setSignedByName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    sigRef.current?.clear();
  }

  function handleConfirm() {
    setError(null);

    if (!signedByName.trim()) {
      setError("Informe o nome de quem está assinando.");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Colete a assinatura antes de confirmar.");
      return;
    }

    const dataUrl = sigRef.current.toDataURL("image/png");
    startTransition(async () => {
      await onConfirm(signedByName.trim(), dataUrl);
    });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Nome de quem está assinando (aluno ou responsável)"
        value={signedByName}
        onChange={(event) => setSignedByName(event.target.value)}
      />
      <div className="rounded-md border bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{ className: "h-40 w-full touch-none" }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpar
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={pending}>
          {pending ? "Salvando..." : "Confirmar assinatura"}
        </Button>
      </div>
    </div>
  );
}
