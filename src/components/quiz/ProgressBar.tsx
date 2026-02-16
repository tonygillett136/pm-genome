interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const progress = ((current) / total) * 100;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm text-[#9CA3AF]">
        <span>Question {current + 1} of {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[#2A2A3A]">
        <div
          className="h-full rounded-full bg-[#6366F1] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
