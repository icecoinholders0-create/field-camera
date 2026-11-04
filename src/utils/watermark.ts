import { GeoData, StampConfig } from '../types/camera';
import { formatCoordinates, formatHeading, formatFieldDateTime } from './geo';

export interface DrawWatermarkOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  videoElement?: HTMLVideoElement | null;
  imageElement?: HTMLImageElement | HTMLCanvasElement | null;
  geoData: GeoData;
  stampConfig: StampConfig;
  mapCanvas?: HTMLCanvasElement | null;
  customLogoImg?: HTMLImageElement | null;
  showGridReticle?: boolean;
  dateTimeStr?: string;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export function drawWatermarkFrame({
  ctx,
  width,
  height,
  videoElement,
  imageElement,
  geoData,
  stampConfig,
  mapCanvas,
  customLogoImg,
  showGridReticle = false,
  dateTimeStr,
}: DrawWatermarkOptions): void {
  // 1. Draw source video/image
  if (videoElement && videoElement.readyState >= 2) {
    ctx.drawImage(videoElement, 0, 0, width, height);
  } else if (imageElement) {
    ctx.drawImage(imageElement, 0, 0, width, height);
  } else {
    // Fallback backdrop if neither is ready
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Grid / Level Reticle if enabled
  if (showGridReticle) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    // Rule of thirds lines
    const col1 = width / 3;
    const col2 = (width * 2) / 3;
    const row1 = height / 3;
    const row2 = (height * 2) / 3;

    ctx.beginPath();
    ctx.moveTo(col1, 0);
    ctx.lineTo(col1, height);
    ctx.moveTo(col2, 0);
    ctx.lineTo(col2, height);
    ctx.moveTo(0, row1);
    ctx.lineTo(width, row1);
    ctx.moveTo(0, row2);
    ctx.lineTo(width, row2);
    ctx.stroke();

    // Center Crosshair
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    const cx = width / 2;
    const cy = height / 2;
    const crossSize = Math.max(16, width * 0.025);

    ctx.beginPath();
    // Center circle
    ctx.arc(cx, cy, crossSize * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Tick marks
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx - crossSize * 0.45, cy);
    ctx.moveTo(cx + crossSize * 0.45, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy - crossSize * 0.45);
    ctx.moveTo(cx, cy + crossSize * 0.45);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Draw Company Logo (Top-Right by default if enabled)
  if (stampConfig.showLogo && customLogoImg && customLogoImg.complete && customLogoImg.naturalWidth > 0) {
    ctx.save();
    const maxLogoHeight = Math.floor(height * 0.09);
    const aspect = customLogoImg.naturalWidth / customLogoImg.naturalHeight;
    const logoW = Math.min(Math.floor(maxLogoHeight * aspect), Math.floor(width * 0.28));
    const logoH = Math.floor(logoW / aspect);
    const pad = Math.floor(width * 0.03);

    // Subtle dark pill behind logo for contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(width - logoW - pad - 8, pad - 4, logoW + 16, logoH + 8, 8);
    ctx.fill();

    ctx.drawImage(customLogoImg, width - logoW - pad, pad, logoW, logoH);
    ctx.restore();
  }

  // 4. Compile Stamp Text Lines
  const lines: { text: string; isHeader?: boolean; isAccent?: boolean }[] = [];

  if (stampConfig.companyTitle.trim()) {
    lines.push({ text: stampConfig.companyTitle.toUpperCase(), isHeader: true });
  }

  if (stampConfig.showSiteDetails && (stampConfig.siteId || stampConfig.workStatus)) {
    const parts: string[] = [];
    if (stampConfig.siteId) parts.push(`Site / ID: ${stampConfig.siteId}`);
    if (stampConfig.workStatus) parts.push(`Status: ${stampConfig.workStatus}`);
    lines.push({ text: parts.join(' | '), isAccent: true });
  }

  if (stampConfig.showTechnician && stampConfig.technicianName.trim()) {
    lines.push({ text: `Inspector: ${stampConfig.technicianName}` });
  }

  if (stampConfig.showDateTime) {
    const dt = dateTimeStr || formatFieldDateTime();
    lines.push({ text: dt });
  }

  if (stampConfig.showAddress && geoData.address) {
    lines.push({ text: geoData.address });
  }

  if (stampConfig.showCoordinates) {
    let coordText = formatCoordinates(geoData.latitude, geoData.longitude);
    if (geoData.accuracy !== null) {
      coordText += ` (±${Math.round(geoData.accuracy)}m)`;
    }
    if (stampConfig.showAltitude && geoData.altitude !== null) {
      coordText += ` · Alt: ${Math.round(geoData.altitude)}m`;
    }
    lines.push({ text: coordText });
  }

  if (stampConfig.showHeading) {
    const h = formatHeading(geoData.heading);
    lines.push({ text: h.full });
  }

  if (stampConfig.showNotes && stampConfig.customNotes.trim()) {
    lines.push({ text: `Note: ${stampConfig.customNotes}` });
  }

  if (lines.length === 0) return;

  // 5. Calculate Stamp Dimensions & Typography
  ctx.save();
  const baseFontSize = Math.max(18, Math.floor(width * 0.028 * (stampConfig.textScale || 1.0)));
  const headerFontSize = Math.round(baseFontSize * 1.25);
  const lineSpacing = Math.round(baseFontSize * 1.4);
  const padX = Math.round(width * 0.028);
  const padY = Math.round(width * 0.022);

  // Measure text block width
  ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  let maxLineWidth = 0;
  for (const line of lines) {
    if (line.isHeader) {
      ctx.font = `800 ${headerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    } else {
      ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }
    const metrics = ctx.measureText(line.text);
    if (metrics.width > maxLineWidth) {
      maxLineWidth = metrics.width;
    }
  }

  // Mini-map box dimensions
  const hasMap = stampConfig.showMap && mapCanvas;
  const mapSize = hasMap ? Math.max(76, Math.floor(width * 0.125)) : 0;
  const mapGap = hasMap ? Math.round(width * 0.02) : 0;

  // Total stamp dimensions
  const stampContentWidth = maxLineWidth + (hasMap ? mapSize + mapGap : 0);
  const totalBoxWidth = Math.min(width - padX * 2, stampContentWidth + padX * 2);
  const totalBoxHeight = lines.length * lineSpacing + padY * 2;

  // Position coordinates
  let boxX = padX;
  let boxY = height - totalBoxHeight - padY;

  if (stampConfig.position === 'bottom-right') {
    boxX = width - totalBoxWidth - padX;
    boxY = height - totalBoxHeight - padY;
  } else if (stampConfig.position === 'top-left') {
    boxX = padX;
    boxY = padY;
  } else if (stampConfig.position === 'top-right') {
    boxX = width - totalBoxWidth - padX;
    boxY = padY;
  }

  // Draw Card Background (respecting transparent mode and custom opacity)
  const isTransparent =
    stampConfig.backgroundStyle === 'transparent' ||
    stampConfig.backgroundStyle === 'minimal' ||
    stampConfig.backgroundOpacity === 0;

  if (!isTransparent) {
    const opacity = stampConfig.backgroundOpacity ?? 0.68;
    if (stampConfig.backgroundStyle === 'solid-dark') {
      ctx.fillStyle = `rgba(12, 14, 20, ${opacity})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(opacity * 0.3, 0.25)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, totalBoxWidth, totalBoxHeight, 10);
      ctx.fill();
      ctx.stroke();
    } else if (stampConfig.backgroundStyle === 'translucent') {
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(opacity * 0.35, 0.25)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, totalBoxWidth, totalBoxHeight, 10);
      ctx.fill();
      ctx.stroke();
    } else if (stampConfig.backgroundStyle === 'glass') {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, totalBoxWidth, totalBoxHeight, 10);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 5. Draw Semi-Transparent Rounded-Rectangle Backdrop behind Text Elements if enabled
  const textStartX = boxX + padX;
  const maxTextAllowed = totalBoxWidth - (hasMap ? mapSize + mapGap : 0) - padX * 2;
  const showTextBackdrop = stampConfig.showTextBackdrop ?? true;

  if (showTextBackdrop) {
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const textPadX = Math.round(baseFontSize * 0.55);
    const textPadY = Math.round(baseFontSize * 0.38);
    const textBackdropX = textStartX - textPadX;
    const textBackdropY = boxY + padY - Math.round(textPadY * 0.4);
    const textBackdropW = Math.min(maxLineWidth, maxTextAllowed) + textPadX * 2;
    const textBackdropH = lines.length * lineSpacing + textPadY * 1.4;
    const cornerRadius = Math.min(10, Math.max(6, Math.round(baseFontSize * 0.4)));

    drawRoundedRect(ctx, textBackdropX, textBackdropY, textBackdropW, textBackdropH, cornerRadius);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Text Lines (High-legibility on transparent backgrounds)
  let currentY = boxY + padY + baseFontSize;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 6;

  for (const line of lines) {
    if (line.isHeader) {
      ctx.font = `800 ${headerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = stampConfig.stampColor;
    } else if (line.isAccent) {
      ctx.font = `700 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
    } else {
      ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = stampConfig.stampColor;
    }

    // Clip line text if wider than available space
    const maxTextAllowed = totalBoxWidth - (hasMap ? mapSize + mapGap : 0) - padX * 2;
    let displayText = line.text;
    while (ctx.measureText(displayText).width > maxTextAllowed && displayText.length > 10) {
      displayText = displayText.slice(0, -4) + '...';
    }

    // On transparent watermark, stroke subtle dark outline first for ultra-crisp legibility
    if (isTransparent) {
      ctx.save();
      ctx.lineWidth = Math.max(2, Math.round(baseFontSize * 0.16));
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeText(displayText, textStartX, currentY);
      ctx.restore();
    }

    ctx.fillText(displayText, textStartX, currentY);
    currentY += lineSpacing;
  }

  // Draw Mini-Map Tile on Right Side of stamp box
  if (hasMap && mapCanvas) {
    const mapX = boxX + totalBoxWidth - padX - mapSize;
    const mapY = boxY + (totalBoxHeight - mapSize) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapSize, mapSize, 8);
    ctx.clip();
    ctx.drawImage(mapCanvas, mapX, mapY, mapSize, mapSize);
    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapSize, mapSize, 8);
    ctx.stroke();
  }

  ctx.restore();
}
