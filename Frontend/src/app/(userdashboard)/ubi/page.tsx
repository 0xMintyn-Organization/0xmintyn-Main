"use client";

import React from 'react';
import UBIDashboard from '@/components/UBI/UBIDashboard';
import Protected from '@/hooks/useProtected';

function UBIPage() {
  return (
    <Protected>
      <div className="container mx-auto py-6 px-4">
        <UBIDashboard />
      </div>
    </Protected>
  );
}

export default UBIPage;
