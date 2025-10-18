"use client";

import { useWarPressure } from "../hooks/useWarPressure";

interface PressuredButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  buttonId: string;
  warMessage?: string;
}

export default function PressuredButton({ 
  children, 
  buttonId, 
  warMessage = "This action is restricted due to pending wars! ⚔️",
  className = "",
  ...props 
}: PressuredButtonProps) {
  const { isButtonFrozen, getButtonProps, pressureLevel } = useWarPressure();
  const buttonProps = getButtonProps(buttonId);
  const frozen = isButtonFrozen(buttonId);

  if (frozen) {
    return (
      <div className="relative">
        <button
          {...props}
          {...buttonProps}
          className={`${className} ${buttonProps.className}`}
          onClick={(e) => {
            e.preventDefault();
            alert(warMessage);
          }}
        >
          {children}
        </button>
        
        {/* Frozen overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold border border-red-800">
            ❄️ FROZEN
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      {...props}
      className={className}
    >
      {children}
    </button>
  );
}
