import { jsPDF } from 'jspdf';
import { Match, Innings } from '../types';
import { 
  formatOvers, 
  calculateCRR, 
  getBattingTeam, 
  getBowlingTeam 
} from './cricketEngine';

/**
 * Generates and downloads a complete, professional PDF scorecard for any cricket match.
 */
export function exportScorecardToPDF(match: Match): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm
  let y = margin;

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`${match.seriesName} • ${match.matchTitle}`, margin + 3, y + 5.5);
    doc.text(`Official Scorecard`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
    y += 11;
  };

  // 1. TOP HEADER BANNER
  doc.setFillColor(10, 15, 30); // deep navy
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

  // CricLive Brand Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(margin + 4, y + 4, 22, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CRICLIVE', margin + 15, y + 8.2, { align: 'center' });

  // Tournament & Match Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(match.seriesName || 'Cricket Match', margin + 30, y + 8.5);

  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(match.matchTitle || `${match.teamA.name} vs ${match.teamB.name}`, margin + 4, y + 16);

  // Match Meta details: Venue, Date, Pitch
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const venueText = `Venue: ${match.venue || 'Stadium'}  |  Date: ${match.matchDate || 'Today'}  |  Pitch: ${match.pitchType || 'Standard'}`;
  doc.text(venueText, margin + 4, y + 22);

  // Toss & Result
  let tossInfo = '';
  if (match.tossWinnerId) {
    const tossWinner = match.tossWinnerId === match.teamA.id ? match.teamA.name : match.teamB.name;
    tossInfo = `Toss: ${tossWinner} elected to ${match.tossChoice || 'bat'} first.`;
  }
  const resultText = match.resultSummary 
    ? `Result: ${match.resultSummary}` 
    : match.status === 'live' 
      ? `Status: LIVE MATCH IN PROGRESS` 
      : `Status: Upcoming fixture`;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`${tossInfo}  ${resultText}`, margin + 4, y + 29);

  y += 38;

  // Render each innings
  const inningsToRender: Array<{ inn: Innings; innNum: 1 | 2 }> = [];
  if (match.innings[0]) inningsToRender.push({ inn: match.innings[0], innNum: 1 });
  if (match.innings[1]) inningsToRender.push({ inn: match.innings[1], innNum: 2 });

  if (inningsToRender.length === 0) {
    checkPageBreak(25);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Match has not commenced yet. No innings data logged.', margin + contentWidth / 2, y + 11, { align: 'center' });
    y += 26;
  }

  inningsToRender.forEach(({ inn, innNum }) => {
    const battingTeam = getBattingTeam(match, innNum).team;
    const bowlingTeam = getBowlingTeam(match, innNum).team;
    const crr = calculateCRR(inn.totalRuns, inn.legalBallsBowled);
    const oversFormatted = formatOvers(inn.legalBallsBowled);

    checkPageBreak(35);

    // Innings Header Banner
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${innNum === 1 ? '1st INNINGS' : '2nd INNINGS'}: ${battingTeam.name.toUpperCase()}`,
      margin + 3,
      y + 7.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(52, 211, 153); // emerald-400
    const scoreStr = `${inn.totalRuns}/${inn.totalWickets} (${oversFormatted}/${inn.totalOversLimit} Ov, CRR: ${crr})`;
    doc.text(scoreStr, pageWidth - margin - 3, y + 7.5, { align: 'right' });
    y += 12;

    // --- BATTING SCORECARD TABLE ---
    checkPageBreak(12);

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600

    // Columns: Batter (60), Dismissal (60), R(13), B(13), 4s(12), 6s(12), SR(16) = 186
    const colBatter = margin + 3;
    const colDismissal = margin + 63;
    const colR = margin + 125;
    const colB = margin + 138;
    const col4s = margin + 151;
    const col6s = margin + 163;
    const colSR = margin + 176;

    doc.text('BATTER', colBatter, y + 4.5);
    doc.text('DISMISSAL / HOW OUT', colDismissal, y + 4.5);
    doc.text('R', colR + 8, y + 4.5, { align: 'right' });
    doc.text('B', colB + 8, y + 4.5, { align: 'right' });
    doc.text('4s', col4s + 7, y + 4.5, { align: 'right' });
    doc.text('6s', col6s + 7, y + 4.5, { align: 'right' });
    doc.text('SR', colSR + 8, y + 4.5, { align: 'right' });
    y += 6.5;

    // Batter Rows
    const didNotBat: string[] = [];

    battingTeam.players.forEach((p, idx) => {
      const stats = inn.battingScorecard[p.id];
      const isStriker = p.id === inn.currentStrikerId && !inn.isCompleted;
      const isNonStriker = p.id === inn.currentNonStrikerId && !inn.isCompleted;
      const hasBatted = stats && (stats.balls > 0 || stats.isOut || isStriker || isNonStriker);

      if (!hasBatted) {
        didNotBat.push(p.name + (p.isCaptain ? ' (c)' : '') + (p.isWicketKeeper ? ' (wk)' : ''));
        return;
      }

      checkPageBreak(6);

      // Alternating background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42); // slate-900

      let pLabel = p.name;
      if (p.isCaptain) pLabel += ' (c)';
      if (p.isWicketKeeper) pLabel += ' (wk)';
      if (isStriker || isNonStriker) pLabel += '*';

      // Trim name if too long
      const truncatedName = doc.splitTextToSize(pLabel, 58)[0];
      doc.text(truncatedName, colBatter, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const howOut = stats.isOut ? (stats.dismissalInfo || 'out') : 'not out';
      const truncatedHowOut = doc.splitTextToSize(howOut, 58)[0];
      doc.text(truncatedHowOut, colDismissal, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(stats.runs), colR + 8, y + 4, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(stats.balls), colB + 8, y + 4, { align: 'right' });
      doc.text(String(stats.fours), col4s + 7, y + 4, { align: 'right' });
      doc.text(String(stats.sixes), col6s + 7, y + 4, { align: 'right' });
      doc.text(String(stats.strikeRate), colSR + 8, y + 4, { align: 'right' });

      y += 5.5;
    });

    // Extras Line
    checkPageBreak(6);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const totalExtras = inn.wides + inn.noBalls + inn.byes + inn.legByes;
    doc.text(
      `Extras: ${totalExtras} (w ${inn.wides}, nb ${inn.noBalls}, lb ${inn.legByes}, b ${inn.byes})`,
      colBatter,
      y + 4
    );
    doc.setFont('helvetica', 'bold');
    doc.text(String(totalExtras), colR + 8, y + 4, { align: 'right' });
    y += 5.5;

    // Total Score Line
    checkPageBreak(7);
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL (${inn.totalWickets} wkts, ${oversFormatted} Overs)`, colBatter, y + 4.8);
    doc.setFontSize(9.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(String(inn.totalRuns), colR + 8, y + 4.8, { align: 'right' });
    y += 7.5;

    // Did Not Bat List
    if (didNotBat.length > 0) {
      checkPageBreak(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const dnbString = `Did Not Bat: ${didNotBat.join(', ')}`;
      const dnbLines = doc.splitTextToSize(dnbString, contentWidth - 6);
      doc.text(dnbLines, margin + 3, y + 3.5);
      y += dnbLines.length * 3.5 + 2;
    }

    // Fall of Wickets
    if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('Fall of Wickets: ', margin + 3, y + 3.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const fowStr = inn.fallOfWickets
        .map((f) => `${f.score}/${f.wicketNumber} (${f.playerName}, ${f.over} ov)`)
        .join(' • ');
      const fowLines = doc.splitTextToSize(fowStr, contentWidth - 30);
      doc.text(fowLines, margin + 25, y + 3.5);
      y += Math.max(1, fowLines.length) * 3.5 + 3;
    }

    // --- BOWLING SCORECARD TABLE ---
    checkPageBreak(12);

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // Columns: Bowler (76), O (20), M (16), R (20), W (18), Econ (20), Dots (16) = 186
    const bColBowler = margin + 3;
    const bColO = margin + 79;
    const bColM = margin + 99;
    const bColR = margin + 115;
    const bColW = margin + 135;
    const bColEcon = margin + 153;
    const bColDots = margin + 173;

    doc.text('BOWLER', bColBowler, y + 4.2);
    doc.text('O', bColO + 12, y + 4.2, { align: 'right' });
    doc.text('M', bColM + 10, y + 4.2, { align: 'right' });
    doc.text('R', bColR + 12, y + 4.2, { align: 'right' });
    doc.text('W', bColW + 12, y + 4.2, { align: 'right' });
    doc.text('ECON', bColEcon + 14, y + 4.2, { align: 'right' });
    doc.text('DOTS', bColDots + 10, y + 4.2, { align: 'right' });
    y += 6;

    let bIdx = 0;
    bowlingTeam.players.forEach((p) => {
      const bStats = inn.bowlingScorecard[p.id];
      if (!bStats || (bStats.overs === 0 && bStats.runsConceded === 0)) return;

      checkPageBreak(5.5);

      if (bIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.2, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(p.name, bColBowler, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(bStats.overs), bColO + 12, y + 3.8, { align: 'right' });
      doc.text(String(bStats.maidens), bColM + 10, y + 3.8, { align: 'right' });
      doc.text(String(bStats.runsConceded), bColR + 12, y + 3.8, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(String(bStats.wickets), bColW + 12, y + 3.8, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(bStats.economy), bColEcon + 14, y + 3.8, { align: 'right' });
      doc.text(String(bStats.dots || 0), bColDots + 10, y + 3.8, { align: 'right' });

      y += 5.2;
      bIdx++;
    });

    y += 6; // Spacing between innings
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CricLive Digital Cricket Scorer • Match ID: ${match.id} • Generated: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 6.5
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Trigger download
  const cleanTeamA = match.teamA.shortName || 'TeamA';
  const cleanTeamB = match.teamB.shortName || 'TeamB';
  const fileName = `${cleanTeamA}_vs_${cleanTeamB}_Scorecard_${Date.now()}.pdf`;
  doc.save(fileName);
}
