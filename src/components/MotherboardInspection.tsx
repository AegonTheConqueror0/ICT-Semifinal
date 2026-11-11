import React, { useState } from 'react';
import { HardwareState, ActiveTool, RAMSlot, RAMStick } from '../types/simulator';
import { soundFX } from '../utils/audio';
import { 
  Power, 
  RotateCw, 
  Wrench, 
  Sparkles, 
  Gauge, 
  Check, 
  AlertCircle, 
  HelpCircle,
  Zap,
  Layers,
  ArrowRight,
  Disc,
  Cable,
  Eye,
  Maximize2,
  X,
  BookOpen
} from 'lucide-react';

// Photorealistic component asset paths
const COMPONENT_IMAGES = {
  cpu: '/src/assets/images/component_cpu_processor_1790908834202.jpg',
  ram: '/src/assets/images/component_ram_module_1790908846322.jpg',
  gpu: '/src/assets/images/component_gpu_card_1790908859735.jpg',
  ssd: '/src/assets/images/component_storage_ssd_1790908872523.jpg',
  motherboard: '/src/assets/images/component_motherboard_atx_1790908885190.jpg',
};

interface MotherboardInspectionProps {
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onOpenGuide?: () => void;
  isGuidedMode?: boolean;
}

export const MotherboardInspection: React.FC<MotherboardInspectionProps> = ({
  hardwareState,
  onUpdateHardware,
  activeTool,
  onSelectTool,
  onOpenGuide,
  isGuidedMode = false,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<
    'ram' | 'cpu_cooler' | 'gpu' | 'power_cables' | 'cmos' | 'sata' | 'qled' | null
  >(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [multimeterReadout, setMultimeterReadout] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [macroZoomImage, setMacroZoomImage] = useState<{ src: string; title: string; subtitle: string } | null>(null);

  const showNotification = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 2800);
  };

  // Turn system on/off using the physical case power button
  const handlePowerButtonClick = () => {
    soundFX.playClick('switch');

    // If already on, turn off
    if (hardwareState.isSystemPoweredOn) {
      soundFX.updateFanState(false);
      onUpdateHardware({
        isSystemPoweredOn: false,
        fansSpinning: false,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: false },
        hexPostCode: '00',
      });
      showNotification('Power button pressed: System shutdown initiated.');
      return;
    }

    // Check if PSU has power and is connected
    if (!hardwareState.psuMasterSwitch || !hardwareState.psuWallPlugged) {
      showNotification('Power button pressed: No response. No current flowing into system.');
      return;
    }

    if (!hardwareState.atx24PinConnected) {
      showNotification('Power button pressed: 24-Pin ATX power harness not connected to motherboard.');
      return;
    }

    // Power turns on! Start fans
    soundFX.updateFanState(true);
    onUpdateHardware({
      isSystemPoweredOn: true,
      fansSpinning: true,
    });

    // Determine POST outcome
    const seatedWorkingRam = hardwareState.ramSlots.some(
      s => s.installedStick && !s.installedStick.isDefective && s.latched
    );

    if (!hardwareState.cpu8PinConnected) {
      // Missing CPU 12V power
      setTimeout(() => {
        onUpdateHardware({
          qLedStatus: { cpu: true, dram: false, vga: false, boot: false },
          hexPostCode: '00',
          postBeepCode: 'continuous',
        });
        soundFX.playBeep('continuous');
      }, 500);
      return;
    }

    if (!seatedWorkingRam) {
      // RAM failure
      setTimeout(() => {
        onUpdateHardware({
          qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
          hexPostCode: '55',
          postBeepCode: 'three_beeps',
        });
        soundFX.playBeep('three_beeps');
      }, 600);
      return;
    }

    if (hardwareState.gpuInstalled && !hardwareState.gpuPowerPlugged) {
      // GPU missing power
      setTimeout(() => {
        onUpdateHardware({
          qLedStatus: { cpu: false, dram: false, vga: true, boot: false },
          hexPostCode: 'd6',
          postBeepCode: 'one_long_two_short',
        });
        soundFX.playBeep('one_long_two_short');
      }, 700);
      return;
    }

    // Healthy POST cycle!
    setTimeout(() => {
      onUpdateHardware({
        qLedStatus: { cpu: false, dram: false, vga: false, boot: false },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      });
      soundFX.playBeep('single_short');
    }, 800);
  };

  // RAM module interaction
  const handleRamSlotClick = (slot: RAMSlot) => {
    setActiveSlotId(slot.id);
    setSelectedComponent('ram');
  };

  const handleLatchClip = (slotId: string) => {
    soundFX.playClick('latch');
    const newSlots = hardwareState.ramSlots.map(s => {
      if (s.id === slotId) {
        return { ...s, latched: !s.latched };
      }
      return s;
    });
    onUpdateHardware({ ramSlots: newSlots });
    showNotification('Retention clip toggled.');
  };

  const handleRemoveRam = (slotId: string) => {
    soundFX.playClick('latch');
    const newSlots = hardwareState.ramSlots.map(s => {
      if (s.id === slotId) {
        return { ...s, installedStick: null, latched: false };
      }
      return s;
    });
    onUpdateHardware({ ramSlots: newSlots });
    showNotification('RAM module removed from slot.');
  };

  const handleInsertRam = (slotId: string, stick: RAMStick) => {
    soundFX.playClick('latch');
    const newSlots = hardwareState.ramSlots.map(s => {
      if (s.id === slotId) {
        return { ...s, installedStick: stick, latched: true };
      }
      return s;
    });
    onUpdateHardware({ ramSlots: newSlots });
    showNotification('RAM module firmly seated into slot and latched.');
  };

  // CPU Cooler & Thermal Paste Actions
  const handleCoolerScrewsToggle = () => {
    soundFX.playClick('screw');
    const newTightened = !hardwareState.coolerScrewsTightened;
    onUpdateHardware({ coolerScrewsTightened: newTightened });
    showNotification(newTightened ? 'Cooler mounting thumbscrews tightened firmly.' : 'Cooler mounting screws loosened.');
  };

  const handleUnmountCooler = () => {
    if (hardwareState.coolerScrewsTightened) {
      showNotification('Cannot remove heatsink: Mounting screws are tightened. Loosen them first.');
      return;
    }
    soundFX.playClick('panel');
    onUpdateHardware({ coolerMounted: !hardwareState.coolerMounted });
    showNotification(hardwareState.coolerMounted ? 'Heatsink lifted off CPU socket.' : 'Heatsink placed onto CPU.');
  };

  const handleCleanThermalPaste = () => {
    soundFX.playClick('cable');
    onUpdateHardware({ thermalPasteStatus: 'missing' });
    showNotification('Cleaned old thermal compound from CPU heat spreader with isopropyl alcohol wipe.');
  };

  const handleApplyThermalPaste = () => {
    soundFX.playClick('cable');
    onUpdateHardware({ thermalPasteStatus: 'fresh' });
    showNotification('Dispensed pea-sized dot of fresh thermal compound onto center of CPU IHS.');
  };

  // GPU Actions
  const handleGpuPowerToggle = () => {
    soundFX.playClick('cable');
    const newPlugged = !hardwareState.gpuPowerPlugged;
    onUpdateHardware({ 
      gpuPowerPlugged: newPlugged,
      pcie8PinConnected: newPlugged,
    });
    showNotification(newPlugged ? '8-Pin PCIe power connector plugged into graphics card.' : '8-Pin PCIe power connector unplugged.');
  };

  const handleGpuReseat = () => {
    soundFX.playClick('latch');
    onUpdateHardware({ gpuPcieSeated: true });
    showNotification('GPU pushed firmly into PCIe x16 slot until retention lock clicked.');
  };

  // CMOS Battery Actions
  const handleTestCmosVoltage = () => {
    soundFX.playMultimeterBeep();
    const voltage = hardwareState.cmosBatteryInstalled ? hardwareState.cmosBatteryVoltage : 0;
    setMultimeterReadout(`${voltage.toFixed(2)} V DC`);
    showNotification(`Multimeter probe on CR2032 coin cell: ${voltage.toFixed(2)} Volts`);
  };

  const handleReplaceCmosBattery = () => {
    soundFX.playClick('screw');
    onUpdateHardware({
      cmosBatteryInstalled: true,
      cmosBatteryVoltage: 3.12,
    });
    showNotification('Installed fresh 3.0V CR2032 lithium coin cell into socket.');
  };

  // Storage SATA Actions
  const handleSataDataToggle = () => {
    soundFX.playClick('cable');
    const newConn = !hardwareState.sataDataConnected;
    onUpdateHardware({ sataDataConnected: newConn });
    showNotification(newConn ? 'SATA data cable connected between SSD and Motherboard SATA3_0.' : 'SATA data cable disconnected.');
  };

  const handleSataPowerToggle = () => {
    soundFX.playClick('cable');
    const newConn = !hardwareState.sataPowerConnected;
    onUpdateHardware({ sataPowerConnected: newConn });
    showNotification(newConn ? 'SATA 15-pin power cable connected to SSD.' : 'SATA power cable disconnected.');
  };

  // 24-Pin ATX & 8-Pin CPU Cables
  const handleAtx24Toggle = () => {
    soundFX.playClick('cable');
    const newConn = !hardwareState.atx24PinConnected;
    onUpdateHardware({ atx24PinConnected: newConn });
    showNotification(newConn ? '24-Pin ATX main motherboard power connector seated firmly with lock clip.' : '24-Pin ATX power harness disconnected.');
  };

  const handleCpu8PinToggle = () => {
    soundFX.playClick('cable');
    const newConn = !hardwareState.cpu8PinConnected;
    onUpdateHardware({ cpu8PinConnected: newConn });
    showNotification(newConn ? '8-Pin (4+4) EPS CPU 12V power connector plugged into top motherboard socket.' : '8-Pin EPS CPU power cable disconnected.');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      
      {/* Top Status & Physical Case Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          {/* Physical Case Power Button */}
          <button
            onClick={handlePowerButtonClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md cursor-pointer border ${
              hardwareState.isSystemPoweredOn
                ? 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>Power Button {hardwareState.isSystemPoweredOn ? '(ON)' : '(OFF)'}</span>
          </button>

          {/* PSU Rear Master Switch status indicator */}
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-slate-400">PSU Rocker:</span>
            <span className={hardwareState.psuMasterSwitch ? 'text-emerald-400 font-mono font-semibold' : 'text-red-400 font-mono font-semibold'}>
              {hardwareState.psuMasterSwitch ? '[I] ON' : '[O] OFF'}
            </span>
          </div>
        </div>

        {/* Live Motherboard Diagnostic Section */}
        <div className="flex items-center gap-3">
          {/* Diagnostic Guide Quick Reference Button */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer"
              title="Open Technician Diagnostic Reference & Cheat Sheet"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Diagnostic Guide</span>
            </button>
          )}

          {/* Q-LED Diagnostic Cluster */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400 font-sans text-xs mr-1">Q-LED:</span>
            
            <div className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.cpu 
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' 
                  : 'bg-slate-800'
              }`} />
              <span className={hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.cpu ? 'text-red-400 font-bold' : 'text-slate-500'}>
                CPU
              </span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.dram 
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]' 
                  : 'bg-slate-800'
              }`} />
              <span className={hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.dram ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                DRAM
              </span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.vga 
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,1)]' 
                  : 'bg-slate-800'
              }`} />
              <span className={hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.vga ? 'text-white font-bold' : 'text-slate-500'}>
                VGA
              </span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.boot 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]' 
                  : 'bg-slate-800'
              }`} />
              <span className={hardwareState.isSystemPoweredOn && hardwareState.qLedStatus.boot ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                BOOT
              </span>
            </div>
          </div>

          {/* 7-Segment POST Code Display */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs">POST Code:</span>
            <span className={`font-mono text-base font-bold px-1.5 py-0.5 rounded tracking-widest ${
              hardwareState.isSystemPoweredOn 
                ? 'bg-red-950 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                : 'text-slate-600 bg-slate-900'
            }`}>
              {hardwareState.isSystemPoweredOn ? hardwareState.hexPostCode : '--'}
            </span>

            {/* In Guided Mode, decode the code into plain English */}
            {isGuidedMode && hardwareState.isSystemPoweredOn && (
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 ml-1">
                {hardwareState.hexPostCode === '55' && <span className="text-amber-400">RAM Fault (Check DIMM latch)</span>}
                {hardwareState.hexPostCode === 'd6' && <span className="text-blue-400">VGA Fault (Check 8-pin PCIe)</span>}
                {hardwareState.hexPostCode === '00' && <span className="text-red-400">CPU Fault (Check 8-pin 12V)</span>}
                {hardwareState.hexPostCode === 'AA' && <span className="text-emerald-400">POST Passed (Healthy)</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating feedback toast notification */}
      {feedbackNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-neutral-700 text-neutral-200 px-4 py-2 rounded-lg text-xs shadow-2xl z-40 backdrop-blur flex items-center gap-2 animate-in fade-in duration-200">
          <Wrench className="w-3.5 h-3.5 text-blue-400" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Main Motherboard & Chassis Interactive Layout */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 justify-center items-center">
        
        {/* Motherboard Visual Schematic & Interactive Hotspots */}
        <div className="relative w-[680px] h-[580px] bg-slate-900 border-4 border-slate-700/90 rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-600/50 p-4 flex flex-col justify-between">
          
          {/* Authentic High-Resolution Motherboard Photo Backdrop with brightened exposure */}
          <img
            src={COMPONENT_IMAGES.motherboard}
            alt="ATX Motherboard Hardware"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none select-none filter contrast-115 brightness-110"
          />
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

          {/* PCB Surface Details */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="absolute top-3 left-3 text-neutral-400 font-mono text-[10px] tracking-widest flex items-center gap-2 z-10">
            <span>ATX SPEC 2.41 // LGA1700</span>
            <button
              onClick={() => setMacroZoomImage({
                src: COMPONENT_IMAGES.motherboard,
                title: 'ATX Gaming Motherboard',
                subtitle: 'Precision PCB with heavy copper traces, VRM heatsinks, LGA socket & PCIe Gen 4 lanes'
              })}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700"
            >
              <Eye className="w-3 h-3" />
              <span>Inspect PCB Macro</span>
            </button>
          </div>

          {/* Top Section: CPU Socket, VRMs, 8-Pin CPU Power, 4 RAM DIMM slots */}
          <div className="flex justify-between items-start gap-4 z-10">
            
            {/* Top-Left: 8-Pin CPU Power Socket */}
            <div 
              onClick={() => setSelectedComponent('power_cables')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                hardwareState.cpu8PinConnected 
                  ? 'bg-slate-800/90 border-emerald-500/70 hover:border-emerald-400' 
                  : 'bg-slate-900 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">8-Pin CPU 12V</div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Cable className={`w-3.5 h-3.5 ${hardwareState.cpu8PinConnected ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={hardwareState.cpu8PinConnected ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                  {hardwareState.cpu8PinConnected ? 'Connected' : 'DISCONNECTED'}
                </span>
              </div>
            </div>

            {/* Center-Top: CPU Socket & Tower Cooler Assembly */}
            <div 
              onClick={() => setSelectedComponent('cpu_cooler')}
              className={`flex-1 max-w-xs p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                selectedComponent === 'cpu_cooler' 
                  ? 'border-blue-400 bg-slate-800 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : (!hardwareState.coolerScrewsTightened || hardwareState.thermalPasteStatus !== 'fresh') && isGuidedMode
                    ? 'border-amber-500/80 bg-slate-850 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-slate-700 bg-slate-850 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <RotateCw className={`w-4 h-4 ${hardwareState.fansSpinning ? 'text-blue-400 animate-spin' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs text-slate-200">
                  {hardwareState.coolerMounted ? 'CPU Tower Cooler' : 'CPU Socket Exposed'}
                </span>
              </div>

              {hardwareState.coolerMounted ? (
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>Mounting: <span className={
                    hardwareState.coolerScrewsTightened 
                      ? 'text-emerald-400 font-medium' 
                      : isGuidedMode ? 'text-red-400 font-bold' : 'text-slate-400 font-medium'
                  }>
                    {hardwareState.coolerScrewsTightened 
                      ? 'Tightened Firmly' 
                      : isGuidedMode ? '⚠️ Screws Loose' : 'Loose Thumbscrews'}
                  </span></div>
                  <div>Live Temp: <span className={(hardwareState.cpuTemperature || 40) > 80 ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}>
                    {hardwareState.cpuTemperature || 40}°C {(hardwareState.cpuTemperature || 40) > 80 ? '(High)' : '(Nominal)'}
                  </span></div>
                </div>
              ) : (
                <div className="text-[11px] space-y-0.5">
                  <div className="text-amber-400 font-medium">Heatsink Unmounted</div>
                  <div className="text-slate-400 text-[10px]">
                    Paste: <span className={
                      hardwareState.thermalPasteStatus === 'fresh' ? 'text-emerald-400 font-medium' :
                      isGuidedMode ? (hardwareState.thermalPasteStatus === 'dried_out' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold') : 'text-slate-300'
                    }>
                      {hardwareState.thermalPasteStatus === 'fresh' ? 'Fresh Compound' :
                       isGuidedMode 
                         ? (hardwareState.thermalPasteStatus === 'dried_out' ? '⚠️ Dried / Chalky' : '⚠️ Missing')
                         : (hardwareState.thermalPasteStatus === 'dried_out' ? 'Dried Residue' : 'Bare IHS')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right: 4 RAM DIMM Slots */}
            <div className="flex flex-col gap-1.5 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">DDR4 Memory Slots</div>
              
              <div className="flex gap-2">
                {hardwareState.ramSlots.map((slot) => {
                  const hasStick = !!slot.installedStick;
                  const isLatched = slot.latched;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleRamSlotClick(slot)}
                      className={`w-9 h-28 rounded flex flex-col items-center justify-between p-1 transition-all cursor-pointer border ${
                        activeSlotId === slot.id && selectedComponent === 'ram'
                          ? 'border-blue-400 bg-slate-800 ring-2 ring-blue-500/50'
                          : hasStick
                            ? isLatched
                              ? 'border-emerald-500/80 bg-slate-850 hover:border-emerald-400'
                              : isGuidedMode
                                ? 'border-amber-400 bg-amber-950/60 hover:border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                                : 'border-slate-700 bg-slate-850 hover:border-slate-600'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                      title={`${slot.label}: ${hasStick ? (isLatched ? 'Installed & Latched' : (isGuidedMode ? 'Loose - Click to Latch' : 'Installed - Latch Open')) : 'Empty'}`}
                    >
                      {/* Top Retention Clip */}
                      <span className={`w-3.5 h-1.5 rounded-xs ${
                        hasStick && isLatched 
                          ? 'bg-emerald-400' 
                          : hasStick 
                            ? (isGuidedMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500') 
                            : 'bg-slate-600'
                      }`} />

                      {/* Stick body or empty channel */}
                      {hasStick ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono text-slate-200 transform -rotate-90 whitespace-nowrap font-medium">
                            8GB
                          </span>
                          {!isLatched && isGuidedMode && (
                            <span className="text-[8px] text-amber-300 font-bold bg-amber-950/90 px-1 rounded">LOOSE</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[8px] text-slate-500 font-mono uppercase">
                          Empty
                        </span>
                      )}

                      {/* Bottom Retention Clip */}
                      <span className={`w-3.5 h-1.5 rounded-xs ${
                        hasStick && isLatched 
                          ? 'bg-emerald-400' 
                          : hasStick 
                            ? (isGuidedMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500') 
                            : 'bg-slate-600'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Section: Main 24-Pin ATX connector, Chipset, CMOS Battery */}
          <div className="flex justify-between items-center z-10 px-2 my-2">
            
            {/* Left: CMOS Battery */}
            <div 
              onClick={() => setSelectedComponent('cmos')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                selectedComponent === 'cmos' 
                  ? 'border-blue-400 bg-slate-800 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : hardwareState.cmosBatteryVoltage < 2.5 && isGuidedMode
                    ? 'border-amber-500/80 bg-slate-850 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-slate-700 bg-slate-850 hover:border-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-radial from-slate-100 to-slate-300 text-slate-900 flex items-center justify-center font-bold text-[9px] shadow">
                CR2032
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">CMOS Battery</div>
                <div className="text-[11px] text-slate-400">
                  {isGuidedMode ? (
                    hardwareState.cmosBatteryVoltage < 2.5 ? (
                      <span className="text-red-400 font-bold">⚠️ Depleted ({hardwareState.cmosBatteryVoltage.toFixed(1)}V)</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">✓ Nominal ({hardwareState.cmosBatteryVoltage.toFixed(1)}V)</span>
                    )
                  ) : (
                    <span className="text-slate-400 font-medium">3V Lithium Cell</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: 24-Pin ATX Main Power Harness */}
            <div 
              onClick={() => setSelectedComponent('power_cables')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                hardwareState.atx24PinConnected 
                  ? 'border-emerald-500/70 bg-slate-850 hover:border-emerald-400' 
                  : isGuidedMode
                    ? 'border-red-500 bg-slate-900 hover:border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                    : 'border-slate-700 bg-slate-850 hover:border-slate-600'
              }`}
            >
              <Cable className={`w-5 h-5 ${hardwareState.atx24PinConnected ? 'text-emerald-400' : isGuidedMode ? 'text-red-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">24-Pin ATX Harness</div>
                <div className={`text-[11px] font-medium ${
                  hardwareState.atx24PinConnected 
                    ? 'text-emerald-400 font-semibold' 
                    : isGuidedMode ? 'text-red-400 font-bold' : 'text-slate-400'
                }`}>
                  {hardwareState.atx24PinConnected ? 'Firmly Latched' : (isGuidedMode ? '⚠️ DISCONNECTED' : 'Disconnected')}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: PCIe x16 Discrete GPU & SATA Storage headers */}
          <div className="flex justify-between items-end gap-4 z-10">
            
            {/* PCIe Discrete GPU Card */}
            <div 
              onClick={() => setSelectedComponent('gpu')}
              className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedComponent === 'gpu' 
                  ? 'border-blue-400 bg-slate-800 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : (!hardwareState.gpuPowerPlugged || !hardwareState.gpuPcieSeated) && isGuidedMode
                    ? 'border-amber-500/80 bg-slate-850 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-slate-700 bg-slate-850 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs text-slate-200">
                    PCIe x16: NVIDIA RTX 3060
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  hardwareState.gpuPowerPlugged 
                    ? 'bg-emerald-950 text-emerald-400' 
                    : isGuidedMode ? 'bg-red-950 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {hardwareState.gpuPowerPlugged ? 'Power Connected' : (isGuidedMode ? '⚠️ NO POWER' : 'Power Unplugged')}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <div>PCIe Retention Latch: <span className={
                  hardwareState.gpuPcieSeated 
                    ? 'text-emerald-400 font-medium' 
                    : isGuidedMode ? 'text-amber-400 font-bold' : 'text-slate-400'
                }>
                  {hardwareState.gpuPcieSeated ? 'Locked' : (isGuidedMode ? '⚠️ Unseated / Tilted' : 'Open / Unseated')}
                </span></div>
                <div>8-Pin Auxiliary Power: <span className={
                  hardwareState.gpuPowerPlugged 
                    ? 'text-emerald-400 font-medium' 
                    : isGuidedMode ? 'text-red-400 font-bold' : 'text-slate-400'
                }>
                  {hardwareState.gpuPowerPlugged ? 'Plugged In' : (isGuidedMode ? '⚠️ DISCONNECTED' : 'Disconnected')}
                </span></div>
              </div>
            </div>

            {/* SATA Drive & Cable Ports */}
            <div 
              onClick={() => setSelectedComponent('sata')}
              className={`w-64 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedComponent === 'sata' 
                  ? 'border-blue-400 bg-slate-800 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : (!hardwareState.sataDataConnected || !hardwareState.sataPowerConnected) && isGuidedMode
                    ? 'border-amber-500/80 bg-slate-850 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-slate-700 bg-slate-850 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Disc className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs text-slate-200">SATA SSD Storage</span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <div>SATA Data Cable: <span className={
                  hardwareState.sataDataConnected 
                    ? 'text-emerald-400 font-medium' 
                    : isGuidedMode ? 'text-red-400 font-bold' : 'text-slate-400'
                }>
                  {hardwareState.sataDataConnected ? 'Connected (Port 0)' : (isGuidedMode ? '⚠️ DISCONNECTED' : 'Disconnected')}
                </span></div>
                <div>SATA Power Cable: <span className={
                  hardwareState.sataPowerConnected 
                    ? 'text-emerald-400 font-medium' 
                    : isGuidedMode ? 'text-red-400 font-bold' : 'text-slate-400'
                }>
                  {hardwareState.sataPowerConnected ? 'Connected' : (isGuidedMode ? '⚠️ DISCONNECTED' : 'Disconnected')}
                </span></div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Inspection & Action Panel (Contextual to selected component) */}
        <div className="w-80 h-[580px] bg-slate-900 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between shadow-2xl">
          
          <div className="space-y-4">
            <div className="border-b border-slate-700/80 pb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                Physical Inspection
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedComponent ? selectedComponent.toUpperCase() : 'SELECT COMPONENT'}
              </span>
            </div>

            {/* Selected Component Actions */}
            {selectedComponent === 'ram' && activeSlotId && (() => {
              const currentSlot = hardwareState.ramSlots.find(s => s.id === activeSlotId);
              if (!currentSlot) return null;

              return (
                <div className="space-y-4 text-xs">
                  {/* Photo-Realistic RAM Module Card */}
                  <div className="relative rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 group shadow-md">
                    <img
                      src={COMPONENT_IMAGES.ram}
                      alt="DDR4 RAM Module"
                      referrerPolicy="no-referrer"
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                    <button
                      onClick={() => setMacroZoomImage({
                        src: COMPONENT_IMAGES.ram,
                        title: 'DDR4 Desktop Memory Module',
                        subtitle: 'Inspect gold contact fingers for oxidation/damage, heat spreader alignment, and retention notches.'
                      })}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                      title="Inspect High-Res Macro"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-center text-[10px] text-neutral-300">
                      <span className="font-mono">DDR4 3200MHz CL16</span>
                      <span className="text-neutral-400">Gold Contact Fingers</span>
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                    <div className="font-semibold text-neutral-200 flex justify-between">
                      <span>{currentSlot.label}</span>
                      <span className="text-neutral-400 font-mono">Channel {currentSlot.channel}</span>
                    </div>

                    <div className="text-neutral-300">
                      Module Status:{' '}
                      {currentSlot.installedStick ? (
                        <span className={currentSlot.latched ? 'text-emerald-400 font-medium' : 'text-amber-400 font-bold'}>
                          {currentSlot.latched ? 'Seated & Latched' : 'UNLATCHED / LOOSE'}
                        </span>
                      ) : (
                        <span className="text-neutral-500">[Slot Empty]</span>
                      )}
                    </div>

                    {currentSlot.installedStick && (
                      <div className="text-[11px] text-neutral-400">
                        Spec: {currentSlot.installedStick.capacityGB}GB DDR4-{currentSlot.installedStick.speedMHz} CL16
                      </div>
                    )}
                  </div>

                  {/* Actions on this RAM slot */}
                  <div className="space-y-2 pt-2">
                    {currentSlot.installedStick ? (
                      <>
                        <button
                          onClick={() => handleLatchClip(currentSlot.id)}
                          className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                            currentSlot.latched 
                              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                              : 'bg-amber-600 text-white hover:bg-amber-500 font-semibold'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{currentSlot.latched ? 'Unlatch Retention Clips' : 'Press Down to Latch Clips Firmly'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveRam(currentSlot.id)}
                          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700"
                        >
                          Remove Module to Parts Tray
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInsertRam(currentSlot.id, {
                          id: 'spare-ram-1',
                          capacityGB: 8,
                          speedMHz: 3200,
                          isDefective: false,
                          contactsClean: true,
                        })}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Insert 8GB DDR4 Module from Tray</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {selectedComponent === 'cpu_cooler' && (
              <div className="space-y-4 text-xs">
                {/* Photo-Realistic CPU Processor Card */}
                <div className="relative rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 group shadow-md">
                  <img
                    src={COMPONENT_IMAGES.cpu}
                    alt="Desktop CPU Processor"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                  <button
                    onClick={() => setMacroZoomImage({
                      src: COMPONENT_IMAGES.cpu,
                      title: 'Intel Core Desktop Processor (IHS & Socket)',
                      subtitle: 'Inspect laser-engraved nickel-plated heat spreader, silicon substrate, and thermal paste application.'
                    })}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                    title="Inspect High-Res Macro"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-center text-[10px] text-neutral-300">
                    <span className="font-mono">Core i5-12400F 2.5GHz</span>
                    <span className="text-neutral-400">Integrated Heat Spreader</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                  <div className="font-semibold text-neutral-200">CPU Thermal Subsystem</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Heatsink Status:</span>
                    <span className={hardwareState.coolerMounted ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                      {hardwareState.coolerMounted ? 'Mounted on CPU' : 'Unmounted'}
                    </span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Mounting Thumbscrews:</span>
                    <span className={hardwareState.coolerScrewsTightened ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.coolerScrewsTightened ? 'Tightened' : 'Loose'}
                    </span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Thermal Compound:</span>
                    <span className={
                      hardwareState.thermalPasteStatus === 'fresh' ? 'text-emerald-400 font-medium' :
                      hardwareState.thermalPasteStatus === 'dried_out' ? 'text-red-400 font-bold' : 'text-neutral-400'
                    }>
                      {hardwareState.thermalPasteStatus === 'fresh' ? 'Fresh Compound' :
                       hardwareState.thermalPasteStatus === 'dried_out' ? 'Dried Out / Chalky' : 'Clean Surface'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCoolerScrewsToggle}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700 flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span>{hardwareState.coolerScrewsTightened ? 'Loosen Mounting Screws' : 'Tighten Mounting Screws Firmly'}</span>
                  </button>

                  <button
                    onClick={handleUnmountCooler}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700 flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{hardwareState.coolerMounted ? 'Lift Off Heatsink' : 'Place Heatsink on CPU'}</span>
                  </button>

                  {!hardwareState.coolerMounted && (
                    <>
                      <button
                        onClick={handleCleanThermalPaste}
                        className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wipe Old Paste (Alcohol Pad)</span>
                      </button>

                      <button
                        onClick={handleApplyThermalPaste}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply Fresh Thermal Paste (Syringe)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedComponent === 'gpu' && (
              <div className="space-y-4 text-xs">
                {/* Photo-Realistic GPU Card */}
                <div className="relative rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 group shadow-md">
                  <img
                    src={COMPONENT_IMAGES.gpu}
                    alt="Dedicated Graphics Card GPU"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                  <button
                    onClick={() => setMacroZoomImage({
                      src: COMPONENT_IMAGES.gpu,
                      title: 'NVIDIA GeForce RTX 3060 12GB',
                      subtitle: 'Inspect dual axial fans, copper composite heatpipes, PCIe x16 gold edge connector, and 8-pin power socket.'
                    })}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                    title="Inspect High-Res Macro"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-center text-[10px] text-neutral-300">
                    <span className="font-mono">RTX 3060 12GB GDDR6</span>
                    <span className="text-neutral-400">Dual Fan Shroud</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                  <div className="font-semibold text-neutral-200">NVIDIA RTX 3060 12GB</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>PCIe Retention Clip:</span>
                    <span className="text-emerald-400 font-medium">Locked</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>8-Pin PCIe Power:</span>
                    <span className={hardwareState.gpuPowerPlugged ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.gpuPowerPlugged ? 'Connected' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleGpuPowerToggle}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      hardwareState.gpuPowerPlugged 
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                    }`}
                  >
                    <Cable className="w-3.5 h-3.5" />
                    <span>{hardwareState.gpuPowerPlugged ? 'Unplug 8-Pin PCIe Power' : 'Plug in 8-Pin PCIe Power Connector'}</span>
                  </button>

                  <button
                    onClick={handleGpuReseat}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700"
                  >
                    Reseat Card in PCIe x16 Slot
                  </button>
                </div>
              </div>
            )}

            {selectedComponent === 'cmos' && (
              <div className="space-y-4 text-xs">
                <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                  <div className="font-semibold text-neutral-200">CR2032 Lithium Coin Battery</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Installed:</span>
                    <span className={hardwareState.cmosBatteryInstalled ? 'text-emerald-400' : 'text-red-400'}>
                      {hardwareState.cmosBatteryInstalled ? 'Yes' : 'Removed'}
                    </span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Battery Status:</span>
                    <span className={hardwareState.cmosBatteryVoltage >= 2.7 ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.cmosBatteryVoltage >= 2.7 ? '3.0V Nominal' : 'Depleted (<2.5V)'}
                    </span>
                  </div>
                  {multimeterReadout && (
                    <div className="text-blue-400 font-mono text-[11px] pt-1 border-t border-neutral-700">
                      Meter: {multimeterReadout}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleTestCmosVoltage}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer border border-neutral-700 flex items-center justify-center gap-2"
                  >
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test with Digital Multimeter</span>
                  </button>

                  <button
                    onClick={handleReplaceCmosBattery}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Install Fresh 3.0V CR2032 Battery</span>
                  </button>
                </div>
              </div>
            )}

            {selectedComponent === 'sata' && (
              <div className="space-y-4 text-xs">
                {/* Photo-Realistic SATA SSD Card */}
                <div className="relative rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 group shadow-md">
                  <img
                    src={COMPONENT_IMAGES.ssd}
                    alt="SATA Solid State Drive SSD"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                  <button
                    onClick={() => setMacroZoomImage({
                      src: COMPONENT_IMAGES.ssd,
                      title: 'Samsung 870 EVO SATA 2.5" SSD',
                      subtitle: 'Inspect 7-pin SATA data header, 15-pin SATA power connector, and aluminum chassis casing.'
                    })}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                    title="Inspect High-Res Macro"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-center text-[10px] text-neutral-300">
                    <span className="font-mono">Samsung 870 EVO 500GB</span>
                    <span className="text-neutral-400">SATA III 6Gb/s</span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                  <div className="font-semibold text-neutral-200">Samsung 870 EVO SATA SSD</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>SATA Data Cable:</span>
                    <span className={hardwareState.sataDataConnected ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.sataDataConnected ? 'Connected to Port 0' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>SATA 15-Pin Power:</span>
                    <span className={hardwareState.sataPowerConnected ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.sataPowerConnected ? 'Connected' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSataDataToggle}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      hardwareState.sataDataConnected 
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                    }`}
                  >
                    <Cable className="w-3.5 h-3.5" />
                    <span>{hardwareState.sataDataConnected ? 'Disconnect SATA Data Cable' : 'Connect SATA Data Cable to Motherboard'}</span>
                  </button>

                  <button
                    onClick={handleSataPowerToggle}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      hardwareState.sataPowerConnected 
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{hardwareState.sataPowerConnected ? 'Disconnect SATA Power' : 'Connect SATA Power Cable from PSU'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedComponent === 'power_cables' && (
              <div className="space-y-4 text-xs">
                <div className="bg-neutral-800/80 p-3 rounded-lg border border-neutral-700 space-y-2">
                  <div className="font-semibold text-neutral-200">Main Power Harnesses</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>24-Pin ATX Main:</span>
                    <span className={hardwareState.atx24PinConnected ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.atx24PinConnected ? 'Firmly Latched' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>8-Pin EPS CPU 12V:</span>
                    <span className={hardwareState.cpu8PinConnected ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {hardwareState.cpu8PinConnected ? 'Connected' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleAtx24Toggle}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      hardwareState.atx24PinConnected 
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                    }`}
                  >
                    <Cable className="w-3.5 h-3.5" />
                    <span>{hardwareState.atx24PinConnected ? 'Unclip 24-Pin ATX Harness' : 'Plug in 24-Pin ATX Main Power'}</span>
                  </button>

                  <button
                    onClick={handleCpu8PinToggle}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      hardwareState.cpu8PinConnected 
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                    }`}
                  >
                    <Cable className="w-3.5 h-3.5" />
                    <span>{hardwareState.cpu8PinConnected ? 'Unplug 8-Pin CPU 12V' : 'Plug in 8-Pin CPU 12V Connector'}</span>
                  </button>
                </div>
              </div>
            )}

            {!selectedComponent && (
              <div className="p-4 bg-neutral-850 border border-neutral-800 rounded-lg text-center space-y-2">
                <HelpCircle className="w-6 h-6 text-neutral-500 mx-auto" />
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Click any hardware component on the motherboard schematic to inspect physical connections, test voltages, seat modules, or replace components.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex items-center justify-between">
            <span>Hardware Bench Status:</span>
            <span className="text-neutral-400 font-mono">ESD Ground Active</span>
          </div>

        </div>

      </div>

      {/* High-Resolution Macro Optical Inspection Modal */}
      {macroZoomImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200 select-none">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-sm text-neutral-100">{macroZoomImage.title}</h3>
                  <p className="text-xs text-neutral-400">{macroZoomImage.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setMacroZoomImage(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center bg-neutral-950">
              <img
                src={macroZoomImage.src}
                alt={macroZoomImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto object-contain rounded-xl border border-neutral-800 shadow-2xl"
              />
            </div>

            <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px]">HardwareLab Optical Bench // 1:1 Macro Magnification</span>
              <button
                onClick={() => setMacroZoomImage(null)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 px-4 py-1.5 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
