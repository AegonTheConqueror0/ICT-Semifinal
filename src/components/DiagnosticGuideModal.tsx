import React from 'react';
import { X, BookOpen, AlertTriangle, Activity, Cpu, CheckCircle2, Cable, Layers, ShieldCheck } from 'lucide-react';

interface DiagnosticGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticGuideModal: React.FC<DiagnosticGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-mono text-slate-400">Troubleshooting Field Reference</div>
              <div className="text-sm font-bold text-white">Technician Diagnostic Quick Guide</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          
          {/* Quick 5-Step Process */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="font-semibold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standard 5-Step Troubleshooting Workflow</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-blue-400">1. Power Check</div>
                <div className="text-slate-400 text-[10px] mt-0.5">AC cord, PSU switch, 24-Pin ATX</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-blue-400">2. Observe POST</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Q-LED color & buzzer beeps</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-blue-400">3. Video Route</div>
                <div className="text-slate-400 text-[10px] mt-0.5">GPU port vs Motherboard port</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-blue-400">4. Physical Seat</div>
                <div className="text-slate-400 text-[10px] mt-0.5">RAM latches, screws, cables</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="font-bold text-emerald-400">5. Verify Boot</div>
                <div className="text-slate-400 text-[10px] mt-0.5">BIOS HW Mon & OS desktop</div>
              </div>
            </div>
          </div>

          {/* Motherboard Q-LED Table */}
          <div className="space-y-2">
            <div className="font-semibold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Motherboard 4-Phase Diagnostic Q-LEDs</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-400">CPU LED (Red)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CPU failed to initialize or 8-Pin EPS CPU 12V auxiliary power cable is disconnected.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-400">DRAM LED (Amber / Yellow)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    RAM module loose / retention clip unlatched, empty channels, or defective stick.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex gap-2.5">
                <span className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-100">VGA LED (White)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Graphics card unseated from PCIe slot, or auxiliary 8-Pin PCIe power cable unplugged.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400">BOOT LED (Green)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    POST passed! Storage drive missing bootloader or SATA data/power cable disconnected.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buzzer Beep Codes & 7-Segment POST Codes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                Motherboard Beep Codes
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-emerald-400">1 Short Beep</span>
                  <span className="text-slate-300">Healthy POST Pass</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-amber-400">3 Repeated Beeps</span>
                  <span className="text-slate-300">Memory / RAM Error</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-blue-400">1 Long, 2 Short</span>
                  <span className="text-slate-300">Display / GPU Error</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-red-400">Continuous Beeps</span>
                  <span className="text-slate-300">Power / CPU Supply Fault</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                7-Segment POST Codes
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-emerald-400">AA</span>
                  <span className="text-slate-300">System Booted (Normal)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-amber-400">55</span>
                  <span className="text-slate-300">Memory not installed/seated</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="font-mono text-blue-400">d6</span>
                  <span className="text-slate-300">No Console Output / GPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-red-400">00</span>
                  <span className="text-slate-300">CPU Power 12V absent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Cable Port Reminder */}
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/40 text-[11px] text-blue-200 flex items-start gap-2.5">
            <Cable className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Common Beginner Trap: </span>
              If a dedicated graphics card (GPU) is installed, the monitor video cable MUST be plugged into the graphics card ports at the bottom, NOT into the motherboard upper I/O shield.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Educational Troubleshooting Reference</span>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>

    </div>
  );
};
