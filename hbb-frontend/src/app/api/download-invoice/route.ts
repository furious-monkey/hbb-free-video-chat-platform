import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Function to load logo image
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

// Function to load fonts
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
            medium: await pdfDoc.embedFont(mediumFontBytes),
        };
    } catch (error) {
        console.error('Error loading fonts:', error);
        throw new Error('Failed to load Montserrat fonts');
    }
}

// Function to draw header with more space above the logo and adjusted layout for transactionId
function drawHeader(page, { width, height, logoImage, fonts, transaction }) {
    const logoSize = logoImage.scale(0.19);

    // Draw logo image
    page.drawImage(logoImage, {
        x: 30,
        y: height - 100,
        width: logoSize.width,
        height: logoSize.height,
    });

    // TODO: Generate unique invoice number from DB
    page.drawText(`#${transaction.invoiceNumber?.split("-")[4]}`, {
        x: width - 140,
        y: height - 100,
        size: 16,
        font: fonts.regular,
        color: rgb(0.1, 0.1, 0.1),
        lineHeight: 21.6,
    });

    // Draw the invoice title
    const invoiceTitleY = height - 180;
    page.drawText('INVOICE', {
        x: 30,
        y: invoiceTitleY,
        size: 32,
        font: fonts.medium,
        color: rgb(0, 0, 0),
        lineHeight: 41.6,
    });

    return invoiceTitleY;
}

// Function to draw details (date, bill from/to)
function drawDetails(page, { width, height, fonts, transaction, invoiceTitleY }) {
    const spaceBelowInvoice = 25;
    const dateY = invoiceTitleY - spaceBelowInvoice - 50;

    // Ensure the transaction.date is a valid Date object
    let date = new Date(transaction.date);

    // If the date is invalid, fall back to the current date
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date provided: ${transaction.date}. Using current date instead.`);
        date = new Date(); // Use current date as fallback
    }

    // Format the date using 'en-GB' locale for DD MMM, YYYY format
    let formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    // Add a comma to the month abbreviation
    formattedDate = formattedDate.replace(/(\b\w{3}\b)/, '$1,'); // Adds a comma after the month abbreviation

    page.drawText('Date:', {
        x: 30,
        y: dateY,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
        lineHeight: 18.9,
    });

    page.drawText(formattedDate, {
        x: 100,
        y: dateY,
        size: 14,
        font: fonts.light,
        color: rgb(92 / 255, 92 / 255, 92 / 255),
        lineHeight: 18.9,
    });

    const dividerMidpointY = (invoiceTitleY + dateY) / 2;
    page.drawLine({
        start: { x: 30, y: dividerMidpointY },
        end: { x: width - 50, y: dividerMidpointY },
        thickness: 1,
        color: rgb(234 / 255, 234 / 255, 234 / 255),
    });

    const billY = dateY - 50;
    const leftX = 30;
    const rightX = width - 200;

    page.drawText('Bill from:', {
        x: leftX,
        y: billY,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });

    page.drawText('Bill to:', {
        x: rightX,
        y: billY,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });

    page.drawText('Honeybunnybun', {
        x: leftX + 70,
        y: billY,
        size: 14,
        font: fonts.light,
        color: rgb(92 / 255, 92 / 255, 92 / 255),
    });

    page.drawText('Sugar01', {
        x: rightX + 50,
        y: billY,
        size: 14,
        font: fonts.light,
        color: rgb(92 / 255, 92 / 255, 92 / 255),
    });

    page.drawText('USA', {
        x: leftX + 70,
        y: billY - 15,
        size: 14,
        font: fonts.light,
        color: rgb(92 / 255, 92 / 255, 92 / 255),
    });

    page.drawText('USA', {
        x: rightX + 50,
        y: billY - 15,
        size: 14,
        font: fonts.light,
        color: rgb(92 / 255, 92 / 255, 92 / 255),
    });

    return billY - 80;
}

// Function to draw table header
function drawTableHeader(page, { headerY, fonts, width }) {
    const rectHeight = 40;
    const shiftUp = 10; // Amount to shift the rectangle up

    // Shift the rectangle upwards by adjusting the y position
    page.drawRectangle({
        x: 30,
        y: headerY - rectHeight + 70, // Adjusted y position for the rectangle
        width: width - 70,
        height: rectHeight - 10,
        color: rgb(0.9, 0.9, 0.9),
    });

    const headers = ['Description/Detail', 'Amount'];
    const headerX = [40, width - 130];
    const amountOffset = 20;

    // Calculate the y position for the text (keeps it unchanged)
    const headerYPosition = headerY - rectHeight / 2 + 60;

    headers.forEach((header, index) => {
        page.drawText(header, {
            x: index === 1 ? headerX[index] + amountOffset : headerX[index],
            y: headerYPosition,
            size: 14,
            font: fonts.medium,
            color: rgb(0, 0, 0),
        });
    });
}

// Function to draw transactions
function drawTransactions(page, { transaction, startY, fonts, width }) {
    const rectangleY = startY - 80;
    const rectHeight = 140;

    page.drawRectangle({
        x: 30,
        y: rectangleY - 100,
        width: width - 100,
        height: rectHeight,
        color: rgb(1, 1, 1),
    });

    page.drawText(transaction.description || 'Invoice for one-time processing fee', {
        x: 40,
        y: rectangleY + rectHeight / 2 + 50,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });

    const amountX = width - 80;
    const amountText = transaction.amount.toFixed(2);

    page.drawText(amountText, {
        x: amountX - 10,
        y: rectangleY + rectHeight / 2 + 50,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });

    return rectangleY - rectHeight - 10;
}

// Function to draw total
function drawTotal(page, { height, fonts, transaction, width }) {
    const totalY = height - 400;

    page.drawLine({
        start: { x: 30, y: totalY - 70 },
        end: { x: width - 45, y: totalY - 70 },
        thickness: 1,
        color: rgb(234 / 255, 234 / 255, 234 / 255),
    });

    page.drawText('Total amount:', {
        x: 40,
        y: totalY - 100,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });

    const totalAmountX = width - 100;
    const totalText = `$${transaction.amount.toFixed(2)}`;

    page.drawText(totalText, {
        x: totalAmountX,
        y: totalY - 100,
        size: 14,
        font: fonts.medium,
        color: rgb(0, 0, 0),
    });
}

// POST handler to generate PDF
export async function POST(req) {
    try {
        const transaction = await req.json();

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const logoImage = await loadLogoImage(pdfDoc);
        const fonts = await loadFonts(pdfDoc);

        const page = pdfDoc.addPage([612, 792]);
        const { width, height } = page.getSize();

        const invoiceTitleY = drawHeader(page, { width, height, logoImage, fonts, transaction });
        const detailsEndY = drawDetails(page, { width, height, fonts, transaction, invoiceTitleY });
        const startY = detailsEndY - 50;
        drawTableHeader(page, { headerY: startY, fonts, width });
        drawTransactions(page, { transaction, startY: startY - 50, fonts, width });
        drawTotal(page, { height, fonts, transaction, width });

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice_${transaction.transactionId}.pdf"`,
            },
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate invoice PDF' }, { status: 500 });
    }
}


