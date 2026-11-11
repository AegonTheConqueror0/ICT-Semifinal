import { HardwareState, WorkOrder, RAMSlot, RAMStick } from '../types/simulator';
import { createDefaultHardwareState } from '../scenarios/troubleshootingScenarios';

export type DifficultyLevel = 'novice' | 'technician' | 'exam';

export interface HardwareFaultDefinition {
  id: string;
  subsystem: 'power' | 'memory' | 'video' | 'thermal' | 'storage_cmos';
  shortTitle: string;
  diagnosticCategory: string;
  description: string;
  symptomClues: string[];
  apply: (state: HardwareState) => void;
  checkResolved: (state: HardwareState) => { resolved: boolean; remainingIssue: string };
  autoFix: (state: HardwareState) => void;
}

export const FAULT_REGISTRY: HardwareFaultDefinition[] = [
  // 1. PSU Switch Off
  {
    id: 'FAULT_PSU_SWITCH',
    subsystem: 'power',
    shortTitle: 'PSU Rocker Switch OFF',
    diagnosticCategory: 'PSU_ROCKER_OFF',
    description: 'PSU master I/O rocker switch toggled OFF [O] on the rear panel',
    symptomClues: [
      'The computer will not power on at all. Pressing the front power switch produces zero response.',
      'PC seems completely lifeless. No lights, no fan twitch, nothing happens when power button is pressed.',
    ],
    apply: (state) => {
      state.psuMasterSwitch = false;
      state.isSystemPoweredOn = false;
      state.fansSpinning = false;
    },
    checkResolved: (state) => ({
      resolved: state.psuMasterSwitch === true,
      remainingIssue: 'Power Supply rear master rocker switch is toggled OFF (O).',
    }),
    autoFix: (state) => {
      state.psuMasterSwitch = true;
    },
  },

  // 2. AC Power Cord Unplugged
  {
    id: 'FAULT_PSU_WALL_CORD',
    subsystem: 'power',
    shortTitle: 'AC Power Cord Disconnected',
    diagnosticCategory: 'AC_CORD_DISCONNECTED',
    description: 'Main AC power cord disconnected from the power supply rear socket',
    symptomClues: [
      'Customer set up the PC after cleaning their room, but pressing the power button yields zero power or illumination.',
      'Desktop fails to receive AC mains current. Wall outlet is confirmed functional.',
    ],
    apply: (state) => {
      state.psuWallPlugged = false;
      state.isSystemPoweredOn = false;
      state.fansSpinning = false;
    },
    checkResolved: (state) => ({
      resolved: state.psuWallPlugged === true,
      remainingIssue: 'AC power cord is unplugged from the power supply IEC socket.',
    }),
    autoFix: (state) => {
      state.psuWallPlugged = true;
    },
  },

  // 3. 24-Pin ATX Unplugged
  {
    id: 'FAULT_ATX_24PIN',
    subsystem: 'power',
    shortTitle: '24-Pin ATX Harness Disconnected',
    diagnosticCategory: 'ATX_24PIN_UNPLUGGED',
    description: 'Main 24-Pin ATX power harness disconnected from the motherboard',
    symptomClues: [
      'PSU rocker switch is lit and power cable is in, but the motherboard receives no standby 5VSB or 12V power.',
      'Case power switch has no effect. Motherboard LEDs remain completely off.',
    ],
    apply: (state) => {
      state.atx24PinConnected = false;
      state.isSystemPoweredOn = false;
      state.fansSpinning = false;
    },
    checkResolved: (state) => ({
      resolved: state.atx24PinConnected === true,
      remainingIssue: 'Motherboard 24-Pin ATX main power harness is disconnected.',
    }),
    autoFix: (state) => {
      state.atx24PinConnected = true;
    },
  },

  // 4. 8-Pin CPU 12V EPS Unplugged
  {
    id: 'FAULT_CPU_8PIN',
    subsystem: 'power',
    shortTitle: '8-Pin CPU 12V EPS Disconnected',
    diagnosticCategory: 'CPU_8PIN_EPS_MISSING',
    description: 'Auxiliary 8-Pin CPU 12V power connector unplugged at top-left of motherboard',
    symptomClues: [
      'Fans spin up loudly, but motherboard immediately halts with Red CPU Q-LED on and POST Code 00. Continuous alert tone sounds.',
      'System powers on, but CPU fails initialization due to missing VRM 12V auxiliary line.',
    ],
    apply: (state) => {
      state.cpu8PinConnected = false;
    },
    checkResolved: (state) => ({
      resolved: state.cpu8PinConnected === true,
      remainingIssue: 'Auxiliary 8-Pin CPU 12V EPS cable at motherboard top-left is unplugged.',
    }),
    autoFix: (state) => {
      state.cpu8PinConnected = true;
    },
  },

  // 5. RAM Unseated in DIMM A2
  {
    id: 'FAULT_RAM_UNSEATED',
    subsystem: 'memory',
    shortTitle: 'RAM Module Unseated',
    diagnosticCategory: 'RAM_UNSEATED_LATCH',
    description: 'Memory stick in primary DIMM A2 slot is loose with retention clip popped open',
    symptomClues: [
      'PC powers on, fans spin, but the motherboard beeps 3 times, Amber DRAM LED lights up, and hex display halts at Code 55.',
      'Customer reports computer fans run continuously but monitor remains black and system beeps repeatedly.',
    ],
    apply: (state) => {
      state.ramSlots = state.ramSlots.map((s) => {
        if (s.id === 'DIMM_A2') {
          return { ...s, latched: false };
        }
        return s;
      });
      state.qLedStatus = { cpu: false, dram: true, vga: false, boot: false };
      state.hexPostCode = '55';
      state.postBeepCode = 'three_beeps';
    },
    checkResolved: (state) => {
      const seatedGood = state.ramSlots.some(
        (s) => s.installedStick && !s.installedStick.isDefective && s.latched
      );
      return {
        resolved: seatedGood,
        remainingIssue: 'Memory module is unseated or not latched securely into the DIMM slot.',
      };
    },
    autoFix: (state) => {
      state.ramSlots = state.ramSlots.map((s) => ({ ...s, latched: true }));
    },
  },

  // 6. Defective Second RAM Stick
  {
    id: 'FAULT_RAM_DEFECTIVE',
    subsystem: 'memory',
    shortTitle: 'Defective RAM Module in DIMM B2',
    diagnosticCategory: 'DEFECTIVE_RAM_MODULE',
    description: 'Secondary memory module has damaged memory cells preventing successful memory training',
    symptomClues: [
      'User installed a second RAM module from another computer. Now the PC fails to boot and beeps 3 times indefinitely.',
      'System fails memory training on channel B. Yellow DRAM Q-LED illuminates.',
    ],
    apply: (state) => {
      state.ramSlots = state.ramSlots.map((s) => {
        if (s.id === 'DIMM_B2') {
          return {
            ...s,
            installedStick: {
              id: 'ram-bad',
              capacityGB: 8,
              speedMHz: 3200,
              isDefective: true,
              contactsClean: true,
            },
            latched: true,
          };
        }
        return s;
      });
      state.qLedStatus = { cpu: false, dram: true, vga: false, boot: false };
      state.hexPostCode = '55';
      state.postBeepCode = 'three_beeps';
    },
    checkResolved: (state) => {
      const hasBad = state.ramSlots.some(
        (s) => s.installedStick && s.installedStick.isDefective
      );
      const hasWorking = state.ramSlots.some(
        (s) => s.installedStick && !s.installedStick.isDefective && s.latched
      );
      return {
        resolved: !hasBad && hasWorking,
        remainingIssue: 'A defective memory module is installed in DIMM slot or no working RAM is seated.',
      };
    },
    autoFix: (state) => {
      state.ramSlots = state.ramSlots.map((s) => {
        if (s.id === 'DIMM_B2') {
          return { ...s, installedStick: null, latched: true };
        }
        return s;
      });
    },
  },

  // 7. GPU Auxiliary Power Cable Missing
  {
    id: 'FAULT_GPU_POWER',
    subsystem: 'video',
    shortTitle: 'GPU 8-Pin PCIe Power Disconnected',
    diagnosticCategory: 'GPU_POWER_DISCONNECTED',
    description: 'Auxiliary 8-Pin PCIe power cable unplugged from dedicated graphics card',
    symptomClues: [
      'Computer powers on and beeps 1 long and 2 short. Motherboard White VGA LED remains lit and hex display halts on Code d6.',
      'Graphics card fans are stationary, monitor displays "No Signal", and VGA debug LED is lit.',
    ],
    apply: (state) => {
      state.gpuPowerPlugged = false;
      state.qLedStatus = { cpu: false, dram: false, vga: true, boot: false };
      state.hexPostCode = 'd6';
      state.postBeepCode = 'one_long_two_short';
    },
    checkResolved: (state) => ({
      resolved: state.gpuPowerPlugged === true,
      remainingIssue: 'Discrete graphics card 8-Pin PCIe auxiliary power cable is unplugged.',
    }),
    autoFix: (state) => {
      state.gpuPowerPlugged = true;
    },
  },

  // 8. GPU Unseated in PCIe x16 Slot
  {
    id: 'FAULT_GPU_PCIE_UNSEATED',
    subsystem: 'video',
    shortTitle: 'GPU Unseated in PCIe Slot',
    diagnosticCategory: 'GPU_PCIE_UNSEATED',
    description: 'Graphics card popped loose from the PCIe x16 motherboard slot',
    symptomClues: [
      'Customer moved their PC to a new desk. Now when booted, system beeps 1 long and 2 short with White VGA light on, no video.',
      'Display remains black. GPU card is physically tilted and not locked in the PCIe x16 slot.',
    ],
    apply: (state) => {
      state.gpuPcieSeated = false;
      state.qLedStatus = { cpu: false, dram: false, vga: true, boot: false };
      state.hexPostCode = 'd6';
      state.postBeepCode = 'one_long_two_short';
    },
    checkResolved: (state) => ({
      resolved: state.gpuPcieSeated === true,
      remainingIssue: 'Graphics card is loose / unseated in motherboard PCIe x16 slot.',
    }),
    autoFix: (state) => {
      state.gpuPcieSeated = true;
    },
  },

  // 9. Display Cable in Motherboard Instead of GPU
  {
    id: 'FAULT_DISPLAY_ONBOARD',
    subsystem: 'video',
    shortTitle: 'Video Cable in Motherboard Port',
    diagnosticCategory: 'DISPLAY_PLUGGED_INTO_MOTHERBOARD',
    description: 'Monitor HDMI cable plugged into motherboard onboard port instead of discrete GPU port',
    symptomClues: [
      'PC turns on and passes POST with a short single chime (Code AA), but monitor displays "No Signal / Check Video Cable".',
      'Customer bought a new graphics card. The PC boots up normally and plays Windows chime, but monitor gets no video feed.',
    ],
    apply: (state) => {
      state.displayCablePluggedInto = 'motherboard';
      state.gpuInstalled = true;
    },
    checkResolved: (state) => ({
      resolved: state.displayCablePluggedInto === 'gpu',
      remainingIssue: 'Monitor cable is plugged into onboard motherboard I/O rather than discrete GPU port.',
    }),
    autoFix: (state) => {
      state.displayCablePluggedInto = 'gpu';
    },
  },

  // 10. Display Cable Unplugged
  {
    id: 'FAULT_DISPLAY_UNPLUGGED',
    subsystem: 'video',
    shortTitle: 'Monitor Cable Disconnected',
    diagnosticCategory: 'DISPLAY_CABLE_DISCONNECTED',
    description: 'Monitor video cable is completely disconnected at the rear I/O',
    symptomClues: [
      'System lights up and fans spin, but monitor screen shows "Check Cable Connection".',
      'No video cable is attached to the back of the computer tower.',
    ],
    apply: (state) => {
      state.displayCablePluggedInto = 'none';
    },
    checkResolved: (state) => ({
      resolved: state.displayCablePluggedInto === 'gpu',
      remainingIssue: 'Monitor display cable is not plugged into the computer.',
    }),
    autoFix: (state) => {
      state.displayCablePluggedInto = 'gpu';
    },
  },

  // 11. CPU Overheating / Dried Paste & Loose Screws
  {
    id: 'FAULT_CPU_OVERHEAT',
    subsystem: 'thermal',
    shortTitle: 'Dried Thermal Paste & Loose Heatsink',
    diagnosticCategory: 'THERMAL_OVERHEAT_LOOSE_COOLER',
    description: 'CPU thermal paste is dried out and heatsink thumbscrews are loose, triggering thermal shutdown',
    symptomClues: [
      'Computer boots into Windows, but after 30 to 50 seconds the fans ramp to 100% and system suddenly shuts down.',
      'PC turns on normally but cuts power abruptly during operation. CPU temperature rapidly spikes above 90°C.',
    ],
    apply: (state) => {
      state.coolerScrewsTightened = false;
      state.thermalPasteStatus = 'dried_out';
      state.cpuTemperature = 92;
    },
    checkResolved: (state) => {
      const goodPaste = state.thermalPasteStatus === 'fresh';
      const goodScrews = state.coolerScrewsTightened && state.coolerMounted;
      return {
        resolved: goodPaste && goodScrews,
        remainingIssue: 'CPU cooler screws are loose or thermal paste needs cleaning and reapplication.',
      };
    },
    autoFix: (state) => {
      state.thermalPasteStatus = 'fresh';
      state.coolerScrewsTightened = true;
      state.coolerMounted = true;
      state.cpuTemperature = 38;
    },
  },

  // 12. SATA Data Disconnected
  {
    id: 'FAULT_SATA_DATA',
    subsystem: 'storage_cmos',
    shortTitle: 'SATA Data Cable Disconnected',
    diagnosticCategory: 'SATA_DATA_DISCONNECTED',
    description: 'SATA 6Gbps data cable disconnected between storage drive and motherboard Port 0',
    symptomClues: [
      'System powers on and passes POST, but halts at a black screen: "Reboot and Select proper Boot device or Insert Boot Media".',
      'UEFI BIOS cannot detect the primary Windows SSD. Motherboard Green BOOT LED remains lit.',
    ],
    apply: (state) => {
      state.sataDataConnected = false;
      state.qLedStatus = { cpu: false, dram: false, vga: false, boot: true };
    },
    checkResolved: (state) => ({
      resolved: state.sataDataConnected && state.sataPortConnectedOnMotherboard,
      remainingIssue: 'SATA data cable is unplugged from the storage drive or motherboard.',
    }),
    autoFix: (state) => {
      state.sataDataConnected = true;
      state.sataPortConnectedOnMotherboard = true;
    },
  },

  // 13. SATA Power Disconnected
  {
    id: 'FAULT_SATA_POWER',
    subsystem: 'storage_cmos',
    shortTitle: 'SATA Power Cable Disconnected',
    diagnosticCategory: 'SATA_POWER_DISCONNECTED',
    description: '15-Pin SATA power cable from PSU is unplugged from storage SSD',
    symptomClues: [
      'Computer turns on but boots straight into UEFI BIOS utility stating "No Drives Detected".',
      'Primary SSD is receiving no DC power. System cannot boot operating system.',
    ],
    apply: (state) => {
      state.sataPowerConnected = false;
      state.qLedStatus = { cpu: false, dram: false, vga: false, boot: true };
    },
    checkResolved: (state) => ({
      resolved: state.sataPowerConnected === true,
      remainingIssue: 'Storage drive 15-Pin SATA power cable is unplugged.',
    }),
    autoFix: (state) => {
      state.sataPowerConnected = true;
    },
  },

  // 14. Depleted CMOS Battery
  {
    id: 'FAULT_CMOS_DEAD',
    subsystem: 'storage_cmos',
    shortTitle: 'Dead CMOS CR2032 Battery',
    diagnosticCategory: 'CMOS_BATTERY_DEAD',
    description: 'CR2032 3V coin cell battery is depleted (0.4V), losing BIOS NVRAM date/time and hardware settings on shutdown',
    symptomClues: [
      'Every time the power strip is turned off, the PC halts at startup with "CMOS Checksum Bad - Press F1 to Run Setup" and date resets to Jan 1, 2001.',
      'BIOS settings and system clock do not save when PC is unplugged. Multimeter reveals CR2032 is below 1.0V.',
    ],
    apply: (state) => {
      state.cmosBatteryVoltage = 0.4;
      state.biosSettingsReset = true;
    },
    checkResolved: (state) => ({
      resolved: state.cmosBatteryVoltage >= 2.7,
      remainingIssue: 'CMOS CR2032 coin cell battery is depleted (<2.7V) and requires replacement.',
    }),
    autoFix: (state) => {
      state.cmosBatteryVoltage = 3.1;
      state.biosSettingsReset = false;
    },
  },

  // 15. Windows BCD Corrupted
  {
    id: 'FAULT_OS_BCD_CORRUPT',
    subsystem: 'storage_cmos',
    shortTitle: 'Corrupted Windows BCD Boot Data',
    diagnosticCategory: 'WINDOWS_BCD_CORRUPTED',
    description: 'Windows Boot Configuration Data store corrupted; requires USB recovery boot to rebuild',
    symptomClues: [
      'System powers on and passes POST, but encounters Blue Screen: "Recovery: Your PC needs to be repaired. Error code: 0xc000000f".',
      'Windows bootloader fails to find system registry hive on startup. System cannot complete boot.',
    ],
    apply: (state) => {
      state.osCorrupted = true;
    },
    checkResolved: (state) => ({
      resolved: state.osCorrupted === false,
      remainingIssue: 'Windows Boot Configuration Data (BCD) is corrupted and must be rebuilt via USB Recovery Drive.',
    }),
    autoFix: (state) => {
      state.osCorrupted = false;
    },
  },
];

