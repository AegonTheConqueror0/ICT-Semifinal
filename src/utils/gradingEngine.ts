import { WorkOrder, HardwareState } from '../types/simulator';

export interface TechnicalGradeResult {
  totalScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'F';
  passed: boolean;
  scoreBreakdown: {
    hardwareScore: number;       // out of 40
    timeScore: number;           // out of 20
    observationScore: number;    // out of 20
    fixExplanationScore: number; // out of 20
  };
  timeFormatted: string;
  hardwareFeedback: string;
  timeFeedback: string;
  observationFeedback: string;
  fixFeedback: string;
  overallRemarks: string;
  detectedKeywords: string[];
  expectedConcepts: string[];
}

export function evaluateTroubleshootingPerformance(
  elapsedSeconds: number,
  hardwareResolved: boolean,
  isSystemBootedAndHealthy: boolean,
  writtenObservation: string,
  writtenDiagnosis: string,
  writtenFix: string,
  selectedDiagnosisCategory: string,
  currentOrder: WorkOrder
): TechnicalGradeResult {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins}m ${secs.toString().padStart(2, '0')}s`;

  // 1. Hardware State Verification (Max 40 Points)
  let hardwareScore = 0;
  let hardwareFeedback = '';
  if (hardwareResolved) {
    hardwareScore += 30;
    if (isSystemBootedAndHealthy) {
      hardwareScore += 10;
      hardwareFeedback = 'Physical hardware verified operational: POST Code AA reached, all Q-LEDs cleared, system booted successfully.';
    } else {
      hardwareFeedback = 'All physical faults were corrected, but system was left unpowered or did not complete full POST boot test.';
    }
  } else {
    hardwareScore = 5;
    hardwareFeedback = 'Physical defects remain unresolved in the chassis. Hardware does not pass electrical/POST verification.';
  }

  // 2. Time Efficiency Score (Max 20 Points)
  // Troubleshooting speed measures diagnostic fluency
  let timeScore = 0;
  let timeFeedback = '';
  if (elapsedSeconds <= 120) {
    timeScore = 20;
    timeFeedback = `Mastery Speed (${timeFormatted}): Diagnostic completed in under 2 minutes. Outstanding efficiency.`;
  } else if (elapsedSeconds <= 240) {
    timeScore = 18;
    timeFeedback = `Senior Speed (${timeFormatted}): Diagnostic completed in ${timeFormatted}. High benchmark.`;
  } else if (elapsedSeconds <= 420) {
    timeScore = 15;
    timeFeedback = `Proficient Speed (${timeFormatted}): Completed within expected laboratory timeframe.`;
  } else if (elapsedSeconds <= 600) {
    timeScore = 12;
    timeFeedback = `Moderate Speed (${timeFormatted}): Acceptable pacing, but troubleshooting flow had hesitations.`;
  } else if (elapsedSeconds <= 900) {
    timeScore = 8;
    timeFeedback = `Prolonged Session (${timeFormatted}): Excessive time spent isolating fault symptoms.`;
  } else {
    timeScore = 5;
    timeFeedback = `Exceeded Time Target (${timeFormatted}): Over 15 minutes taken to troubleshoot the workstation.`;
  }

  // 3. Technical Observation & Symptom Analysis (Max 20 Points)
  const normObs = writtenObservation.toLowerCase();
  const normDiag = writtenDiagnosis.toLowerCase();
  const combinedText = `${normObs} ${normDiag}`;

  // Gather active faults
  const activeFaults = currentOrder.activeFaultsList || [];
  const expectedConcepts: string[] = [];
  const detectedKeywords: string[] = [];

  // Build concept targets based on active faults or work order category
  const targetSubsystems = new Set<string>();
  if (activeFaults.length > 0) {
    activeFaults.forEach(f => {
      targetSubsystems.add(f.subsystem);
      expectedConcepts.push(f.shortTitle);
    });
  } else {
    // Fallback if from standard bank
    expectedConcepts.push(currentOrder.ticketNumber);
  }

  // Domain technical dictionaries
  const KEYWORD_GROUPS: Record<string, string[]> = {
    power: [
      'psu', 'power supply', 'rocker', 'switch', 'cord', 'cable', 'ac', 'wall', 
      '24-pin', 'atx', '8-pin', 'eps', '12v', 'auxiliary', 'no power', 'led', '00'
    ],
    memory: [
      'ram', 'dimm', 'memory', 'slot', 'latch', 'unseated', 'loose', 'dram', 
      '55', '3 beeps', 'three beeps', 'amber', 'yellow', 'defective', 'contact', 'gold'
    ],
    video: [
      'gpu', 'pcie', 'rtx', 'graphics', 'd6', 'vga', 'white led', 'beep', 'beeps', 
      'hdmi', 'displayport', 'motherboard', 'onboard', 'discrete', 'no signal', 'cable', 'port'
    ],
    thermal: [
      'thermal', 'paste', 'compound', 'cooler', 'heatsink', 'temperature', 'temp', 
      'celsius', '90', 'screws', 'mounting', 'overheat', 'shutdown', 'fan', 'throttl'
    ],
    storage_cmos: [
      'sata', 'ssd', 'drive', 'storage', 'data', 'power', 'port 0', 'boot', 'media', 
      'cmos', 'battery', 'cr2032', 'voltage', 'multimeter', '3v', 'clock', 'date', 
      'checksum', 'bcd', '0xc000000f', 'recovery', 'usb'
    ],
  };

  // Diagnostic telemetry terms (POST codes, LEDs, multimeter)
  const TELEMETRY_TERMS = [
    'post', 'code', 'hex', '00', '55', 'd6', 'aa', 'q-led', 'qled', 'beep', 'beeps', 
    'chime', 'multimeter', 'voltage', 'volt', 'v', 'led', 'amber', 'red', 'white', 'green'
  ];

  let telemetryPoints = 0;
  TELEMETRY_TERMS.forEach(term => {
    if (combinedText.includes(term)) {
      if (!detectedKeywords.includes(term)) detectedKeywords.push(term);
      telemetryPoints += 1.5;
    }
  });
  telemetryPoints = Math.min(7, telemetryPoints);

  // Subsystem keyword matching
  let subsystemPoints = 0;
  if (targetSubsystems.size > 0) {
    targetSubsystems.forEach(sub => {
      const words = KEYWORD_GROUPS[sub] || [];
      let foundCount = 0;
      words.forEach(w => {
        if (combinedText.includes(w)) {
          foundCount++;
          if (!detectedKeywords.includes(w)) detectedKeywords.push(w);
        }
      });
      if (foundCount >= 3) subsystemPoints += (7 / targetSubsystems.size);
      else if (foundCount >= 1) subsystemPoints += (4 / targetSubsystems.size);
    });
  } else {
    // Generic check
    if (combinedText.length > 50) subsystemPoints = 5;
  }
  subsystemPoints = Math.min(7, subsystemPoints);

  // Quality & length evaluation
  let textQualityPoints = 0;
  const wordCount = writtenObservation.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 20) textQualityPoints = 6;
  else if (wordCount >= 10) textQualityPoints = 4;
  else if (wordCount >= 4) textQualityPoints = 2;
  else textQualityPoints = 0;

  const observationScore = Math.min(20, Math.round(telemetryPoints + subsystemPoints + textQualityPoints));
  let observationFeedback = '';
  if (observationScore >= 16) {
    observationFeedback = `Strong technical documentation (${observationScore}/20). Accurately identified symptoms, diagnostic codes/LEDs, and component indicators.`;
  } else if (observationScore >= 11) {
    observationFeedback = `Adequate technical observation (${observationScore}/20). Core symptoms documented, but lacked specific telemetry details (hex codes, beep counts, or meter readouts).`;
  } else {
    observationFeedback = `Insufficient technical observation (${observationScore}/20). Description was vague, too brief, or lacked the specific diagnostic indicators generated in this simulation.`;
  }

  // 4. Corrective Action & Procedure Alignment (Max 20 Points)
  const normFix = writtenFix.toLowerCase();
  const PROCEDURE_VERBS = [
    'latched', 'latch', 'reseated', 'reseat', 'plugged', 'plug', 'connected', 'connect', 
    'tightened', 'tighten', 'screwed', 'screw', 'cleaned', 'clean', 'wiped', 'applied', 
    'apply', 'replaced', 'replace', 'swapped', 'swap', 'inserted', 'insert', 'rebuilt', 
    'rebuild', 'toggled', 'toggle', 'switched', 'switch', 'probed', 'tested'
  ];

  let procedurePoints = 0;
  PROCEDURE_VERBS.forEach(v => {
    if (normFix.includes(v)) {
      if (!detectedKeywords.includes(v)) detectedKeywords.push(v);
      procedurePoints += 1.5;
    }
  });
  procedurePoints = Math.min(8, procedurePoints);

  // Action alignment with specific faults
  let alignmentPoints = 0;
  if (activeFaults.length > 0) {
    activeFaults.forEach(f => {
      const words = KEYWORD_GROUPS[f.subsystem] || [];
      const hasSubsystemMatch = words.some(w => normFix.includes(w));
      if (hasSubsystemMatch) {
        alignmentPoints += (7 / activeFaults.length);
      }
    });
  } else {
    alignmentPoints = 5;
  }
  alignmentPoints = Math.min(7, alignmentPoints);

  // Multiple-choice category alignment check
  let hypothesisBonus = 0;
  if (selectedDiagnosisCategory === currentOrder.correctDiagnosisCategory) {
    hypothesisBonus = 5;
  } else if (selectedDiagnosisCategory) {
    hypothesisBonus = 2;
  }

  const fixExplanationScore = Math.min(20, Math.round(procedurePoints + alignmentPoints + hypothesisBonus));
  let fixFeedback = '';
  if (fixExplanationScore >= 16) {
    fixFeedback = `Accurate technical procedure (${fixExplanationScore}/20). Explicitly detailed the physical corrective steps and component interventions required.`;
  } else if (fixExplanationScore >= 11) {
    fixFeedback = `Partial procedural alignment (${fixExplanationScore}/20). General steps mentioned, but lacked component specificity or full multi-step resolution breakdown.`;
  } else {
    fixFeedback = `Weak procedure explanation (${fixExplanationScore}/20). Lacked clear actionable hardware repair steps corresponding to the actual defects.`;
  }

  // Compute Total Score
  const totalScore = Math.min(100, hardwareScore + timeScore + observationScore + fixExplanationScore);

  let letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'F' = 'F';
  if (totalScore >= 95) letterGrade = 'A+';
  else if (totalScore >= 90) letterGrade = 'A';
  else if (totalScore >= 85) letterGrade = 'B+';
  else if (totalScore >= 80) letterGrade = 'B';
  else if (totalScore >= 75) letterGrade = 'C+';
  else if (totalScore >= 70) letterGrade = 'C';
  else letterGrade = 'F';

  const passed = totalScore >= 70 && hardwareResolved;

  let overallRemarks = '';
  if (passed && totalScore >= 90) {
    overallRemarks = `Exceptional troubleshooting competency. Physical hardware was completely restored to normal POST (Code AA) in ${timeFormatted}, supported by precise diagnostic symptom analysis and clear procedural documentation.`;
  } else if (passed) {
    overallRemarks = `Satisfactory hardware resolution. The computer was restored to operational status in ${timeFormatted}. To improve, provide deeper technical observation notes regarding motherboard POST telemetry and exact component actions.`;
  } else {
    overallRemarks = `Laboratory competency benchmark not achieved. The physical hardware remains defective or incomplete, and/or the written technical explanation did not align with the injected computer faults. Review diagnostic beeps and POST codes.`;
  }

  return {
    totalScore,
    letterGrade,
    passed,
    scoreBreakdown: {
      hardwareScore,
      timeScore,
      observationScore,
      fixExplanationScore,
    },
    timeFormatted,
    hardwareFeedback,
    timeFeedback,
    observationFeedback,
    fixFeedback,
    overallRemarks,
    detectedKeywords,
    expectedConcepts,
  };
}
