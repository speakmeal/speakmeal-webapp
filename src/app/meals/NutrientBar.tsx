interface Props {
    label: string, 
    value: number, 
    color: string
}

const NutrientBar = ({ label, value, color }: Props) => {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min((value / 300) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NutrientBar;