// Customer Profiles for Procedural Tickets
const CUSTOMER_NAMES = [
  'Jordan Blake', 'Elena Rostova', 'Devon Campbell', 'Sophia Chen',
  'Liam Gallagher', 'Chloe Dubois', 'Tyler Vance', 'Aaliyah Patel',
  'Mateo Ramirez', 'Aria Montgomery', 'Zackary Scott', 'Nadia Al-Mansoor',
  'Jackson Brooks', 'Maya Lin', 'Caleb Wright', 'Hannah Kim'
];

const PC_SPECS = [
  'Custom ATX Gaming Rig (Core i5-12600K / RTX 3060 / 16GB DDR4)',
  'Creator Workstation (Ryzen 7 5700X / RTX 3070 / 32GB DDR4)',
  'Office Mid-Tower (Intel Core i3-10100 / 8GB DDR4 / 512GB SSD)',
  'Performance Desktop (Ryzen 5 5600X / Radeon RX 6600 / 16GB DDR4)',
  'CAD Engineering PC (Core i7-11700 / RTX 3060 / 32GB DDR4)'
];

// Distractor diagnostic options pool
const DISTRACTOR_DIAGNOSES = [
  { category: 'BLOWN_VRM_MOSFET', description: 'Blown VRM power delivery MOSFET on motherboard' },
  { category: 'DEAD_MONITOR_PANEL', description: 'Monitor internal power supply board failure' },
  { category: 'CORRUPTED_VBIOS', description: 'Discrete graphics card firmware corruption' },
  { category: 'PCI_LANE_FAULT', description: 'Damaged PCIe bus traces causing interrupt halt' },
  { category: 'BAD_POWER_STRIP', description: 'Surge protector internal thermal fuse blown' },
  { category: 'CPU_PIN_BENT', description: 'LGA1700 socket bent pins causing memory channel dropout' },
  { category: 'SATA_PORT_SHORT', description: 'Southbridge SATA controller electrical short' },
  { category: 'RAM_PARITY_ERROR', description: 'Severe SPD timing mismatch triggering kernel panic' },
];
// High-entropy 32-bit PRNG (Mulberry32) for deterministic or random distribution
function createMulberry32(seedNumber: number) {
  let a = seedNumber | 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 32-bit FNV-1a string hashing
function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

// Fisher-Yates array shuffle using provided PRNG
function shuffleArray<T>(array: readonly T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Procedurally generates a randomized troubleshooting work order.
 * @param difficulty 'novice' (1 fault), 'technician' (2 faults), or 'exam' (2-3 compound faults)
 * @param seed Optional string or number to generate reproducible or student-keyed exams
 */
export function generateProceduralWorkOrder(
  difficulty: DifficultyLevel = 'exam',
  seed?: string | number
): {
  workOrder: WorkOrder;
  faults: HardwareFaultDefinition[];
} {
  // Initialize PRNG: if seed provided, hash it; otherwise use cryptographically random value
  const seedNum = seed !== undefined && seed !== ''
    ? (typeof seed === 'number' ? seed : hashString(String(seed)))
    : Math.floor(Math.random() * 2147483647);

  const rng = createMulberry32(seedNum);

  // Determine number of faults
  let numFaults = 1;
  if (difficulty === 'technician') numFaults = 2;
  if (difficulty === 'exam') numFaults = 2 + Math.floor(rng() * 2); // 2 or 3 compound faults

  // Pick distinct faults from different subsystems using Fisher-Yates shuffle
  const shuffledFaults = shuffleArray(FAULT_REGISTRY, rng);
  const selectedFaults: HardwareFaultDefinition[] = [];
  const usedSubsystems = new Set<string>();

  for (const fault of shuffledFaults) {
    if (selectedFaults.length >= numFaults) break;
    // For realism, prefer different subsystems
    if (!usedSubsystems.has(fault.subsystem) || selectedFaults.length === 0) {
      // Incompatibility rules:
      // Don't combine display unplugged with display in motherboard
      const hasDisplayIssue = selectedFaults.some(f => f.subsystem === 'video');
      if (hasDisplayIssue && fault.subsystem === 'video') continue;

      // Don't combine SATA data unplugged and SATA power unplugged simultaneously (redundant symptom)
      const hasSataIssue = selectedFaults.some(f => f.id === 'FAULT_SATA_DATA' || f.id === 'FAULT_SATA_POWER');
      if (hasSataIssue && (fault.id === 'FAULT_SATA_DATA' || fault.id === 'FAULT_SATA_POWER')) continue;

      selectedFaults.push(fault);
      usedSubsystems.add(fault.subsystem);
    }
  }

  // If we couldn't fulfill numFaults with distinct subsystems, pick any compatible
  for (const fault of shuffledFaults) {
    if (selectedFaults.length >= numFaults) break;
    if (!selectedFaults.some(f => f.id === fault.id)) {
      selectedFaults.push(fault);
    }
  }

  // Customer metadata
  const customerName = CUSTOMER_NAMES[Math.floor(rng() * CUSTOMER_NAMES.length)];
  const deviceModel = PC_SPECS[Math.floor(rng() * PC_SPECS.length)];
  const ticketNum = `EXAM-${Math.floor(1000 + rng() * 9000)}`;

  // Synthesize realistic customer report (no spoilers!)
  // In the real world, the customer only observes the outermost symptom (e.g. PC won't turn on, or No Video, or Shuts off)
  // We sort faults by visibility hierarchy: Power inlet > Power internal > POST/RAM/CPU > Display > OS/Storage
  const sortedFaultsBySymptom = [...selectedFaults].sort((a, b) => {
    const hierarchy: Record<string, number> = {
      power: 1,
      memory: 2,
      video: 3,
      thermal: 4,
      storage_cmos: 5,
    };
    return (hierarchy[a.subsystem] || 99) - (hierarchy[b.subsystem] || 99);
  });

  // Outermost symptom description
  const primaryFault = sortedFaultsBySymptom[0];
  const symptomText = primaryFault.symptomClues[Math.floor(rng() * primaryFault.symptomClues.length)];
  
  let customerReport = symptomText;
  if (selectedFaults.length > 1) {
    const secondary = sortedFaultsBySymptom[1];
    customerReport += ` Note: User also mentions: "${secondary.symptomClues[0]}"`;
  }

  // Create initial hardware state by applying all selected faults onto default state
  const baseState = createDefaultHardwareState();
  selectedFaults.forEach(f => f.apply(baseState));

  // Build the correct combined diagnosis label
  const correctDiagnosisCategory = selectedFaults.map(f => f.diagnosticCategory).sort().join('__');
  const correctDiagnosisDescription = selectedFaults.map(f => f.description).join(' + ');

  // Build 3 convincing distractor diagnosis options
  const distractorList = [...DISTRACTOR_DIAGNOSES].sort(() => rng() - 0.5).slice(0, 3);
  const diagnosisOptions = [
    { category: correctDiagnosisCategory, description: correctDiagnosisDescription },
    ...distractorList.map(d => ({ category: d.category, description: d.description }))
  ].sort(() => rng() - 0.5);

  const workOrder: WorkOrder = {
    id: `rand-${ticketNum.toLowerCase()}`,
    ticketNumber: ticketNum,
    studentNumber: seed ? (typeof seed === 'number' ? seed : 42) : Math.floor(1 + rng() * 20),
    customerName,
    deviceModel,
    intakeDate: 'Oct 08, 2026',
    customerReport,
    guidedClue: difficulty === 'exam' ? undefined : selectedFaults[0].symptomClues[0],
    guidedStep: difficulty === 'exam' ? undefined : `Inspect components related to ${selectedFaults[0].subsystem}.`,
    initialHardwareState: baseState,
    solutionCriteria: (state: HardwareState) => {
      const remainingIssues: string[] = [];
      for (const fault of selectedFaults) {
        const check = fault.checkResolved(state);
        if (!check.resolved) {
          remainingIssues.push(check.remainingIssue);
        }
      }
      return {
        solved: remainingIssues.length === 0,
        remainingIssues,
      };
    },
    diagnosisOptions,
    correctDiagnosisCategory,
    activeFaultsList: selectedFaults.map(f => ({
      id: f.id,
      shortTitle: f.shortTitle,
      description: f.description,
      diagnosticCategory: f.diagnosticCategory,
      subsystem: f.subsystem,
    })),
  };

  return { workOrder, faults: selectedFaults };
}
