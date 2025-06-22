from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime
import os
from typing import Dict, List, Optional

class PDFReportGenerator:
    def __init__(self, output_dir: str = "reports"):
        """Initialize the PDF report generator with output directory"""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()
    
    def _add_custom_styles(self):
        """Add custom styles for the report"""
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=12,
            alignment=1  # Center aligned
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=12,
            spaceAfter=6
        ))
        self.styles.add(ParagraphStyle(
            name='BodyText',
            parent=self.styles['Normal'],
            spaceAfter=6
        ))
    
    def _create_metadata_table(self, data: Dict) -> Table:
        """Create a table for metadata"""
        table_data = [[Paragraph('<b>Key</b>'), Paragraph('<b>Value</b>')]]
        for key, value in data.items():
            table_data.append([key, str(value)])
        
        table = Table(table_data, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6)
        ]))
        return table
    
    def _create_threats_table(self, threats: List[Dict]) -> Optional[Table]:
        """Create a table for threats"""
        if not threats:
            return None
            
        table_data = [[
            Paragraph('<b>Type</b>'),
            Paragraph('<b>Severity</b>'),
            Paragraph('<b>Description</b>'),
            Paragraph('<b>Status</b>')
        ]]
        
        for threat in threats:
            table_data.append([
                threat.get('type', 'N/A'),
                threat.get('severity', 'N/A'),
                threat.get('description', 'N/A'),
                threat.get('status', 'N/A')
            ])
        
        table = Table(table_data, colWidths=[1*inch, 1*inch, 3*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc3545')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmike),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8d7da')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#721c24')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f5c6cb')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f5c6cb')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 4)
        ]))
        return table
    
    def generate_report(self, report_data: Dict, filename: Optional[str] = None) -> str:
        """Generate a PDF report from the given data"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"security_report_{timestamp}.pdf"
        
        filepath = os.path.join(self.output_dir, filename)
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        
        # Prepare the story (content)
        story = []
        
        # Add title
        story.append(Paragraph("Security Analysis Report", self.styles['ReportTitle']))
        story.append(Spacer(1, 12))
        
        # Add report metadata
        metadata = {
            "Report ID": report_data.get('report_id', 'N/A'),
            "Generated At": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Scan Type": report_data.get('scan_type', 'N/A'),
            "Status": report_data.get('status', 'Completed'),
            "Target": report_data.get('target', 'N/A')
        }
        story.append(Paragraph("Report Information", self.styles['SectionHeader']))
        story.append(self._create_metadata_table(metadata))
        
        # Add summary
        story.append(Paragraph("Summary", self.styles['SectionHeader']))
        story.append(Paragraph(report_data.get('summary', 'No summary available.'), self.styles['BodyText']))
        
        # Add threats if any
        if 'threats' in report_data and report_data['threats']:
            story.append(Paragraph("Detected Threats", self.styles['SectionHeader']))
            threats_table = self._create_threats_table(report_data['threats'])
            if threats_table:
                story.append(threats_table)
        
        # Add recommendations
        if 'recommendations' in report_data and report_data['recommendations']:
            story.append(Paragraph("Recommendations", self.styles['SectionHeader']))
            for rec in report_data['recommendations']:
                story.append(Paragraph(f"• {rec}", self.styles['BodyText']))
        
        # Add footer
        story.append(Spacer(1, 20))
        story.append(Paragraph("This report was generated by TrinetraSec Security Platform", 
                             self.styles['Italic']))
        
        # Build the PDF
        doc.build(story)
        return filepath
