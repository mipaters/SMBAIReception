import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDemo } from "../../context/DemoContext";
import { getOperator } from "../../data/operators";

const PRIMARY_NAV = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/live-demo", label: "Live Demo", icon: "📞" },
  { to: "/appointments", label: "Appointments", icon: "🗓️" },
  { to: "/history", label: "History", icon: "🕑" },
];

const SECONDARY_NAV = [
  { to: "/setup", label: "Setup wizard" },
  { to: "/business-profile", label: "Business profile" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/privacy", label: "Privacy" },
  { to: "/architecture", label: "Architecture" },
  { to: "/about", label: "About this concept" },
];

function BrandMark({ productName }: { productName: string }) {
  return (
    <div className="brand">
      <span className="brand-mark">R</span>
      <span>{productName}</span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { resetDemo, operatorId } = useDemo();
  const operator = getOperator(operatorId);

  const handleReset = () => {
    resetDemo();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="app-shell">
      <nav className="nav-rail">
        <BrandMark productName={operator.productName} />
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="nav-section">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button className="more-menu-item" style={{ color: "var(--brand)" }} onClick={handleReset}>
            Reset demo
          </button>
        </div>
      </nav>

      <div className="app-main">
        <div className="top-bar">
          <BrandMark productName={operator.productName} />
          <button className="menu-button" aria-label="More options" onClick={() => setMenuOpen(true)}>
            ☰
          </button>
        </div>
        {children}
      </div>

      <nav className="bottom-nav">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {menuOpen && (
        <div className="more-menu" onClick={() => setMenuOpen(false)}>
          <div className="more-menu-panel" onClick={(e) => e.stopPropagation()}>
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="more-menu-item" onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <button className="more-menu-item" style={{ color: "var(--brand)" }} onClick={handleReset}>
              Reset demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
