import React, { useState } from 'react';
import { CameraView, ActiveTool, HardwareState } from '../types/simulator';
import { soundFX } from '../utils/audio';
import { 
  Tv, 
  Cpu, 
  Layers, 
  RotateCw, 
  Cable, 
  Volume2, 
  VolumeX, 
  Wrench, 
  Sparkles, 
  Disc, 
  Usb, 
  Gauge, 
  HelpCircle,
  FileText,
  Power,
  BookOpen
} from 'lucide-react';

interface WorkBenchToolbarProps {
  currentView: CameraView;
  onSelectView: (view: CameraView) => void;
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onToggleWorkOrder: () => void;
  onOpenGuide?: () => void;
  hasOpenTicket: boolean;
}

export const WorkBenchToolbar: React.FC<WorkBenchToolbarProps> = ({
  currentView,
  onSelectView,
  hardwareState,
  onUpdateHardware,
  activeTool,
  onSelectTool,
  onToggleWorkOrder,
  onOpenGuide,
  hasOpenTicket,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
  };

  const handleUsbToggle = () => {
    soundFX.playClick('cable');
    const newState = !hardwareState.usbDriveInserted;
    onUpdateHardware({
      usbDriveInserted: newState,
      usbDriveHasRecoveryTools: newState,
    });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 select-none">
      
      {/* Collapsible Spare Parts & Diagnostic Drawer */}
      {drawerOpen && (
        <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="text-[11px] font-mono text-neutral-400 uppercase pr-2 border-r border-neutral-700">
            Parts Bench
          </div>

          {/* USB Recovery Drive */}
          <button
            onClick={handleUsbToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              hardwareState.usbDriveInserted
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>USB Recovery Drive {hardwareState.usbDriveInserted ? '(Plugged In)' : ''}</span>
          </button>

          {/* Spare DDR4 RAM Module */}
          <button
            onClick={() => {
              onSelectTool('spare_ram');
              onSelectView('motherboard');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 cursor-pointer group"
          >
            <img 
              src="/src/assets/images/component_ram_module_1790908846322.jpg" 
              alt="DDR4 RAM"
              referrerPolicy="no-referrer"
              className="w-5 h-4 object-cover rounded border border-neutral-600"
            />
            <span>Spare DDR4 8GB</span>
          </button>

          {/* Spare SATA SSD */}
          <button
            onClick={() => {
              onSelectTool('inspect');
              onSelectView('motherboard');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 cursor-pointer group"
          >
            <img 
              src="/src/assets/images/component_storage_ssd_1790908872523.jpg" 
              alt="SATA SSD"
              referrerPolicy="no-referrer"
              className="w-4 h-4 object-cover rounded border border-neutral-600"
            />
            <span>Samsung SSD</span>
          </button>

          {/* Thermal Paste & Wipe */}
          <button
            onClick={() => {
              onSelectTool('thermal_paste');
              onSelectView('motherboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Thermal Paste Syringe</span>
          </button>

          {/* Spare CR2032 Battery */}
          <button
            onClick={() => {
              onSelectTool('spare_battery');
              onSelectView('motherboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 cursor-pointer"
          >
            <Disc className="w-3.5 h-3.5 text-neutral-300" />
            <span>Spare CR2032 Battery</span>
          </button>

          {/* Digital Multimeter */}
          <button
            onClick={() => {
              onSelectTool('multimeter');
              onSelectView('motherboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Multimeter</span>
          </button>
        </div>
      )}

      {/* Main Navigation Island */}
      <div className="bg-neutral-900/90 border border-neutral-750 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1 ring-1 ring-white/5">
        
        {/* Work Order Ticket Button */}
        <button
          onClick={onToggleWorkOrder}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            hasOpenTicket 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
              : 'text-neutral-300 hover:bg-neutral-800'
          }`}
          title="Customer Work Order & Diagnosis"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">Work Order</span>
        </button>

        <div className="h-5 w-px bg-neutral-800 mx-1" />

        {/* Viewport Camera Selectors */}
        {[
          { id: 'desk', label: 'Desk Overview', icon: Tv },
          { id: 'monitor', label: 'Monitor Screen', icon: Tv },
          { id: 'motherboard', label: 'Motherboard', icon: Cpu },
          { id: 'rear-io', label: 'Rear I/O Ports', icon: Cable },
        ].map((v) => {
          const Icon = v.icon;
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelectView(v.id as CameraView)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          );
        })}

        <div className="h-5 w-px bg-neutral-800 mx-1" />

        {/* Spare Parts Toggle */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            drawerOpen 
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' 
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title="Technician Spare Parts & Tools"
        >
          <span>Tools & Parts</span>
        </button>

        {/* Mute Audio Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};
