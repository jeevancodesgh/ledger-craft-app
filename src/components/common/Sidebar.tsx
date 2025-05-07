
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { 
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Package2
} from "lucide-react";

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobile = false,
  isOpen = false,
  onClose = () => {},
}) => {
  const location = useLocation();
  const { businessProfile } = useAppContext();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? currentPath === path : currentPath.startsWith(path);
    return `flex items-center space-x-2 py-2 px-4 rounded-md transition-colors ${
      isActive
        ? "bg-primary text-primary-foreground"
        : "hover:bg-primary/10 text-foreground"
    }`;
  };

  return (
    <div
      className={`${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-lg transform ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out`
          : "min-h-screen w-64 border-r"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold truncate">
            {businessProfile?.name || "Invoice App"}
          </h1>
          {isMobile && (
            <button onClick={onClose} className="p-1">
              <X size={20} />
            </button>
          )}
        </div>
        <nav className="space-y-1">
          <Link to="/" className={getLinkClass("/", true)}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/customers" className={getLinkClass("/customers")}>
            <Users size={20} />
            <span>Customers</span>
          </Link>
          <Link to="/invoices" className={getLinkClass("/invoices")}>
            <FileText size={20} />
            <span>Invoices</span>
          </Link>
          <Link to="/items" className={getLinkClass("/items")}>
            <Package2 size={20} />
            <span>Items</span>
          </Link>
          <Link to="/settings" className={getLinkClass("/settings")}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
