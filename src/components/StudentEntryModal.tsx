import React, { useState } from 'react';
import { soundFX } from '../utils/audio';
import { 
  User, 
  Layers, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Cpu,
  Wrench
} from 'lucide-react';

export interface StudentProfile {
  name: string;
  section: string;
  studentId?: string;
}

interface StudentEntryModalProps {
  isOpen: boolean;
  onStartSimulation: (profile: StudentProfile) => void;
}

export const StudentEntryModal: React.FC<StudentEntryModalProps> = ({
  isOpen,
  onStartSimulation,
}) => {
  const [name, setName] = useState(() => localStorage.getItem('hwlab_student_name') || '');
  const [section, setSection] = useState(() => localStorage.getItem('hwlab_student_section') || '');
  const [studentId, setStudentId] = useState(() => localStorage.getItem('hwlab_student_id') || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your Full Name to begin the practical examination.');
      return;
    }
    if (!section.trim()) {
      setError('Please enter your Section / Class code.');
      return;
    }

    soundFX.playClick('switch');
    localStorage.setItem('hwlab_student_name', name.trim());
    localStorage.setItem('hwlab_student_section', section.trim());
    if (studentId.trim()) localStorage.setItem('hwlab_student_id', studentId.trim());

    onStartSimulation({
      name: name.trim(),
      section: section.trim(),
      studentId: studentId.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      
      {/* Entry Gate Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col ring-1 ring-slate-600/50">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-900/80 via-slate-900 to-slate-900 px-7 py-6 border-b border-slate-750">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                HardwareLab Practical Examination
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Candidate Intake & Laboratory Registration
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Please register your credentials before entering the simulated technician workbench. A randomized hardware fault has been procedurally staged.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/80 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Student Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Edgardo Rojas Jr."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-750 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Section / Class & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Section / Class <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. BSIT 2-A"
                    value={section}
                    onChange={(e) => {
                      setSection(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-750 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Student ID Number <span className="text-slate-500 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024-00481"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
            <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Assessment Rules & Instructions:</span>
            </div>
            <ul className="space-y-1 text-slate-400 pl-4 list-disc">
              <li><strong className="text-slate-300">Automated Unique Activity:</strong> Each candidate is automatically assigned a unique, randomized hardware fault combination. No two students receive the same activity.</li>
              <li><strong className="text-slate-300">Timed & Anti-Cheat Protected:</strong> The diagnostic timer starts upon entry. Activity is locked and cannot be rerolled or skipped.</li>
              <li><strong className="text-slate-300">Unassisted Troubleshooting:</strong> Inspect physical components, POST codes, Q-LEDs, beep codes, and voltages.</li>
              <li><strong className="text-slate-300">PDF Report Only:</strong> Upon fixing the PC, document your observations and physical procedure to generate your official graded PDF transcript.</li>
            </ul>
          </div>

          {/* Submit / Enter Button */}
          <button
            type="submit"
            className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer active:scale-98"
          >
            <span>Enter Workbench & Begin Troubleshooting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
