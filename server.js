const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Serve the static HTML file
app.use(express.static(path.join(__dirname)));

// Handle saving signature
app.post('/save-signature', async (req, res) => {
    try {
        const signatureData = req.body.signature;
        const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
        const timestamp = Date.now();
        const signatureFilePath = path.join(__dirname, `signature_${timestamp}.png`);
        fs.writeFileSync(signatureFilePath, base64Data, 'base64');
        res.json({ message: 'Signature saved successfully.', filePath: signatureFilePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while saving the signature.' });
    }
});

app.post('/generate-pdf', async (req, res) => {
    try {
        const {
            signature, 
            companyName, 
            companyAddress, 
            farmerName, 
            fatherName, 
            village, 
            district, 
            effectiveDate, 
            contractDate, 
            croptype,
            area,
            // title
        } = req.body;
        
        const base64Data = signature.replace(/^data:image\/png;base64,/, "");
        const timestamp = Date.now();
        const userSignatureFilePath = path.join(__dirname, `signature_${timestamp}.png`);
        const pdfPath = path.join(__dirname, `signed_contract_${timestamp}.pdf`);
        const companySignaturePath = path.join(__dirname, 'company_signature.png'); // Path to the company signature image

        // Save the user's signature
        fs.writeFileSync(userSignatureFilePath, base64Data, 'base64');

        const doc = new PDFDocument({ size: 'A4' });
        doc.pipe(fs.createWriteStream(pdfPath));

        // Add contract text with dynamic content
        doc.text(`AGREEMENT`, { align: 'center', fontSize: 18, underline: true });
        doc.text(`\n\nThis Agreement is made on ${contractDate} between ${companyName}, having its corporate office at ${companyAddress}, (hereinafter referred to as "Company") of the First Part, and Shri ${farmerName}, S/o ${fatherName}, Village ${village}, District ${district} (hereinafter referred to as "Farmer") of the Second Part for the crop ${croptype} at an area of ${area}`, { paragraphGap: 10 });
        
        doc.text(`\nWhereas : The Farmer is willing to sell his crops to the Company.The Company has the facility to buy the products from Farmers at pre-decided rates, quality parameters, and grades.`);
        
        doc.text(`\nTERMS & CONDITIONS:`);
        doc.text(`\nTerm : This Agreement will be effective from ${effectiveDate} and will be valid for a period of nine months.`);
        
        doc.text(`\nResponsibilities of the Company : Provide technical expertise, improved cultivation methods, and seeds of specified varieties.Purchase 100% of the produce at the agreed rates and quality parameters.`);
        
        doc.text(`\nResponsibilities of the Farmer : Grow the crop as per the Package of Practices and harvest it at the right time.Bear the costs of planting, maintenance, and inputs required for cultivation.`);
        
        doc.text(`\nCompensation : No compensation for loss due to natural calamities or force majeure events.`);
        
        doc.text(`\nGeneral : The relationship between the Company and the Farmer is on a principal-to-principal basis.The Agreement supersedes all prior agreements and can only be amended in writing.`);
        
        doc.text(`\nTermination:The Company may terminate the Agreement with a 30-day notice or immediately under specified circumstances.`);
        
        doc.text(`\nSignatures:`);
        
        // Reserve space for signatures
        const signatureY = doc.y + 20; // Move down from the last text line
        doc.text(`\nParty of First Part:                                                                   Party of Second Part:`, { continued: true });
        // doc.text(`\t\t\tParty of Second Part:`, { continued: true });
        
        // Add company signature image to the PDF (bottom left)
        if (fs.existsSync(companySignaturePath)) {
            const bottomLeftX = 70; // X-coordinate for bottom left corner
            const bottomLeftY = doc.page.height - 230; // Y-coordinate for bottom left corner
            doc.image(companySignaturePath, bottomLeftX, bottomLeftY, { width: 150 });
        } else {
            console.log('Company signature image not found.');
        }

        // Add the user’s signature image to the PDF (bottom right)
        if (fs.existsSync(userSignatureFilePath)) {
            const bottomRightX = doc.page.width - 225; // X-coordinate for bottom right corner
            const bottomRightY = doc.page.height - 230; // Y-coordinate for bottom right corner
            doc.image(userSignatureFilePath, bottomRightX, bottomRightY, { width: 150 });
        }

        doc.end();

        res.json({ message: 'PDF generated successfully.', pdfPath });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while generating the PDF.' });
    }
});


// Start the server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
// Start:
// npm init -y
// npm install express pdfkit
// Execute:
// node server.js