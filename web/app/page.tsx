"use client";

import { useEffect, useState, useMemo } from "react";
import BalanceChart from "./components/BalanceChart";

const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "http://localhost:8000";

interface Tick {
  block_number: number;
  timestamp: string;
  balance: {
    total: string;
    free: string;
    root: string;
    alpha: string;
  };
}

interface Extrinsic {
  block_number: number;
  timestamp: string;
  address: string;
  call_module: string;
  call_function: string;
  hotkey: string | null;
  netuid: number | null;
  amount: number | null;
  limit_price: number | null;
}

export default function Home() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [extrinsics, setExtrinsics] = useState<Extrinsic[]>([]);
  const [ticksCount, setTicksCount] = useState<number>(0);
  const [extrinsicsCount, setExtrinsicsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch counts
      const [ticksCountRes, extrinsicsCountRes, ticksRes, extrinsicsRes] =
        await Promise.all([
          fetch(`${API_URL}/ticks/count`),
          fetch(`${API_URL}/extrinsics/count`),
          fetch(`${API_URL}/ticks?limit=100`),
          fetch(`${API_URL}/extrinsics?limit=100`),
        ]);

      const ticksCountData = await ticksCountRes.json();
      const extrinsicsCountData = await extrinsicsCountRes.json();
      const ticksData = await ticksRes.json();
      const extrinsicsData = await extrinsicsRes.json();

      setTicksCount(ticksCountData);
      setExtrinsicsCount(extrinsicsCountData);
      setTicks(ticksData);
      setExtrinsics(extrinsicsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const ticksChartData = useMemo(
    () =>
      ticks
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .map((tick) => {
          const date = new Date(tick.timestamp);
          return {
            timestamp: date.getTime(),
            total: parseFloat(tick.balance.total.replace(/[τ,]/g, "")) || 0,
            free: parseFloat(tick.balance.free.replace(/[τ,]/g, "")) || 0,
            alpha: parseFloat(tick.balance.alpha.replace(/[τ,]/g, "")) || 0,
          };
        }),
    [ticks]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
          The Shadow Realm
        </h1>

        {/* Balance Over Time Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Balance
          </h2>
          <BalanceChart data={ticksChartData} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Ticks ({ticksCount.toLocaleString()})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Time
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Total
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Alpha
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Root
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Free
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticks
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .slice(0, 10)
                    .map((tick) => (
                      <tr
                        key={tick.block_number}
                        className="border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {tick.block_number}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {new Date(tick.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          τ
                          {parseFloat(
                            tick.balance.total.replace(/[τ,]/g, "")
                          ).toFixed(2)}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          τ
                          {parseFloat(
                            tick.balance.alpha.replace(/[τ,]/g, "")
                          ).toFixed(2)}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          τ
                          {parseFloat(
                            tick.balance.root.replace(/[τ,]/g, "")
                          ).toFixed(2)}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          τ
                          {parseFloat(
                            tick.balance.free.replace(/[τ,]/g, "")
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Extrinsics ({extrinsicsCount.toLocaleString()})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Function
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Netuid
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extrinsics.slice(0, 10).map((ext, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.block_number}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.call_function}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.netuid}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.amount ? (ext.amount / 1e9).toFixed(2) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
