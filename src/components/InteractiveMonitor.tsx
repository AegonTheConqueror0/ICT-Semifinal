import React, { useState, useEffect } from 'react';
import { HardwareState } from '../types/simulator';
import { soundFX } from '../utils/audio';
import { 
  Power, 
  Terminal, 
  Activity, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Folder, 
  RotateCcw,
  ShieldAlert,
  Sliders,
  Database
} from 'lucide-react';

interface InteractiveMonitorProps {
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
  isZoomedIn: boolean;
  onExitZoom?: () => void;
}

export const InteractiveMonitor: React.FC<InteractiveMonitorProps> = ({
  hardwareState,
  onUpdateHardware,
  isZoomedIn,
  onExitZoom,
}) => {
  const [monitorPowered, setMonitorPowered] = useState(true);
  const [biosActiveTab, setBiosActiveTab] = useState<'main' | 'hwmon' | 'memory' | 'boot' | 'exit'>('main');
  const [inBios, setInBios] = useState(false);
  const [activeDesktopApp, setActiveDesktopApp] = useState<'diag' | 'cmd' | 'device_mgr' | null>(null);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    'Microsoft Windows [Version 10.0.22631.3296]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    'C:\\Users\\Technician> ',
  ]);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState<{
    cpu: 'pass' | 'fail' | 'warn';
    ram: 'pass' | 'fail';
    storage: 'pass' | 'fail';
    gpu: 'pass' | 'fail';
  } | null>(null);

  // Recovery UI state for corrupted OS scenario
  const [recoveryStep, setRecoveryStep] = useState<'main' | 'rebuilding' | 'done'>('main');

  // Evaluate the monitor signal
  // 1. Is PC powered on and PSU working?
  const isPCOn = hardwareState.isSystemPoweredOn && hardwareState.psuMasterSwitch && hardwareState.atx24PinConnected;

  // 2. Does PC have POST memory success?
  const hasSeatedRam = hardwareState.ramSlots.some(s => s.installedStick && !s.installedStick.isDefective && s.latched);

  // 3. Is Display cable plugged into the correct active port?
  // If discrete GPU is installed, motherboard port output gives NO SIGNAL (standard behavior on modern desktop with discrete card)
  const isDisplayCableValid = hardwareState.displayCablePluggedInto === 'gpu' 
    ? (hardwareState.gpuInstalled && hardwareState.gpuPcieSeated && hardwareState.gpuPowerPlugged)
    : (hardwareState.displayCablePluggedInto === 'motherboard' && !hardwareState.gpuInstalled); // Only works if no dGPU is present

  const hasVideoSignal = isPCOn && hasSeatedRam && isDisplayCableValid;

  // Storage connected?
  const hasStorage = hardwareState.storageInstalled && 
    hardwareState.sataDataConnected && 
    hardwareState.sataPowerConnected && 
    hardwareState.sataPortConnectedOnMotherboard;

  // Relaxed, student-friendly thermal progression simulation:
  useEffect(() => {
    if (!hardwareState.isSystemPoweredOn) return;
    
    // If thermal paste is dry/missing or cooler not mounted, CPU temp warms up gently
    if (hardwareState.thermalPasteStatus !== 'fresh' || !hardwareState.coolerScrewsTightened) {
      const interval = setInterval(() => {
        onUpdateHardware({
          // Gentle rise (+1C every 2.5s) up to 94C so students have plenty of time to diagnose
          cpuTemperature: Math.min(94, (hardwareState.cpuTemperature || 65) + 1),
        });
      }, 2500);
      return () => clearInterval(interval);
    } else {
      // Nominal cooling
      if ((hardwareState.cpuTemperature || 38) > 38) {
        const interval = setInterval(() => {
          onUpdateHardware({
            cpuTemperature: Math.max(38, (hardwareState.cpuTemperature || 42) - 1),
          });
        }, 1500);
        return () => clearInterval(interval);
      }
    }
  }, [hardwareState.isSystemPoweredOn, hardwareState.thermalPasteStatus, hardwareState.coolerScrewsTightened, hardwareState.cpuTemperature, onUpdateHardware]);

  // Gentle thermal protection cutoff (only outside BIOS after prolonged extreme heat >98C)
  useEffect(() => {
    // While in BIOS or inspecting, NEVER cut power abruptly so students can read telemetry calmly!
    if (inBios) return;

    if (hardwareState.isSystemPoweredOn && (hardwareState.cpuTemperature || 0) >= 98) {
      soundFX.updateFanState(false);
      soundFX.playClick('switch');
      onUpdateHardware({
        isSystemPoweredOn: false,
        fansSpinning: false,
      });
    }
  }, [hardwareState.cpuTemperature, hardwareState.isSystemPoweredOn, inBios, onUpdateHardware]);

  // Key handler for pressing DEL or F2 to enter BIOS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'F2') && hasVideoSignal && !inBios) {
        setInBios(true);
        soundFX.playClick('latch');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasVideoSignal, inBios]);

  // Command prompt submission
  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const trimmed = cmdInput.trim().toLowerCase();
    const newHistory = [...cmdHistory, `C:\\Users\\Technician> ${cmdInput}`];

    if (trimmed === 'help') {
      newHistory.push(
        'Supported diagnostic commands:',
        '  chkdsk C: /f     - Checks file system and disk integrity',
        '  sfc /scannow     - Scans integrity of protected system files',
        '  wmic diskdrive   - Queries physical drive health & SMART status',
        '  systeminfo       - Displays OS configuration & memory statistics',
        '  cls              - Clears screen'
      );
    } else if (trimmed === 'cls') {
      setCmdHistory(['C:\\Users\\Technician> ']);
      setCmdInput('');
      return;
    } else if (trimmed.startsWith('chkdsk')) {
      newHistory.push(
        'The type of the file system is NTFS.',
        'Volume label is OS_BOOT.',
        'Stage 1: Examining basic file system structure...',
        'Stage 2: Examining file name linkage...',
        'Windows has scanned the file system and found no problems.',
        '487,832,572 KB total disk space.',
        '142,392,100 KB in 284,912 files.',
        '0 KB in bad sectors.'
      );
    } else if (trimmed === 'sfc /scannow') {
      newHistory.push(
        'Beginning system scan. This process will take some time.',
        'Beginning verification phase of system scan.',
        'Verification 100% complete.',
        'Windows Resource Protection did not find any integrity violations.'
      );
    } else if (trimmed.startsWith('wmic diskdrive')) {
      newHistory.push(
        'Model                    Status  InterfaceType  Size(Bytes)',
        'SAMSUNG MZ7TY512HDHP-00  OK      IDE/SATA       512110190592'
      );
    } else if (trimmed === 'systeminfo') {
      const ramTotal = hardwareState.ramSlots
        .filter(s => s.installedStick && !s.installedStick.isDefective && s.latched)
        .reduce((acc, s) => acc + (s.installedStick?.capacityGB || 0), 0);
      newHistory.push(
        'OS Name:                   Microsoft Windows 11 Pro',
        'System Manufacturer:       HardwareLab Custom Platform',
        'Processor:                 1 Processor(s) Installed. [01]: x64 Family 6 Model 151',
        `Total Physical Memory:     ${ramTotal * 1024} MB`,
        `Available Memory:          ${Math.max(0, ramTotal * 1024 - 3100)} MB`,
        'Hotfix(s):                 4 Hotfix(s) Installed.'
      );
    } else {
      newHistory.push(`'${cmdInput}' is not recognized as an internal or external command.`);
    }

    newHistory.push('');
    setCmdHistory(newHistory);
    setCmdInput('');
  };

  // Run hardware stress test
  const runHardwareDiagnostic = () => {
    setDiagRunning(true);
    setDiagResults(null);
    setTimeout(() => {
      setDiagRunning(false);
      setDiagResults({
        cpu: (hardwareState.cpuTemperature || 40) > 85 ? 'warn' : 'pass',
        ram: hasSeatedRam ? 'pass' : 'fail',
        storage: hasStorage ? 'pass' : 'fail',
        gpu: hardwareState.gpuPowerPlugged ? 'pass' : 'fail',
      });
    }, 2000);
  };

  // Perform USB BCD repair
  const executeUsbBcdRepair = () => {
    setRecoveryStep('rebuilding');
    setTimeout(() => {
      setRecoveryStep('done');
      onUpdateHardware({ osCorrupted: false });
      soundFX.playBeep('single_short');
    }, 2500);
  };

  // Render Monitor Screen Content
  const renderScreenContent = () => {
    if (!monitorPowered) {
      return (
        <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
          <div className="text-neutral-700 text-xs font-mono">Display Powered Down</div>
        </div>
      );
    }

    // 1. NO SIGNAL STATE
    if (!hasVideoSignal) {
      return (
        <div className="w-full h-full bg-neutral-950 relative overflow-hidden flex flex-col items-center justify-center select-none">
          {/* Subtle CRT / LED scanlines */}
          <div className="absolute inset-0 bg-radial from-neutral-900/50 to-neutral-950" />
          
          {/* Floating OSD dialog */}
          <div className="z-10 bg-neutral-900/90 border border-neutral-700 text-neutral-200 px-6 py-4 rounded shadow-2xl flex flex-col items-center gap-2 font-mono text-sm backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 font-semibold tracking-wider text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Input: HDMI 1</span>
            </div>
            <div className="text-base font-bold text-white tracking-wide">NO SIGNAL</div>
            <div className="text-xs text-neutral-400">Check video cable connection to PC</div>
          </div>
        </div>
      );
    }

    // 2. UEFI BIOS SETUP SCREEN
    if (inBios) {
      const ramSlotsSeated = hardwareState.ramSlots.filter(s => s.installedStick && !s.installedStick.isDefective && s.latched);
      const totalMemoryGB = ramSlotsSeated.reduce((acc, s) => acc + (s.installedStick?.capacityGB || 0), 0);

      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-mono text-xs select-none">
          {/* BIOS Header */}
          <div className="bg-slate-950 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-bold tracking-wider text-sm">UEFI BIOS UTILITY</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-xs">Version 2.22.1284 (x64)</span>
            </div>
            <div className="text-slate-400 text-xs">
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* BIOS Navigation Tabs */}
          <div className="bg-slate-800 border-b border-slate-700 flex px-2 gap-1 pt-1">
            {[
              { id: 'main', label: 'Main' },
              { id: 'hwmon', label: 'Hardware Monitor' },
              { id: 'memory', label: 'Memory (DRAM)' },
              { id: 'boot', label: 'Boot Configuration' },
              { id: 'exit', label: 'Save & Exit' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBiosActiveTab(tab.id as typeof biosActiveTab)}
                className={`px-4 py-1.5 font-medium transition-colors border-t-2 ${
                  biosActiveTab === tab.id
                    ? 'bg-slate-900 text-blue-400 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* BIOS Body */}
          <div className="flex-1 p-5 overflow-auto bg-slate-900">
            {biosActiveTab === 'main' && (
              <div className="max-w-xl space-y-4">
                <div className="border border-slate-700 bg-slate-800/60 rounded p-4 space-y-2">
                  <div className="text-blue-400 font-semibold mb-2">System Information</div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-1">
                    <span className="text-slate-400">Processor:</span>
                    <span>12th Gen Intel(R) Core(TM) i5-12400F @ 2.50GHz</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-1">
                    <span className="text-slate-400">Total Installed Memory:</span>
                    <span>{totalMemoryGB} GB ({ramSlotsSeated.length} / 4 DIMMs active)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 pb-1">
                    <span className="text-slate-400">Storage Controller:</span>
                    <span>AHCI SATA 6Gb/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CMOS Battery Voltage:</span>
                    <span className={hardwareState.cmosBatteryVoltage < 2.5 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {hardwareState.cmosBatteryVoltage.toFixed(2)} V {hardwareState.cmosBatteryVoltage < 2.5 ? '(Depleted / Replace CR2032)' : '(Good)'}
                    </span>
                  </div>
                </div>

                <div className="text-slate-400 text-xs">
                  Tip: Use the top navigation tabs to inspect hardware telemetry and storage boot parameters.
                </div>
              </div>
            )}

            {biosActiveTab === 'hwmon' && (
              <div className="max-w-xl space-y-4">
                <div className="border border-slate-700 bg-slate-800/60 rounded p-4 space-y-3">
                  <div className="text-blue-400 font-semibold">Live Hardware Telemetry</div>

                  {/* CPU Temp Gauge */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">CPU Core Temperature:</span>
                      <span className={`font-bold text-sm ${
                        (hardwareState.cpuTemperature || 40) > 85 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {hardwareState.cpuTemperature || 40}°C / {Math.round(((hardwareState.cpuTemperature || 40) * 9/5) + 32)}°F
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          (hardwareState.cpuTemperature || 40) > 85 ? 'bg-red-500' : (hardwareState.cpuTemperature || 40) > 65 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, ((hardwareState.cpuTemperature || 40) / 105) * 100)}%` }}
                      />
                    </div>
                    {(hardwareState.cpuTemperature || 40) > 85 && (
                      <div className="text-red-400 text-xs mt-1 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        CRITICAL OVERHEAT WARNING - Check CPU heatsink mounting and thermal paste!
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between border-b border-slate-700/60 py-1">
                    <span className="text-slate-400">CPU Fan Speed:</span>
                    <span>{hardwareState.coolerFanPlugged ? '1,420 RPM' : '0 RPM (Not Connected)'}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-700/60 py-1">
                    <span className="text-slate-400">+12V Rail:</span>
                    <span className="text-emerald-400">12.096 V</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700/60 py-1">
                    <span className="text-slate-400">+5V Rail:</span>
                    <span className="text-emerald-400">5.012 V</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">+3.3V Rail:</span>
                    <span className="text-emerald-400">3.328 V</span>
                  </div>
                </div>
              </div>
            )}

            {biosActiveTab === 'memory' && (
              <div className="max-w-xl space-y-3">
                <div className="border border-slate-700 bg-slate-800/60 rounded p-4 space-y-2">
                  <div className="text-blue-400 font-semibold mb-2">DIMM Slot Status</div>
                  {hardwareState.ramSlots.map((slot) => (
                    <div key={slot.id} className="flex justify-between border-b border-slate-700/60 py-1.5 items-center">
                      <span className="text-slate-300 font-medium">{slot.label}:</span>
                      {slot.installedStick && slot.latched && !slot.installedStick.isDefective ? (
                        <span className="text-emerald-400">
                          {slot.installedStick.capacityGB}GB DDR4-{slot.installedStick.speedMHz} [Active]
                        </span>
                      ) : slot.installedStick && !slot.latched ? (
                        <span className="text-amber-400 font-semibold">
                          Module Loose / Unlatched Retention Clip
                        </span>
                      ) : (
                        <span className="text-slate-500">[Empty Slot]</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {biosActiveTab === 'boot' && (
              <div className="max-w-xl space-y-3">
                <div className="border border-slate-700 bg-slate-800/60 rounded p-4 space-y-2">
                  <div className="text-blue-400 font-semibold mb-2">Boot Priority List</div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 rounded">
                      <span className="text-slate-300">Boot Option #1:</span>
                      {hasStorage ? (
                        <span className="text-emerald-400">Windows Boot Manager (Samsung 870 EVO SSD)</span>
                      ) : (
                        <span className="text-red-400 font-bold">No SATA / NVMe Drive Detected</span>
                      )}
                    </div>

                    {hardwareState.usbDriveInserted && (
                      <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 rounded">
                        <span className="text-slate-300">Boot Option #2:</span>
                        <span className="text-blue-400">UEFI: SanDisk USB Recovery Toolkit (32GB)</span>
                      </div>
                    )}
                  </div>

                  {!hasStorage && (
                    <div className="text-amber-400 text-xs mt-2">
                      Notice: Primary boot drive not reported on SATA bus. Check physical cable connection inside case.
                    </div>
                  )}
                </div>
              </div>
            )}

            {biosActiveTab === 'exit' && (
              <div className="max-w-md space-y-3">
                <button
                  onClick={() => {
                    soundFX.playClick('switch');
                    setInBios(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded text-center transition-colors"
                >
                  Save Changes and Reboot
                </button>
                <button
                  onClick={() => {
                    soundFX.playClick('switch');
                    setInBios(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-4 rounded text-center border border-slate-700 transition-colors"
                >
                  Discard Changes and Exit
                </button>
              </div>
            )}
          </div>

          {/* BIOS Footer Navigation keys */}
          <div className="bg-slate-950 border-t border-slate-700 px-4 py-2 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex gap-4">
              <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-bold">ESC</kbd> Exit</span>
              <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-bold">F10</kbd> Save & Exit</span>
            </div>
            <button
              onClick={() => {
                soundFX.playClick('switch');
                setInBios(false);
              }}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Exit BIOS Setup
            </button>
          </div>
        </div>
      );
    }

    // 3. STORAGE DISCONNECTED / MISSING BOOT DEVICE ERROR
    if (!hasStorage && (!hardwareState.usbDriveInserted || !hardwareState.usbDriveHasRecoveryTools)) {
      return (
        <div className="w-full h-full bg-black text-white font-mono p-8 text-sm select-none flex flex-col justify-start">
          <div className="space-y-4">
            <div>American Megatrends BIOS (C) 2026</div>
            <div>CPU: Intel(R) Core(TM) i5-12400F CPU @ 2.50GHz</div>
            <div>Speed: 2.50GHz  Count: 6 Cores</div>
            <div>DRAM Frequency: 3200MHz</div>
            <div className="pt-6 font-bold text-neutral-100">
              Reboot and Select proper Boot device<br />
              or Insert Boot Media in selected Boot device and press a key_
            </div>
          </div>
          <div className="mt-auto pt-6 text-neutral-500 text-xs flex items-center justify-between">
            <span>Press <kbd className="bg-neutral-800 text-neutral-300 px-1 py-0.5 rounded">DEL</kbd> or <kbd className="bg-neutral-800 text-neutral-300 px-1 py-0.5 rounded">F2</kbd> to enter UEFI Setup</span>
            <button 
              onClick={() => setInBios(true)} 
              className="text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Enter BIOS
            </button>
          </div>
        </div>
      );
    }

    // 4. CORRUPTED OS / BSOD / RECOVERY ENVIRONMENT
    if (hardwareState.osCorrupted) {
      if (hardwareState.usbDriveInserted && hardwareState.usbDriveHasRecoveryTools) {
        // USB Diagnostic toolkit environment
        return (
          <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
            {/* USB Diagnostic Tool Header */}
            <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between border-b border-blue-700">
              <div className="flex items-center gap-2 font-semibold tracking-wide text-sm">
                <ShieldAlert className="w-4 h-4 text-blue-300" />
                <span>Technician USB Recovery Environment v5.4</span>
              </div>
              <span className="text-xs bg-blue-800 px-2 py-0.5 rounded text-blue-200">Live WinPE</span>
            </div>

            <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-left w-full space-y-3">
                <div className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span>Boot Diagnostic & Recovery Utility</span>
                </div>
                <p className="text-xs text-slate-400">
                  Target Disk: <span className="text-slate-200 font-mono">/dev/sda (Samsung SSD 870 EVO)</span><br />
                  Detected Issue: <span className="text-amber-400 font-mono">Missing or damaged BCD store (0xc000000e)</span>
                </p>

                {recoveryStep === 'main' && (
                  <button
                    onClick={executeUsbBcdRepair}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rebuild BCD Bootloader & Repair Partition</span>
                  </button>
                )}

                {recoveryStep === 'rebuilding' && (
                  <div className="py-4 space-y-2 text-center">
                    <div className="text-xs text-blue-400 font-mono animate-pulse">
                      Executing `bootrec /fixmbr`, `bootrec /fixboot`, `bootrec /rebuildbcd`...
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded overflow-hidden">
                      <div className="bg-blue-500 h-full w-2/3 animate-pulse" />
                    </div>
                  </div>
                )}

                {recoveryStep === 'done' && (
                  <div className="py-3 text-center space-y-3">
                    <div className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>BCD Store successfully rebuilt! System is bootable.</span>
                    </div>
                    <button
                      onClick={() => setRecoveryStep('main')}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1.5 px-3 rounded cursor-pointer"
                    >
                      Restart Computer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Blue Screen of Death
      return (
        <div className="w-full h-full bg-blue-600 text-white p-12 flex flex-col justify-between font-sans select-none">
          <div className="space-y-6 max-w-2xl">
            <div className="text-6xl font-light">:(</div>
            <div className="text-xl font-normal leading-relaxed">
              Your device ran into a problem and needs to restart. We&apos;re just collecting some error info, and then we&apos;ll restart for you.
            </div>
            <div className="pt-4 text-xs font-mono opacity-80 space-y-1">
              <div>Stop code: INACCESSIBLE_BOOT_DEVICE</div>
              <div>What failed: \EFI\Microsoft\Boot\BCD (0xc000000e)</div>
            </div>
          </div>
          <div className="text-xs opacity-75 font-mono flex items-center justify-between">
            <span>Insert technician recovery media or press DEL to enter UEFI BIOS.</span>
            <button 
              onClick={() => setInBios(true)} 
              className="text-white underline cursor-pointer"
            >
              Enter BIOS
            </button>
          </div>
        </div>
      );
    }

    // 5. FUNCTIONAL WINDOWS 11 DESKTOP
    return (
      <div className="w-full h-full bg-radial from-slate-800 to-slate-950 text-slate-100 flex flex-col select-none overflow-hidden relative">
        {/* Desktop Background Art */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Desktop Icons Area */}
        <div className="flex-1 p-6 grid grid-flow-col auto-cols-max gap-6 content-start z-10">
          {/* Diagnostic Tool Icon */}
          <button
            onClick={() => setActiveDesktopApp('diag')}
            className="flex flex-col items-center gap-1.5 w-20 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-600/80 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-200 leading-tight drop-shadow">Hardware Diagnostics</span>
          </button>

          {/* Command Prompt Icon */}
          <button
            onClick={() => setActiveDesktopApp('cmd')}
            className="flex flex-col items-center gap-1.5 w-20 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer group"
          >
            <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-emerald-400 border border-neutral-700 shadow-lg group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-200 leading-tight drop-shadow">Terminal (CMD)</span>
          </button>

          {/* Device Manager Icon */}
          <button
            onClick={() => setActiveDesktopApp('device_mgr')}
            className="flex flex-col items-center gap-1.5 w-20 p-2 rounded hover:bg-white/10 transition-colors text-center cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-600/80 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-200 leading-tight drop-shadow">Device Manager</span>
          </button>
        </div>

        {/* Floating Windows */}
        {activeDesktopApp === 'diag' && (
          <div className="absolute top-10 left-12 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 flex flex-col overflow-hidden text-xs">
            <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between text-slate-200">
              <span className="font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Hardware Diagnostic Suite
              </span>
              <button 
                onClick={() => setActiveDesktopApp(null)} 
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-slate-400 text-xs">
                Performs system bus health checks, memory addressing verification, and thermal sensor calibration.
              </p>

              <button
                disabled={diagRunning}
                onClick={runHardwareDiagnostic}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2 rounded text-xs transition-colors cursor-pointer"
              >
                {diagRunning ? 'Testing Subsystems (Please wait)...' : 'Run Full System Diagnostic'}
              </button>

              {diagResults && (
                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">CPU Thermal Check:</span>
                    {diagResults.cpu === 'pass' ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Nominal ({hardwareState.cpuTemperature}°C)
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> High Temp ({hardwareState.cpuTemperature}°C)
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Memory Integrity:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 0 Errors Detected
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Storage Controller:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SMART OK
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Dedicated GPU:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PCIe Gen 4 x16 Linked
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeDesktopApp === 'cmd' && (
          <div className="absolute top-12 left-20 w-[480px] h-72 bg-neutral-950 border border-neutral-700 rounded-lg shadow-2xl z-20 flex flex-col overflow-hidden font-mono text-xs">
            <div className="bg-neutral-900 px-3 py-1.5 border-b border-neutral-800 flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                Administrator: Command Prompt
              </span>
              <button 
                onClick={() => setActiveDesktopApp(null)} 
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto text-neutral-200 space-y-1">
              {cmdHistory.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">{line}</div>
              ))}
              <form onSubmit={handleCmdSubmit} className="flex items-center">
                <span className="text-emerald-400 mr-1.5">C:\Users\Technician&gt;</span>
                <input
                  type="text"
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white font-mono text-xs"
                  autoFocus
                />
              </form>
            </div>
          </div>
        )}

        {activeDesktopApp === 'device_mgr' && (
          <div className="absolute top-14 left-28 w-[420px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 flex flex-col overflow-hidden text-xs">
            <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between text-slate-200">
              <span className="font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Device Manager
              </span>
              <button 
                onClick={() => setActiveDesktopApp(null)} 
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3 font-mono text-[11px] text-slate-300">
              <div>
                <div className="text-slate-400 font-semibold mb-1">Display Adapters</div>
                <div className="pl-4 text-emerald-400">└ NVIDIA GeForce RTX 3060 (12 GB)</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold mb-1">Processors</div>
                <div className="pl-4 text-slate-200">└ 12th Gen Intel(R) Core(TM) i5-12400F (6C / 12T)</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold mb-1">Disk Drives</div>
                <div className="pl-4 text-slate-200">└ Samsung SSD 870 EVO 500GB (SATA AHCI)</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold mb-1">Memory Controllers</div>
                <div className="pl-4 text-slate-200">└ DDR4 Dual-Channel Synchronous Controller</div>
              </div>
            </div>
          </div>
        )}

        {/* Windows Taskbar */}
        <div className="bg-slate-950/90 border-t border-slate-800 h-10 px-4 flex items-center justify-between z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveDesktopApp(prev => prev === 'diag' ? null : 'diag')}
              className="p-1.5 hover:bg-slate-800 rounded transition-colors text-blue-400 cursor-pointer"
              title="Start"
            >
              <Cpu className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => setActiveDesktopApp('diag')}
              className={`p-1.5 rounded transition-colors ${activeDesktopApp === 'diag' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Diagnostics"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDesktopApp('cmd')}
              className={`p-1.5 rounded transition-colors ${activeDesktopApp === 'cmd' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Command Prompt"
            >
              <Terminal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDesktopApp('device_mgr')}
              className={`p-1.5 rounded transition-colors ${activeDesktopApp === 'device_mgr' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Device Manager"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
      isZoomedIn ? 'w-full h-full max-w-4xl max-h-[640px]' : 'w-full h-full'
    }`}>
      {/* Physical Monitor Bezel */}
      <div className="w-full h-full bg-neutral-900 border-8 border-neutral-800 rounded-t-xl shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-neutral-700/50">
        
        {/* Screen Display Area */}
        <div className="flex-1 w-full h-full overflow-hidden bg-black relative">
          {renderScreenContent()}
        </div>

        {/* Bottom Bezel with Brand and Power LED */}
        <div className="bg-neutral-850 h-8 border-t border-neutral-700/80 px-4 flex items-center justify-between text-neutral-400 text-[10px] font-sans">
          <span className="font-semibold tracking-widest text-neutral-400">LABVISION 27Q</span>

          <div className="flex items-center gap-3">
            {/* Monitor Power LED */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                !monitorPowered 
                  ? 'bg-neutral-700' 
                  : hasVideoSignal 
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' 
                    : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
              }`} />
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">
                {!monitorPowered ? 'Off' : hasVideoSignal ? 'Active' : 'Standby'}
              </span>
            </div>

            {/* Monitor Power Button */}
            <button
              onClick={() => {
                soundFX.playClick('switch');
                setMonitorPowered(!monitorPowered);
              }}
              className="p-1 hover:text-white text-neutral-400 cursor-pointer transition-colors"
              title="Monitor Power"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Monitor Stand Base */}
      <div className="w-32 h-6 bg-neutral-800 border-t border-neutral-700 rounded-b-md shadow-md flex items-center justify-center">
        <div className="w-16 h-1 bg-neutral-700 rounded-full" />
      </div>

      {/* Exit Zoom Button when in monitor view */}
      {isZoomedIn && onExitZoom && (
        <button
          onClick={onExitZoom}
          className="absolute -top-10 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-lg border border-neutral-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <X className="w-3.5 h-3.5" />
          <span>Back to Desk</span>
        </button>
      )}
    </div>
  );
};
