import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import Member from '../models/Member.js';
import Setting from '../models/Setting.js';

const CARD_W = 340;
const CARD_H = 216;
const ORANGE = '#FF6B00';
const DARK = '#1E293B';
const GRAY = '#64748B';
const LIGHT_GRAY = '#F1F5F9';
const WHITE = '#FFFFFF';

export const MemberCardService = {
  generateCard: async (memberId) => {
    const member = await Member.findById(memberId)
      .populate('seatId', 'seatNumber floor seatType')
      .populate('shiftId', 'shiftName startTime endTime');

    if (!member) throw new Error('Member not found');

    const settings = await Setting.findOne();
    const libraryName = settings?.libraryName || 'Saahityik Library';
    const address = settings?.address || '';
    const libMobile = settings?.mobile || '';
    const libEmail = settings?.email || '';

    const memberIdDisplay = member.memberId || member._id.toString().slice(-6).toUpperCase();
    const qrData = JSON.stringify({ id: member._id.toString(), memberId: memberIdDisplay });
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 1, color: { dark: DARK, light: WHITE } });

    const photoUrl = member.photo || null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [CARD_W, CARD_H * 2], margin: 0 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ═══════════════ FRONT SIDE ═══════════════
      // Background
      doc.rect(0, 0, CARD_W, CARD_H).fill(LIGHT_GRAY);

      // Orange header bar
      doc.rect(0, 0, CARD_W, 44).fill(ORANGE);

      // Library name in header
      doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold').text(libraryName.toUpperCase(), 12, 8, { width: CARD_W - 24, align: 'center' });
      doc.fontSize(7).fillColor(WHITE).font('Helvetica').text('MEMBER IDENTITY CARD', 12, 26, { width: CARD_W - 24, align: 'center' });

      // Photo area (right side)
      doc.roundedRect(240, 52, 84, 84, 6).fillAndStroke(WHITE, ORANGE);
      if (photoUrl) {
        try {
          doc.image(photoUrl, 244, 56, { width: 76, height: 76 });
        } catch {
          drawPhotoPlaceholder(doc, 244, 56, 76);
        }
      } else {
        drawPhotoPlaceholder(doc, 244, 56, 76);
      }

      // Member details (left side)
      let y = 50;
      const leftX = 14;

      const field = (label, value) => {
        doc.fontSize(6).fillColor(GRAY).font('Helvetica').text(label, leftX, y);
        doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold').text(value || '-', leftX, y + 9, { width: 215 });
        y += 24;
      };

      field('FULL NAME', member.fullName);
      field('MEMBER ID', memberIdDisplay);
      field('SEAT', member.seatId ? `${member.seatId.seatNumber} (Floor ${member.seatId.floor})` : 'Unassigned');
      field('SHIFT', member.shiftId ? `${member.shiftId.shiftName} (${member.shiftId.startTime} - ${member.shiftId.endTime})` : '-');
      field('EXPIRY DATE', member.membershipExpiryDate ? new Date(member.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

      // QR code
      doc.image(qrBuffer, 14, CARD_H - 62, { width: 48, height: 48 });
      doc.fontSize(5).fillColor(GRAY).font('Helvetica').text('Scan to verify', 14, CARD_H - 12, { width: 48, align: 'center' });

      // Footer bar
      doc.rect(0, CARD_H - 2, CARD_W, 2).fill(ORANGE);

      // ═══════════════ BACK SIDE ═══════════════
      const backY = CARD_H;

      doc.rect(0, backY, CARD_W, CARD_H).fill(WHITE);

      // Back side header
      doc.rect(0, backY, CARD_W, 36).fill(ORANGE);
      doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold').text(libraryName.toUpperCase(), 12, backY + 6, { width: CARD_W - 24, align: 'center' });
      doc.fontSize(7).fillColor(WHITE).font('Helvetica').text('VERIFICATION & CONTACT', 12, backY + 22, { width: CARD_W - 24, align: 'center' });

      // Emergency contact section
      let by = backY + 48;
      doc.fontSize(7).fillColor(ORANGE).font('Helvetica-Bold').text('EMERGENCY CONTACT', 14, by);
      by += 16;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Name', 14, by);
      doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold').text(member.fullName, 14, by + 8);
      by += 22;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Phone', 14, by);
      doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold').text(member.mobile || '-', 14, by + 8);
      by += 22;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Email', 14, by);
      doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold').text(member.email || '-', 14, by + 8);

      // Library address
      by = backY + 48;
      doc.fontSize(7).fillColor(ORANGE).font('Helvetica-Bold').text('LIBRARY ADDRESS', 190, by);
      by += 16;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Address', 190, by);
      doc.fontSize(7).fillColor(DARK).font('Helvetica').text(address || '-', 190, by + 8, { width: 140 });
      by += 30;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Phone', 190, by);
      doc.fontSize(7).fillColor(DARK).font('Helvetica-Bold').text(libMobile || '-', 190, by + 8);
      by += 16;
      doc.fontSize(6).fillColor(GRAY).font('Helvetica').text('Email', 190, by);
      doc.fontSize(7).fillColor(DARK).font('Helvetica-Bold').text(libEmail || '-', 190, by + 8);

      // QR verification section
      let qy = backY + 130;
      doc.roundedRect(14, qy, CARD_W - 28, 72, 6).fillAndStroke(LIGHT_GRAY, ORANGE);
      doc.fontSize(7).fillColor(ORANGE).font('Helvetica-Bold').text('QR VERIFICATION', 24, qy + 8);
      doc.image(qrBuffer, CARD_W - 80, qy + 10, { width: 52, height: 52 });
      doc.fontSize(6).fillColor(DARK).font('Helvetica').text(
        'Scan this QR code to verify the authenticity of this ID card. The QR contains the unique member identifier for verification purposes.',
        24, qy + 24, { width: CARD_W - 120 }
      );

      // Footer
      doc.rect(0, CARD_H * 2 - 2, CARD_W, 2).fill(ORANGE);

      doc.end();
    });
  },

  getCardData: async (memberId) => {
    const member = await Member.findById(memberId)
      .populate('seatId', 'seatNumber floor seatType')
      .populate('shiftId', 'shiftName startTime endTime');
    if (!member) throw new Error('Member not found');
    const settings = await Setting.findOne();
    const memberIdDisplay = member.memberId || member._id.toString().slice(-6).toUpperCase();
    const qrData = JSON.stringify({ id: member._id.toString(), memberId: memberIdDisplay });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1, color: { dark: '#1E293B', light: '#FFFFFF' } });
    return {
      _id: member._id,
      fullName: member.fullName,
      mobile: member.mobile,
      email: member.email,
      address: member.address,
      photo: member.photo,
      memberId: memberIdDisplay,
      seat: member.seatId ? { number: member.seatId.seatNumber, floor: member.seatId.floor, type: member.seatId.seatType } : null,
      shift: member.shiftId ? { name: member.shiftId.shiftName, startTime: member.shiftId.startTime, endTime: member.shiftId.endTime } : null,
      membershipPlan: member.membershipPlan,
      membershipExpiryDate: member.membershipExpiryDate,
      joiningDate: member.joiningDate,
      status: member.status,
      qrDataUrl,
      library: {
        name: settings?.libraryName || 'Saahityik Library',
        address: settings?.address || '',
        mobile: settings?.mobile || '',
        email: settings?.email || '',
      },
    };
  },
};

function drawPhotoPlaceholder(doc, x, y, size) {
  doc.fontSize(7).fillColor(GRAY).font('Helvetica').text('PHOTO', x + 12, y + size / 2 - 4, { width: size - 24, align: 'center' });
}
