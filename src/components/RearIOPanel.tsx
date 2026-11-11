import React, { useState } from 'react';
import { HardwareState } from '../types/simulator';
import { soundFX } from '../utils/audio';
import { Power, Tv, Check, AlertCircle, Wrench, RotateCcw } from 'lucide-react';

interface RearIOPanelProps {
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
}

export const RearIOPanel: React.FC<RearIOPanelProps> = ({
  hardwareState,
  onUpdateHardware,
}) => {
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const handlePsuSwitchToggle = () => {
    soundFX.playClick('switch');
    const newState = !hardwareState.psuMasterSwitch;
    onUpdateHardware({
      psuMasterSwitch: newState,
      // If turned off, system power cuts immediately
      isSystemPoweredOn: newState ? hardwareState.isSystemPoweredOn : false,
      fansSpinning: newState ? hardwareState.fansSpinning : false,
    });
    if (!newState) {
      soundFX.updateFanState(false);
    }
    showToast(`PSU Rocker Switch toggled to ${newState ? 'ON [ I ]' : 'OFF [ O ]'}`);
  };

  const handlePowerCordToggle = () => {
    soundFX.playClick('cable');
    const newState = !hardwareState.psuWallPlugged;
    onUpdateHardware({
      psuWallPlugged: newState,
      isSystemPoweredOn: newState ? hardwareState.isSystemPoweredOn : false,
      fansSpinning: newState ? hardwareState.fansSpinning : false,
    });
    if (!newState) {
      soundFX.updateFanState(false);
    }
    showToast(`AC Power Cord ${newState ? 'Plugged In' : 'Unplugged'}`);
  };

  const handleDisplayCableChange = (target: 'none' | 'motherboard' | 'gpu') => {
    soundFX.playClick('cable');
    onUpdateHardware({ displayCablePluggedInto: target });
    if (target === 'motherboard') {
      showToast('Monitor HDMI cable plugged into Motherboard Onboard I/O port.');
    } else if (target === 'gpu') {
      showToast('Monitor DisplayPort/HDMI cable plugged into Discrete Graphics Card port.');
    } else {
      showToast('Monitor video cable disconnected.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 select-none relative">
      
      {/* Toast Notice */}
      {notice && (
        <div className="absolute top-8 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs shadow-xl flex items-center gap-2 z-30">
          <Wrench className="w-3.5 h-3.5 text-blue-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Rear Panel Chassis Cutout */}
      <div className="w-96 bg-slate-900 border-4 border-slate-700/80 rounded-xl p-5 shadow-2xl flex flex-col gap-6 ring-1 ring-slate-600/40">
        
        <div className="border-b border-slate-700/80 pb-3 flex items-center justify-between">
          <span className="font-mono text-xs text-slate-300 tracking-wider font-semibold">REAR CHASSIS I/O PANEL</span>
          <span className="text-[10px] text-slate-400 font-mono">100-240V ~ 50/60Hz</span>
        </div>

        {/* Top: Motherboard Integrated I/O Shield */}
        <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Motherboard Integrated Ports</span>
            <span className="text-[10px] text-slate-400 font-mono">Onboard I/O</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-750">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <div className="text-slate-200">HDMI 2.0 (Integrated)</div>
                <div className="text-[10px] text-slate-400">
                  {hardwareState.displayCablePluggedInto === 'motherboard' ? 'Cable Connected' : 'Port Empty'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDisplayCableChange(hardwareState.displayCablePluggedInto === 'motherboard' ? 'none' : 'motherboard')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                hardwareState.displayCablePluggedInto === 'motherboard'
                  ? 'bg-amber-600 text-white hover:bg-amber-500 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {hardwareState.displayCablePluggedInto === 'motherboard' ? 'Unplug Cable' : 'Plug Video Cable Here'}
            </button>
          </div>
        </div>

        {/* Middle: Expansion Slots (Discrete GPU Ports) */}
        <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">PCIe Expansion Slots</span>
            <span className="text-[10px] text-blue-400 font-mono font-semibold">GeForce RTX 3060</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-750">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <div className="text-xs">
                <div className="text-slate-200 font-medium">DisplayPort / HDMI (dGPU)</div>
                <div className="text-[10px] text-slate-400">
                  {hardwareState.displayCablePluggedInto === 'gpu' ? 'Cable Connected' : 'Port Empty'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDisplayCableChange(hardwareState.displayCablePluggedInto === 'gpu' ? 'none' : 'gpu')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                hardwareState.displayCablePluggedInto === 'gpu'
                  ? 'bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {hardwareState.displayCablePluggedInto === 'gpu' ? 'Unplug Cable' : 'Plug Video Cable Here'}
            </button>
          </div>
        </div>

        {/* Bottom: Power Supply Unit (PSU) AC Inlet & Rocker Switch */}
        <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Power Supply (650W Bronze)</span>
            <span className="text-[10px] text-slate-400 font-mono">AC Input</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Rocker Switch */}
            <button
              onClick={handlePsuSwitchToggle}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                hardwareState.psuMasterSwitch
                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                  : 'bg-red-950/50 border-red-500 text-red-400'
              }`}
            >
              <Power className="w-4 h-4" />
              <span className="text-xs font-mono font-bold">
                SWITCH: {hardwareState.psuMasterSwitch ? '[ I ] ON' : '[ O ] OFF'}
              </span>
            </button>

            {/* AC Power Cord */}
            <button
              onClick={handlePowerCordToggle}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                hardwareState.psuWallPlugged
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-amber-950/50 border-amber-500 text-amber-400'
              }`}
            >
              <div className="w-3 h-3 rounded-full border border-current" />
              <span className="text-xs font-medium">
                {hardwareState.psuWallPlugged ? 'Cord Plugged' : 'Cord Unplugged'}
              </span>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-4 text-xs text-slate-400">
        Click ports to switch where the monitor video cable or power is routed.
      </div>
    </div>
  );
};
