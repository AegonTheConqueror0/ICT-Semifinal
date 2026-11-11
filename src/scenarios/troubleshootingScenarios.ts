import { WorkOrder, HardwareState, RAMSlot } from '../types/simulator';

export const createDefaultHardwareState = (): HardwareState => {
  const ramSlots: RAMSlot[] = [
    { id: 'DIMM_A1', label: 'DIMM A1', channel: 'A', installedStick: null, latched: true },
    { 
      id: 'DIMM_A2', 
      label: 'DIMM A2 (Primary)', 
      channel: 'A', 
      installedStick: { id: 'ram-1', capacityGB: 8, speedMHz: 3200, isDefective: false, contactsClean: true }, 
      latched: true 
    },
    { id: 'DIMM_B1', label: 'DIMM B1', channel: 'B', installedStick: null, latched: true },
    { 
      id: 'DIMM_B2', 
      label: 'DIMM B2 (Secondary)', 
      channel: 'B', 
      installedStick: { id: 'ram-2', capacityGB: 8, speedMHz: 3200, isDefective: false, contactsClean: true }, 
      latched: true 
    },
  ];

  return {
    sidePanelRemoved: false,
    screwsRemoved: false,
    casePowerButtonPushed: false,
    isSystemPoweredOn: false,
    fansSpinning: false,

    psuMasterSwitch: true,
    psuWallPlugged: true,
    psuHealthy: true,

    atx24PinConnected: true,
    cpu8PinConnected: true,
    pcie8PinConnected: true,
    sataPowerConnected: true,
    sataDataConnected: true,
    sataPortConnectedOnMotherboard: true,

    cpuInstalled: true,
    cpuDamagedPins: false,
    coolerMounted: true,
    coolerScrewsTightened: true,
    coolerFanPlugged: true,
    thermalPasteStatus: 'fresh',
    cpuTemperature: 38,

    ramSlots,

    gpuInstalled: true,
    gpuPcieSeated: true,
    gpuBracketScrewed: true,
    gpuPowerPlugged: true,

    storageInstalled: true,
    storageHealthy: true,
    osCorrupted: false,

    cmosBatteryInstalled: true,
    cmosBatteryVoltage: 3.1,
    biosSettingsReset: false,

    displayCablePluggedInto: 'gpu',
    monitorPowerOn: true,

    qLedStatus: {
      cpu: false,
      dram: false,
      vga: false,
      boot: false,
    },
    hexPostCode: 'AA',
    postBeepCode: 'single_short',

    usbDriveInserted: false,
    usbDriveHasRecoveryTools: false,
  };
};

