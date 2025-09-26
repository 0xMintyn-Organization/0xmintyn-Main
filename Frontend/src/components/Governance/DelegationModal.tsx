"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ArrowRight } from 'lucide-react';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DelegationModal: React.FC<DelegationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [delegateAddress, setDelegateAddress] = useState('');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Delegation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Vote Delegation</h3>
                <p className="text-sm text-muted-foreground">
                  Delegate your voting power to another address to vote on your behalf
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delegate">Delegate Address</Label>
              <Input
                id="delegate"
                placeholder="Enter wallet address to delegate to"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Delegate
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DelegationModal;
