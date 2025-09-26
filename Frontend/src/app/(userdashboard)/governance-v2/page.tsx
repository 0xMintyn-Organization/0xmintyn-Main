"use client";

import React from 'react';
import GovernanceDashboard from '@/components/Governance/GovernanceDashboard';
import Protected from '@/hooks/useProtected';

function GovernanceV2Page() {
  return (
    <Protected>
      <div className="container mx-auto py-6 px-4">
        <GovernanceDashboard />
      </div>
    </Protected>
  );
}

export default GovernanceV2Page;
