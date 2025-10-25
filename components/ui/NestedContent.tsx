import React from "react";
import NestedTable, { NestedColumn } from "./NestedTable";

interface NestedSection<T> {
  title: string;
  data: T[];
  columns: NestedColumn<T>[];
  emptyMessage?: string;
}

interface NestedContentProps {
  sections: NestedSection<any>[];
  className?: string;
}

export default function NestedContent({ 
  sections, 
  className = "" 
}: NestedContentProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section, idx) => (
        <NestedTable
          key={idx}
          title={section.title}
          columns={section.columns}
          data={section.data}
          emptyMessage={section.emptyMessage}
        />
      ))}
    </div>
  );
}