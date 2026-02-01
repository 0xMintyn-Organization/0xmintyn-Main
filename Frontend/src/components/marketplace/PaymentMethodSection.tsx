"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import type { PaymentMethodBody, PaymentMethodStored } from "@/lib/marketplaceApi";

const METHOD_OPTIONS: { value: PaymentMethodBody["methodType"]; label: string }[] = [
  { value: "", label: "None" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bank account" },
  { value: "crypto", label: "Crypto wallet" },
];

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***@${domain}`;
}

function maskCrypto(addr: string) {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type Props = {
  value: PaymentMethodStored | undefined;
  editing: boolean;
  onChange: (next: PaymentMethodBody) => void;
  /** Optional label prefix (e.g. "Payment method (receive & send)") */
  label?: string;
  className?: string;
};

export function PaymentMethodSection({ value, editing, onChange, label = "Payment method (receive & send)", className = "" }: Props) {
  const pm = value?.methodType ? value : undefined;
  const [methodType, setMethodType] = useState<PaymentMethodBody["methodType"]>(pm?.methodType ?? "");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiry, setCardExpiry] = useState(pm?.methodType === "card" ? pm.cardExpiry ?? "" : "");
  const [cardCvc, setCardCvc] = useState("");
  const [cardholderName, setCardholderName] = useState(pm?.methodType === "card" ? pm.cardholderName ?? "" : "");
  const [paypalEmail, setPaypalEmail] = useState(pm?.methodType === "paypal" ? pm.paypalEmail ?? "" : "");
  const [bankName, setBankName] = useState(pm?.methodType === "bank" ? pm.bankName ?? "" : "");
  const [accountHolderName, setAccountHolderName] = useState(pm?.methodType === "bank" ? pm.accountHolderName ?? "" : "");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [routing, setRouting] = useState(pm?.methodType === "bank" ? pm.routing ?? "" : "");
  const [cryptoAddress, setCryptoAddress] = useState(pm?.methodType === "crypto" ? pm.cryptoAddress ?? "" : "");

  useEffect(() => {
    const m = value?.methodType ?? "";
    setMethodType(m);
    if (m === "card") {
      setCardExpiry(value?.cardExpiry ?? "");
      setCardholderName(value?.cardholderName ?? "");
    } else if (m === "paypal") setPaypalEmail(value?.paypalEmail ?? "");
    else if (m === "bank") {
      setBankName(value?.bankName ?? "");
      setAccountHolderName(value?.accountHolderName ?? "");
      setRouting(value?.routing ?? "");
    } else if (m === "crypto") setCryptoAddress(value?.cryptoAddress ?? "");
  }, [value]);

  const commitPaypal = () => {
    onChange({ methodType: "paypal", paypalEmail: paypalEmail.trim() });
  };

  const commitBank = () => {
    const last4 = accountNumberInput.replace(/\D/g, "").slice(-4);
    onChange({
      methodType: "bank",
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim(),
      accountLast4: last4 || pm?.accountLast4,
      routing: routing.trim(),
    });
  };

  const commitCrypto = () => {
    onChange({ methodType: "crypto", cryptoAddress: cryptoAddress.trim() });
  };

  const handleMethodTypeChange = (v: PaymentMethodBody["methodType"]) => {
    setMethodType(v);
    if (v === "") onChange({ methodType: "" });
    else if (v === "card") onChange({ methodType: "card", cardLast4: pm?.cardLast4, cardExpiry: cardExpiry, cardholderName: cardholderName });
    else if (v === "paypal") onChange({ methodType: "paypal", paypalEmail: paypalEmail || pm?.paypalEmail });
    else if (v === "bank") onChange({ methodType: "bank", bankName: bankName, accountHolderName: accountHolderName, accountLast4: pm?.accountLast4, routing: routing });
    else if (v === "crypto") onChange({ methodType: "crypto", cryptoAddress: cryptoAddress || pm?.cryptoAddress });
  };

  if (!editing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-muted-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {label}
        </Label>
        <div className="text-foreground">
          {!pm?.methodType && "—"}
          {pm?.methodType === "card" && (
            <div className="space-y-1">
              <p>Card •••• {pm.cardLast4 || "****"}</p>
              <p className="text-sm text-muted-foreground">Expiry: {pm.cardExpiry || "—"} (only you can see this)</p>
              {pm.cardholderName && <p className="text-sm">Name: {pm.cardholderName}</p>}
            </div>
          )}
          {pm?.methodType === "paypal" && <p>PayPal: {maskEmail(pm.paypalEmail || "")}</p>}
          {pm?.methodType === "bank" && (
            <div className="space-y-1">
              <p>{pm.bankName || "Bank"} •••• {pm.accountLast4 || "****"}</p>
              {pm.accountHolderName && <p className="text-sm">Account: {pm.accountHolderName}</p>}
            </div>
          )}
          {pm?.methodType === "crypto" && <p className="font-mono text-sm">{maskCrypto(pm.cryptoAddress || "")}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-muted-foreground flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        {label}
      </Label>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Method</Label>
        <select
          value={methodType}
          onChange={(e) => handleMethodTypeChange(e.target.value as PaymentMethodBody["methodType"])}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          {METHOD_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {methodType === "card" && (
        <div className="grid gap-4 rounded-lg border border-border p-4 bg-muted/20">
          <p className="text-xs text-muted-foreground">Only last 4 digits and expiry are stored. Full number and CVC are never saved.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Card number</Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder={pm?.cardLast4 ? `•••• •••• •••• ${pm.cardLast4}` : "1234 5678 9012 3456"}
                value={cardNumberInput}
                onChange={(e) => {
                  setCardNumberInput(e.target.value);
                  const last4 = e.target.value.replace(/\D/g, "").slice(-4);
                  onChange({ methodType: "card", cardLast4: last4 || pm?.cardLast4, cardExpiry: cardExpiry, cardholderName: cardholderName });
                }}
              />
              <p className="text-xs text-muted-foreground">Only last 4 digits are stored for receiving payments.</p>
            </div>
            <div className="space-y-2">
              <Label>Expiry (MM/YY)</Label>
              <Input
                placeholder="12/28"
                value={cardExpiry}
                onChange={(e) => {
                  setCardExpiry(e.target.value);
                  onChange({ methodType: "card", cardLast4: pm?.cardLast4 || cardNumberInput.replace(/\D/g, "").slice(-4), cardExpiry: e.target.value, cardholderName: cardholderName });
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>CVC</Label>
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Not stored. Only for your reference when paying out.</p>
            </div>
            <div className="space-y-2">
              <Label>Cardholder name</Label>
              <Input
                value={cardholderName}
                onChange={(e) => {
                  setCardholderName(e.target.value);
                  onChange({ methodType: "card", cardLast4: pm?.cardLast4 || cardNumberInput.replace(/\D/g, "").slice(-4), cardExpiry: cardExpiry, cardholderName: e.target.value });
                }}
                placeholder="Name on card"
              />
            </div>
          </div>
        </div>
      )}

      {methodType === "paypal" && (
        <div className="space-y-2">
          <Label>PayPal email</Label>
          <Input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            onBlur={commitPaypal}
            placeholder="you@example.com"
          />
        </div>
      )}

      {methodType === "bank" && (
        <div className="grid gap-4 rounded-lg border border-border p-4 bg-muted/20">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} onBlur={commitBank} placeholder="e.g. Chase" />
            </div>
            <div className="space-y-2">
              <Label>Account holder name</Label>
              <Input value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} onBlur={commitBank} placeholder="Full name" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account number</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={accountNumberInput}
                onChange={(e) => setAccountNumberInput(e.target.value)}
                onBlur={commitBank}
                placeholder={pm?.accountLast4 ? `••••${pm.accountLast4}` : "Only last 4 stored"}
              />
            </div>
            <div className="space-y-2">
              <Label>Routing number</Label>
              <Input value={routing} onChange={(e) => setRouting(e.target.value)} onBlur={commitBank} placeholder="9 digits" />
            </div>
          </div>
        </div>
      )}

      {methodType === "crypto" && (
        <div className="space-y-2">
          <Label>Wallet address</Label>
          <Input
            value={cryptoAddress}
            onChange={(e) => setCryptoAddress(e.target.value)}
            onBlur={commitCrypto}
            placeholder="0x... or bc1..."
          />
        </div>
      )}
    </div>
  );
}
