import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs/promises';
import path from 'path';

const ITEMS_PER_PAGE = 10;

async function loadFonts(pdfDoc) {
  try {

    pdfDoc.registerFontkit(fontkit);

    const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf');
    const lightFontPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Light.ttf');
    const mediumFontPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Medium.ttf');
    
    const regularFontBytes = await fs.readFile(regularFontPath);
    const lightFontBytes = await fs.readFile(lightFontPath);
    const mediumFontBytes = await fs.readFile(mediumFontPath);

    return {
      regular: await pdfDoc.embedFont(regularFontBytes),
      light: await pdfDoc.embedFont(lightFontBytes),
      medium: await pdfDoc.embedFont(mediumFontBytes)
    };
  } catch (error) {
    console.error('Error loading fonts:', error);
    throw new Error('Failed to load Montserrat fonts');
  }
}


async function loadLogoImage(pdfDoc) {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'img', 'logo.png');
    const logoBytes = await fs.readFile(logoPath);
    return await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error('Error loading logo image:', error);
    throw new Error('Failed to load logo image');
  }
}

function drawHeader(page, { width, height, logoImage, pageNum, totalPages, fonts }) {
  const logoSize = logoImage.scale(0.19);
  page.drawImage(logoImage, {
    x: 30,  
    y: height - 100,  
    width: logoSize.width,
    height: logoSize.height,
  });

  page.drawText(`page ${pageNum + 1} of ${totalPages}`, {
    x: width - 80, 
    y: height - 40,  
    size: 12,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

function drawSummary(page, { height, data, fonts, width }) {
  page.drawText('Statement of Payment', {
    x: 30,  
    y: height - 130, 
    size: 20,
    font: fonts.medium,
  });

  page.drawLine({
    start: { x: 30, y: height - 140 }, 
    end: { x: width - 360, y: height - 140 },  
    thickness: 0.5,
    color: rgb(0.9176, 0.9176, 0.9176),
  });

  page.drawText(data.dateRange, {
    x: 30, 
    y: height - 165,  
    size: 12,
    font: fonts.regular,
    color: rgb(0.4392, 0.4392, 0.4392),
  });

  page.drawLine({
    start: { x: 30, y: height - 180 }, 
    end: { x: width - 360, y: height - 180 }, 
    thickness: 0.5,
    color: rgb(0.9176, 0.9176, 0.9176),
  });

  const rightAlignX = width - 30; 
  const documentText = 'Document Requested By:';
  page.drawText(documentText, {
    x: rightAlignX - fonts.regular.widthOfTextAtSize(documentText, 12),
    y: height - 165,  
    size: 12,
    font: fonts.medium,
  });

  const accountHolderText = data.accountHolder;
  page.drawText(accountHolderText, {
    x: rightAlignX - fonts.regular.widthOfTextAtSize(accountHolderText, 12),
    y: height - 188, 
    size: 12,
    font: fonts.medium,
  });

  const locationText = data.location;
  page.drawText(locationText, {
    x: rightAlignX - fonts.regular.widthOfTextAtSize(locationText, 12),
    y: height - 210, 
    size: 12,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText('Account Summary', {
    x: 30, 
    y: height - 205, 
    size: 12,
    font: fonts.medium,
  });

  page.drawLine({
    start: { x: 30, y: height - 220 },  
    end: { x: width - 360, y: height - 220 },  
    thickness: 0.5,
    color: rgb(0.9176, 0.9176, 0.9176),
  });

  page.drawText('Money Earned', {
    x: 30, 
    y: height - 245,  
    size: 12,
    font: fonts.medium,
  });

  const earnedText = `$${data.moneyEarned.toFixed(2)}`;
  page.drawText(earnedText, {
    x: 240 - fonts.regular.widthOfTextAtSize(earnedText, 12), 
    y: height - 245,  
    size: 12,
    font: fonts.regular,
  });

  page.drawText('Money Spent', {
    x: 30, 
    y: height - 270,  
    size: 12,
    font: fonts.medium,
  });

  const spentText = `$${data.moneySpent.toFixed(2)}`;
  page.drawText(spentText, {
    x: 240 - fonts.regular.widthOfTextAtSize(spentText, 12), 
    y: height - 270,  
    size: 12,
    font: fonts.regular,
  });
}

function drawTableHeader(page, { headerY, fonts, width }) {
  page.drawRectangle({
    x: 30, 
    y: headerY - 31,
    width: width - 60,  
    height: 36,
    color: rgb(0.4784, 0.4784, 0.4784),
  });

  const headers = ['Date', 'Transaction Details', 'Money Earned', 'Money Spent'];
  const headerX = [30, 130, width - 230, width - 130]; 
  const columnWidths = [100, width - 360, 100, 100]; 

  headers.forEach((header, index) => {
    let adjustedX = headerX[index] + 10;
    if (index === 2 || index === 3) {
      const textWidth = fonts.regular.widthOfTextAtSize(header, 12);
      adjustedX = headerX[index] + columnWidths[index] - textWidth - 10;
    }

    page.drawText(header, {
      x: adjustedX,
      y: headerY - 18,
      size: 12,
      font: fonts.medium,
      color: rgb(1, 1, 1),
    });
  });
}

function drawTransactions(page, { transactions, startY, fonts, width }) {
  let currentY = startY;

  transactions.forEach((transaction, index) => {
    if (index % 2 !== 0) {
      page.drawRectangle({
        x: 30, 
        y: currentY - 15,
        width: width - 60, 
        height: 36,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    page.drawText(transaction.date || "N/A", {
      x: 40,  
      y: currentY - 2,
      size: 11,
      font: fonts.regular,
    });

    page.drawText(transaction.paymentDetails || "N/A", {
      x: 140, 
      y: currentY - 2,
      size: 11,
      font: fonts.regular,
    });

    if (transaction.type === 'earned') {
      const earnedText = `$${transaction.amount.toFixed(2)}`;
      const earnedX = width - 230 + 90 - fonts.regular.widthOfTextAtSize(earnedText, 11); 
      page.drawText(earnedText, {
        x: earnedX,
        y: currentY - 2,
        size: 11,
        font: fonts.regular,
      });
    }

    if (transaction.type === 'spent') {
      const spentText = `$${transaction.amount.toFixed(2)}`;
      const spentX = width - 130 + 90 - fonts.regular.widthOfTextAtSize(spentText, 11);  
      page.drawText(spentText, {
        x: spentX,
        y: currentY - 2,
        size: 11,
        font: fonts.regular,
      });
    }

    currentY -= 36;
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const pdfDoc = await PDFDocument.create();
    const logoImage = await loadLogoImage(pdfDoc);
    const fonts = await loadFonts(pdfDoc);


    const totalPages = Math.ceil(data.transactions.length / ITEMS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();

      drawHeader(page, { width, height, logoImage, pageNum, totalPages, fonts });

      if (pageNum === 0) {
        drawSummary(page, { height, data, fonts, width });
      }

      const startIndex = pageNum * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.transactions.length);
      const pageTransactions = data.transactions.slice(startIndex, endIndex);

      const startY = pageNum === 0 ? height - 315 : height - 130;  
      drawTableHeader(page, { headerY: startY, fonts, width });
      drawTransactions(page, { transactions: pageTransactions, startY: startY - 50, fonts, width });
    }

    const pdfBytes = await pdfDoc.save();
    
    const fileName = `statement_${data.accountHolder}_${data.date}`;

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
      
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}