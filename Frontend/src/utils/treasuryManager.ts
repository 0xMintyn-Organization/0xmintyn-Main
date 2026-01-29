/*
  Treasury manager stub
  ---------------------
  On-chain integration removed. This file provides safe no-op
  functions so UI components can import the same symbols without
  causing compile-time errors. None of these functions perform
  network actions.
*/

export async function getTreasuryBalance(): Promise<number> {
  return 0;
}

export async function getAuthorityBalance(_authority: unknown): Promise<number> {
  return 0;
}

export async function getSupportedUsers(): Promise<number> {
  return 0;
}

export async function needsFunding(_threshold: number = 100_000): Promise<boolean> {
  return false;
}

export async function fundTreasury(_authority: unknown, _amount: number, _provider?: any): Promise<string> {
  throw new Error("Treasury funding feature removed");
}

export async function autoFundTreasury(_authority: unknown, _targetBalance: number, _provider?: any): Promise<string | null> {
  throw new Error("Auto-fund feature removed");
}

export async function getTreasuryStatus() {
  return {
    treasuryAddress: "DISABLED",
    currentBalance: 0,
    supportedUsers: 0,
    status: "DISABLED",
    recommendation: "Treasury features have been removed",
  };
}


