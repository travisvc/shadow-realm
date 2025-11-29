export default function LoadingPulse() {
  return (
    <div className="relative flex items-center justify-center mb-4">
      <div
        className="absolute w-6 h-6 border-4 border-[#BCE5DD] rounded-full"
        style={{ animation: "ring-main 1.8s ease-in-out infinite" }}
      ></div>
      <div
        className="absolute w-6 h-6 border-4 border-[#BCE5DD] rounded-full"
        style={{ animation: "ring-pulse 1.8s ease-out infinite -0.05s" }}
      ></div>
    </div>
  );
}
