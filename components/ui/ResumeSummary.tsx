import React from "react";

export type SummaryItem = {
  description: string;
  amount: number;
};

type Props = {
  items: SummaryItem[];
  currency?: string;
  title?: string;
  showTotal?: boolean;
  highlightLastRow?: boolean;
};

export default function ResumeSummary({
  items,
  currency = "Q.",
  title,
  showTotal = true,
  highlightLastRow = true,
}: Props) {
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <>
      {title && (
        <h2 className="text-sm font-semibold text-gray-900 mb-2">{title}</h2>
      )}
      <table className="w-full text-sm">
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 text-gray-600">{item.description}</td>
              <td className="py-2 text-right font-medium">
                {currency} {Number(item.amount).toFixed(2)}
              </td>
            </tr>
          ))}
          {showTotal && (
            <tr className={highlightLastRow ? "bg-orange-50" : ""}>
              <td className="py-2 text-gray-900 font-semibold">Total</td>
              <td
                className={`py-2 text-right font-bold ${
                  highlightLastRow ? "text-orange-600" : ""
                }`}
              >
                {currency} {Number(total).toFixed(2)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
