/**
 * Print/PDF export utilities for diagnostic reports
 */

import { DiagnosticResult } from '../types'

interface DiagnosticPrintData {
  locationAddress?: string | null
  equipmentModel?: string | null
  equipmentSerial?: string | null
  systemType: string
  refrigerant: string | null
  readings: Record<string, number>
  userNotes: string | null
  result: DiagnosticResult
  createdAt: string
  technicianName?: string
  companyName?: string
}

export function printDiagnostic(data: DiagnosticPrintData) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('Please allow popups to print this report')
    return
  }

  const formattedDate = new Date(data.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const statusColor =
    data.result.system_status === 'normal' ? '#10b981' :
    data.result.system_status === 'attention_needed' ? '#f59e0b' : '#ef4444'

  const statusText = data.result.system_status.replace('_', ' ').toUpperCase()

  // Build HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>FieldSync HVAC Report - ${formattedDate}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 28px;
          color: #1e40af;
          margin-bottom: 10px;
        }

        .header .subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
          background-color: ${statusColor};
          color: white;
        }

        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e40af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .info-item {
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .info-label {
          font-weight: 600;
          color: #4b5563;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #111827;
        }

        .readings-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .readings-table th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }

        .readings-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .readings-table tr:last-child td {
          border-bottom: none;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 10px;
        }

        .metric-card {
          padding: 15px;
          background: #eff6ff;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 600;
          color: #1e40af;
        }

        .fault-card {
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 8px;
          border-left: 4px solid;
          background: #f9fafb;
        }

        .fault-critical {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .fault-warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .fault-info {
          border-left-color: #3b82f6;
          background: #eff6ff;
        }

        .fault-component {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .fault-issue {
          font-size: 13px;
          color: #374151;
          margin-bottom: 8px;
        }

        .fault-action {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .summary-box {
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
          margin-top: 10px;
        }

        .recommendations {
          margin-top: 10px;
        }

        .recommendation-item {
          padding: 10px 15px;
          margin-bottom: 8px;
          background: #ffffff;
          border-left: 3px solid #2563eb;
          border-radius: 4px;
        }

        .notes-box {
          padding: 15px;
          background: #fffbeb;
          border-radius: 8px;
          border: 1px solid #fcd34d;
          margin-top: 10px;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }

        @media print {
          body {
            padding: 20px;
          }

          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FieldSync HVAC Report</h1>
        <p class="subtitle">Professional System Analysis</p>
        <div class="status-badge">${statusText}</div>
        <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">${formattedDate}</p>
      </div>

      <!-- Location & Equipment Info -->
      <div class="section">
        <h2 class="section-title">Service Information</h2>
        <div class="info-grid">
          ${data.locationAddress ? `
            <div class="info-item">
              <div class="info-label">Service Location</div>
              <div class="info-value">${data.locationAddress}</div>
            </div>
          ` : ''}
          ${data.equipmentModel ? `
            <div class="info-item">
              <div class="info-label">Equipment Model</div>
              <div class="info-value">${data.equipmentModel}</div>
            </div>
          ` : ''}
          ${data.equipmentSerial ? `
            <div class="info-item">
              <div class="info-label">Serial Number</div>
              <div class="info-value">${data.equipmentSerial}</div>
            </div>
          ` : ''}
          <div class="info-item">
            <div class="info-label">System Type</div>
            <div class="info-value">${data.systemType}</div>
          </div>
          ${data.refrigerant ? `
            <div class="info-item">
              <div class="info-label">Refrigerant</div>
              <div class="info-value">${data.refrigerant}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- System Readings -->
      <div class="section">
        <h2 class="section-title">System Readings</h2>
        <table class="readings-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.readings).map(([key, value]) => `
              <tr>
                <td>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Performance Metrics -->
      ${Object.keys(data.result.metrics).length > 0 ? `
        <div class="section">
          <h2 class="section-title">Performance Metrics</h2>
          <div class="metrics-grid">
            ${data.result.metrics.delta_t ? `
              <div class="metric-card">
                <div class="metric-label">Delta T</div>
                <div class="metric-value">${data.result.metrics.delta_t}°F</div>
              </div>
            ` : ''}
            ${data.result.metrics.superheat ? `
              <div class="metric-card">
                <div class="metric-label">Superheat</div>
                <div class="metric-value">${data.result.metrics.superheat}°F</div>
              </div>
            ` : ''}
            ${data.result.metrics.subcooling ? `
              <div class="metric-card">
                <div class="metric-label">Subcooling</div>
                <div class="metric-value">${data.result.metrics.subcooling}°F</div>
              </div>
            ` : ''}
            ${data.result.metrics.efficiency_rating ? `
              <div class="metric-card">
                <div class="metric-label">Efficiency Rating</div>
                <div class="metric-value" style="text-transform: capitalize;">${data.result.metrics.efficiency_rating}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Faults -->
      ${data.result.faults.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Detected Issues (${data.result.faults.length})</h2>
          ${data.result.faults.map(fault => `
            <div class="fault-card fault-${fault.severity}">
              <div class="fault-component">${fault.component} - ${fault.issue}</div>
              <div class="fault-issue">${fault.explanation}</div>
              <div class="fault-action"><strong>Recommended Action:</strong> ${fault.recommended_action}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="section">
          <h2 class="section-title">System Status</h2>
          <div style="padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac; color: #166534;">
            ✓ No issues detected. System is operating normally.
          </div>
        </div>
      `}

      <!-- Summary -->
      <div class="section">
        <h2 class="section-title">Diagnostic Summary</h2>
        <div class="summary-box">
          ${data.result.summary}
        </div>
      </div>

      <!-- Recommendations -->
      ${data.result.recommendations.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Recommendations</h2>
          <div class="recommendations">
            ${data.result.recommendations.map(rec => `
              <div class="recommendation-item">${rec}</div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Technician Notes -->
      ${data.userNotes ? `
        <div class="section">
          <h2 class="section-title">Technician Notes</h2>
          <div class="notes-box">
            ${data.userNotes}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>FieldSync HVAC</strong></p>
        <p>Model: ${data.result.model_used}</p>
        <p>Professional HVAC Diagnostic System</p>
      </div>

      <script>
        // Auto-print when page loads
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
