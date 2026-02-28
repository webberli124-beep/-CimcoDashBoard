import type { MachineData } from "@/types/dashboard";
import { MachineCard } from "@/components/machine-card/machine-card";

interface MachineGridProps {
  machines: MachineData[];
  isTV?: boolean;
  greenThreshold?: number;
  yellowThreshold?: number;
  onSelectMachine: (machine: MachineData) => void;
}

export function MachineGrid({
  machines,
  isTV = false,
  greenThreshold = 100,
  yellowThreshold = 80,
  onSelectMachine,
}: MachineGridProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: isTV
          ? "repeat(4, 1fr)"
          : "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
        gap: isTV ? "20px" : "12px",
      }}
    >
      {machines.map((m) => (
        <MachineCard
          key={m.id}
          machine={m}
          isTV={isTV}
          greenThreshold={greenThreshold}
          yellowThreshold={yellowThreshold}
          onClick={() => onSelectMachine(m)}
        />
      ))}
    </div>
  );
}
