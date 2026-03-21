import { Outlet } from "react-router-dom";
import PieNav from "./PieNav";

const PieLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <PieNav />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PieLayout;
