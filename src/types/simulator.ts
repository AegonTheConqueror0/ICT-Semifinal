/**
 * Types for HardwareLab - Simulated Computer Troubleshooting Workspace
 */

export type CameraView = 
  | 'desk'           // Full workbench view
  | 'monitor'        // Front view of the display monitor
  | 'case-side'      // Open side panel view of PC tower
  | 'motherboard'    // Extreme close-up of motherboard components
  | 'rear-io';       // Back of the PC case with video & power ports

export interface RAMStick {
  id: string;
  capacityGB: number;
  speedMHz: number;
  isDefective: boolean;
  contactsClean: boolean;
}

export interface RAMSlot {
  id: 'DIMM_A1' | 'DIMM_A2' | 'DIMM_B1' | 'DIMM_B2';
  label: string;
  channel: 'A' | 'B';
  installedStick: RAMStick | null;
  latched: boolean; // Are retention clips latched
}

export interface CableConnection {
  connected: boolean;
  firmlySeated: boolean;
}

export interface HardwareState {
  // Case & Physical
  sidePanelRemoved: boolean;
  screwsRemoved: boolean;
  casePowerButtonPushed: boolean;
  isSystemPoweredOn: boolean;
  fansSpinning: boolean;

  // Power Supply
  psuMasterSwitch: boolean; // I/O rocker on back
  psuWallPlugged: boolean;
  psuHealthy: boolean;

  // Motherboard & Power Connections
  atx24PinConnected: boolean;
  cpu8PinConnected: boolean;
  pcie8PinConnected: boolean;
  sataPowerConnected: boolean;
  sataDataConnected: boolean;
  sataPortConnectedOnMotherboard: boolean;

  // CPU & Cooler
  cpuInstalled: boolean;
  cpuDamagedPins: boolean;
  coolerMounted: boolean;
  coolerScrewsTightened: boolean;
  coolerFanPlugged: boolean;
  thermalPasteStatus: 'missing' | 'dried_out' | 'fresh';
  cpuTemperature: number; // in Celsius

  // RAM
  ramSlots: RAMSlot[];

  // GPU
  gpuInstalled: boolean;
  gpuPcieSeated: boolean;
  gpuBracketScrewed: boolean;
  gpuPowerPlugged: boolean;

  // Storage
  storageInstalled: boolean;
  storageHealthy: boolean;
  osCorrupted: boolean;

  // CMOS
  cmosBatteryInstalled: boolean;
  cmosBatteryVoltage: number; // 3.0V is good, <1.0V is dead
  biosSettingsReset: boolean;

  // Rear Display Cabling
  // A classic mistake: plugging HDMI into motherboard when dedicated GPU is installed (or CPU has no iGPU)
  displayCablePluggedInto: 'none' | 'motherboard' | 'gpu';
  monitorPowerOn: boolean;

  // Motherboard Diagnostics (Live status)
  qLedStatus: {
    cpu: boolean;    // Red
    dram: boolean;   // Amber
    vga: boolean;    // White
    boot: boolean;   // Green
  };
  hexPostCode: string; // e.g. "00", "55", "d6", "99", "AA"
  postBeepCode: 'none' | 'single_short' | 'three_beeps' | 'one_long_two_short' | 'continuous';

  // USB Port
  usbDriveInserted: boolean;
  usbDriveHasRecoveryTools: boolean;
}

export interface WorkOrder {
  id: string;
  ticketNumber: string;
  studentNumber?: number; // 1 to 20 for assignment
  customerName: string;
  deviceModel: string;
  intakeDate: string;
  customerReport: string; // The symptom described by customer (zero hints in pro mode!)
  guidedClue?: string;    // Gentle diagnostic hint for apprentice / guided mode
  guidedStep?: string;    // Practical action to resolve
  initialHardwareState: Partial<HardwareState>;
  solutionCriteria: (state: HardwareState) => {
    solved: boolean;
    remainingIssues: string[];
  };
  diagnosisOptions: {
    category: string;
    description: string;
  }[];
  correctDiagnosisCategory: string;
  activeFaultsList?: {
    id: string;
    shortTitle: string;
    description: string;
    diagnosticCategory: string;
    subsystem: string;
  }[];
}

export type ActiveTool = 
  | 'inspect'         // Hand cursor / direct manipulation
  | 'screwdriver'     // For thumbscrews, cooler mounting, M.2 screw
  | 'thermal_paste'   // Syringe of thermal paste
  | 'alcohol_wipe'    // For cleaning CPU IHS
  | 'multimeter'      // For testing PSU rails and CR2032
  | 'spare_ram'       // Spare DDR4 8GB stick
  | 'spare_sata'      // Spare SATA locking cable
  | 'spare_battery'   // Spare 3V CR2032 battery
  | 'usb_repair';     // Diagnostic boot USB
