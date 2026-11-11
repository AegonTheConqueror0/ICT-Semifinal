import React, { useState } from 'react';
import { WorkOrder, HardwareState } from '../types/simulator';
import { soundFX } from '../utils/audio';
import { evaluateTroubleshootingPerformance, TechnicalGradeResult } from '../utils/gradingEngine';
import { generateAndDownloadPDFReport } from '../utils/pdfReportGenerator';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  User, 
  Calendar, 
  Cpu, 
  Clock, 
  Award, 
  FileCheck, 
  Terminal, 
  Wrench, 
  Info,
  Check,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { StudentProfile } from './StudentEntryModal';

interface WorkOrderTicketProps {
  currentOrder: WorkOrder;
  hardwareState: HardwareState;
  elapsedSeconds: number;
  studentProfile: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderTicket: React.FC<WorkOrderTicketProps> = ({
  currentOrder,
  hardwareState,
  elapsedSeconds,
  studentProfile,
  isOpen,
  onClose,
}) => {
  // Automated student identification (derived from initial intake registration)
  const resolvedName = (studentProfile?.name || localStorage.getItem('hwlab_student_name') || '').trim() || 'Laboratory Candidate';
  const resolvedSection = (studentProfile?.section || localStorage.getItem('hwlab_student_section') || '').trim() || 'BSIT Practical';
  const resolvedStudentId = (studentProfile?.studentId || localStorage.getItem('hwlab_student_id') || '').trim();

  // Technical written response fields
  const [writtenObservation, setWrittenObservation] = useState('');
  const [writtenDiagnosis, setWrittenDiagnosis] = useState('');
  const [writtenFix, setWrittenFix] = useState('');
  const [selectedDiagnosisCategory, setSelectedDiagnosisCategory] = useState('');

  // Evaluation & PDF state
  const [evaluationResult, setEvaluationResult] = useState<TechnicalGradeResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEvaluateAndGeneratePDF = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Written technical observations validation
    if (!writtenObservation.trim() || writtenObservation.trim().length < 8) {
      setValidationError('Please document your technical observations (POST code, Q-LED, beeps, multimeter or monitor status).');
      return;
    }
    if (!writtenFix.trim() || writtenFix.trim().length < 8) {
      setValidationError('Please explain the physical corrective actions executed in the simulator.');
      return;
    }

    soundFX.playClick('switch');

    // Check physical hardware resolution
    const { solved } = currentOrder.solutionCriteria(hardwareState);

    // Check if machine is powered on and passed POST
    const isBootedHealthy = 
      hardwareState.isSystemPoweredOn && 
      hardwareState.hexPostCode === 'AA' && 
      !hardwareState.qLedStatus.cpu && 
      !hardwareState.qLedStatus.dram && 
      !hardwareState.qLedStatus.vga;

    // Run technical evaluation
    const result = evaluateTroubleshootingPerformance(
      elapsedSeconds,
      solved,
      isBootedHealthy,
      writtenObservation,
      writtenDiagnosis || selectedDiagnosisCategory,
      writtenFix,
      selectedDiagnosisCategory,
      currentOrder
    );

    setEvaluationResult(result);

    // Trigger instant PDF Generation & Download with automated student credentials
    try {
      setIsDownloading(true);
      generateAndDownloadPDFReport({
        studentName: resolvedName,
        studentSection: resolvedSection,
        studentId: resolvedStudentId || undefined,
        workOrder: currentOrder,
        hardwareState,
        gradeResult: result,
        writtenObservation: writtenObservation.trim(),
        writtenDiagnosis: writtenDiagnosis.trim() || selectedDiagnosisCategory,
        writtenFix: writtenFix.trim(),
      });
      if (result.passed) {
        soundFX.playBeep('single_short');
      } else {
        soundFX.playBeep('three_beeps');
      }
    } catch (err) {
      console.error('PDF Generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRedownloadPDF = () => {
    if (!evaluationResult) return;
    soundFX.playClick('switch');
    generateAndDownloadPDFReport({
      studentName: resolvedName,
      studentSection: resolvedSection,
      studentId: resolvedStudentId || undefined,
      workOrder: currentOrder,
      hardwareState,
      gradeResult: evaluationResult,
      writtenObservation: writtenObservation.trim(),
      writtenDiagnosis: writtenDiagnosis.trim() || selectedDiagnosisCategory,
      writtenFix: writtenFix.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-200">
      
      {/* Assessment Modal Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-750 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                  {currentOrder.ticketNumber}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-xs font-mono text-slate-300">
                  Client: {currentOrder.customerName}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Hardware Troubleshooting Assessment & PDF Transcript
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Timer Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-400 shadow-inner">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Time: {formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-200">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Reported User</div>
                <div className="font-semibold text-white truncate">{currentOrder.customerName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Date Intake</div>
                <div className="font-semibold text-white">{currentOrder.intakeDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Chassis Hardware</div>
                <div className="font-semibold text-white truncate" title={currentOrder.deviceModel}>
                  {currentOrder.deviceModel}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Observed Symptom Box */}
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-semibold flex items-center justify-between">
              <span>Customer Initial Complaint (External Symptom):</span>
              <span className="text-[10px] text-slate-500 font-normal">Unassisted troubleshooting mode</span>
            </div>
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-200 italic leading-relaxed text-xs">
              &quot;{currentOrder.customerReport}&quot;
            </div>
          </div>

          {/* Validation Notice Banner */}
          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-500/80 rounded-xl text-red-200 flex items-center gap-2.5 text-xs animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Post-Evaluation Scorecard Banner (When evaluated) */}
          {evaluationResult && (
            <div className={`p-5 rounded-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-xl ${
              evaluationResult.passed 
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100' 
                : 'bg-red-950/40 border-red-500/80 text-red-100'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg font-mono text-white shadow ${
                    evaluationResult.passed ? 'bg-emerald-600' : 'bg-red-600'
                  }`}>
                    {evaluationResult.letterGrade}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{evaluationResult.passed ? 'Technical Examination Passed!' : 'Examination Incomplete / Failed'}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-700">
                        {evaluationResult.totalScore} / 100 PTS
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Troubleshooting Time: <strong className="text-cyan-400 font-mono">{evaluationResult.timeFormatted}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRedownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Transcript</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs transition-colors cursor-pointer"
                  >
                    <span>Return to Workbench</span>
                  </button>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Hardware & POST</div>
                  <div className="font-bold text-sm text-white font-mono mt-0.5">
                    {evaluationResult.scoreBreakdown.hardwareScore} <span className="text-slate-500 text-xs">/ 40</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Time Efficiency</div>
                  <div className="font-bold text-sm text-cyan-400 font-mono mt-0.5">
                    {evaluationResult.scoreBreakdown.timeScore} <span className="text-slate-500 text-xs">/ 20</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Observation Rigor</div>
                  <div className="font-bold text-sm text-amber-400 font-mono mt-0.5">
                    {evaluationResult.scoreBreakdown.observationScore} <span className="text-slate-500 text-xs">/ 20</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Fix Alignment</div>
                  <div className="font-bold text-sm text-emerald-400 font-mono mt-0.5">
                    {evaluationResult.scoreBreakdown.fixExplanationScore} <span className="text-slate-500 text-xs">/ 20</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <strong className="text-white">Technical Feedback: </strong>
                {evaluationResult.overallRemarks}
              </div>
            </div>
          )}

          {/* Examination Submission Form */}
          <form onSubmit={handleEvaluateAndGeneratePDF} className="space-y-4 border-t border-slate-800 pt-4">
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Student Examination Submission Form
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Format: PDF Export Only</span>
            </div>

            {/* Automated Student Candidate Identification Badge (Auto-populated from initial entry) */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/25 via-slate-950 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/40 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Candidate Record Verified
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[10px] text-slate-400 font-mono">Automated from Laboratory Registration</span>
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2.5 mt-0.5">
                    <span>{resolvedName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                      {resolvedSection}
                    </span>
                    {resolvedStudentId && (
                      <span className="text-xs font-mono text-slate-400">
                        ID: {resolvedStudentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Bound to PDF Transcript</span>
              </div>
            </div>

            {/* Observation Textarea */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-semibold mb-1">
                1. Technical Observation & Symptoms Detected <span className="text-red-400">*</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Describe what you observed: Motherboard POST hex code (e.g. 00, 55, d6, AA), Q-LED color (CPU/DRAM/VGA/BOOT), speaker beep count, multimeter readings, or screen errors.
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Upon powering on, the motherboard halted with hex POST code 55, Yellow/Amber DRAM Q-LED was active, and speaker emitted 3 repeated beeps. Fans spun at 100% and monitor displayed 'No Signal'..."
                value={writtenObservation}
                onChange={(e) => setWrittenObservation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors leading-relaxed"
                required
              />
            </div>

            {/* Multiple Choice Root Cause Hypothesis */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-300 font-semibold">
                2. Select Root Cause Category:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {currentOrder.diagnosisOptions.map((opt) => (
                  <label
                    key={opt.category}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedDiagnosisCategory === opt.category
                        ? 'bg-blue-950/60 border-blue-500 text-blue-100 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="diagnosis"
                      value={opt.category}
                      checked={selectedDiagnosisCategory === opt.category}
                      onChange={() => setSelectedDiagnosisCategory(opt.category)}
                      className="mt-0.5 accent-blue-500 cursor-pointer"
                    />
                    <span className="font-medium text-xs leading-snug">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Corrective Action Textarea */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-semibold mb-1">
                3. Physical Corrective Action / Fix Explanation <span className="text-red-400">*</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Explain step-by-step how you physically resolved the defect (e.g. latched DIMM retention clips, connected auxiliary power, swapped coin cell battery, moved display cable to discrete GPU).
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Inspected the Internal Chassis and found memory stick in DIMM A2 had unlatched retention clips. Firmly pushed down and latched the stick. Verified 24-Pin ATX and 8-Pin CPU cables firmly seated, then booted system to POST code AA..."
                value={writtenFix}
                onChange={(e) => setWrittenFix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors leading-relaxed"
                required
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                Return to Workbench
              </button>

              <button
                type="submit"
                disabled={isDownloading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Pass & Download Graded PDF</span>
              </button>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
