/**
 * CERTIFICATE PDF GENERATOR
 * Generate professional PDF certificates using jsPDF
 */

import jsPDF from 'jspdf';
import type { CertificateData } from '@/components/learning/certificate-generator';

/**
 * Generate a certificate PDF as a Blob
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background (cream color)
  pdf.setFillColor(255, 253, 245);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border (double line in gold/amber)
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(2);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  pdf.setLineWidth(0.5);
  pdf.setDrawColor(180, 83, 9);
  pdf.rect(18, 18, pageWidth - 36, pageHeight - 36);

  // Header
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 35, { align: 'center' });

  // School name (if available)
  if (data.schoolName) {
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.text(data.schoolName, pageWidth / 2, 42, { align: 'center' });
  }

  // "This is to certify that"
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This is to certify that', pageWidth / 2, 55, { align: 'center' });

  // Student name (large, bold)
  pdf.setFontSize(28);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.studentName, pageWidth / 2, 70, { align: 'center' });

  // Student ID
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 120, 120);
  pdf.text(`ID: ${data.studentId}`, pageWidth / 2, 76, { align: 'center' });

  // "has successfully completed"
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text('has successfully completed', pageWidth / 2, 88, { align: 'center' });

  // Module title
  pdf.setFontSize(20);
  pdf.setTextColor(217, 119, 6);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.moduleTitle, pageWidth / 2, 100, { align: 'center' });

  // Module description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);

  // Word wrap for description
  const maxWidth = pageWidth - 60;
  const lines = pdf.splitTextToSize(data.moduleName, maxWidth);
  pdf.text(lines, pageWidth / 2, 110, { align: 'center' });

  // Score/Grade section (if available)
  let yOffset = 110 + (lines.length * 6) + 5;

  if (data.score !== undefined) {
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`Score: ${data.score}%`, pageWidth / 2, yOffset, { align: 'center' });
  }

  if (data.grade) {
    pdf.setFontSize(14);
    pdf.setTextColor(217, 119, 6);
    pdf.text(`Grade: ${data.grade}`, pageWidth / 2, yOffset + 8, { align: 'center' });
  }

  // Certificate number
  yOffset += 18;
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Certificate No: ${data.certificateNumber}`, pageWidth / 2, yOffset, { align: 'center' });

  // Footer with date and signature
  const footerY = pageHeight - 30;

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Date of Completion', pageWidth / 4, footerY, { align: 'center' });
  pdf.setFont('helvetica', 'bold');
  pdf.text(
    new Date(data.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    pageWidth / 4,
    footerY + 8,
    { align: 'center' }
  );

  // Signature line
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.5);
  pdf.line((pageWidth * 3) / 4 - 30, footerY + 10, (pageWidth * 3) / 4 + 30, footerY + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Instructor Signature', (pageWidth * 3) / 4, footerY, { align: 'center' });
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.instructorName || 'Instructor', (pageWidth * 3) / 4, footerY + 15, { align: 'center' });

  // Watermark
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 180);
  pdf.text(
    `Issued by ${data.schoolName || 'Bhutan EduSkill'}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: 'right' }
  );

  return pdf.output('blob');
}
