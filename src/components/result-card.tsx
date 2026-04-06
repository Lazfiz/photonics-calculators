"use client";

interface ResultCardProps {
  label: string;
  value: string;
  tone?: "blue" | "green" | "yellow" | "orange" | "purple" | "cyan" | "red" | "gray";
  subtext?: string;
}

const toneMap = {
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  red: "text-red-400",
  gray: "text-gray-400",
};

export default function ResultCard({ label, value, tone = "blue", subtext }: ResultCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4" role="status" aria-label={`${label}: ${value}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${toneMap[tone]}`}>{value}</p>
      {subtext ? <p className="text-sm text-gray-500 mt-1">{subtext}</p> : null}
    </div>
  );
}
