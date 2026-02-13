interface FintoLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function FintoLogo({
  className = "",
  showText = true,
  size = "md",
}: FintoLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 36, text: "text-xl" },
    lg: { icon: 44, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <FintoLogoIcon size={icon} />
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent ${text}`}>Finto</span>
      )}
    </div>
  );
}

export function FintoLogoIcon({ size = 32 }: { size?: number }) {
  // Use the generated PNG logo for a crisp, professional look
  return (
    <img
      src="/finto-logo-icon.png"
      alt="Finto"
      width={size}
      height={size}
      style={{ borderRadius: '22%' }}
    />
  );
}
