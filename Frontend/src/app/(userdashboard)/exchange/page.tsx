"use client";

import { ArrowLeftRight } from "lucide-react";
import Protected from "@/hooks/useProtected";
import { Card, CardContent } from "@/components/ui/card";

function Exchange() {
  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <ArrowLeftRight className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Exchange
            </h1>
            
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8">
              Coming Soon
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-500 mb-6">
              We're working hard to bring you an amazing token exchange experience. 
              Stay tuned for updates!
            </p>
            
           
          </CardContent>
        </Card>
      </div>
    </Protected>
  );
}

export default Exchange;
