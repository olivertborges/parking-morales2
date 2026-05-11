import { Clock3, CalendarDays, Menu } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString("es-UY", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setDate(
        now.toLocaleDateString("es-UY", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center">
          <Menu className="w-4 h-4 text-amber-500" />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-bold">
            Parking Morales
          </h1>

          <p className="text-[10px] text-slate-400">
            Sistema Profesional
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Clock3 className="w-3 h-3 text-amber-500" />
            <span>{time}</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs hidden md:block">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3 text-amber-500" />
            <span>{date}</span>
          </div>
        </div>
      </div>
    </header>
  );
}