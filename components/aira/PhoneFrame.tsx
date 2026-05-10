import type { ReactNode } from "react";

export function PhoneFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="phone-card">
      {label ? <div className="phone-label">{label}</div> : null}
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="phone-status">
            <span>9:41</span>
            <span className="phone-notch" />
            <span>▮▮ ◒ ▱</span>
          </div>
          {children}
          <div className="phone-home" />
        </div>
      </div>
    </div>
  );
}