export const WORK_ORDERS: WorkOrder[] = [
  // CASE 1
  {
    id: 'wo-101',
    ticketNumber: 'WO #101',
    studentNumber: 1,
    customerName: 'Marcus Vance',
    deviceModel: 'Custom ATX Gaming PC (Intel i5-12400F / RTX 3060)',
    intakeDate: 'Oct 02, 2026',
    customerReport: 'Turned on the computer before work. Fans spin up loudly and there is an audible repeating beeping sound, but the display remains pitch black with no signal. Rebooting does not change anything.',
    guidedClue: '3 Beeps and Yellow/Amber DRAM LED indicates memory failure. Inspect the RAM slot latches.',
    guidedStep: 'Go to Internal Chassis -> Click RAM Slot DIMM A2 -> Click "Press Down & Latch RAM Stick".',
    initialHardwareState: {
      ramSlots: [
        { id: 'DIMM_A1', label: 'DIMM A1', channel: 'A', installedStick: null, latched: true },
        { 
          id: 'DIMM_A2', 
          label: 'DIMM A2 (Primary)', 
          channel: 'A', 
          installedStick: { id: 'ram-1', capacityGB: 8, speedMHz: 3200, isDefective: false, contactsClean: true }, 
          latched: false // Loose / unseated!
        },
        { id: 'DIMM_B1', label: 'DIMM B1', channel: 'B', installedStick: null, latched: true },
        { id: 'DIMM_B2', label: 'DIMM B2 (Secondary)', channel: 'B', installedStick: null, latched: true },
      ],
      qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
      hexPostCode: '55',
      postBeepCode: 'three_beeps',
    },
    solutionCriteria: (state: HardwareState) => {
      const seatedRam = state.ramSlots.filter(s => s.installedStick && !s.installedStick.isDefective && s.latched);
      if (seatedRam.length === 0) {
        return { solved: false, remainingIssues: ['Memory is unseated or not detected by motherboard.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'DRAM_UNSEATED', description: 'RAM module unseated / loose memory retention latch' },
      { category: 'PSU_DEFECT', description: 'Faulty 12V power supply rail' },
      { category: 'GPU_FAILURE', description: 'Discrete GPU PCIe lane failure' },
      { category: 'STORAGE_DEAD', description: 'Corrupted boot sector on primary SSD' },
    ],
    correctDiagnosisCategory: 'DRAM_UNSEATED',
  },

  // CASE 2
  {
    id: 'wo-102',
    ticketNumber: 'WO #102',
    studentNumber: 2,
    customerName: 'Sarah Jenkins',
    deviceModel: 'Workstation Desktop (Ryzen 5 / B550)',
    intakeDate: 'Oct 02, 2026',
    customerReport: 'The system powers on and begins booting into Windows, but after approximately 40 to 60 seconds it suddenly cuts power completely. The computer will not turn on again unless allowed to rest for several minutes.',
    guidedClue: 'Sudden thermal cutoff after 45s. Telemetry shows CPU temperature spiking past 90°C.',
    guidedStep: 'Go to Internal Chassis -> CPU Cooler -> Clean dried paste, apply fresh thermal paste, and tighten cooler screws.',
    initialHardwareState: {
      coolerScrewsTightened: false,
      thermalPasteStatus: 'dried_out',
      cpuTemperature: 92,
    },
    solutionCriteria: (state: HardwareState) => {
      const issues: string[] = [];
      if (state.thermalPasteStatus !== 'fresh') {
        issues.push('Thermal interface material between CPU IHS and cooler is dry or missing.');
      }
      if (!state.coolerScrewsTightened || !state.coolerMounted) {
        issues.push('CPU heatsink cooler is not firmly mounted with tightened bracket screws.');
      }
      return { solved: issues.length === 0, remainingIssues: issues };
    },
    diagnosisOptions: [
      { category: 'THERMAL_OVERHEAT', description: 'CPU thermal throttling & emergency shutdown due to dried thermal paste / loose cooler' },
      { category: 'BAD_CAPACITOR', description: 'Motherboard VRM filter capacitor breakdown' },
      { category: 'MALWARE_CRASH', description: 'Kernel driver exploit causing sudden shutdown' },
      { category: 'RAM_PARITY', description: 'ECC memory parity failure under heavy load' },
    ],
    correctDiagnosisCategory: 'THERMAL_OVERHEAT',
  },

  // CASE 3
  {
    id: 'wo-103',
    ticketNumber: 'WO #103',
    studentNumber: 3,
    customerName: 'Alex Rivera',
    deviceModel: 'Mid-Tower PC (Core i5-11400F / GTX 1660 Super)',
    intakeDate: 'Oct 03, 2026',
    customerReport: 'I bought a dedicated graphics card and installed it. The computer lights up, the fans are spinning, and I can hear Windows start chime through my headphones, but the monitor says "Check Video Cable / No Signal".',
    guidedClue: 'PC has a dedicated GPU installed. When a discrete card is installed, motherboard display ports are disabled.',
    guidedStep: 'Go to Rear I/O -> Move monitor video cable from Motherboard HDMI to the discrete GPU lower port.',
    initialHardwareState: {
      displayCablePluggedInto: 'motherboard',
      gpuInstalled: true,
      gpuPowerPlugged: true,
    },
    solutionCriteria: (state: HardwareState) => {
      if (state.displayCablePluggedInto !== 'gpu') {
        return { solved: false, remainingIssues: ['Display cable is plugged into motherboard I/O rather than discrete GPU port.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'WRONG_DISPLAY_PORT', description: 'Monitor video cable connected to Motherboard I/O instead of discrete GPU' },
      { category: 'DEAD_MONITOR', description: 'Monitor internal power supply board burned out' },
      { category: 'BAD_PCI_SLOT', description: 'Motherboard PCIe x16 slot physically broken' },
      { category: 'CORRUPT_VBIOS', description: 'Graphics card VBIOS bricked' },
    ],
    correctDiagnosisCategory: 'WRONG_DISPLAY_PORT',
  },

  // CASE 4
  {
    id: 'wo-104',
    ticketNumber: 'WO #104',
    studentNumber: 4,
    customerName: 'Evelyn Reed',
    deviceModel: 'Office Desktop (Core i3-10100 / 256GB SATA SSD)',
    intakeDate: 'Oct 03, 2026',
    customerReport: 'Computer turns on normally, but after POST it halts at a black screen with white text stating: "Reboot and Select proper Boot device or Insert Boot Media in selected Boot device and press a key".',
    guidedClue: 'BIOS cannot locate any bootable OS drive. Inspect the storage device connection.',
    guidedStep: 'Go to Internal Chassis -> SATA Storage -> Connect SATA data cable to motherboard Port 0.',
    initialHardwareState: {
      sataDataConnected: false,
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.sataDataConnected || !state.sataPowerConnected || !state.sataPortConnectedOnMotherboard) {
        return { solved: false, remainingIssues: ['Primary storage drive SATA data or power cable is disconnected.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'STORAGE_DISCONNECTED', description: 'SATA data or power cable disconnected from primary boot drive' },
      { category: 'CPU_CACHE_FAULT', description: 'CPU L3 Cache defect preventing kernel dispatch' },
      { category: 'VGA_ROM_MISSING', description: 'Motherboard missing Option ROM firmware' },
      { category: 'BAD_RAM_STICK', description: 'RAM SPD EEPROM corrupted' },
    ],
    correctDiagnosisCategory: 'STORAGE_DISCONNECTED',
  },

  // CASE 5
  {
    id: 'wo-105',
    ticketNumber: 'WO #105',
    studentNumber: 5,
    customerName: 'Derrick Hall',
    deviceModel: 'Home Desktop (ATX Standard Case)',
    intakeDate: 'Oct 04, 2026',
    customerReport: 'I press the front power button on the case and nothing happens whatsoever. No fans spin, no LEDs turn on, no sound. The wall outlet has power because my phone charger works in it.',
    guidedClue: 'Zero power entering system. Check the rear PSU rocker switch and motherboard 24-Pin ATX main connector.',
    guidedStep: 'Go to Rear I/O -> Toggle PSU switch to [ I ] ON -> Go to Internal Chassis -> Connect 24-Pin ATX.',
    initialHardwareState: {
      psuMasterSwitch: false,
      atx24PinConnected: false,
    },
    solutionCriteria: (state: HardwareState) => {
      const issues: string[] = [];
      if (!state.psuMasterSwitch) {
        issues.push('PSU master power rocker switch (I/O) is toggled to OFF (O).');
      }
      if (!state.atx24PinConnected) {
        issues.push('Motherboard 24-Pin ATX main power harness is not seated.');
      }
      return { solved: issues.length === 0, remainingIssues: issues };
    },
    diagnosisOptions: [
      { category: 'POWER_SUPPLY_OFF', description: 'PSU rocker switch toggled OFF & 24-Pin ATX power harness disconnected' },
      { category: 'BLOWN_CPU', description: 'CPU silicone electromigration fatal short circuit' },
      { category: 'DEAD_MONITOR', description: 'Display panel failed power handshake' },
      { category: 'CMOS_JUMPER', description: 'Clear CMOS jumper set to shorted position' },
    ],
    correctDiagnosisCategory: 'POWER_SUPPLY_OFF',
  },

  // CASE 6
  {
    id: 'wo-106',
    ticketNumber: 'WO #106',
    studentNumber: 6,
    customerName: 'Claire Bennet',
    deviceModel: 'Legacy Workstation (LGA1151 / B360)',
    intakeDate: 'Oct 04, 2026',
    customerReport: 'Whenever I unplug the power cord or turn off my surge protector, the computer halts during boot with "CMOS Checksum Bad - Press F1 to Run SETUP". The date and time in Windows always reverts back to year 2012.',
    guidedClue: 'RTC clock and BIOS configuration revert when power cuts. Coin cell battery voltage is depleted.',
    guidedStep: 'Go to Internal Chassis -> Click CMOS Battery -> Click "Install Fresh 3.0V CR2032 Battery".',
    initialHardwareState: {
      cmosBatteryVoltage: 0.4,
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.cmosBatteryInstalled || state.cmosBatteryVoltage < 2.7) {
        return { solved: false, remainingIssues: ['CR2032 CMOS battery is depleted (<2.7V) and cannot maintain NVRAM BIOS settings.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'DEAD_CMOS_BATTERY', description: 'Depleted CR2032 3V coin cell battery failing to maintain CMOS NVRAM RTC settings' },
      { category: 'SATA_CONTROLLER_FAIL', description: 'Chipset SATA controller defective' },
      { category: 'CORRUPT_WINDOWS_REG', description: 'Windows registry clock corruption' },
      { category: 'GROUND_FAULT', description: 'Chassis motherboard standoff grounding short' },
    ],
    correctDiagnosisCategory: 'DEAD_CMOS_BATTERY',
  },

  // CASE 7
  {
    id: 'wo-107',
    ticketNumber: 'WO #107',
    studentNumber: 7,
    customerName: 'Jordan Smith',
    deviceModel: 'Gaming Tower (RTX 3070 Ti / 750W PSU)',
    intakeDate: 'Oct 05, 2026',
    customerReport: 'System lights up and case fans spin, but the motherboard diagnostic light stays on a solid white LED (VGA) and the monitor shows a warning: "PLEASE POWER DOWN AND CONNECT THE PCIe POWER CABLE(S) FOR THIS GRAPHICS CARD".',
    guidedClue: 'White VGA LED lit (POST Code d6). Graphics card is missing auxiliary PCIe 8-pin power from the PSU.',
    guidedStep: 'Go to Internal Chassis -> Click Graphics Card -> Click "Plug in 8-Pin PCIe Power Connector".',
    initialHardwareState: {
      pcie8PinConnected: false,
      gpuPowerPlugged: false,
      qLedStatus: { cpu: false, dram: false, vga: true, boot: false },
      hexPostCode: 'd6',
      postBeepCode: 'one_long_two_short',
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.gpuPowerPlugged || !state.pcie8PinConnected) {
        return { solved: false, remainingIssues: ['Auxiliary 8-Pin PCIe power connector is not plugged into the graphics card.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'GPU_POWER_UNPLUGGED', description: 'Auxiliary 8-Pin PCIe power cable unplugged from graphics card' },
      { category: 'CPU_PIN_BENT', description: 'Bent pin in LGA CPU socket' },
      { category: 'DEAD_SSD', description: 'NVMe controller firmware lock' },
      { category: 'RAM_CHANNEL_FAULT', description: 'IMC memory channel B trace severed' },
    ],
    correctDiagnosisCategory: 'GPU_POWER_UNPLUGGED',
  },

  // CASE 8
  {
    id: 'wo-108',
    ticketNumber: 'WO #108',
    studentNumber: 8,
    customerName: 'Taylor Morgan',
    deviceModel: 'Student PC (Windows 11 / 500GB SSD)',
    intakeDate: 'Oct 05, 2026',
    customerReport: 'Windows starts loading with the spinning dots, but quickly crashes into a Blue Screen saying: "Recovery - Your PC couldn\'t start properly. File: \\EFI\\Microsoft\\Boot\\BCD. Error code: 0xc000000f".',
    guidedClue: 'Windows Boot Configuration Data (BCD) file is corrupted. Requires boot repair via Recovery Drive.',
    guidedStep: 'Plug in USB Recovery Drive (Tools & Parts drawer) -> Rebuild BCD store in Command Prompt or Windows Setup.',
    initialHardwareState: {
      osCorrupted: true,
      storageHealthy: true,
      sataDataConnected: true,
      sataPowerConnected: true,
    },
    solutionCriteria: (state: HardwareState) => {
      if (state.osCorrupted) {
        return { solved: false, remainingIssues: ['Windows Boot Configuration Data (BCD) is corrupted. Requires boot repair via Recovery Drive.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'CORRUPTED_BCD_BOOTLOADER', description: 'Corrupted Windows BCD Bootloader requiring repair via Diagnostic USB' },
      { category: 'HARDWARE_RAM_DEFECT', description: 'Physical cell failure in RAM bank' },
      { category: 'MOTHERBOARD_VBIOS', description: 'UEFI GOP driver corruption' },
      { category: 'THERMAL_SHUTDOWN', description: 'Chipset heatsink overheating' },
    ],
    correctDiagnosisCategory: 'CORRUPTED_BCD_BOOTLOADER',
  },

  // CASE 9
  {
    id: 'wo-109',
    ticketNumber: 'WO #109',
    studentNumber: 9,
    customerName: 'Nathan Drake',
    deviceModel: 'High-End Gaming Rig (Core i7 / Z690)',
    intakeDate: 'Oct 06, 2026',
    customerReport: 'I press the power button, the fans twitch for a fraction of a second, but the motherboard diagnostic light immediately turns solid RED at CPU and emits rapid beeping. The monitor remains completely dark.',
    guidedClue: 'Red CPU LED lit (POST Code 00). The 8-Pin EPS CPU auxiliary 12V power line is not connected.',
    guidedStep: 'Go to Internal Chassis -> Click 8-Pin CPU 12V at top-left -> Click "Plug in 8-Pin EPS Cable".',
    initialHardwareState: {
      cpu8PinConnected: false, // 8-Pin EPS CPU 12V unplugged!
      qLedStatus: { cpu: true, dram: false, vga: false, boot: false },
      hexPostCode: '00',
      postBeepCode: 'continuous',
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.cpu8PinConnected) {
        return { solved: false, remainingIssues: ['8-Pin EPS CPU 12V auxiliary power cable is disconnected from the motherboard.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'CPU_POWER_DISCONNECTED', description: '8-Pin EPS 12V CPU power connector disconnected from motherboard VRM header' },
      { category: 'FAILED_GPU_FAN', description: 'Graphics card tachometer sensor fault' },
      { category: 'CORRUPT_CMOS', description: 'Corrupt CMOS RTC clock register' },
      { category: 'DEFECTIVE_PANEL', description: 'Display panel LVDS ribbon failure' },
    ],
    correctDiagnosisCategory: 'CPU_POWER_DISCONNECTED',
  },

  // CASE 10
  {
    id: 'wo-110',
    ticketNumber: 'WO #110',
    studentNumber: 10,
    customerName: 'Samantha Wu',
    deviceModel: 'CAD Drafting Workstation (32GB DDR4)',
    intakeDate: 'Oct 06, 2026',
    customerReport: 'Computer was upgraded with a second memory stick. Now the PC fails to pass POST, the DRAM diagnostic LED shines bright yellow/amber, and system speaker beeps repeatedly without showing BIOS.',
    guidedClue: 'POST Code 55 with 3 beeps. The newly inserted second RAM stick in DIMM B2 has defective SPD/contacts.',
    guidedStep: 'Go to Internal Chassis -> Click RAM Slot DIMM B2 -> Click "Remove Defective RAM Stick".',
    initialHardwareState: {
      ramSlots: [
        { id: 'DIMM_A1', label: 'DIMM A1', channel: 'A', installedStick: null, latched: true },
        { 
          id: 'DIMM_A2', 
          label: 'DIMM A2 (Primary)', 
          channel: 'A', 
          installedStick: { id: 'ram-1', capacityGB: 8, speedMHz: 3200, isDefective: false, contactsClean: true }, 
          latched: true 
        },
        { id: 'DIMM_B1', label: 'DIMM B1', channel: 'B', installedStick: null, latched: true },
        { 
          id: 'DIMM_B2', 
          label: 'DIMM B2 (Secondary)', 
          channel: 'B', 
          installedStick: { id: 'ram-bad', capacityGB: 8, speedMHz: 3200, isDefective: true, contactsClean: false }, 
          latched: true 
        },
      ],
      qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
      hexPostCode: '55',
      postBeepCode: 'three_beeps',
    },
    solutionCriteria: (state: HardwareState) => {
      const badStickInstalled = state.ramSlots.some(s => s.installedStick && s.installedStick.isDefective);
      const hasGoodWorkingStick = state.ramSlots.some(s => s.installedStick && !s.installedStick.isDefective && s.latched);
      if (badStickInstalled) {
        return { solved: false, remainingIssues: ['Defective / damaged RAM module is still installed in memory slot. Remove it.'] };
      }
      if (!hasGoodWorkingStick) {
        return { solved: false, remainingIssues: ['No functional working RAM module installed in system.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'DEFECTIVE_RAM_MODULE', description: 'Defective/corrupted RAM module in secondary slot preventing memory training' },
      { category: 'SATA_BUS_CONTENTION', description: 'SATA bus collision on port 0' },
      { category: 'BLOWN_FUSE', description: 'Motherboard polyfuse tripped on 5VSB rail' },
      { category: 'BAD_KEYBOARD', description: 'USB keyboard shorting 5V rail' },
    ],
    correctDiagnosisCategory: 'DEFECTIVE_RAM_MODULE',
  },

  // CASE 11
  {
    id: 'wo-111',
    ticketNumber: 'WO #111',
    studentNumber: 11,
    customerName: 'Kevin Patel',
    deviceModel: 'Home Office Tower (Core i5 / 1TB SSD)',
    intakeDate: 'Oct 07, 2026',
    customerReport: 'I checked inside and saw the thin black data cable is plugged into the drive, but the computer still says "No Bootable Device Found". The drive was working yesterday.',
    guidedClue: 'SATA data cable is connected, but the 15-pin flat power cable from the power supply is disconnected.',
    guidedStep: 'Go to Internal Chassis -> SATA Storage -> Click "Connect SATA Power Cable from PSU".',
    initialHardwareState: {
      sataDataConnected: true,
      sataPowerConnected: false, // Power cable detached!
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.sataPowerConnected) {
        return { solved: false, remainingIssues: ['SATA 15-Pin power cable is unplugged from the storage drive.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'SATA_POWER_UNPLUGGED', description: 'SATA 15-pin power cable disconnected from SSD power receptacle' },
      { category: 'PCI_CLOCK_JITTER', description: 'PCIe bus clock PLL unlocked' },
      { category: 'RAM_LATENCY_MISMATCH', description: 'CAS latency mismatch in JEDEC profile' },
      { category: 'BAD_POWER_BUTTON', description: 'Front panel momentary switch stuck closed' },
    ],
    correctDiagnosisCategory: 'SATA_POWER_UNPLUGGED',
  },

  // CASE 12
  {
    id: 'wo-112',
    ticketNumber: 'WO #112',
    studentNumber: 12,
    customerName: 'Hannah Abbott',
    deviceModel: 'Custom Built Desktop (Ryzen 7 5700X)',
    intakeDate: 'Oct 07, 2026',
    customerReport: 'Friend helped me build this PC yesterday. It turns on, but after about 25 seconds the computer suddenly shuts down with a loud fan sound. If I open BIOS quickly, the temperature shows rising above 95°C!',
    guidedClue: 'Extreme thermal spike >95°C. Bare metal on metal with no thermal compound applied.',
    guidedStep: 'Go to Internal Chassis -> CPU Cooler -> Click "Apply Fresh Thermal Paste".',
    initialHardwareState: {
      thermalPasteStatus: 'missing', // Bare metal on metal!
      coolerScrewsTightened: true,
      cpuTemperature: 96,
    },
    solutionCriteria: (state: HardwareState) => {
      if (state.thermalPasteStatus !== 'fresh') {
        return { solved: false, remainingIssues: ['Thermal paste is completely missing between CPU and heatsink. Apply thermal compound.'] };
      }
      if (!state.coolerMounted || !state.coolerScrewsTightened) {
        return { solved: false, remainingIssues: ['Cooler is not properly mounted and tightened.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'MISSING_THERMAL_PASTE', description: 'Thermal paste completely absent between CPU IHS and cooler baseplate' },
      { category: 'INSUFFICIENT_PSU_WATT', description: 'Power supply wattage insufficient for CPU boost state' },
      { category: 'CPU_CORE_FAULT', description: 'Defective ALU execution unit in CPU core 0' },
      { category: 'CORRUPT_SSD_SECTORS', description: 'High concentration of bad sectors on SSD' },
    ],
    correctDiagnosisCategory: 'MISSING_THERMAL_PASTE',
  },

  // CASE 13
  {
    id: 'wo-113',
    ticketNumber: 'WO #113',
    studentNumber: 13,
    customerName: 'Lucas Grey',
    deviceModel: 'Mid-Tower Gaming PC (GeForce RTX 3060)',
    intakeDate: 'Oct 08, 2026',
    customerReport: 'Moved the desktop computer from my dorm to home. When powering on, the motherboard VGA diagnostic LED stays lit up white, screen has no display, and graphics card fans do not spin.',
    guidedClue: 'Graphics card dislodged during transit. PCIe retention latch is unseated and card is loose in the slot.',
    guidedStep: 'Go to Internal Chassis -> Click Graphics Card -> Click "Reseat Card in PCIe x16 Slot".',
    initialHardwareState: {
      gpuPcieSeated: false, // Tilted/unseated PCIe card!
      qLedStatus: { cpu: false, dram: false, vga: true, boot: false },
      hexPostCode: 'd6',
      postBeepCode: 'one_long_two_short',
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.gpuPcieSeated) {
        return { solved: false, remainingIssues: ['Discrete graphics card is physically loose / unseated in PCIe x16 slot.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'GPU_PCIE_UNSEATED', description: 'Graphics card dislodged/unseated from PCIe x16 slot during transport' },
      { category: 'DEFECTIVE_RAM_SPD', description: 'Memory SPD timing table wiped' },
      { category: 'SATA_PORT_BURNOUT', description: 'SATA controller physical port burned out' },
      { category: 'CPU_PIN_OXIDATION', description: 'LGA pin gold plating eroded' },
    ],
    correctDiagnosisCategory: 'GPU_PCIE_UNSEATED',
  },

  // CASE 14
  {
    id: 'wo-114',
    ticketNumber: 'WO #114',
    studentNumber: 14,
    customerName: 'Grace Hopper',
    deviceModel: 'Laboratory Testbed (B450 Motherboard)',
    intakeDate: 'Oct 08, 2026',
    customerReport: 'Technician took out parts for cleaning. Now when pressing power button, fans run at 100% roar, 3 beeps sound continuously, and the amber DRAM light stays on forever.',
    guidedClue: 'All RAM slots are completely empty. The system cannot perform POST without memory installed.',
    guidedStep: 'Open Tools & Parts drawer -> Click "Spare DDR4 8GB" -> Click Slot DIMM A2 to install and latch.',
    initialHardwareState: {
      ramSlots: [
        { id: 'DIMM_A1', label: 'DIMM A1', channel: 'A', installedStick: null, latched: false },
        { id: 'DIMM_A2', label: 'DIMM A2 (Primary)', channel: 'A', installedStick: null, latched: false },
        { id: 'DIMM_B1', label: 'DIMM B1', channel: 'B', installedStick: null, latched: false },
        { id: 'DIMM_B2', label: 'DIMM B2 (Secondary)', channel: 'B', installedStick: null, latched: false },
      ],
      qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
      hexPostCode: '55',
      postBeepCode: 'three_beeps',
    },
    solutionCriteria: (state: HardwareState) => {
      const hasWorkingSeatedStick = state.ramSlots.some(s => s.installedStick && !s.installedStick.isDefective && s.latched);
      if (!hasWorkingSeatedStick) {
        return { solved: false, remainingIssues: ['No RAM module installed and latched in any DIMM channel.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'NO_RAM_INSTALLED', description: 'No RAM modules installed in memory slots (channels completely empty)' },
      { category: 'CORRUPTED_UEFI_GOP', description: 'Graphics Output Protocol driver missing in SPI flash' },
      { category: 'FAULTY_SATA_CABLE', description: 'SATA differential pair severed' },
      { category: 'BAD_MONITOR_EDID', description: 'Monitor EDID EEPROM checksum failure' },
    ],
    correctDiagnosisCategory: 'NO_RAM_INSTALLED',
  },

  // CASE 15
  {
    id: 'wo-115',
    ticketNumber: 'WO #115',
    studentNumber: 15,
    customerName: 'Oliver Twist',
    deviceModel: 'Compact Office Desktop (Micro-ATX)',
    intakeDate: 'Oct 09, 2026',
    customerReport: 'Cleaned behind my desk and dusted the cables. Now when I press the computer power button, nothing happens at all. The rear switch on the power box is pressed to ON, but it seems to have zero electricity.',
    guidedClue: 'Zero electricity. AC power cord was pulled loose from the power supply rear socket.',
    guidedStep: 'Go to Rear I/O -> Click "Cord Unplugged" to connect the AC main wall power cord.',
    initialHardwareState: {
      psuWallPlugged: false, // Cord unplugged on back!
      psuMasterSwitch: true,
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.psuWallPlugged) {
        return { solved: false, remainingIssues: ['AC main power cord is unplugged from the power supply inlet on rear I/O.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'AC_CORD_UNPLUGGED', description: 'Main AC power cord disconnected / loose from PSU rear inlet' },
      { category: 'BLOWN_MAINBOARD_VRM', description: 'VRM high-side MOSFET ruptured' },
      { category: 'DEAD_CPU_SILICON', description: 'CPU packaging delamination' },
      { category: 'CORRUPTED_BOOT_SECTOR', description: 'Master Boot Record damaged' },
    ],
    correctDiagnosisCategory: 'AC_CORD_UNPLUGGED',
  },

  // CASE 16
  {
    id: 'wo-116',
    ticketNumber: 'WO #116',
    studentNumber: 16,
    customerName: 'Maya Lin',
    deviceModel: 'Media Editing Rig (i5-12400F / RTX 3060)',
    intakeDate: 'Oct 09, 2026',
    customerReport: 'Computer turns on with normal single beep and fans spin quietly, green boot light comes on, but monitor screen shows floating box: "INPUT: HDMI - NO SIGNAL - CHECK CABLE".',
    guidedClue: 'System passed POST normally, but video display cable is completely disconnected on the back.',
    guidedStep: 'Go to Rear I/O -> Click "Plug Video Cable Here" on the Discrete GPU expansion slot.',
    initialHardwareState: {
      displayCablePluggedInto: 'none', // Disconnected video cable!
    },
    solutionCriteria: (state: HardwareState) => {
      if (state.displayCablePluggedInto !== 'gpu') {
        return { solved: false, remainingIssues: ['Monitor video cable is not connected to the discrete GPU display port.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'VIDEO_CABLE_DISCONNECTED', description: 'Display cable completely disconnected from system video ports' },
      { category: 'DEAD_GPU_CHIP', description: 'GPU core dye cracked' },
      { category: 'MEMORY_BUS_SHORT', description: 'Data bus DQS trace shorted to ground' },
      { category: 'CORRUPT_NTLDR', description: 'NTLDR boot legacy failure' },
    ],
    correctDiagnosisCategory: 'VIDEO_CABLE_DISCONNECTED',
  },

  // CASE 17
  {
    id: 'wo-117',
    ticketNumber: 'WO #117',
    studentNumber: 17,
    customerName: 'Ethan Hunt',
    deviceModel: 'Silent Mini-Tower (Core i5 / Tower Cooler)',
    intakeDate: 'Oct 10, 2026',
    customerReport: 'Whenever I start the PC, the CPU fan starts screaming at 100% max speed. Within 50 seconds the computer abruptly turns off. Touching the side of the case, it feels unusually hot near the center.',
    guidedClue: 'Thermal shutdown due to loose mounting. The CPU cooler thumbscrews are not tightened against the heat spreader.',
    guidedStep: 'Go to Internal Chassis -> Click CPU Cooler -> Click "Tighten Mounting Bracket Screws".',
    initialHardwareState: {
      coolerScrewsTightened: false, // Loose thumbscrews!
      thermalPasteStatus: 'fresh',
      cpuTemperature: 94,
    },
    solutionCriteria: (state: HardwareState) => {
      if (!state.coolerScrewsTightened || !state.coolerMounted) {
        return { solved: false, remainingIssues: ['CPU heatsink mounting thumbscrews are loose, resulting in poor contact pressure.'] };
      }
      return { solved: true, remainingIssues: [] };
    },
    diagnosisOptions: [
      { category: 'LOOSE_COOLER_BRACKET', description: 'CPU cooler mounting screws loose, causing zero contact pressure and immediate thermal shutdown' },
      { category: 'FAULTY_SATA_PORT', description: 'SATA AHCI DMA engine buffer overflow' },
      { category: 'DEAD_BIOS_FLASH', description: 'SPI flash memory read-only lock' },
      { category: 'BAD_PCI_BUS', description: 'PCIe root complex lane parity fault' },
    ],
    correctDiagnosisCategory: 'LOOSE_COOLER_BRACKET',
  },

  // CASE 18
  {
    id: 'wo-118',
    ticketNumber: 'WO #118',
    studentNumber: 18,
    customerName: 'Victoria Sterling',
    deviceModel: 'Office Desktop (Core i5 / 256GB SSD)',
    intakeDate: 'Oct 10, 2026',
    customerReport: 'Two problems occurred: First, the computer was making 3 beeping sounds with black screen after being dropped slightly. And the hard drive cable also seemed loose inside.',
    guidedClue: 'Dual problem: Loose RAM stick in DIMM A2 and disconnected SATA data cable to the SSD.',
    guidedStep: 'Go to Internal Chassis -> Latch DIMM A2 RAM stick -> Connect SATA data cable to Port 0.',
    initialHardwareState: {
      ramSlots: [
        { id: 'DIMM_A1', label: 'DIMM A1', channel: 'A', installedStick: null, latched: true },
        { 
          id: 'DIMM_A2', 
          label: 'DIMM A2 (Primary)', 
          channel: 'A', 
          installedStick: { id: 'ram-1', capacityGB: 8, speedMHz: 3200, isDefective: false, contactsClean: true }, 
          latched: false // Unlatched RAM
        },
        { id: 'DIMM_B1', label: 'DIMM B1', channel: 'B', installedStick: null, latched: true },
        { id: 'DIMM_B2', label: 'DIMM B2 (Secondary)', channel: 'B', installedStick: null, latched: true },
      ],
      sataDataConnected: false, // Disconnected SATA data cable
      qLedStatus: { cpu: false, dram: true, vga: false, boot: false },
      hexPostCode: '55',
      postBeepCode: 'three_beeps',
    },
    solutionCriteria: (state: HardwareState) => {
      const issues: string[] = [];
      const hasSeatedRam = state.ramSlots.some(s => s.installedStick && !s.installedStick.isDefective && s.latched);
      if (!hasSeatedRam) {
        issues.push('RAM module in DIMM_A2 is still loose/unlatched.');
      }
      if (!state.sataDataConnected) {
        issues.push('SATA data cable to storage drive is disconnected.');
      }
      return { solved: issues.length === 0, remainingIssues: issues };
    },
    diagnosisOptions: [
      { category: 'DUAL_FAULT_RAM_SATA', description: 'Compound fault: Unlatched RAM module in DIMM_A2 and disconnected SATA data cable' },
      { category: 'BLOWN_PSU_TRANSISTOR', description: 'Primary switching transistor blown in power supply' },
      { category: 'DEAD_CORE_VOLTAGE', description: 'VRM buck controller PWM failure' },
      { category: 'VBIOS_CHIP_CORRUPT', description: 'Graphics card firmware checksum mismatch' },
    ],
    correctDiagnosisCategory: 'DUAL_FAULT_RAM_SATA',
  },

  // CASE 19
  {
    id: 'wo-119',
    ticketNumber: 'WO #119',
    studentNumber: 19,
    customerName: 'Gabriel Stone',
    deviceModel: 'Gaming Tower (RTX 3060 / 650W)',
    intakeDate: 'Oct 11, 2026',
    customerReport: 'I bought this custom PC second hand. Pressing the front power button produced zero response at all. Then when looking inside, several cables looked disconnected.',
    guidedClue: 'Dual problem: PSU rear rocker switch is toggled OFF [O], and GPU 8-pin PCIe auxiliary power is unplugged.',
    guidedStep: 'Go to Rear I/O -> Flip PSU switch to [ I ] ON -> Go to Internal Chassis -> Plug 8-Pin PCIe into GPU.',
    initialHardwareState: {
      psuMasterSwitch: false, // Switch off
      pcie8PinConnected: false, // GPU power unplugged
      gpuPowerPlugged: false,
    },
    solutionCriteria: (state: HardwareState) => {
      const issues: string[] = [];
      if (!state.psuMasterSwitch) {
        issues.push('PSU rocker switch on the back is toggled to OFF [O].');
      }
      if (!state.gpuPowerPlugged || !state.pcie8PinConnected) {
        issues.push('8-Pin PCIe power connector is unplugged from graphics card.');
      }
      return { solved: issues.length === 0, remainingIssues: issues };
    },
    diagnosisOptions: [
      { category: 'DUAL_FAULT_PSU_GPU', description: 'Compound fault: PSU rocker switch turned OFF and auxiliary 8-pin PCIe power unplugged' },
      { category: 'CORRUPTED_NVRAM', description: 'Motherboard NVRAM flash array erased' },
      { category: 'SHORTED_AUDIO_CODEC', description: 'Realtek audio chip shorted' },
      { category: 'DEFECTIVE_SOUTHBRIDGE', description: 'PCH chipset internal solder ball crack' },
    ],
    correctDiagnosisCategory: 'DUAL_FAULT_PSU_GPU',
  },

  // CASE 20
  {
    id: 'wo-120',
    ticketNumber: 'WO #120',
    studentNumber: 20,
    customerName: 'Dr. Aris Thorne',
    deviceModel: 'Archive Research Computer (Core i5 / Legacy BIOS)',
    intakeDate: 'Oct 11, 2026',
    customerReport: 'This machine was stored in our science department warehouse for two years. Now whenever it is turned on, the system date reverts to 2012, and Windows fails with a blue recovery screen (BCD missing).',
    guidedClue: 'Dual problem: Depleted CR2032 battery (<1V) and corrupted Windows BCD boot partition.',
    guidedStep: 'Go to Internal Chassis -> Replace CMOS battery -> Insert USB Recovery Drive to rebuild Windows BCD.',
    initialHardwareState: {
      cmosBatteryVoltage: 0.3, // Dead coin cell!
      osCorrupted: true, // Corrupted BCD store!
    },
    solutionCriteria: (state: HardwareState) => {
      const issues: string[] = [];
      if (!state.cmosBatteryInstalled || state.cmosBatteryVoltage < 2.7) {
        issues.push('CR2032 CMOS battery is depleted and must be replaced with fresh 3.0V cell.');
      }
      if (state.osCorrupted) {
        issues.push('Windows BCD Bootloader is corrupted and requires rebuild via USB Recovery Drive.');
      }
      return { solved: issues.length === 0, remainingIssues: issues };
    },
    diagnosisOptions: [
      { category: 'DUAL_FAULT_CMOS_BCD', description: 'Compound fault: Depleted CR2032 battery (<1V) and corrupted Windows BCD boot partition' },
      { category: 'RAM_CHIP_BURNOUT', description: 'Memory bank row decoder failure' },
      { category: 'OVERHEATING_CHIPSET', description: 'Southbridge thermal paste deterioration' },
      { category: 'DAMAGED_HDMI_PORT', description: 'Physical fracture inside monitor connector' },
    ],
    correctDiagnosisCategory: 'DUAL_FAULT_CMOS_BCD',
  },
];

/**
 * Returns a randomized work order from the list, optionally excluding the current one.
 */
export const getRandomWorkOrder = (currentId?: string): WorkOrder => {
  const available = currentId ? WORK_ORDERS.filter(o => o.id !== currentId) : WORK_ORDERS;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};

/**
 * Shuffles an array of work orders (Fisher-Yates) for random distribution across students.
 */
export const getShuffledWorkOrders = (): WorkOrder[] => {
  const copy = [...WORK_ORDERS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Provides an automatic hardware fix helper for Guided / Demonstration mode
 * so stuck students can observe the resolution without frustration.
 */
export const autoResolveHardware = (order: WorkOrder): Partial<HardwareState> => {
  const defaultGood = createDefaultHardwareState();
  switch (order.id) {
    case 'wo-101':
      return {
        ramSlots: defaultGood.ramSlots,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-102':
      return {
        coolerScrewsTightened: true,
        coolerMounted: true,
        thermalPasteStatus: 'fresh',
        cpuTemperature: 38,
      };
    case 'wo-103':
      return {
        displayCablePluggedInto: 'gpu',
      };
    case 'wo-104':
      return {
        sataDataConnected: true,
        sataPowerConnected: true,
        sataPortConnectedOnMotherboard: true,
      };
    case 'wo-105':
      return {
        psuMasterSwitch: true,
        atx24PinConnected: true,
      };
    case 'wo-106':
      return {
        cmosBatteryInstalled: true,
        cmosBatteryVoltage: 3.1,
      };
    case 'wo-107':
      return {
        pcie8PinConnected: true,
        gpuPowerPlugged: true,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-108':
      return {
        osCorrupted: false,
        usbDriveInserted: true,
        usbDriveHasRecoveryTools: true,
      };
    case 'wo-109':
      return {
        cpu8PinConnected: true,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-110':
      return {
        ramSlots: [
          defaultGood.ramSlots[0],
          defaultGood.ramSlots[1],
          defaultGood.ramSlots[2],
          { ...defaultGood.ramSlots[3], installedStick: null },
        ],
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-111':
      return {
        sataPowerConnected: true,
      };
    case 'wo-112':
      return {
        thermalPasteStatus: 'fresh',
        coolerMounted: true,
        coolerScrewsTightened: true,
        cpuTemperature: 38,
      };
    case 'wo-113':
      return {
        gpuPcieSeated: true,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-114':
      return {
        ramSlots: defaultGood.ramSlots,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-115':
      return {
        psuWallPlugged: true,
      };
    case 'wo-116':
      return {
        displayCablePluggedInto: 'gpu',
      };
    case 'wo-117':
      return {
        coolerScrewsTightened: true,
        coolerMounted: true,
        cpuTemperature: 38,
      };
    case 'wo-118':
      return {
        ramSlots: defaultGood.ramSlots,
        sataDataConnected: true,
        qLedStatus: { cpu: false, dram: false, vga: false, boot: true },
        hexPostCode: 'AA',
        postBeepCode: 'single_short',
      };
    case 'wo-119':
      return {
        psuMasterSwitch: true,
        pcie8PinConnected: true,
        gpuPowerPlugged: true,
      };
    case 'wo-120':
      return {
        cmosBatteryInstalled: true,
        cmosBatteryVoltage: 3.1,
        osCorrupted: false,
        usbDriveInserted: true,
      };
    default:
      return defaultGood;
  }
};
