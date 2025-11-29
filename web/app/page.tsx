"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Copy, Check } from "lucide-react";
import BalanceChart from "./components/BalanceChart";
import PortfolioChart from "./components/PortfolioChart";
import Dropdown from "./components/Dropdown";
import TaoIcon from "./components/TaoIcon";
import LoadingScreen from "./components/LoadingScreen";

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
  const [timeRange, setTimeRange] = useState<number>(24); // Default to 1 day (24 hours)
  const [blockHighlight, setBlockHighlight] = useState(false);
  const prevBlockRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"ticks" | "extrinsics">("ticks");

  const coldkeyAddress = "5DoAKfL58HSgynPxM1mUpyw8Fm6wS9PREZcCj4Heooq5uN4B";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coldkeyAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch counts
      const [ticksCountRes, extrinsicsCountRes, ticksRes, extrinsicsRes] =
        await Promise.all([
          fetch(`${API_URL}/ticks/count`),
          fetch(`${API_URL}/extrinsics/count`),
          fetch(`${API_URL}/ticks?hours=${timeRange}`),
          fetch(`${API_URL}/extrinsics?hours=${timeRange}`),
        ]);

      const ticksCountData = await ticksCountRes.json();
      const extrinsicsCountData = await extrinsicsCountRes.json();
      const ticksData = await ticksRes.json();
      const extrinsicsData = await extrinsicsRes.json();

      setTicksCount(ticksCountData);
      setExtrinsicsCount(extrinsicsCountData);
      setTicks(ticksData);
      setExtrinsics(extrinsicsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  // Calculate current block number and animate when it changes
  const currentBlock = useMemo(() => {
    if (ticks.length === 0) return null;
    return ticks.reduce(
      (max, tick) => (tick.block_number > max ? tick.block_number : max),
      ticks[0].block_number
    );
  }, [ticks]);

  useEffect(() => {
    if (currentBlock !== null && prevBlockRef.current !== null) {
      if (currentBlock !== prevBlockRef.current) {
        setBlockHighlight(true);
        setTimeout(() => setBlockHighlight(false), 1000);
      }
    }
    prevBlockRef.current = currentBlock;
  }, [currentBlock]);

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

  // Calculate trading metrics
  const tradingMetrics = useMemo(() => {
    if (ticks.length === 0) {
      return {
        currentBalance: { total: 0, free: 0, root: 0, alpha: 0 },
        initialBalance: { total: 0, free: 0, root: 0, alpha: 0 },
        pnl: 0,
        pnlPercent: 0,
        portfolioDistribution: [],
        tradingStats: {
          totalTrades: 0,
          buyCount: 0,
          sellCount: 0,
          totalVolume: 0,
        },
      };
    }

    const sortedTicks = [...ticks].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const latestTick = sortedTicks[sortedTicks.length - 1];
    const earliestTick = sortedTicks[0];

    const parseBalance = (balance: string) =>
      parseFloat(balance.replace(/[τ,]/g, "")) || 0;

    const currentBalance = {
      total: parseBalance(latestTick.balance.total),
      free: parseBalance(latestTick.balance.free),
      root: parseBalance(latestTick.balance.root),
      alpha: parseBalance(latestTick.balance.alpha),
    };

    const initialBalance = {
      total: parseBalance(earliestTick.balance.total),
      free: parseBalance(earliestTick.balance.free),
      root: parseBalance(earliestTick.balance.root),
      alpha: parseBalance(earliestTick.balance.alpha),
    };

    const pnl = currentBalance.total - initialBalance.total;
    const pnlPercent =
      initialBalance.total > 0 ? (pnl / initialBalance.total) * 100 : 0;

    // Portfolio distribution
    const portfolioDistribution = [
      {
        name: "Free",
        value: currentBalance.free,
        color: "#BCE5DD",
        total: currentBalance.total,
      },
      {
        name: "Root Staked",
        value: currentBalance.root,
        color: "#60A5FA",
        total: currentBalance.total,
      },
      {
        name: "Alpha Staked",
        value: currentBalance.alpha,
        color: "#A78BFA",
        total: currentBalance.total,
      },
    ].filter((item) => item.value > 0);

    // Trading statistics
    const tradingExtrinsics = extrinsics.filter(
      (ext) =>
        ext.call_function === "add_stake_limit" ||
        ext.call_function === "remove_stake_limit"
    );

    const buyCount = tradingExtrinsics.filter(
      (ext) => ext.call_function === "add_stake_limit"
    ).length;
    const sellCount = tradingExtrinsics.filter(
      (ext) => ext.call_function === "remove_stake_limit"
    ).length;

    const totalVolume = tradingExtrinsics.reduce((sum, ext) => {
      return sum + (ext.amount ? ext.amount / 1e9 : 0);
    }, 0);

    return {
      currentBalance,
      initialBalance,
      pnl,
      pnlPercent,
      portfolioDistribution,
      tradingStats: {
        totalTrades: tradingExtrinsics.length,
        buyCount,
        sellCount,
        totalVolume,
      },
    };
  }, [ticks, extrinsics]);

  if (loading) {
    return (
      <LoadingScreen
        onComplete={() => {
          setLoading(false);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ animation: "fade-in 0.4s ease-in" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-6">
          {/* Balance Over Time Chart */}
          <div className="bg-white dark:bg-[#181819] p-6 rounded-lg shadow lg:col-span-4">
            <div className="flex items-end justify-between mb-5">
              <div className="ml-2">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Balance
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-baseline gap-0.5 text-3xl font-normal text-[#181819] dark:text-zinc-100">
                    <TaoIcon />
                    {tradingMetrics.currentBalance.total.toFixed(2)}
                  </div>

                  <div
                    className={`inline-flex items-center px-2 py-1 mt-1 rounded-md text-xs font-medium ${
                      tradingMetrics.pnlPercent >= 0
                        ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tradingMetrics.pnlPercent >= 0 ? "+" : ""}
                    {tradingMetrics.pnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              <Dropdown
                value={timeRange}
                onChange={(val) => setTimeRange(Number(val))}
                options={[
                  { value: 24, label: "1d" },
                  { value: 168, label: "7d" },
                  { value: 720, label: "30d" },
                ]}
              />
            </div>
            <BalanceChart data={ticksChartData} />
          </div>

          {/* Right Column - Portfolio and Info */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Info Card */}
            <div className="bg-white dark:bg-[#181819] p-4 rounded-lg shadow">
              <div className="space-y-3">
                <div className="relative">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    Coldkey Address
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-[#181819] dark:text-zinc-100 break-all truncate flex-1">
                      {coldkeyAddress}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex-shrink-0 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-[#BCE5DD] transition-colors" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-colors" />
                      )}
                      {copied && (
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-zinc-800 dark:bg-zinc-700 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                          Address copied
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    Last Synchronized Block
                  </div>
                  <div
                    className="text-sm transition-colors duration-500 text-[#181819] dark:text-zinc-100"
                    style={{
                      color: blockHighlight ? "#BCE5DD" : undefined,
                    }}
                  >
                    {currentBlock !== null ? currentBlock : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Distribution */}
            <div className="bg-white dark:bg-[#181819] p-4 rounded-lg shadow">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                Portfolio Distribution
              </div>
              {tradingMetrics.portfolioDistribution.length > 0 ? (
                <PortfolioChart data={tradingMetrics.portfolioDistribution} />
              ) : (
                <div className="flex items-center justify-center py-4 text-zinc-500 dark:text-zinc-400 text-sm">
                  No portfolio data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tables with Tabs */}
        <div className="bg-white dark:bg-[#181819] p-6 rounded-lg shadow">
          {/* Tab Navigator */}
          <div className="flex items-center gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab("ticks")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "ticks"
                  ? "border-[#BCE5DD] text-[#181819] dark:text-zinc-100"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-[#181819] dark:hover:text-zinc-100"
              }`}
            >
              Ticks ({ticksCount.toLocaleString()})
            </button>
            <button
              onClick={() => setActiveTab("extrinsics")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "extrinsics"
                  ? "border-[#BCE5DD] text-[#181819] dark:text-zinc-100"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-[#181819] dark:hover:text-zinc-100"
              }`}
            >
              Extrinsics ({extrinsicsCount.toLocaleString()})
            </button>
          </div>

          {/* Ticks Table */}
          {activeTab === "ticks" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Time
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Total
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Alpha
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Root
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
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
          )}

          {/* Extrinsics Table */}
          {activeTab === "extrinsics" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Time
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Module
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Function
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Address
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Hotkey
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Netuid
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Amount
                    </th>
                    <th className="text-left p-2 text-[#181819] dark:text-zinc-100">
                      Limit Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extrinsics
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .slice(0, 10)
                    .map((ext, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.block_number}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {new Date(ext.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.call_module}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.call_function}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                          {ext.address.slice(0, 8)}...{ext.address.slice(-6)}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                          {ext.hotkey
                            ? `${ext.hotkey.slice(0, 8)}...${ext.hotkey.slice(
                                -6
                              )}`
                            : "-"}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.netuid ?? "-"}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.amount ? (ext.amount / 1e9).toFixed(2) : "-"}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {ext.limit_price
                            ? (ext.limit_price / 1e9).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
