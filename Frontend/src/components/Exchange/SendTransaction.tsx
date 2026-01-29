// On-chain transaction helper removed.
// This stub preserves imports but no longer performs on-chain transactions.

const sendSol = async (_receiver: string, _amount: number) => {
  console.warn('sendSol is disabled: on-chain transactions removed');
  return null;
};

export default sendSol;