/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeEvent, FormEvent } from "react";

interface ConnectAccountType {
    submitAccount: (e: FormEvent) => void;
    accountToAdd: string;
    accToAddFunc: (e: ChangeEvent<HTMLSelectElement>) => void;
    cancelAddAccount: () => void;
}

export default function ConnectAccount({ submitAccount, accountToAdd, accToAddFunc, cancelAddAccount }: ConnectAccountType) {
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      
    </div>
  );
}
