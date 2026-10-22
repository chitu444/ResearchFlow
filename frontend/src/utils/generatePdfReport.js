import { jsPDF } from 'jspdf';

export function generateExperimentPdf(experiment, history = [], tasks = [], comments = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = 18;

  // Header Banner
  doc.setFillColor(122, 57, 68); // #7a3944 Accent
  doc.rect(0, 0, pageWidth, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RESEARCHFLOW INSTITUTIONAL RESEARCH & COMPLIANCE PLATFORM', margin, 8);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - margin - 35, 8);

  // Document Title
  y = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(45, 37, 36);
  doc.text('SCIENTIFIC EXPERIMENT AUDIT & RUN REPORT', margin, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 109, 105);
  doc.text(`Official record generated for internal viva, grant compliance, and laboratory governance.`, margin, y);

  // Divider Line
  y += 4;
  doc.setDrawColor(222, 210, 201);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Experiment Overview Card Box
  y += 6;
  doc.setFillColor(250, 245, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(122, 57, 68);
  doc.text(experiment.title, margin + 4, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 37, 36);

  doc.text('Status:', margin + 4, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${experiment.status} (Version ${experiment.version})`, margin + 25, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Lead Investigator:', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(experiment.createdBy?.name || 'Unassigned', margin + 35, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Facility / Lab:', margin + 4, y + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(`${experiment.laboratory?.name || 'Unassigned'} (${experiment.laboratory?.code || 'N/A'})`, margin + 35, y + 27);

  doc.setFont('helvetica', 'bold');
  doc.text('Schedule Period:', margin + 4, y + 33);
  doc.setFont('helvetica', 'normal');
  const startStr = experiment.startDate ? new Date(experiment.startDate).toLocaleDateString() : 'TBD';
  const endStr = experiment.endDate ? new Date(experiment.endDate).toLocaleDateString() : 'TBD';
  doc.text(`${startStr} to ${endStr}`, margin + 35, y + 33);

  // Required Equipment
  const eqNames = experiment.requiredEquipment?.map((e) => e.name).join(', ') || 'General Facility Bench';
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment:', margin + 95, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(eqNames, margin + 118, y + 15, { maxWidth: 60 });

  // Research Objectives Section
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(122, 57, 68);
  doc.text('1. SCIENTIFIC OBJECTIVE & HYPOTHESIS', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(45, 37, 36);
  const objLines = doc.splitTextToSize(experiment.researchObjective || 'No objective specified.', pageWidth - margin * 2);
  doc.text(objLines, margin, y);
  y += objLines.length * 4.5 + 4;

  // Methodology Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(122, 57, 68);
  doc.text('2. METHODOLOGY & OPERATIONAL CONFIGURATION', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(45, 37, 36);
  const descLines = doc.splitTextToSize(experiment.description || 'No detailed methodology provided.', pageWidth - margin * 2);
  doc.text(descLines, margin, y);
  y += descLines.length * 4.5 + 6;

  // Task & Milestone Checklist Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(122, 57, 68);
  doc.text('3. MILESTONES & AUDIT CHECKLIST', margin, y);

  y += 5;
  doc.setFontSize(8.5);
  if (tasks.length) {
    tasks.forEach((t) => {
      const isDone = t.status === 'Done';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isDone ? 95 : 122, isDone ? 124 : 57, isDone ? 88 : 68);
      doc.text(isDone ? '[X] COMPLETED' : '[ ] PENDING', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 37, 36);
      doc.text(t.title, margin + 28, y);

      if (t.assignee?.name) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 109, 105);
        doc.text(`(${t.assignee.name})`, margin + 120, y);
      }
      y += 5;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 109, 105);
    doc.text('No milestones logged.', margin, y);
    y += 5;
  }

  // Version History Section
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(122, 57, 68);
  doc.text('4. REVISION HISTORY & TRACEABILITY', margin, y);

  y += 5;
  doc.setFontSize(8.5);
  if (history.length) {
    history.forEach((h) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 37, 36);
      doc.text(`Version ${h.version}:`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 109, 105);
      doc.text(
        `${new Date(h.createdAt).toLocaleString()} by ${h.changedBy?.name || 'System'}`,
        margin + 20,
        y
      );
      y += 4.5;
    });
  }

  // Sign-off Block
  y = pageHeight - 32;
  doc.setDrawColor(200, 190, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 65, y);
  doc.line(pageWidth - margin - 65, y, pageWidth - margin, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 70, 65);
  doc.text('PRINCIPAL INVESTIGATOR SIGNATURE', margin, y + 4);
  doc.text('LABORATORY DIRECTOR VERIFICATION', pageWidth - margin - 65, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 130, 125);
  doc.text(`Generated via ResearchFlow Institutional Engine · Verification ID: ${experiment._id}`, margin, pageHeight - 6);

  // Trigger browser download
  const safeTitle = (experiment.title || 'Experiment').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeTitle}_Run_Report_v${experiment.version}.pdf`);
}
