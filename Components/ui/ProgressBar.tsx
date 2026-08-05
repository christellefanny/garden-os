type ProgressBarProps = {
  value: number;
  color?: string;
};

export default function ProgressBar({
  value,
  color = "#5f8f64",
}: ProgressBarProps) {
  return (
    <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(value, 100)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}