"use client";

import React from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import {
  ubiBalance,
  stakingInfo,
  ubiDistributionData,
  claimHistory,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

function UBIFinancials() {
  const { user } = useSelector((state: any) => state.auth);

  return (
    <Card>
      <CardHeader className="text-heading font-semibold">
        <CardTitle>UBI & Financials</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
          {/* EQM Balance Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-100 shadow-md rounded-lg p-6 dark:bg-zinc-900">
              <h2 className="text-heading text-xl font-semibold mb-4">EQM Balance</h2>
              <div>
                <p className="text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(ubiBalance?.currentBalance || 0)}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Lifetime Earnings:{" "}
                  {formatCurrency(ubiBalance?.lifetimeEarnings || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  Pending Claims:{" "}
                  {formatCurrency(ubiBalance?.pendingClaims || 0)}
                </p>
              </div>
            </div>

            {/* Claim History */}
            <div className="bg-slate-100 shadow-md rounded-lg p-6 dark:bg-zinc-900">
              <h2 className="text-heading text-xl font-semibold mb-4">Claim History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-zinc-600">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimHistory.map((claim) => (
                      <tr key={claim.id} className="border-b">
                        <td className="p-2">
                          {new Date(claim.date).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`
                            px-2 py-1 rounded text-xs 
                            ${
                              claim.status === "Claimed"
                                ? "bg-green-100 text-green-800"
                                : claim.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          `}
                          >
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Staking & UBI Distribution Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Staking Information */}
            <div className="bg-slate-100 shadow-md rounded-lg p-6 dark:bg-zinc-900">
              <h2 className="text-heading text-xl font-semibold mb-4">Staking</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-500">Total Staked</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(stakingInfo?.totalStaked || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Current Yield</p>
                  <p className="text-lg">
                    {stakingInfo?.currentYield.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Annual Percentage Yield</p>
                  <p className="text-lg">
                    {stakingInfo?.annualPercentageYield.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Pending Rewards</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(stakingInfo?.pendingRewards || 0)}
                  </p>
                </div>
                <Button
                  className="w-full mt-4 bg-green-900 text-white px-4 py-2 rounded hover:bg-green-800"
                >
                  Stake EQM
                </Button>
              </div>
            </div>

            {/* UBI Distribution Insights */}
            <div className="bg-slate-100 shadow-md rounded-lg p-6 dark:bg-zinc-900">
              <h2 className="text-heading text-xl font-semibold mb-4">
                UBI Distribution Insights
              </h2>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={ubiDistributionData?.monthlyAllocations}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="allocation"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Total Allocation"
                    />
                    <Line
                      type="monotone"
                      dataKey="claimed"
                      stroke="#16a34a"
                      name="Claimed Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Upcoming Allocations</h3>
                {ubiDistributionData?.upcomingAllocations.map(
                  (allocation, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b py-2"
                    >
                      <span>{allocation.date}</span>
                      <span className="font-bold">
                        {formatCurrency(allocation.expectedAmount)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}

export default UBIFinancials;
