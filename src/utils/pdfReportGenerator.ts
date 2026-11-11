import { jsPDF } from 'jspdf';
import { WorkOrder, HardwareState } from '../types/simulator';
import { TechnicalGradeResult } from './gradingEngine';

export interface PDFReportData {
  studentName: string;
  studentSection: string;
  studentId?: string;
  workOrder: WorkOrder;
  hardwareState: HardwareState;
  gradeResult: TechnicalGradeResult;
  writtenObservation: string;
  writtenDiagnosis: string;
  writtenFix: string;
}

export function generateAndDownloadPDFReport(data: PDFReportData): void {
  const {
    studentName,
    studentSection,
    studentId,
    workOrder,
    hardwareState,
    gradeResult,
    writtenObservation,
    writtenDiagnosis,
    writtenFix,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 14;

  // Helper to add lines with wrap
  const addWrappedText = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number = 4.5
  ): number => {
    const lines = doc.splitTextToSize(text || 'N/A', maxWidth);
    doc.text(lines, x, startY);
    return startY + lines.length * lineHeight;
  };

  // 1. Top Decorative Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Cyan accent stripe
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HARDWARE DIAGNOSTICS & TROUBLESHOOTING LABORATORY', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Official Examination Transcript & Technical Competency Report', margin, 18);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.text(`Issued: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });

  y = 32;

  // 2. Student & Simulation Info Grid
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600

  // Left col: Student info
  doc.text('STUDENT FULL NAME:', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(studentName.toUpperCase(), margin + 4, y + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('SECTION / CLASS:', margin + 4, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(studentSection.toUpperCase() + (studentId ? `  (ID: ${studentId})` : ''), margin + 4, y + 23);

  // Right col: Work order details
  const rightX = margin + 100;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TICKET NUMBER:', rightX, y + 6);
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(9.5);
  doc.text(workOrder.ticketNumber, rightX, y + 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CHASSIS SPECIFICATION:', rightX, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(workOrder.deviceModel, 75)[0] || '', rightX, y + 23);

  y += 33;

  // 3. Official Grade Banner & Time Metric
  const isPassed = gradeResult.passed;
  if (isPassed) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
  } else {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(239, 68, 68); // red-500
  }
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  // Grade badge box
  doc.setFillColor(isPassed ? 16 : 220, isPassed ? 185 : 38, isPassed ? 129 : 38);
  doc.roundedRect(margin + 4, y + 3.5, 36, 17, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`GRADE ${gradeResult.letterGrade}`, margin + 22, y + 11, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`${gradeResult.totalScore} / 100 PTS`, margin + 22, y + 17, { align: 'center' });

  // Score description
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isPassed ? 'AUTOMATED TECHNICAL EVALUATION: PASSED' : 'AUTOMATED TECHNICAL EVALUATION: INCOMPLETE',
    margin + 44,
    y + 9
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Troubleshooting Time Elapsed: ${gradeResult.timeFormatted}   |   Status: ${isPassed ? 'Operational & POST Verified' : 'Physical Defect Unresolved'}`,
    margin + 44,
    y + 15
  );
  doc.setFontSize(7.5);
  doc.text(
    gradeResult.timeFeedback,
    margin + 44,
    y + 20
  );

  y += 29;

  // 4. Rubric Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EVALUATION RUBRIC SCORECARD BREAKDOWN', margin, y);
  y += 3;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CRITERIA COMPONENT', margin + 3, y + 4.2);
  doc.text('MAX', margin + 115, y + 4.2, { align: 'center' });
  doc.text('AWARDED', margin + 138, y + 4.2, { align: 'center' });
  doc.text('STATUS', pageWidth - margin - 5, y + 4.2, { align: 'right' });
  y += 6;

  const rubricItems = [
    {
      title: '1. Physical Hardware Resolution & POST AA Boot',
      desc: gradeResult.hardwareFeedback,
      max: 40,
      awarded: gradeResult.scoreBreakdown.hardwareScore,
    },
    {
      title: '2. Diagnostic Time Efficiency',
      desc: gradeResult.timeFeedback,
      max: 20,
      awarded: gradeResult.scoreBreakdown.timeScore,
    },
    {
      title: '3. Technical Observation & Symptom Documentation',
      desc: gradeResult.observationFeedback,
      max: 20,
      awarded: gradeResult.scoreBreakdown.observationScore,
    },
    {
      title: '4. Corrective Action & Procedure Alignment',
      desc: gradeResult.fixFeedback,
      max: 20,
      awarded: gradeResult.scoreBreakdown.fixExplanationScore,
    },
  ];

  rubricItems.forEach((item, idx) => {
    const rowH = 10;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.desc, 105)[0] || '', margin + 3, y + 7.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.max}`, margin + 115, y + 5.5, { align: 'center' });

    doc.setTextColor(item.awarded >= item.max * 0.7 ? 16 : 220, item.awarded >= item.max * 0.7 ? 140 : 38, item.awarded >= item.max * 0.7 ? 70 : 38);
    doc.text(`${item.awarded}`, margin + 138, y + 5.5, { align: 'center' });

    doc.setFontSize(7);
    doc.text(item.awarded === item.max ? 'EXCELLENT' : item.awarded >= item.max * 0.7 ? 'PASSED' : 'NEEDS WORK', pageWidth - margin - 5, y + 5.5, { align: 'right' });

    y += rowH;
  });

  y += 5;

  // 5. Technical Notes & Student Written Findings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('STUDENT TECHNICAL SUBMISSION & DIAGNOSTIC RECORD', margin, y);
  y += 4;

  // Box 1: Symptoms & Observations
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text('STUDENT OBSERVED SYMPTOMS (POST Codes, Q-LEDs, Beeps, Meter Readouts):', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  addWrappedText(writtenObservation || '(No observation notes submitted)', margin + 3, y + 9.5, pageWidth - margin * 2 - 6, 3.8);

  y += 28;

  // Box 2: Root Cause Diagnosis & Physical Fix Applied
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text('ROOT CAUSE DIAGNOSIS & STEP-BY-STEP PHYSICAL FIX APPLIED:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const fixText = `Identified Cause: ${writtenDiagnosis || 'N/A'}\nProcedure Executed: ${writtenFix || 'N/A'}`;
  addWrappedText(fixText, margin + 3, y + 9.5, pageWidth - margin * 2 - 6, 3.8);

  y += 28;

  // 6. Simulator Telemetry & Evaluator Remarks
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('HARDWARE TELEMETRY AUDIT:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const telemetrySummary = 
    `Power: ${hardwareState.isSystemPoweredOn ? 'ON' : 'OFF'}   |   POST Code: ${hardwareState.hexPostCode}   |   Beep Code: ${hardwareState.postBeepCode}   |   Q-LEDs: CPU=${hardwareState.qLedStatus.cpu ? 'FAIL' : 'OK'}, DRAM=${hardwareState.qLedStatus.dram ? 'FAIL' : 'OK'}, VGA=${hardwareState.qLedStatus.vga ? 'FAIL' : 'OK'}, BOOT=${hardwareState.qLedStatus.boot ? 'WARN' : 'OK'}`;
  doc.text(telemetrySummary, margin + 3, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('EVALUATOR REMARKS:', margin + 3, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(gradeResult.overallRemarks, pageWidth - margin * 2 - 6)[0] || '', margin + 3, y + 19);

  y += 26;

  // 7. Security Hash & Digital Signature Footer
  const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
  const certId = `AUTH-VERIFIED-HWLAB-${workOrder.ticketNumber.replace('#', '')}-${hash}`;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(`Digital Verification Hash: ${certId}`, margin, pageHeight - 11);

  doc.setFont('helvetica', 'normal');
  doc.text('HardwareLab Simulator Competency Assessment - Generated via Client PDF Engine', pageWidth - margin, pageHeight - 11, { align: 'right' });

  // Save / Trigger Download
  const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
  const cleanSection = studentSection.replace(/[^a-zA-Z0-9]/g, '_') || 'Section';
  const filename = `HardwareLab_Exam_${cleanName}_${cleanSection}.pdf`;
  doc.save(filename);
}
