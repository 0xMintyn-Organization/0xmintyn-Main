"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Store, ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface SellerSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerType?: string;
}

export default function SellerSuccessModal({ isOpen, onClose, sellerType }: SellerSuccessModalProps) {
  const router = useRouter();

  const handleCreateProduct = () => {
    onClose();
    router.push("/marketplace/create-product");
  };

  const handleCreateService = () => {
    onClose();
    router.push("/marketplace/create-service");
  };

  const handleViewDashboard = () => {
    onClose();
    router.push("/marketplace/seller-dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            Welcome to the Marketplace!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Store className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Your seller profile has been created successfully!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You can now start selling digital products and services on our marketplace.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              What would you like to do next?
            </h4>
            
            <div className={`grid gap-4 ${
              sellerType === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}>
              {(sellerType === "products" || sellerType === "both") && (
                <Button
                  onClick={handleCreateProduct}
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-6 w-6" />
                  <span className="font-semibold">Create a Product</span>
                  <span className="text-sm opacity-90">Sell digital products</span>
                </Button>
              )}

              {(sellerType === "services" || sellerType === "both") && (
                <Button
                  onClick={handleCreateService}
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-6 w-6" />
                  <span className="font-semibold">Create a Service</span>
                  <span className="text-sm opacity-90">Offer your services</span>
                </Button>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleViewDashboard}
                variant="outline"
                className="w-full gap-2"
              >
                <Store className="h-4 w-4" />
                View Seller Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={
                sellerType === "services" 
                  ? handleCreateService 
                  : handleCreateProduct
              } 
              className="bg-green-600 hover:bg-green-700"
            >
              {sellerType === "services" ? "Start Offering Services" : "Start Selling"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
