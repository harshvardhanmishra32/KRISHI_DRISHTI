"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  Layers,
  Info,
  X,
  Sparkles,
  PieChart as PieIcon,
  Tag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Skeleton from "../../components/Skeleton";
import ErrorBox from "../../components/ErrorBox";

const CATEGORIES = [
  { value: "seed", label: "Seeds (बीज)" },
  { value: "fertilizer", label: "Fertilizer (उर्वरक / खाद)" },
  { value: "pesticide", label: "Pesticide (कीटनाशक)" },
  { value: "labour", label: "Labour (मजदूरी)" },
  { value: "irrigation", label: "Irrigation (सिंचाई)" },
  { value: "other", label: "Other (अन्य)" },
];

export default function TrackerPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedCropId, setSelectedCropId] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [scenario, setScenario] = useState("modal"); // "low" | "modal" | "high"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customYieldInput, setCustomYieldInput] = useState("");
  const [isEditingYield, setIsEditingYield] = useState(false);

  // Add Expense Form state
  const [newCategory, setNewCategory] = useState("seed");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNote, setNewNote] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);

  // 1. Initial Load: Farms & Crops
  useEffect(() => {
    const init = async () => {
      try {
        const [farmList, cropList] = await Promise.all([
          api.get("/farms").catch(() => []),
          api.get("/crops").catch(() => []),
        ]);

        setFarms(farmList || []);
        setCrops(cropList || []);

        if (farmList && farmList.length > 0) {
          setSelectedFarmId(farmList[0].id);
        }
        if (cropList && cropList.length > 0) {
          setSelectedCropId(cropList[0].id);
        }
      } catch (err) {
        console.error("Init tracker error:", err);
      }
    };
    init();
  }, []);

  // 2. Fetch Expenses & Profit Summary
  const refreshData = useCallback(async (yieldOverride = null) => {
    if (!selectedFarmId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parallel requests
      const [expenseList, summaryRes] = await Promise.all([
        api.get(`/expenses?farm_id=${selectedFarmId}${selectedCropId ? `&crop_id=${selectedCropId}` : ""}`).catch(() => []),
        api.get(`/expenses/summary?farm_id=${selectedFarmId}`).catch(() => null),
      ]);

      setExpenses(expenseList || []);
      setSummary(summaryRes);

      // Fetch profit summary if crop is selected
      if (selectedCropId) {
        try {
          const yieldParam = yieldOverride !== null ? yieldOverride : customYieldInput;
          const yieldQuery = yieldParam ? `&expected_yield_quintal=${yieldParam}` : "";
          const pRes = await api.get(
            `/profit-summary?farm_id=${selectedFarmId}&crop_id=${selectedCropId}${yieldQuery}`
          );
          setProfitData(pRes);
        } catch (pErr) {
          console.warn("Profit summary unavailable:", pErr);
          setProfitData(null);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, selectedCropId, customYieldInput]);

  useEffect(() => {
    if (selectedFarmId) {
      refreshData();
    }
  }, [refreshData, selectedFarmId]);

  // Handle Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedFarmId || !selectedCropId) {
      setError("Please ensure farm and crop are selected.");
      return;
    }

    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid positive expense amount.");
      return;
    }

    setAddingExpense(true);
    setError(null);

    try {
      await api.post("/expenses", {
        farm_id: selectedFarmId,
        crop_id: selectedCropId,
        expense_type: newCategory,
        amount: amt,
        expense_date: newDate,
        note: newNote.trim() || undefined,
      });

      setIsAddOpen(false);
      setNewAmount("");
      setNewNote("");
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save expense.");
    } finally {
      setAddingExpense(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to delete expense.");
    }
  };

  // Find active profit scenario
  const activeScenario =
    profitData?.scenarios?.find((s) => s.scenario === scenario) ||
    profitData?.scenarios?.[1] ||
    null;

  // Prepare chart data from summary
  const chartData =
    summary?.by_month?.map((m) => ({
      month: m.month.slice(5), // e.g. '03', '04'
      total: Number(m.total_amount),
    })) || [];

  const maxExpense = Math.max(...chartData.map((d) => d.total), 1000);

  return (
    <ProtectedRoute>
      <div className="pb-24">
        <Header title={t("tracker_title")} showBack />

        <div className="p-4 space-y-4">
          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {/* Farm & Crop Filter Bar */}
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-krishi-grey uppercase mb-1">
                  Farm
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full text-xs font-bold text-krishi-text bg-white border border-krishi-border rounded-button px-2 py-1.5 focus:ring-2 focus:ring-krishi-green truncate"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-krishi-grey uppercase mb-1">
                  Crop
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full text-xs font-bold text-krishi-text bg-white border border-krishi-border rounded-button px-2 py-1.5 focus:ring-2 focus:ring-krishi-green truncate"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* TOP SUMMARY FINANCIAL CARD */}
          {loading ? (
            <Skeleton className="h-44 w-full rounded-card" />
          ) : (
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {profitData?.crop_name || "Financial Overview"}
                </span>

                {/* Scenario Toggle */}
                <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  {["low", "modal", "high"].map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setScenario(sc)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md capitalize transition-colors ${
                        scenario === sc
                          ? "bg-krishi-green text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profit Highlight */}
              <div className="mt-4">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {t("profit")} ({scenario} scenario)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-4xl font-black tracking-tight ${
                      Number(activeScenario?.profit ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    ₹{Number(activeScenario?.profit ?? 0).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {Number(activeScenario?.profit ?? 0) >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>

              {/* Spent & Expected Revenue */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-700/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {t("spent")}
                  </span>
                  <span className="text-sm font-bold text-white">
                    ₹{Number(summary?.total_expenses ?? profitData?.total_expenses ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {t("expected_revenue")}
                  </span>
                  <span className="text-sm font-bold text-white">
                    ₹{Number(activeScenario?.revenue ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Break-even Price */}
              {profitData?.break_even_price_per_quintal && (
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between text-[11px] text-slate-400">
                  <span>{t("break_even")}:</span>
                  <span className="font-mono font-bold text-amber-300">
                    ₹{Number(profitData.break_even_price_per_quintal).toFixed(0)} / quintal
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* YIELD PREDICTION WITH RANGE */}
          {profitData && (
            <Card className="p-4 space-y-3 bg-white border border-krishi-border shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-krishi-green flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-krishi-text">
                      Yield Prediction & Harvest Forecast
                    </h4>
                    <span className="text-[10px] text-krishi-grey">
                      {profitData.is_yield_estimated ? "AI XGBoost Model Estimate" : "Custom Specified Yield"}
                    </span>
                  </div>
                </div>
                <Chip variant={profitData.is_yield_estimated ? "success" : "info"} className="text-[10px] py-0.5">
                  {profitData.is_yield_estimated ? "ML Model" : "Manual"}
                </Chip>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-krishi-border text-center">
                <div>
                  <span className="text-[10px] text-krishi-grey block">Min Range</span>
                  <span className="text-xs font-mono font-bold text-krishi-text">
                    {profitData.yield_estimation_range?.min_quintal ?? (Number(profitData.yield_quintal) * 0.85).toFixed(1)} Q
                  </span>
                </div>
                <div className="border-x border-krishi-border">
                  <span className="text-[10px] text-krishi-green font-bold block">Expected Yield</span>
                  <span className="text-sm font-mono font-black text-krishi-green">
                    {Number(profitData.yield_quintal).toFixed(1)} Q
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-krishi-grey block">Max Range</span>
                  <span className="text-xs font-mono font-bold text-krishi-text">
                    {profitData.yield_estimation_range?.max_quintal ?? (Number(profitData.yield_quintal) * 1.15).toFixed(1)} Q
                  </span>
                </div>
              </div>

              {/* Yield Adjuster */}
              <div className="pt-1">
                {isEditingYield ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsEditingYield(false);
                      refreshData(customYieldInput);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Quintals"
                      value={customYieldInput}
                      onChange={(e) => setCustomYieldInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-krishi-border rounded-button focus:ring-2 focus:ring-krishi-green"
                    />
                    <Button type="submit" size="sm">
                      Apply
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingYield(false);
                        setCustomYieldInput("");
                        refreshData("");
                      }}
                      className="text-xs text-krishi-grey hover:text-krishi-red px-1"
                    >
                      Reset
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-krishi-grey">
                      Want to test a different yield scenario?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingYield(true)}
                      className="font-bold text-krishi-green hover:underline"
                    >
                      Adjust Yield
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* MONTHLY EXPENSES BAR CHART (Pure CSS / SVG for maximum reliability & 0 dependencies) */}
          {chartData.length > 0 && (
            <Card className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-krishi-green" />
                Monthly Expenses Breakdown
              </h3>
              <div className="h-36 flex items-end justify-between gap-3 pt-4 px-2 border-b border-krishi-border">
                {chartData.map((d, i) => {
                  const pct = Math.round((d.total / maxExpense) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono text-krishi-grey mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.total}
                      </span>
                      <div
                        className="w-full max-w-[28px] bg-krishi-green rounded-t-md transition-all duration-500 hover:bg-krishi-dark"
                        style={{ height: `${Math.max(pct, 8)}%` }}
                      />
                      <span className="text-[10px] font-bold text-krishi-grey mt-2">
                        M{d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* RECENT EXPENSES LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
                Recorded Expenses
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="text-xs font-bold text-krishi-green hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("add_expense")}
              </button>
            </div>

            {expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-krishi-light flex items-center justify-center text-krishi-green">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-krishi-text capitalize block leading-tight">
                          {item.expense_type}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-krishi-grey mt-0.5">
                          <span>{item.expense_date}</span>
                          {item.note && <span>• {item.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-krishi-text font-mono">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 text-slate-400 hover:text-krishi-red rounded-lg transition-colors"
                        title={t("delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-6 bg-slate-50 border-dashed">
                <IndianRupee className="w-8 h-8 text-krishi-grey mx-auto mb-1 opacity-50" />
                <p className="text-xs font-semibold text-krishi-text">
                  No expenses logged yet
                </p>
                <p className="text-[11px] text-krishi-grey mt-0.5 mb-3">
                  Log seed, fertilizer, and labour costs to estimate your profit
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsAddOpen(true)}
                  icon={Plus}
                  className="mx-auto"
                >
                  {t("add_expense")}
                </Button>
              </Card>
            )}
          </div>

          {/* ASSUMPTIONS DISCLOSURE */}
          {profitData?.assumptions && profitData.assumptions.length > 0 && (
            <Card className="bg-slate-50 border-krishi-border p-3.5 space-y-1.5">
              <h4 className="text-xs font-bold text-krishi-text flex items-center gap-1.5">
                <Info className="w-4 h-4 text-krishi-grey" />
                {t("assumptions")}
              </h4>
              <ul className="text-[11px] text-krishi-grey space-y-1 pl-4 list-disc">
                {profitData.assumptions.map((assump, idx) => (
                  <li key={idx}>{assump}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* MODAL SHEET: ADD EXPENSE */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-md shadow-2xl relative border-krishi-border max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="absolute top-4 right-4 p-2 text-krishi-grey hover:text-krishi-text rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 rounded-xl text-krishi-orange">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-krishi-text">
                    {t("add_expense")}
                  </h2>
                  <p className="text-xs text-krishi-grey">
                    Record farming costs for profit estimation
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    {t("expense_type")}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-krishi-border rounded-button text-xs font-bold text-krishi-text focus:ring-2 focus:ring-krishi-green"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    {t("amount")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-krishi-grey font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full pl-8 pr-3 py-2.5 border border-krishi-border rounded-button text-sm font-mono font-bold focus:ring-2 focus:ring-krishi-green focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-krishi-border rounded-button text-xs font-medium focus:ring-2 focus:ring-krishi-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    Note / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. 50kg Urea bag or 2 laborers"
                    className="w-full px-3 py-2 border border-krishi-border rounded-button text-xs focus:ring-2 focus:ring-krishi-green"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    loading={addingExpense}
                    className="flex-1"
                  >
                    {t("save")}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
