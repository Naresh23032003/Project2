"""Writes synthetic PDF statements into test/fixtures. Needs reportlab and Pillow.
Run: python3 scripts/make-pdf-fixtures.py
Everything here is invented. No real account data."""
import json
import os
from PIL import Image, ImageDraw
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.pdfencrypt import StandardEncryption

OUT = os.path.join(os.path.dirname(__file__), '..', 'test', 'fixtures')
PASSWORD = '01011990'

ROWS = [
    ('05/01/24', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', '199.00', '', '45,000.50'),
    ('06/01/24', 'ACH D- HDFC LTD-1234567890 FOR LOAN ACCOUNT 0012345678', '12,500.00', '', '32,500.50'),
    ('10/01/24', 'NEFT CR-HDFC0000001-TECHCORP SOLUTIONS-ASHA RAO-N0012345', '', '1,00,000.00', '1,32,500.50'),
    ('12/01/24', 'UPI-SPOTIFY INDIA-SPOTIFYUPI.PAYU@HDFCBANK-HDFC0000001-501234567890-UPI MANDATE', '119.00', '', '1,32,381.50'),
    ('05/02/24', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678902-AUTOPAY', '199.00', '', '1,32,182.50'),
    ('12/02/24', 'UPI-SPOTIFY INDIA-SPOTIFYUPI.PAYU@HDFCBANK-HDFC0000001-501234567891-UPI MANDATE', '119.00', '', '1,32,063.50'),
    ('05/03/24', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678903-AUTOPAY', '199.00', '', '1,31,864.50'),
    ('12/03/24', 'UPI-SPOTIFY INDIA-SPOTIFYUPI.PAYU@HDFCBANK-HDFC0000001-501234567892-UPI MANDATE', '119.00', '', '1,31,745.50'),
] * 1

# pad with filler rows so the table runs onto a second page
for i in range(26):
    day = 14 + (i % 14)
    ROWS.append((f'{day:02d}/03/24', f'UPI-SHARMA KIRANA-SHARMAKIRANA@YBL-HDFC0000001-6000000000{i:02d}-UPI', f'{100 + i * 7}.00', '', '1,31,000.00'))

HEADER = ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance']
X = [30, 80, 290, 345, 395, 460, 520]  # left edges
RIGHT_ALIGNED = {4, 5, 6}


def wrap(text, limit=34):
    words, lines, cur = text.replace('-', '- ').split(' '), [], ''
    for w in words:
        if len(cur) + len(w) + 1 > limit and cur:
            lines.append(cur.rstrip())
            cur = ''
        cur += w + ' '
    if cur.strip():
        lines.append(cur.rstrip())
    return [l.replace('- ', '-') for l in lines]


def draw_table(c):
    width, height = A4
    y = height - 50
    c.setFont('Helvetica-Bold', 10)
    c.drawString(30, y, 'Mr TEST PERSON'); y -= 14
    c.setFont('Helvetica', 8)
    c.drawString(30, y, 'Account Branch : ANDHERI WEST'); y -= 11
    c.drawString(30, y, 'IFSC : HDFC0000123  MICR : 400240001'); y -= 11
    c.drawString(30, y, 'Statement From : 01/01/2024 To : 31/03/2024'); y -= 24

    def header(yy):
        c.setFont('Helvetica-Bold', 7)
        for i, h in enumerate(HEADER):
            if i in RIGHT_ALIGNED:
                c.drawRightString(X[i] + 55, yy, h)
            else:
                c.drawString(X[i], yy, h)
        return yy - 14

    y = header(y)
    c.setFont('Helvetica', 7)
    for date, narr, wd, dep, bal in ROWS:
        lines = wrap(narr)
        need = 10 * len(lines) + 4
        if y - need < 60:
            c.showPage()
            y = height - 50
            y = header(y)
            c.setFont('Helvetica', 7)
        c.drawString(X[0], y, date)
        c.drawString(X[2], y, '0000000123')
        c.drawString(X[3], y, date)
        for j, line in enumerate(lines):
            c.drawString(X[1], y - 10 * j, line)
        if wd:
            c.drawRightString(X[4] + 55, y, wd)
        if dep:
            c.drawRightString(X[5] + 55, y, dep)
        c.drawRightString(X[6] + 55, y, bal)
        y -= need
    y -= 10
    c.setFont('Helvetica-Bold', 7)
    c.drawString(30, y, 'STATEMENT SUMMARY :-'); y -= 12
    c.setFont('Helvetica', 7)
    c.drawString(30, y, 'Opening Balance    Dr Count    Cr Count    Debits    Credits    Closing Bal')
    c.showPage()


def make_text_pdf(path, encrypt=None):
    c = canvas.Canvas(path, pagesize=A4, encrypt=encrypt)
    draw_table(c)
    c.save()


def make_scanned_pdf(path):
    img = Image.new('RGB', (1240, 1754), 'white')
    d = ImageDraw.Draw(img)
    y = 100
    d.text((60, y), 'Mr TEST PERSON   Statement From 01/01/2024 To 31/03/2024', fill='black'); y += 40
    for date, narr, wd, dep, bal in ROWS[:20]:
        d.text((60, y), f'{date}  {narr[:60]}  {wd or dep}  {bal}', fill='black'); y += 22
    png = os.path.join(OUT, '_scan.png')
    img.save(png)
    c = canvas.Canvas(path, pagesize=A4)
    c.drawImage(png, 0, 0, width=A4[0], height=A4[1])
    c.showPage()
    c.save()
    os.remove(png)


os.makedirs(OUT, exist_ok=True)
make_text_pdf(os.path.join(OUT, 'hdfc-text.pdf'))
make_text_pdf(os.path.join(OUT, 'hdfc-password.pdf'), encrypt=StandardEncryption(PASSWORD, canPrint=1, canModify=0, strength=128))
make_scanned_pdf(os.path.join(OUT, 'scanned.pdf'))

expected = [
    {'date': '20' + d[6:8] + '-' + d[3:5] + '-' + d[0:2], 'desc': n, 'amount': round(float((w or dp).replace(',', '')) * 100), 'direction': 'debit' if w else 'credit'}
    for d, n, w, dp, b in ROWS
]
with open(os.path.join(OUT, 'hdfc-text.expected.json'), 'w') as f:
    json.dump({'password': PASSWORD, 'txns': expected}, f, indent=1)
print('wrote', len(ROWS), 'rows')
