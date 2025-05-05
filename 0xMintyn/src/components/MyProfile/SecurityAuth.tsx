import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa6";

function SecurityAuth() {
  const [isChecked, setIsChecked] = useState<boolean>(true);
  const [transactionLimit, setTransactionLimit] = useState("1000");
  const [sessions, setSessions] = useState([
    "Device 1 - Active",
    "Device 2 - Active",
  ]);

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg">
      <div className="p-6 space-y-6">
        {/* Multi-Sig & Web3 Login */}
        <Card className="bg-slate-100">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">
              Multi-Signature & Web3 Login
            </h2>
            <Button className="bg-green-900 text-white hover:text-white hover:bg-green-700">
              <LogIn /> Connect Multi-Sig Wallet
            </Button>
            <div className="flex gap-4">
              <Button className="bg-green-900 text-white hover:text-white hover:bg-green-700">
                <FcGoogle /> Login with Google
              </Button>
              <Button className="bg-green-900 text-white hover:text-white hover:bg-green-700">
                <FaApple /> Login with Apple
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Approval */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Transaction Approval</h2>
            <Label>Set Withdrawal/Transfer Limit</Label>
            <Input
              type="number"
              value={transactionLimit}
              onChange={(e) => setTransactionLimit(e.target.value)}
              className="w-full dark:bg-zinc-700 bg-slate-200"
            />
            <div className="flex items-center gap-2">
              <Switch defaultChecked onCheckedChange={setIsChecked} />
              {isChecked ? "Disable Approval" : "Enable Approval"}
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Session Management</h2>
            {sessions.map((session, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{session}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Logout"
                  onClick={() =>
                    setSessions(sessions.filter((_, i) => i !== index))
                  }
                >
                  <LogOut className="w-8 h-8" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SecurityAuth;
