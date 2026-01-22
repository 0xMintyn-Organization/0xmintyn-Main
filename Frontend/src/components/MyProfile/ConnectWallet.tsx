/* ConnectWallet: Phantom integration removed */
const ConnectAccount = () => {
    const handleAcknowledge = () => {
        // Clear any stored wallet address from localStorage
        localStorage.removeItem("phantom_wallet");
        console.log("Phantom integration removed: acknowledged");
    };

    return (
        <div style={{ padding: "1rem", fontFamily: "monospace" }}>
            <p>
                Phantom wallet integration has been removed from this application.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
                If you previously connected a wallet, it has been cleared. For alternative flows, contact your administrator.
            </p>
            <button onClick={handleAcknowledge} style={{ marginTop: '1rem' }}>
                Acknowledge
            </button>
        </div>
    );
};

export default ConnectAccount;
