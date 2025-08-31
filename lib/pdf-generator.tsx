// Generador de PDFs con Puppeteer para vales regalo
import puppeteer from 'puppeteer'
import QRCode from 'qrcode'

export interface VoucherPDFData {
  id: string
  code: string
  type: 'amount' | 'event' | 'pack'
  originalAmount: number
  currentBalance: number
  purchaserName: string
  recipientName?: string
  personalMessage?: string
  expiryDate: Date
  templateUsed: string
  eventTitle?: string
  ticketQuantity?: number
  purchaseDate: Date
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatVoucherValue(voucher: VoucherPDFData): string {
  // Si es un vale de evento, mostrar número de entradas
  if (voucher.type === 'event' && voucher.eventTitle) {
    const tickets = voucher.ticketQuantity || 2
    if (tickets === 1) {
      return `<span style="font-size: 0.8em">1 entrada para</span><br/><span style="font-size: 0.6em; line-height: 1.2">${voucher.eventTitle}</span>`
    } else {
      return `<span style="font-size: 0.8em">${tickets} entradas para</span><br/><span style="font-size: 0.6em; line-height: 1.2">${voucher.eventTitle}</span>`
    }
  }
  // Si es vale de dinero o pack, mostrar el importe
  return formatAmount(voucher.currentBalance)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Estilos para cada template
const getTemplateStyles = (template: string) => {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .voucher-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    
    .qr-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .qr-section img {
      border: 3px solid #f0f0f0;
      border-radius: 10px;
      padding: 10px;
      background: white;
    }
    
    .code-section {
      background: #f8f9fa;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .code-label {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .code-value {
      font-size: 2em;
      font-weight: bold;
      letter-spacing: 3px;
      margin-bottom: 15px;
    }
    
    .amount-value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .valid-until {
      color: #666;
      font-size: 0.9em;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-item {
      text-align: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    
    .info-label {
      color: #666;
      font-size: 0.8em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .info-value {
      color: #333;
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .message-section {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .message-title {
      color: #856404;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .message-text {
      color: #856404;
      font-style: italic;
      line-height: 1.6;
    }
    
    .voucher-body {
      padding: 40px 30px;
    }
    
    .voucher-header {
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .voucher-header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .voucher-header p {
      font-size: 1.1em;
      opacity: 0.95;
    }
    
    .voucher-footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #dee2e6;
    }
    
    .footer-text {
      color: #666;
      font-size: 0.85em;
      line-height: 1.6;
    }
  `

  const templates: Record<string, string> = {
    elegant: `
      ${baseStyles}
      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .voucher-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .code-section {
        border: 2px dashed #667eea;
      }
      .code-value {
        color: #764ba2;
      }
      .amount-value {
        color: #764ba2;
      }
    `,
    christmas: `
      ${baseStyles}
      body {
        background: linear-gradient(135deg, #165b33 0%, #bb2528 100%);
      }
      .voucher-header {
        background: linear-gradient(135deg, #bb2528 0%, #165b33 100%);
      }
      .code-section {
        border: 2px dashed #bb2528;
        background: #f8f8f8;
      }
      .code-value {
        color: #bb2528;
      }
      .amount-value {
        color: #165b33;
      }
      .voucher-container {
        border: 3px solid #bb2528;
      }
      .voucher-header h1::before {
        content: '🎄 ';
      }
      .voucher-header h1::after {
        content: ' 🎅';
      }
    `,
    mystery: `
      ${baseStyles}
      body {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }
      .voucher-container {
        background: #0f1419;
        color: #ffffff;
        border: 2px solid #ffd700;
      }
      .voucher-header {
        background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
        border-bottom: 2px solid #ffd700;
      }
      .voucher-header h1 {
        color: #ffd700;
      }
      .code-section {
        background: #16213e;
        border: 2px dashed #ffd700;
      }
      .code-value {
        color: #ffd700;
      }
      .amount-value {
        color: #ffd700;
      }
      .info-item {
        background: #16213e;
        color: #ffffff;
      }
      .info-value {
        color: #ffd700;
      }
      .voucher-footer {
        background: #16213e;
        border-top: 1px solid #ffd700;
      }
      .footer-text {
        color: #cccccc;
      }
    `,
    fun: `
      ${baseStyles}
      body {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      .voucher-header {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
      .code-section {
        border: 3px dashed #f5576c;
        background: #fff5f5;
      }
      .code-value {
        color: #f5576c;
      }
      .amount-value {
        color: #28a745;
      }
      .voucher-container {
        border: 3px solid #f093fb;
      }
    `
  }

  return templates[template] || templates.elegant
}

function generateHTML(voucher: VoucherPDFData, qrCodeDataURL: string): string {
  const styles = getTemplateStyles(voucher.templateUsed)
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vale Regalo - ${voucher.code}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="voucher-container">
        <div class="voucher-header">
            <h1>MYSTERY EVENTS</h1>
            <p>${voucher.type === 'event' ? `Vale para: ${voucher.eventTitle}` : 'Vale Regalo'}</p>
        </div>
        
        <div class="voucher-body">
            <div class="qr-section">
                <img src="${qrCodeDataURL}" alt="QR Code" width="180" height="180">
            </div>
            
            <div class="code-section">
                <div class="code-label">Código del Vale</div>
                <div class="code-value">${voucher.code}</div>
                <div class="amount-value">${formatVoucherValue(voucher)}</div>
                <div class="valid-until">Válido hasta: ${formatDate(voucher.expiryDate)}</div>
            </div>
            
            ${voucher.personalMessage ? `
            <div class="message-section">
                <div class="message-title">Mensaje personal:</div>
                <div class="message-text">${voucher.personalMessage}</div>
            </div>
            ` : ''}
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Para</div>
                    <div class="info-value">${voucher.recipientName || 'Portador'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">De</div>
                    <div class="info-value">${voucher.purchaserName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha</div>
                    <div class="info-value">${formatDate(voucher.purchaseDate)}</div>
                </div>
            </div>
        </div>
        
        <div class="voucher-footer">
            <div class="footer-text">
                <strong>Cómo usar este vale:</strong><br>
                Presenta el código en mysteryevents.com<br>
                • Válido para una transacción • No reembolsable<br>
                <small>ID: ${voucher.id.slice(-8)} | ${formatDate(voucher.purchaseDate)}</small>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

export async function generateVoucherPDF(voucher: VoucherPDFData): Promise<Buffer> {
  let browser = null
  
  try {
    // Generar QR code
    const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/validate/${voucher.code}`
    const qrCodeDataURL = await QRCode.toDataURL(validationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    })

    // Generar HTML con el template correspondiente
    const html = generateHTML(voucher, qrCodeDataURL)

    // Lanzar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Cargar el HTML con timeout más corto y sin esperar network idle
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    })

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    })

    await browser.close()
    
    const buffer = Buffer.from(pdfBuffer)
    console.log(`PDF generated successfully for voucher ${voucher.code}, size: ${buffer.length} bytes`)
    return buffer

  } catch (error) {
    if (browser) await browser.close()
    console.error('Error generating PDF with Puppeteer:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Función auxiliar para generar QR
export async function generateVoucherQR(voucherCode: string): Promise<string> {
  try {
    const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/validate/${voucherCode}`
    return await QRCode.toDataURL(validationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}