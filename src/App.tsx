/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CameraView, ActiveTool, HardwareState, WorkOrder } from './types/simulator';
import { createDefaultHardwareState } from './scenarios/troubleshootingScenarios';
import { generateProceduralWorkOrder } from './utils/faultGenerator';
import { ThreeWorkspace } from './components/ThreeWorkspace';
import { InteractiveMonitor } from './components/InteractiveMonitor';
import { MotherboardInspection } from './components/MotherboardInspection';
import { RearIOPanel } from './components/RearIOPanel';
import { WorkBenchToolbar } from './components/WorkBenchToolbar';
import { WorkOrderTicket } from './components/WorkOrderTicket';
import { DiagnosticGuideModal } from './components/DiagnosticGuideModal';
import { StudentEntryModal, StudentProfile } from './components/StudentEntryModal';
import { soundFX } from './utils/audio';
import { 
  RotateCcw, 
  FileText, 
  ShieldAlert, 
  BookOpen, 
  Power, 
  Contrast,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Student candidate registration state (inputted before entering simulation)
  const [hasEntered, setHasEntered] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // Initialize with a randomized procedural troubleshooting challenge
  const [currentOrder, setCurrentOrder] = useState<WorkOrder>(() => {
    const { workOrder } = generateProceduralWorkOrder('exam');
    return workOrder;
  });

  const [hardwareState, setHardwareState] = useState<HardwareState>(() => ({
    ...createDefaultHardwareState(),
    ...currentOrder.initialHardwareState,
  }));

  const [currentView, setCurrentView] = useState<CameraView>('desk');
  const [activeTool, setActiveTool] = useState<ActiveTool>('inspect');
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [vignetteMode, setVignetteMode] = useState<'cinematic' | 'soft' | 'off'>('cinematic');
  
  // Real-time troubleshooting session timer - starts when student enters
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!hasEntered) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEntered]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSimulation = (profile: StudentProfile) => {
    setStudentProfile(profile);
    // Automatically generate a unique randomized troubleshooting assessment specifically for this student
    // Keying by student name, section, studentId, and high-entropy timestamp guarantees no two students get the same activity
    const candidateSeed = `${profile.name.trim().toLowerCase()}_${profile.section.trim().toLowerCase()}_${profile.studentId?.trim() || ''}_${Date.now()}`;
    const { workOrder } = generateProceduralWorkOrder('exam', candidateSeed);
    setCurrentOrder(workOrder);
    setHardwareState({
      ...createDefaultHardwareState(),
      ...workOrder.initialHardwareState,
    });
    setHasEntered(true);
    setElapsedSeconds(0);
  };

  // Cycle vignette intensity
  const handleCycleVignette = () => {
    soundFX.playClick('switch');
    setVignetteMode(prev => prev === 'cinematic' ? 'soft' : prev === 'soft' ? 'off' : 'cinematic');
  };

  // Update hardware state helper
  const handleUpdateHardware = (updates: Partial<HardwareState>) => {
    setHardwareState(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Reset current scenario to initial state (restores assigned defect hardware without rerolling problem)
  const handleResetCurrentScenario = () => {
    soundFX.playClick('switch');
    setHardwareState({
      ...createDefaultHardwareState(),
      ...currentOrder.initialHardwareState,
    });
  };

  // Quick Master Power Button toggle from header
  const handleTogglePower = () => {
    soundFX.playClick('switch');
    if (hardwareState.isSystemPoweredOn) {
      soundFX.updateFanState(false);
      handleUpdateHardware({
        isSystemPoweredOn: false,
        fansSpinning: false,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: false },
        hexPostCode: '00',
      });
    } else {
      if (!hardwareState.psuMasterSwitch || !hardwareState.psuWallPlugged || !hardwareState.atx24PinConnected) {
        // No power can flow
        soundFX.playClick('switch');
        return;
      }
      soundFX.updateFanState(true);
      handleUpdateHardware({
        isSystemPoweredOn: true,
        fansSpinning: true,
      });

      // Compute POST outcome
      const seatedWorkingRam = hardwareState.ramSlots.some(
        s => s.installedStick && !s.installedStick.isDefective && s.latched
      );

      if (!hardwareState.cpu8PinConnected) {
        setTimeout(() => {
          handleUpdateHardware({
            qLedStatus: { cpu: true, dram: false, vga: false, boot: false },
            hexPostCode: '00',
            postBeepCode: 'continuous',
          });
          soundFX.playBeep('continuous');
        }, 500);
        return;
      }

      if (!seatedWorkingRam) {
        setTimeout(() => {
          handleUpdateHardware({
            qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
            hexPostCode: '55',
            postBeepCode: 'three_beeps',
          });
          soundFX.playBeep('three_beeps');
        }, 600);
        return;
      }

      if (hardwareState.gpuInstalled && !hardwareState.gpuPowerPlugged) {
        setTimeout(() => {
          handleUpdateHardware({
            qLedStatus: { cpu: false, dram: false, vga: true, boot: false },
            hexPostCode: 'd6',
            postBeepCode: 'one_long_two_short',
          });
          soundFX.playBeep('one_long_two_short');
        }, 700);
        return;
      }

      // Successful healthy POST
      setTimeout(() => {
        handleUpdateHardware({
          qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
          hexPostCode: 'AA',
          postBeepCode: 'single_short',
        });
        soundFX.playBeep('single_short');
      }, 800);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* Student Entry / Intake Gate (Shows before entering simulation) */}
      <StudentEntryModal
        isOpen={!hasEntered}
        onStartSimulation={handleStartSimulation}
      />

      {/* Minimalist Top Bar Header: Clear, Large, High-Visibility Buttons */}
      <header className="h-14 bg-slate-850 border-b border-slate-750 px-5 flex items-center justify-between z-30 shrink-0 shadow-sm">
        
        {/* Left Zone: Brand, One-Click Randomize, Live Timer & Candidate Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              HardwareLab
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Locked Activity Badge (Tamper-proof & Anti-Cheat Protected) */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-blue-500/30 text-xs font-mono text-blue-300 shadow-inner"
            title="Assigned randomized exam activity (Locked - anti-cheat protected)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Activity:</span>
            <span className="font-bold text-white tracking-wider">{currentOrder.ticketNumber}</span>
          </div>

          {/* Prominent Live Diagnostic Timer */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-750 text-xs font-mono font-bold text-cyan-400 shadow-inner"
            title="Elapsed troubleshooting time since intake"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Registered Student Candidate Info Badge (Read-only during exam) */}
          {studentProfile && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200"
              title="Verified candidate profile"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-white truncate max-w-[130px]">{studentProfile.name}</span>
              <span className="text-slate-400 font-mono text-[11px]">({studentProfile.section})</span>
            </div>
          )}
        </div>

        {/* Center Zone: Clean View Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-xs bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'desk', label: 'Workbench' },
            { id: 'monitor', label: 'Monitor Screen' },
            { id: 'motherboard', label: 'Internal Chassis' },
            { id: 'rear-io', label: 'Rear I/O Panel' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as CameraView)}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                currentView === item.id
                  ? 'bg-slate-750 text-white border border-slate-650 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Zone: Controls, Reference Guide & PDF Submission Button */}
        <div className="flex items-center gap-2">
          
          {/* Power Button */}
          <button
            onClick={handleTogglePower}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              hardwareState.isSystemPoweredOn
                ? 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
            title="Toggle PC Power Button"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Power {hardwareState.isSystemPoweredOn ? 'ON' : 'OFF'}</span>
          </button>

          {/* Diagnostic Guide Modal Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-750 hover:border-amber-500/50 transition-colors cursor-pointer"
            title="Open Diagnostic Guide & POST Reference Codes"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Vignette Toggle */}
          <button
            onClick={handleCycleVignette}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-750 transition-colors cursor-pointer"
            title={`Vignette: ${vignetteMode.toUpperCase()}`}
          >
            <Contrast className="w-3.5 h-3.5" />
          </button>

          {/* Work Order & PDF Submission Button */}
          <button
            onClick={() => setIsTicketOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            title="Open Examination Submission Form and Generate Official Graded PDF Transcript"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Pass / Submit PDF ({currentOrder.ticketNumber})</span>
          </button>

          {/* Reset Current Scenario */}
          <button
            onClick={handleResetCurrentScenario}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-750 transition-colors cursor-pointer"
            title="Reset Bench to Initial Scenario State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-slate-900">
        
        {/* View 1: 3D Workbench Environment */}
        {currentView === 'desk' && (
          <ThreeWorkspace
            hardwareState={hardwareState}
            onUpdateHardware={handleUpdateHardware}
            currentView={currentView}
            onSelectView={setCurrentView}
            vignetteMode={vignetteMode}
          />
        )}

        {/* Cinematic Vignette Overlay across 2D inspection views */}
        {vignetteMode !== 'off' && currentView !== 'desk' && (
          <div 
            className="pointer-events-none absolute inset-0 z-20 select-none transition-opacity duration-300"
            style={{
              background: vignetteMode === 'cinematic'
                ? 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(10, 15, 26, 0.35) 80%, rgba(5, 8, 16, 0.70) 100%)'
                : 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(10, 15, 26, 0.22) 85%, rgba(5, 8, 16, 0.45) 100%)'
            }}
          />
        )}

        {/* View 2: Monitor Display Focus */}
        {currentView === 'monitor' && (
          <div className="w-full h-full flex items-center justify-center p-6 bg-slate-900">
            <InteractiveMonitor
              hardwareState={hardwareState}
              onUpdateHardware={handleUpdateHardware}
              isZoomedIn={true}
              onExitZoom={() => setCurrentView('desk')}
            />
          </div>
        )}

        {/* View 3: Inside Case & Motherboard Tactile Inspection */}
        {(currentView === 'motherboard' || currentView === 'case-side') && (
          <div className="w-full h-full">
            <MotherboardInspection
              hardwareState={hardwareState}
              onUpdateHardware={handleUpdateHardware}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onOpenGuide={() => setIsGuideOpen(true)}
              isGuidedMode={false}
            />
          </div>
        )}

        {/* View 4: Rear I/O Panel Focus */}
        {currentView === 'rear-io' && (
          <div className="w-full h-full">
            <RearIOPanel
              hardwareState={hardwareState}
              onUpdateHardware={handleUpdateHardware}
            />
          </div>
        )}

        {/* Minimalist Bottom Control Island */}
        <WorkBenchToolbar
          currentView={currentView}
          onSelectView={setCurrentView}
          hardwareState={hardwareState}
          onUpdateHardware={handleUpdateHardware}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onToggleWorkOrder={() => setIsTicketOpen(!isTicketOpen)}
          onOpenGuide={() => setIsGuideOpen(true)}
          hasOpenTicket={true}
        />

        {/* Examination Assessment & PDF Submission Modal */}
        <WorkOrderTicket
          currentOrder={currentOrder}
          hardwareState={hardwareState}
          elapsedSeconds={elapsedSeconds}
          studentProfile={studentProfile}
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
        />

        {/* Diagnostic Guide & POST Reference Modal */}
        <DiagnosticGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />

      </main>

    </div>
  );
}
