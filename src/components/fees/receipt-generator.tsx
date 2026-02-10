/**
 * RECEIPT GENERATOR
 * Generate printable receipts for fee payments
 */
"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share2 } from "lucide-react";

export interface ReceiptData {
  receiptNumber: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogo?: string;

  studentName: string;
  studentRoll: string;
  studentClass: string;

  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;

  feeItems: Array<{
    description: string;
    amount: number;
  }>;

  receivedBy: string;
  totalInWords?: string;
}

interface ReceiptGeneratorProps {
  data: ReceiptData;
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export function ReceiptGenerator({
  data,
  onPrint,
  onDownload,
  showActions = true,
}: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow && receiptRef.current) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${data.receiptNumber}</title>
              <style>
                body { font-family: 'Times New Roman', serif; padding: 20px; }
                .receipt { max-width: 700px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
                .school-name { font-size: 24px; font-weight: bold; }
                .receipt-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
                .receipt-number { font-size: 14px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .row-half { flex: 1; }
                .label { font-weight: bold; }
                .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
                .table th { background: #f0f0f0; }
                .table .amount { text-align: right; }
                .total-row { font-weight: bold; border-top: 2px solid #000; }
                .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                .sign-box { text-align: center; margin-top: 40px; }
                .sign-line { border-top: 1px solid #000; padding-top: 5px; width: 150px; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const numberToWords = (num: number): string => {
    if (data.totalInWords) return data.totalInWords;

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
    };

    const convert = (n: number): string => {
      if (n === 0) return "Zero";
      if (n < 1000) return convertLessThanThousand(n);

      const lakhs = Math.floor(n / 100000);
      const remainder = n % 100000;
      const thousands = Math.floor(remainder / 1000);
      const hundreds = remainder % 1000;

      let result = "";
      if (lakhs > 0) result += convertLessThanThousand(lakhs) + " Lakh ";
      if (thousands > 0) result += convertLessThanThousand(thousands) + " Thousand ";
      if (hundreds > 0) result += convertLessThanThousand(hundreds);

      return result.trim();
    };

    return convert(num) + " Nu.";
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      )}

      {/* Receipt Preview */}
      <div ref={receiptRef} className="bg-white p-8 max-w-2xl mx-auto shadow-lg">
        <div className="border-2 border-black p-6">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              {data.schoolLogo && (
                <img src={data.schoolLogo} alt={`${data.schoolName} logo`} className="w-16 h-16" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{data.schoolName}</h1>
                <p className="text-sm">{data.schoolAddress}</p>
                <p className="text-sm">Phone: {data.schoolPhone}</p>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-4">OFFICIAL RECEIPT</h2>
            <p className="text-sm">Receipt No: {data.receiptNumber}</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p><span className="font-semibold">Student Name:</span> {data.studentName}</p>
              <p><span className="font-semibold">Roll Number:</span> {data.studentRoll}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Date:</span> {new Date(data.paymentDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">Class:</span> {data.studentClass}</p>
            </div>
          </div>

          {/* Fee Details Table */}
          <table className="w-full border-collapse border border-black mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-4 py-2 text-left">Description</th>
                <th className="border border-black px-4 py-2 text-right w-32">Amount (Nu.)</th>
              </tr>
            </thead>
            <tbody>
              {data.feeItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-4 py-2">{item.description}</td>
                  <td className="border border-black px-4 py-2 text-right">
                    {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-black">
                <td className="border border-black px-4 py-2">Total</td>
                <td className="border border-black px-4 py-2 text-right">
                  {data.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in Words */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
            <p className="text-sm">
              <span className="font-semibold">Amount in words:</span> {numberToWords(data.amount)}
            </p>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><span className="font-semibold">Payment Method:</span> <span className="capitalize">{data.paymentMethod.replace(/_/g, " ")}</span></p>
              {data.transactionId && (
                <p><span className="font-semibold">Transaction ID:</span> {data.transactionId}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Footer with Signatures */}
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="border-b border-black w-32 mb-1"></div>
              <p className="text-sm">Receiver&apos;s Signature</p>
              <p className="text-xs text-gray-500">{data.receivedBy}</p>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold mb-1">For {data.schoolName}</p>
              <div className="border-b border-black w-40 mb-1 mt-8"></div>
              <p className="text-sm">Authorized Signatory</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            <p>For any queries, please contact the school office.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate receipt number
export function generateReceiptNumber(prefix: string = "REC"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Helper function to create receipt data from payment
export function createReceiptData(payment: {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  method: string;
  transactionId?: string;
  student: { name: string; roll: string; class: string };
  feeStructure: string;
  school: { name: string; address: string; phone: string; logo?: string };
  collectedBy: string;
}): ReceiptData {
  return {
    receiptNumber: payment.receiptNumber,
    schoolName: payment.school.name,
    schoolAddress: payment.school.address,
    schoolPhone: payment.school.phone,
    schoolLogo: payment.school.logo,

    studentName: payment.student.name,
    studentRoll: payment.student.roll,
    studentClass: payment.student.class,

    paymentDate: payment.date,
    amount: payment.amount,
    paymentMethod: payment.method,
    transactionId: payment.transactionId,

    feeItems: [
      {
        description: payment.feeStructure,
        amount: payment.amount,
      },
    ],

    receivedBy: payment.collectedBy,
  };
}
