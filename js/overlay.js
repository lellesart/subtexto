(function () {
    'use strict';

    const canvas = document.getElementById('mainCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const params = new URLSearchParams(window.location.search);
    const allowedProfiles = ['edicao', 'transmissao', 'transmissao-logo'];
    const allowedFonts = ['Inter', 'Inter Black', 'Poppins ExtraBold', 'Public Sans Black', 'Montserrat', 'Roboto', 'Playfair Display', 'Archivo Black', 'Arimo', 'Geist', 'IBM Plex Sans', 'Instrument Sans', 'Oswald', 'Roboto Condensed', 'Space Grotesk'];
    const defaultResolution = '1920x1080';
    const sourceChannel = String(params.get('channel') || 'principal').trim().slice(0, 40) || 'principal';

    const state = {
        name: '',
        role: '',
        profile: 'transmissao',
        font: 'Inter',
        fontName: 'Arimo',
        fontRole: 'Instrument Sans',
        nameBold: true,
        nameItalic: false,
        roleBold: true,
        roleItalic: false,
        colorName: '#0f0f11',
        colorRole: '#0f0f11',
        sizeName: 44,
        sizeRole: 28,
        textOffsetX: 0,
        textOffsetY: 0,
        textLineGap: 6,
        bgType: 'preset',
        colorBar1: '#FFC067',
        colorBar2: '#ffffff',
        bgStyle: 'split-bar',
        bgOpacity: 100,
        chromaKey: false,
        customModel: 'logo-inside',
        customLogoData: '',
        customLogoSize: 58,
        customLogoEnterType: 'fade-slide-left',
        customLogoExitType: 'fade-slide-left',
        resolution: defaultResolution,
        animType: 'slide',
        barEnterType: 'stretch-open',
        textEnterType: 'fade-in',
        posX: 120,
        posY: 220,
        animDuration: 1600,
        velEntradaTexto: 1400,
        holdDuration: 6000,
        velSaidaTexto: 800,
        velSaidaBarras: 500,
        textEraseType: 'fade-only',
        barExitType: 'fade-erase'
    };

    let animationRunId = 0;
    let isAnimating = false;
    let brandLogoObj = null;
    let customLogoObj = null;
    let customLogoLoadPromise = Promise.resolve();

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const parseResolution = (value) => {
        if (!/^\d+x\d+$/.test(String(value || ''))) return defaultResolution;
        const [width, height] = String(value).split('x').map(Number);
        if (!Number.isFinite(width) || !Number.isFinite(height)) return defaultResolution;
        return `${clamp(width, 320, 7680)}x${clamp(height, 240, 4320)}`;
    };

    const setCanvasSize = (resolution) => {
        const [width, height] = parseResolution(resolution).split('x').map(Number);
        state.resolution = `${width}x${height}`;
        canvas.width = width;
        canvas.height = height;
    };

    const hexColor = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback);

    const numeric = (value, fallback, min, max) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
    };

    const enumValue = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;

    const loadCustomLogoData = (dataUrl) => {
        if (!dataUrl) {
            customLogoObj = null;
            state.customLogoData = '';
            customLogoLoadPromise = Promise.resolve();
            return customLogoLoadPromise;
        }
        if (dataUrl === state.customLogoData && customLogoObj) return customLogoLoadPromise;
        state.customLogoData = dataUrl;
        customLogoObj = null;
        customLogoLoadPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                customLogoObj = img;
                resolve();
            };
            img.onerror = () => {
                customLogoObj = null;
                resolve();
            };
            img.src = dataUrl;
        });
        return customLogoLoadPromise;
    };

    const applyState = (next = {}) => {
        if (!next || typeof next !== 'object' || Array.isArray(next)) return;
        const nextResolution = parseResolution(next.resolution || state.resolution);
        if (nextResolution) setCanvasSize(nextResolution);
        const legacyEntryMap = {
            slide: 'slide-left',
            fade: 'fade-in',
            scale: 'zoom-in-dynamic'
        };
        if (typeof next.name === 'string') state.name = next.name.slice(0, 120);
        if (typeof next.role === 'string') state.role = next.role.slice(0, 240);
        state.profile = enumValue(next.profile, allowedProfiles, state.profile);
        state.font = enumValue(next.font, allowedFonts, state.font);
        state.fontName = enumValue(next.fontName, allowedFonts, next.font ? enumValue(next.font, allowedFonts, state.fontName) : state.fontName);
        state.fontRole = enumValue(next.fontRole, allowedFonts, next.font ? enumValue(next.font, allowedFonts, state.fontRole) : state.fontRole);
        state.nameBold = typeof next.nameBold === 'boolean' ? next.nameBold : state.nameBold;
        state.nameItalic = typeof next.nameItalic === 'boolean' ? next.nameItalic : state.nameItalic;
        state.roleBold = typeof next.roleBold === 'boolean' ? next.roleBold : state.roleBold;
        state.roleItalic = typeof next.roleItalic === 'boolean' ? next.roleItalic : state.roleItalic;
        state.colorName = hexColor(next.colorName, state.colorName);
        state.colorRole = hexColor(next.colorRole, state.colorRole);
        state.sizeName = numeric(next.sizeName, state.sizeName, 20, 100);
        state.sizeRole = numeric(next.sizeRole, state.sizeRole, 15, 50);
        state.textOffsetX = numeric(next.textOffsetX, state.textOffsetX, -300, 300);
        state.textOffsetY = numeric(next.textOffsetY, state.textOffsetY, -150, 150);
        state.textLineGap = numeric(next.textLineGap, state.textLineGap, -20, 60);
        state.bgType = enumValue(next.bgType, ['preset', 'custom'], state.bgType);
        state.colorBar1 = hexColor(next.colorBar1, state.colorBar1);
        state.colorBar2 = hexColor(next.colorBar2, state.colorBar2);
        state.bgStyle = enumValue(next.bgStyle, ['compact-lower', 'double-bar', 'modern-pill', 'split-bar', 'accent-left', 'progress-card'], state.bgStyle);
        state.bgOpacity = numeric(next.bgOpacity, state.bgOpacity, 10, 100);
        state.chromaKey = typeof next.chromaKey === 'boolean' ? next.chromaKey : state.chromaKey;
        state.customModel = enumValue(next.customModel, ['logo-inside', 'logo-outside', 'logo-left'], state.customModel);
        state.customLogoSize = numeric(next.customLogoSize, state.customLogoSize, 20, 120);
        state.customLogoEnterType = enumValue(next.customLogoEnterType, ['fade-slide-left', 'fade-in', 'zoom-in-dynamic'], state.customLogoEnterType);
        state.customLogoExitType = enumValue(next.customLogoExitType, ['fade-slide-left', 'fade-out', 'zoom-collapse'], state.customLogoExitType);
        if (typeof next.customLogoData === 'string') loadCustomLogoData(next.customLogoData);
        state.animType = enumValue(next.animType, ['slide', 'fade', 'scale'], state.animType);
        if (typeof next.barEnterType === 'string') {
            state.barEnterType = enumValue(next.barEnterType, ['compact-grow', 'slide-left', 'zoom-in-dynamic', 'fade-in', 'stretch-open'], state.barEnterType);
        } else if (legacyEntryMap[next.animType]) {
            state.barEnterType = legacyEntryMap[next.animType];
        }
        state.posX = numeric(next.posX, state.posX, 0, canvas.width || 1920);
        state.posY = numeric(next.posY, state.posY, 0, canvas.height || 1080);
        state.animDuration = numeric(next.animDuration, state.animDuration, 100, 10000);
        state.velEntradaTexto = numeric(next.velEntradaTexto, state.velEntradaTexto, 100, 10000);
        state.textEnterType = enumValue(next.textEnterType, ['slide-up', 'slide-left', 'fade-in', 'zoom-in', 'typewriter'], state.textEnterType);
        state.holdDuration = numeric(next.holdDuration, state.holdDuration, 500, 60000);
        state.velSaidaTexto = numeric(next.velSaidaTexto, state.velSaidaTexto, 100, 10000);
        state.velSaidaBarras = numeric(next.velSaidaBarras, state.velSaidaBarras, 100, 10000);
        state.textEraseType = enumValue(next.textEraseType, ['erase', 'fade-only'], state.textEraseType);
        state.barExitType = enumValue(next.barExitType, ['compact-shrink', 'fade-erase', 'zoom-collapse', 'slide-left', 'fade-out'], state.barExitType);
    };

    const roundRectPath = (x, y, width, height, radius) => {
        const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
        ctx.beginPath();
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
    };

    const fontAliases = {
        'Inter Black': { family: 'Inter', weight: 900 },
        'Poppins ExtraBold': { family: 'Poppins', weight: 800 },
        'Public Sans Black': { family: 'Public Sans', weight: 900 }
    };

    const resolveFontLoad = (fontName, fallbackWeight) => {
        return fontAliases[fontName] || { family: fontName, weight: fallbackWeight };
    };

    const resolveCanvasFont = (fontFamily, stylePrefix) => {
        const family = String(fontFamily || 'sans-serif');
        const aliasName = Object.keys(fontAliases).find(name => family.includes(`'${name}'`) || family.includes(`"${name}"`));
        if (!aliasName) return { family, stylePrefix };
        const alias = fontAliases[aliasName];
        return {
            family: `'${alias.family}', sans-serif`,
            stylePrefix: String(stylePrefix).replace(/\b[1-9]00\b/, String(alias.weight))
        };
    };

    const drawFittedText = (text, x, y, maxWidth, stylePrefix, desiredSize, minSize = 16, fontFamily = null) => {
        let size = Number(desiredSize) || minSize;
        const safeText = String(text ?? '');
        const resolved = resolveCanvasFont(fontFamily || `'${state.fontName || state.font}', sans-serif`, stylePrefix);
        do {
            ctx.font = `${resolved.stylePrefix} ${size}px ${resolved.family}`;
            if (ctx.measureText(safeText).width <= maxWidth || size <= minSize) break;
            size -= 2;
        } while (size > minSize);
        ctx.fillText(safeText, x, y, maxWidth);
    };

    const drawOutlinedFittedText = (text, x, y, maxWidth, stylePrefix, desiredSize, minSize = 16, fontFamily = null) => {
        let size = Number(desiredSize) || minSize;
        const safeText = String(text ?? '');
        const resolved = resolveCanvasFont(fontFamily || `'${state.fontName || state.font}', sans-serif`, stylePrefix);
        do {
            ctx.font = `${resolved.stylePrefix} ${size}px ${resolved.family}`;
            if (ctx.measureText(safeText).width <= maxWidth || size <= minSize) break;
            size -= 2;
        } while (size > minSize);
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(3, size * 0.08);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.strokeText(safeText, x, y, maxWidth);
        ctx.fillText(safeText, x, y, maxWidth);
    };

    const drawPresetBackground = (x, y, direction, progress, customBarProgress) => {
        const op = state.bgOpacity / 100;
        const entryEffect = state.barEnterType || 'slide-left';
        ctx.save();
        ctx.globalAlpha *= op;

        if (state.bgStyle === 'compact-lower') {
            const barW = 720;
            const barH = 64;
            const accentH = 6;
            const isExit = direction === 'out';
            const barProgress = isExit ? customBarProgress : progress;
            const currentH = isExit ? barH : barH * clamp(barProgress, 0, 1);
            const widthFactor = isExit && state.barExitType === 'compact-shrink' ? customBarProgress : 1;
            const currentW = barW * clamp(widthFactor, 0, 1);
            const top = y + barH - currentH;

            ctx.fillStyle = state.colorBar2;
            ctx.fillRect(x, top, currentW, currentH);

            const accentProgress = isExit
                ? customBarProgress
                : clamp((progress - 0.9) / 0.1, 0, 1);
            if (accentProgress > 0) {
                ctx.fillStyle = state.colorBar1;
                ctx.fillRect(x, y + barH - accentH, currentW * accentProgress, accentH);
            }
        } else if (state.bgStyle === 'double-bar' || state.bgStyle === 'legacy-double') {
            const p1 = direction === 'in' ? Math.min(1, progress * 2) : customBarProgress;
            const p2 = direction === 'in' ? Math.max(0, (progress - 0.5) * 2) : customBarProgress;
            const topBarW = 680;
            const topBarH = 72;
            const bottomBarW = 820;
            const bottomBarH = 50;
            const barFactorY = direction === 'out' && state.barExitType === 'zoom-collapse' ? customBarProgress : 1;
            const stretchFactor = direction === 'in' && entryEffect === 'stretch-open' ? progress : 1;

            ctx.fillStyle = state.colorBar1;
            ctx.fillRect(x, y + (topBarH * (1 - barFactorY) / 2), topBarW * p1 * stretchFactor, topBarH * barFactorY);

            if (p2 > 0) {
                ctx.fillStyle = state.colorBar2;
                ctx.fillRect(x, y + topBarH + (bottomBarH * (1 - barFactorY) / 2), bottomBarW * p2 * stretchFactor, bottomBarH * barFactorY);
            }
        } else if (state.bgStyle === 'modern-pill') {
            ctx.fillStyle = state.colorBar2;
            roundRectPath(x, y, 720, 120, 16);
            ctx.fill();
            ctx.fillStyle = state.colorBar1;
            ctx.fillRect(x + 12, y + 16, 8, 88);
        } else if (state.bgStyle === 'split-bar') {
            const isExit = direction === 'out' && state.barExitType === 'fade-erase';
            const horizontalProgress = direction === 'in' && entryEffect === 'stretch-open'
                ? progress
                : (isExit ? customBarProgress : 1);
            ctx.save();
            if (isExit) {
                ctx.globalAlpha *= clamp(customBarProgress, 0, 1);
            }
            ctx.translate(x, y);
            ctx.scale(clamp(horizontalProgress, 0, 1), 1);

            ctx.fillStyle = state.colorBar1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(580, 0);
            ctx.lineTo(555, 64);
            ctx.lineTo(0, 64);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = state.colorBar2;
            ctx.beginPath();
            ctx.moveTo(15, 66);
            ctx.lineTo(520, 66);
            ctx.lineTo(500, 112);
            ctx.lineTo(15, 112);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (state.bgStyle === 'progress-card') {
            const cardW = 720;
            const cardH = 150;
            const accentH = 7;
            const growRaw = direction === 'in' ? clamp(progress / 0.78, 0, 1) : 1;
            const growP = growRaw * growRaw * (3 - (2 * growRaw));
            const slideP = direction === 'out' ? clamp(customBarProgress, 0, 1) : 1;
            const slideX = direction === 'out' ? (1 - slideP) * -(cardW + 80) : 0;
            const currentH = Math.max(2, cardH * growP);
            const top = y + ((cardH - currentH) / 2);
            const accentProgress = direction === 'in'
                ? clamp((progress - 0.78) / 0.22, 0, 1)
                : slideP;

            ctx.save();
            if (direction === 'out') {
                ctx.beginPath();
                ctx.rect(x, y, cardW, cardH);
                ctx.clip();
            }
            ctx.translate(slideX, 0);
            ctx.fillStyle = state.colorBar2;
            ctx.fillRect(x, top, cardW, currentH);
            if (accentProgress > 0.01) {
                ctx.fillStyle = state.colorBar1;
                ctx.fillRect(x, y + cardH - accentH, cardW * accentProgress, accentH);
            }
            ctx.restore();
        } else if (state.bgStyle === 'accent-left') {
            ctx.fillStyle = state.colorBar2;
            ctx.fillRect(x + 16, y, 644, 115);
            ctx.fillStyle = state.colorBar1;
            ctx.fillRect(x, y, 16, 115);
        }

        ctx.restore();
    };

    const drawTransmissaoBackground = (x, y, direction, progress, customBarProgress) => {
        const op = state.bgOpacity / 100;
        const entryEffect = state.barEnterType || 'slide-left';
        ctx.save();
        ctx.globalAlpha *= op;

        const barW = canvas.width;
        const barH = 145;
        const highlightH = 6;
        let currentY = y;
        if (direction === 'out' && state.barExitType === 'zoom-collapse') {
            currentY = y + (1 - customBarProgress) * 200;
        }
        const stretchFactor = direction === 'in' && entryEffect === 'stretch-open' ? progress : 1;

        ctx.fillStyle = state.colorBar2;
        ctx.fillRect(0, currentY, barW * stretchFactor, barH);

        ctx.fillStyle = state.colorBar1;
        ctx.fillRect(0, currentY, barW * stretchFactor, highlightH);

        if (state.profile === 'transmissao-logo' && brandLogoObj?.complete && brandLogoObj.naturalWidth > 0) {
            const logoW = Math.max(1, Math.min(280, canvas.width * 0.20) - 2);
            const logoH = logoW * (brandLogoObj.naturalHeight / brandLogoObj.naturalWidth) * 1.04;
            const rightMargin = Math.max(45, canvas.width * 0.04);
            ctx.drawImage(
                brandLogoObj,
                canvas.width - rightMargin - logoW,
                currentY + (barH - logoH) / 2,
                logoW,
                logoH
            );
        }

        ctx.restore();
    };

    const drawCustomLogoBars = (x, y, direction, progress, customTextProgress, customBarProgress) => {
        const barP = clamp(direction === 'out' ? customBarProgress : progress, 0, 1);
        const logoP = clamp(direction === 'out' ? customBarProgress : customTextProgress, 0, 1);
        const isLogoOutside = state.customModel === 'logo-outside';
        const isLogoLeft = state.customModel === 'logo-left';
        const topW = isLogoLeft ? 660 : 620;
        const topH = isLogoLeft ? Math.max(52, Math.min(86, Number(state.sizeName) + 14)) : 58;
        const bottomW = isLogoLeft ? 610 : 500;
        const bottomH = isLogoLeft ? Math.max(28, Math.min(52, Number(state.sizeRole) + 10)) : 40;
        const gap = isLogoLeft ? 5 : 4;
        const bottomStart = isLogoLeft ? 0 : 18;
        const bottomEnd = bottomStart + bottomW;
        const logoSize = clamp(Number(state.customLogoSize) || 58, 20, 120);
        const logoPad = 7;
        const logoBox = logoSize + logoPad * 2;
        const totalH = topH + gap + bottomH;
        const logoX = isLogoLeft ? x - logoSize - 5 : (isLogoOutside ? x + topW + 5 : x + topW - logoBox - 8);
        const logoY = (isLogoOutside || isLogoLeft) ? y + ((totalH - logoSize) / 2) : y + ((topH - logoSize) / 2);
        const logoOverflowY = Math.max(0, (logoSize - ((isLogoOutside || isLogoLeft) ? totalH : topH)) / 2);

        ctx.save();
        ctx.globalAlpha *= barP;
        ctx.fillStyle = state.colorBar1;
        if (isLogoLeft) {
            ctx.fillRect(x, y, topW, topH);
        } else {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + topW, y);
            ctx.lineTo(x + topW - 24, y + topH);
            ctx.lineTo(x, y + topH);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = state.colorBar2;
        if (isLogoLeft) {
            ctx.fillRect(x + bottomStart, y + topH + gap, bottomW, bottomH);
        } else {
            ctx.beginPath();
            ctx.moveTo(x + bottomStart, y + topH + gap);
            ctx.lineTo(x + bottomEnd, y + topH + gap);
            ctx.lineTo(x + bottomEnd - 18, y + topH + gap + bottomH);
            ctx.lineTo(x + bottomStart, y + topH + gap + bottomH);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        if (customLogoObj?.complete && logoP > 0.01) {
            const enterType = state.customLogoEnterType || 'fade-slide-left';
            const exitType = state.customLogoExitType || 'fade-slide-left';
            const activeType = direction === 'out' ? exitType : enterType;
            let logoOffsetX = 0;
            let logoScale = 1;

            if (activeType === 'fade-slide-left') {
                logoOffsetX = direction === 'out' ? (1 - logoP) * -34 : (1 - logoP) * -24;
            } else if (activeType === 'zoom-in-dynamic' || activeType === 'zoom-collapse') {
                logoScale = direction === 'out' ? Math.max(0.7, logoP) : 0.82 + (logoP * 0.18);
            }

            const naturalW = customLogoObj.naturalWidth || customLogoObj.width || logoSize;
            const naturalH = customLogoObj.naturalHeight || customLogoObj.height || logoSize;
            const ratio = Math.min(logoSize / naturalW, logoSize / naturalH);
            const drawW = naturalW * ratio;
            const drawH = naturalH * ratio;

            ctx.save();
            ctx.globalAlpha *= logoP;
            ctx.beginPath();
            if (isLogoLeft) {
                ctx.rect(x - logoSize - 5, y - logoOverflowY, topW + logoSize + 5, totalH + (logoOverflowY * 2));
            } else {
                ctx.rect(x, y - logoOverflowY, isLogoOutside ? topW + 5 + logoSize : topW, totalH + (logoOverflowY * 2));
            }
            ctx.clip();
            ctx.translate(logoX + logoSize / 2 + logoOffsetX, logoY + logoSize / 2);
            ctx.scale(logoScale, logoScale);
            ctx.drawImage(customLogoObj, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }
    };

    const drawText = (x, y, direction, progress, customTextProgress, customBarProgress) => {
        const nameText = state.name;
        const roleText = state.role;
        const styleNamePrefix = (state.nameItalic ? 'italic ' : '') + (state.nameBold ? '800' : '400');
        const styleRolePrefix = (state.roleItalic ? 'italic ' : '') + (state.roleBold ? '600' : '400');
        const isClassicStyle = state.bgType === 'preset' && state.bgStyle === 'compact-lower' && state.profile === 'edicao';
        const isSplitStyle = state.bgType === 'preset' && state.bgStyle === 'split-bar' && state.profile === 'edicao';
        const isDoubleStyle = state.bgType === 'preset' && state.bgStyle === 'double-bar' && state.profile === 'edicao';
        const isProgressStyle = state.bgType === 'preset' && state.bgStyle === 'progress-card' && state.profile === 'edicao';
        const isCustomLogoStyle = state.bgType === 'custom';
        const isTransmissao = state.profile === 'transmissao' || state.profile === 'transmissao-logo';
        const nameFontFamily = `'${state.fontName || state.font}', sans-serif`;
        const roleFontFamily = `'${state.fontRole || state.font}', sans-serif`;
        const entryEffect = state.barEnterType || 'slide-left';
        let tX = Number(state.textOffsetX) || 0;
        let tY = Number(state.textOffsetY) || 0;
        const lineGap = Number(state.textLineGap) || 0;
        if (direction === 'in' && !isClassicStyle && !isSplitStyle && !isProgressStyle) {
            const textP = Math.max(0, Math.min(1, Number(customTextProgress) || 0));
            if (state.textEnterType === 'slide-up') tY += (1 - textP) * 80;
            else if (state.textEnterType === 'slide-left') tX -= (1 - textP) * 120;
            else if (state.textEnterType === 'zoom-in') tY += (1 - textP) * 20;
        } else if (direction === 'out' && isCustomLogoStyle && state.customModel === 'logo-left') {
            tX += (1 - customTextProgress) * 160;
        } else if (direction === 'out' && state.bgStyle === 'split-bar') {
            tX -= (1 - customTextProgress) * 120;
        }

        if (isClassicStyle) {
            const p1 = direction === 'in' ? Math.min(1, customTextProgress * 2) : customTextProgress;
            const p2 = direction === 'in' ? Math.max(0, (customTextProgress - 0.5) * 2) : customTextProgress;
            const barW = 720;
            const barH = 64;
            const accentH = 6;
            const nameFontSize = Number(state.sizeName) || 90;
            const roleFontSize = Number(state.sizeRole) || 40;
            const classicRoleText = roleText.toUpperCase();
            const measuredName = resolveCanvasFont(nameFontFamily, '900');
            const measuredRole = resolveCanvasFont(roleFontFamily, '700');
            ctx.save();
            ctx.font = `${measuredName.stylePrefix} ${nameFontSize}px ${measuredName.family}`;
            const nameDescent = ctx.measureText(nameText).actualBoundingBoxDescent || (nameFontSize * 0.2);
            ctx.font = `${measuredRole.stylePrefix} ${roleFontSize}px ${measuredRole.family}`;
            const roleDescent = ctx.measureText(classicRoleText).actualBoundingBoxDescent || (roleFontSize * 0.2);
            ctx.restore();
            const safeLeft = Math.max(x, canvas.width * 0.05);
            const safeRight = canvas.width * 0.95;
            const safeW = Math.max(1, safeRight - safeLeft);
            const nameX = x + 40 + tX;
            const roleX = x + 40 + tX;
            const nameBaseline = y - 5 - nameDescent + tY;
            const roleBaseline = y + barH - accentH - 5 - roleDescent + tY + lineGap;
            const nameClipTop = nameBaseline - nameFontSize - 18;
            const nameClipHeight = nameFontSize + 28;
            const exitTextP = clamp(Number(customTextProgress) || 0, 0, 1);
            const nameReveal = direction === 'in' ? clamp((p1 - 0.10) / 0.90, 0, 1) : p1;
            const roleRevealIn = direction === 'in' ? clamp(p2, 0, 1) : p2;
            const nameEntryX = direction === 'in' ? nameX - ((1 - nameReveal) * 54) : nameX;
            const roleEntryX = direction === 'in' ? roleX - ((1 - roleRevealIn) * 44) : roleX;
            const exitShift = direction === 'out' ? (1 - exitTextP) * 58 : 0;
            const nameRevealSmooth = nameReveal * nameReveal * (3 - (2 * nameReveal));
            const visibleNameText = direction === 'out'
                ? nameText.substring(0, Math.ceil(nameText.length * exitTextP))
                : nameText;
            const visibleRoleText = direction === 'out'
                ? classicRoleText.substring(0, Math.ceil(classicRoleText.length * exitTextP))
                : classicRoleText;

            if (nameReveal > 0.01) {
                ctx.save();
                ctx.shadowColor = state.chromaKey ? 'transparent' : 'rgba(0, 0, 0, 0.35)';
                ctx.shadowBlur = state.chromaKey ? 0 : 6;
                ctx.shadowOffsetX = state.chromaKey ? 0 : 1.5;
                ctx.shadowOffsetY = state.chromaKey ? 0 : 1.5;
                ctx.globalAlpha *= direction === 'in' ? Math.min(1, nameReveal * 4) : Math.min(1, p1 * 1.5);
                if (direction === 'out') {
                    ctx.globalAlpha *= Math.pow(exitTextP, 1.25);
                }
                ctx.beginPath();
                if (direction === 'in') {
                    ctx.rect(safeLeft, nameClipTop, safeW * nameRevealSmooth, nameClipHeight);
                } else {
                    ctx.rect(safeLeft, nameClipTop, safeW, nameClipHeight);
                }
                ctx.clip();
                ctx.fillStyle = state.colorName;
                drawOutlinedFittedText(visibleNameText, nameEntryX - exitShift, nameBaseline, 820, '900', nameFontSize, 40, nameFontFamily);
                ctx.restore();
            }

            if (roleRevealIn > 0.01) {
                ctx.save();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.globalAlpha *= direction === 'in' ? Math.min(1, roleRevealIn * 4) : Math.min(1, p2 * 1.5);
                if (direction === 'out') {
                    const roleReveal = clamp(Math.pow(exitTextP, 1.25), 0, 1);
                    ctx.globalAlpha *= roleReveal;
                    ctx.beginPath();
                    ctx.rect(safeLeft, y, Math.min(barW * roleReveal, safeW), barH);
                    ctx.clip();
                } else {
                    ctx.beginPath();
                    ctx.rect(safeLeft, y, Math.min(barW, safeW), barH);
                    ctx.clip();
                }
                ctx.fillStyle = state.colorRole;
                drawFittedText(visibleRoleText, roleEntryX - exitShift, roleBaseline, 650, '700', roleFontSize, 26, roleFontFamily);
                ctx.restore();
            }
            return;
        }

        if (isDoubleStyle) {
            const p1 = direction === 'in' ? Math.min(1, customTextProgress * 2) : customTextProgress;
            const p2 = direction === 'in' ? Math.max(0, (customTextProgress - 0.5) * 2) : customTextProgress;
            const topBarH = 72;
            const safeLeft = canvas.width * 0.05;
            const safeRight = canvas.width * 0.95;
            const safeW = Math.max(1, safeRight - safeLeft);

            if (p1 > 0.05) {
                ctx.save();
                ctx.shadowColor = state.chromaKey ? 'transparent' : 'rgba(0, 0, 0, 0.28)';
                ctx.shadowBlur = state.chromaKey ? 0 : 5;
                ctx.shadowOffsetX = state.chromaKey ? 0 : 1;
                ctx.shadowOffsetY = state.chromaKey ? 0 : 1;
                const nameEase = p1 * p1 * (3 - (2 * p1));
                ctx.globalAlpha *= Math.min(1, nameEase * 1.25);
                ctx.fillStyle = state.colorName;
                const nameSlide = direction === 'in' ? (1 - nameEase) * -34 : 0;
                drawFittedText(nameText.toUpperCase(), Math.max(safeLeft, x + 40 + tX + nameSlide), y + 48 + tY, Math.min(620, safeW), styleNamePrefix, state.sizeName, 20);
                ctx.restore();
            }

            if (p2 > 0) {
                ctx.save();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.globalAlpha *= Math.min(1, p2 * 1.5);
                ctx.fillStyle = state.colorRole;
                let textLength = roleText.length;
                if (direction === 'out' && state.textEraseType === 'erase') {
                    textLength = Math.floor(roleText.length * customTextProgress);
                } else if (direction === 'in') {
                    textLength = Math.min(roleText.length, Math.ceil(roleText.length * p2 * 1.15));
                }
                const visibleText = roleText.substring(0, textLength);
                ctx.beginPath();
                ctx.rect(safeLeft, y + topBarH, safeW, 58);
                ctx.clip();
                drawFittedText(visibleText, x + 40 + tX, y + topBarH + 32 + tY + lineGap, 750, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
                ctx.restore();
            }
            return;
        }

        if (isProgressStyle) {
            const textP = clamp(Number(customTextProgress) || 0, 0, 1);
            const easeText = textP * textP * (3 - (2 * textP));
            const cardW = 720;
            const cardH = 150;
            const accentH = 7;
            const growRaw = direction === 'in' ? clamp(progress / 0.78, 0, 1) : 1;
            const growP = growRaw * growRaw * (3 - (2 * growRaw));
            const slideP = direction === 'out' ? clamp(Number(customBarProgress) || 0, 0, 1) : 1;
            const slideX = direction === 'out' ? (1 - slideP) * -(cardW + 80) : 0;
            const currentH = Math.max(2, cardH * growP);
            const top = y + ((cardH - currentH) / 2);
            const nameSize = Number(state.sizeName);
            const nameX = x + 72 + tX + slideX;
            const nameY = y + 102 + tY;
            const maxTextW = 590;

            if (textP > 0.01 || direction === 'out') {
                ctx.save();
                if (direction === 'out') {
                    ctx.beginPath();
                    ctx.rect(x, y, cardW, cardH - accentH);
                    ctx.clip();
                }
                ctx.beginPath();
                ctx.rect(x + slideX, top, cardW, Math.max(1, currentH - accentH));
                ctx.clip();
                ctx.globalAlpha *= direction === 'in' ? Math.min(1, easeText * 1.35) : slideP;
                ctx.fillStyle = state.colorName;
                if (direction === 'in') {
                    const textScale = 0.88 + (0.12 * easeText);
                    ctx.translate(x + slideX + (cardW / 2), nameY - (nameSize * 0.35));
                    ctx.scale(textScale, 0.96 + (0.04 * easeText));
                    ctx.translate(-(x + slideX + (cardW / 2)), -(nameY - (nameSize * 0.35)));
                }
                drawFittedText(nameText, nameX, nameY, maxTextW, '900', nameSize, 34, nameFontFamily);
                ctx.restore();
            }
            return;
        }

        if (isTransmissao) {
            let currentY = y;
            if (direction === 'in' && entryEffect === 'slide-left') {
                currentY = y + (1 - progress) * 200;
            } else if (direction === 'out' && state.barExitType === 'zoom-collapse') {
                currentY = y + (1 - customBarProgress) * 200;
            }

            ctx.save();
            ctx.globalAlpha *= customTextProgress;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            ctx.fillStyle = state.colorName;
            const logoReserve = state.profile === 'transmissao-logo' ? Math.min(390, canvas.width * 0.30) : 140;
            const availableTextWidth = Math.max(320, canvas.width - 140 - logoReserve - tX);
            drawFittedText(nameText, 140 + tX, currentY + 65 + tY, availableTextWidth, styleNamePrefix, state.sizeName, 20);

            ctx.fillStyle = state.colorRole;
            drawFittedText(roleText, 140 + tX, currentY + 112 + tY + lineGap, availableTextWidth, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.shadowColor = state.chromaKey ? 'transparent' : 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = state.chromaKey ? 0 : 6;
        ctx.shadowOffsetX = state.chromaKey ? 0 : 1.5;
        ctx.shadowOffsetY = state.chromaKey ? 0 : 1.5;
        const textOpacity = direction === 'in' && isSplitStyle
            ? Math.min(1, customTextProgress * 3)
            : customTextProgress;
        ctx.globalAlpha *= textOpacity;
        const splitTextProgress = isSplitStyle && direction === 'out'
            ? clamp(Number(customTextProgress) || 0, 0, 1)
            : 1;
        const visibleName = nameText;
        const visibleRole = isSplitStyle && direction === 'out'
            ? roleText.substring(0, Math.ceil(roleText.length * splitTextProgress))
            : roleText;
        if (isCustomLogoStyle) {
            const barP = clamp(Number(customBarProgress) || 0, 0, 1);
            const isLogoOutside = state.customModel === 'logo-outside';
            const isLogoLeft = state.customModel === 'logo-left';
            const bottomStart = 18;
            const bottomEnd = 500;
            const textX = x + 35 + tX;
            const roleTextX = x + bottomStart + 17 + tX;
            const logoSpace = isLogoOutside ? 0 : Math.min(120, Math.max(60, Number(state.customLogoSize) + 26));
            const topTextW = Math.max(220, 620 - logoSpace - 48);
            const roleTextW = Math.max(220, bottomEnd - bottomStart - 44);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            if (direction === 'out') {
                ctx.globalAlpha *= barP;
            }
            if (isLogoLeft) {
                const nameSize = Number(state.sizeName) || 44;
                const roleSize = Number(state.sizeRole) || 28;
                const topW = 660;
                const topH = Math.max(52, Math.min(86, nameSize + 14));
                const bottomW = 610;
                const bottomH = Math.max(28, Math.min(52, roleSize + 10));
                const gap = 5;
                const customTextX = x + 26 + tX;
                const nameY = y + ((topH + (nameSize * 0.72)) / 2) - 2 + tY;
                const roleY = y + topH + gap + ((bottomH + (roleSize * 0.72)) / 2) - 2 + tY + lineGap;
                const nameClipX = direction === 'out' ? x + (topW * (1 - barP)) : x;
                const roleClipX = direction === 'out' ? x + (bottomW * (1 - barP)) : x;

                ctx.fillStyle = state.colorName;
                ctx.save();
                ctx.beginPath();
                ctx.rect(nameClipX, y, topW * barP, topH);
                ctx.clip();
                drawFittedText(visibleName, customTextX, nameY, topW - 52, styleNamePrefix, state.sizeName, 20, nameFontFamily);
                ctx.restore();

                ctx.fillStyle = state.colorRole;
                ctx.save();
                ctx.beginPath();
                ctx.rect(roleClipX, y + topH + gap, bottomW * barP, bottomH);
                ctx.clip();
                drawFittedText(visibleRole, customTextX, roleY, bottomW - 40, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
                ctx.restore();
            } else {
                ctx.fillStyle = state.colorName;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (620 * barP), y);
                ctx.lineTo(x + ((620 - 24) * barP), y + 58);
                ctx.lineTo(x, y + 58);
                ctx.closePath();
                ctx.clip();
                drawFittedText(visibleName, textX, y + 43 + tY, topTextW, styleNamePrefix, state.sizeName, 20, nameFontFamily);
                ctx.restore();

                ctx.fillStyle = state.colorRole;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x + (bottomStart * barP), y + 62);
                ctx.lineTo(x + (bottomEnd * barP), y + 62);
                ctx.lineTo(x + ((bottomEnd - 18) * barP), y + 102);
                ctx.lineTo(x + (bottomStart * barP), y + 102);
                ctx.closePath();
                ctx.clip();
                drawFittedText(visibleRole, roleTextX, y + 90 + tY + lineGap, roleTextW, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
                ctx.restore();
            }
        } else if (isSplitStyle) {
            const barP = clamp(Number(customBarProgress) || 0, 0, 1);
            const splitTextP = clamp(Number(customTextProgress) || 0, 0, 1);
            const textScale = direction === 'in' ? 0.92 + (0.08 * splitTextP) : 1;
            if (direction === 'out') {
                ctx.globalAlpha *= barP;
            }
            const textX = x + 35 + tX;
            ctx.fillStyle = state.colorName;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (580 * barP), y);
            ctx.lineTo(x + (555 * barP), y + 64);
            ctx.lineTo(x, y + 64);
            ctx.closePath();
            ctx.clip();
            if (direction === 'in') {
                ctx.translate(textX, y + 50 + tY);
                ctx.scale(textScale, 1);
                ctx.translate(-textX, -(y + 50 + tY));
            }
            drawFittedText(visibleName, textX, y + 50 + tY, 620, styleNamePrefix, state.sizeName, 20);
            ctx.restore();

            ctx.fillStyle = state.colorRole;
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.moveTo(x + (15 * barP), y + 66);
            ctx.lineTo(x + (520 * barP), y + 66);
            ctx.lineTo(x + (500 * barP), y + 112);
            ctx.lineTo(x + (15 * barP), y + 112);
            ctx.closePath();
            ctx.clip();
            if (direction === 'in') {
                ctx.translate(textX, y + 92 + tY + lineGap);
                ctx.scale(textScale, 1);
                ctx.translate(-textX, -(y + 92 + tY + lineGap));
            }
            drawFittedText(visibleRole, textX, y + 92 + tY + lineGap, 650, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
            ctx.restore();
        } else {
            ctx.fillStyle = state.colorName;
            drawFittedText(visibleName, x + 35 + tX, y + 50 + tY, 620, styleNamePrefix, state.sizeName, 20);
            ctx.fillStyle = state.colorRole;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            drawFittedText(visibleRole, x + 35 + tX, y + 92 + tY + lineGap, 650, styleRolePrefix, state.sizeRole, 16, roleFontFamily);
        }
        ctx.restore();
    };

    const render = (progress = 1, direction = 'in', customTextProgress = 1, customBarProgress = 1) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.chromaKey) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const width = canvas.width;
        const height = canvas.height;
        let animOffset = 0;
        let opacity = 1;
        let scale = 1;
        const isTransmissao = state.profile === 'transmissao' || state.profile === 'transmissao-logo';
        const isProgressStyle = state.bgType === 'preset' && state.bgStyle === 'progress-card' && state.profile === 'edicao';
        const isCustomLogoLeft = state.bgType === 'custom' && state.customModel === 'logo-left';
        const entryEffect = state.barEnterType || 'slide-left';

        ctx.save();

        let posX = Number(state.posX);
        const posY = height - Number(state.posY);
        if (isCustomLogoLeft) {
            const safeRight = width * 0.95;
            const modelRightEdge = 660;
            posX = Math.max(0, safeRight - modelRightEdge);
        }

        if (direction === 'in' && !isProgressStyle) {
            if (isCustomLogoLeft) {
                animOffset = (1 - progress) * 420;
                opacity = Math.min(1, 0.75 + (progress * 0.25));
            } else if (entryEffect === 'slide-left') {
                const slideDistance = state.bgStyle === 'double-bar' ? 220 : 400;
                animOffset = (1 - progress) * -slideDistance;
                opacity = state.bgStyle === 'double-bar' ? Math.min(1, 0.85 + (progress * 0.15)) : progress;
            } else if (entryEffect === 'fade-in') {
                opacity = progress;
            } else if (entryEffect === 'zoom-in-dynamic') {
                scale = 0.88 + (progress * 0.12);
                opacity = progress;
            } else if (entryEffect === 'stretch-open') {
                opacity = progress;
            }
            ctx.globalAlpha = opacity;
        } else if (direction === 'out' && !isProgressStyle) {
            if (isCustomLogoLeft) {
                animOffset = (1 - customBarProgress) * 420;
                opacity = customBarProgress;
            } else if (state.barExitType === 'zoom-collapse') {
                scale = customBarProgress;
                opacity = customBarProgress;
            } else if (state.barExitType === 'slide-left') {
                animOffset = (1 - customBarProgress) * -400;
                opacity = customBarProgress;
            } else if (state.barExitType === 'fade-out' || state.barExitType === 'fade-erase' || state.barExitType === 'compact-shrink') {
                opacity = customBarProgress;
            }
            ctx.globalAlpha = opacity;
        }

        if (scale !== 1) {
            const originX = isTransmissao ? width / 2 : posX + 360;
            const originY = posY + 70;
            ctx.translate(originX, originY);
            ctx.scale(scale, scale);
            ctx.translate(-originX, -originY);
        }

        if (state.bgType === 'preset') {
            if (isTransmissao) drawTransmissaoBackground(posX + animOffset, posY, direction, progress, customBarProgress);
            else drawPresetBackground(posX + animOffset, posY, direction, progress, customBarProgress);
        } else if (state.bgType === 'custom') {
            drawCustomLogoBars(posX + animOffset, posY, direction, progress, customTextProgress, customBarProgress);
        }

        drawText(posX + animOffset, posY, direction, progress, customTextProgress, customBarProgress);
        ctx.restore();
    };

    const waitForFonts = () => {
        const tasks = [];
        if (document.fonts) {
            const nameSpec = resolveFontLoad(state.fontName || state.font, state.nameBold ? 800 : 400);
            const roleSpec = resolveFontLoad(state.fontRole || state.font, state.roleBold ? 600 : 400);
            tasks.push(
                document.fonts.load(`${nameSpec.weight} ${state.sizeName}px "${nameSpec.family}"`),
                document.fonts.load(`${roleSpec.weight} ${state.sizeRole}px "${roleSpec.family}"`),
                document.fonts.ready
            );
        }
        if (state.bgType === 'custom' && state.customLogoData) {
            tasks.push(customLogoLoadPromise.catch(() => {}));
        }
        if (!tasks.length) return Promise.resolve();
        return Promise.race([Promise.all(tasks), new Promise(resolve => setTimeout(resolve, 1500))]).catch(() => {});
    };

    const startAnimationCycle = () => {
        if (isAnimating) return;
        isAnimating = true;
        const runId = ++animationRunId;
        const barsIn = Math.max(1, Number(state.animDuration));
        const textIn = Math.max(1, Number(state.velEntradaTexto));
        const compactTextDelay = state.bgType === 'preset' && state.bgStyle === 'compact-lower' ? barsIn * 0.5 : 0;
        const splitIn = state.bgType === 'preset' && state.bgStyle === 'split-bar';
        const splitEntryTextDelay = splitIn ? barsIn * 0.82 : 0;
        const splitOut = state.bgType === 'preset' && state.bgStyle === 'split-bar';
        const progressStyle = state.bgType === 'preset' && state.bgStyle === 'progress-card';
        const progressTextDelay = progressStyle ? barsIn * 0.58 : 0;
        const textOut = Math.max(1, Number(state.velSaidaTexto));
        const barOut = Math.max(1, Number(state.velSaidaBarras));
        const splitTextDelay = splitOut ? Math.min(100, barOut * 0.12) : 0;
        const splitEffectiveTextOut = splitOut
            ? Math.max(1, Math.min(textOut, barOut - splitTextDelay - Math.min(80, barOut * 0.1)))
            : textOut;
        const textEntryDelay = progressStyle ? progressTextDelay : (splitIn ? splitEntryTextDelay : compactTextDelay);
        const entranceDuration = Math.max(barsIn, textEntryDelay + textIn);
        const stages = [
            { name: 'in', duration: entranceDuration },
            { name: 'hold', duration: Math.max(1, Number(state.holdDuration)) },
            ...(progressStyle
                ? [{ name: 'out-progress-card', duration: Math.max(textOut, barOut) }]
                : splitOut
                ? [{ name: 'out-split', duration: Math.max(barOut, splitTextDelay + textOut) }]
                : [
                    { name: 'out-text', duration: textOut },
                    { name: 'out-bar', duration: barOut }
                ])
        ];
        let stageIndex = 0;
        let stageStartedAt = performance.now();

        render(0, 'in', 0, 0);

        const frame = (now) => {
            if (runId !== animationRunId) return;
            const stage = stages[stageIndex];
            const ratio = Math.min(1, (now - stageStartedAt) / stage.duration);

        if (stage.name === 'in') {
            const elapsed = now - stageStartedAt;
            const barRatio = Math.min(1, elapsed / barsIn);
            const textRatio = Math.min(1, Math.max(0, (elapsed - textEntryDelay) / textIn));
                const easeBar = 1 - Math.pow(1 - barRatio, 3);
                const easeText = 1 - Math.pow(1 - textRatio, 3);
                render(easeBar, 'in', easeText, easeBar);
            } else if (stage.name === 'hold') {
                render(1, 'in', 1, 1);
                setTimeout(() => {
                    if (runId !== animationRunId) return;
                    stageIndex += 1;
                    stageStartedAt = performance.now();
                    requestAnimationFrame(frame);
                }, stage.duration);
                return;
            } else if (stage.name === 'out-text') {
                render(1, 'out', 1 - ratio, 1);
            } else if (stage.name === 'out-split') {
                const elapsed = now - stageStartedAt;
                const barRatio = Math.min(1, elapsed / barOut);
                const textRatio = Math.min(1, Math.max(0, (elapsed - splitTextDelay) / splitEffectiveTextOut));
                render(1, 'out', 1 - textRatio, Math.pow(1 - barRatio, 3));
            } else if (stage.name === 'out-progress-card') {
                const elapsed = now - stageStartedAt;
                const barRatio = Math.min(1, elapsed / barOut);
                const textRatio = Math.min(1, elapsed / textOut);
                const outBar = Math.pow(1 - barRatio, 3);
                render(1, 'out', 1 - textRatio, outBar);
            } else {
                render(1, 'out', 0, Math.pow(1 - ratio, 3));
            }

            if (ratio < 1) {
                requestAnimationFrame(frame);
            } else if (++stageIndex < stages.length) {
                stageStartedAt = now;
                requestAnimationFrame(frame);
            } else {
                render(0, 'out', 0, 0);
                isAnimating = false;
            }
        };

        requestAnimationFrame(frame);
    };

    const handleLiveCommand = (event) => {
        const payload = event?.detail?.eventData || event?.detail?.event_data || event?.detail || {};
        const payloadChannel = String(payload.channel || 'principal').trim().slice(0, 40) || 'principal';
        if (payloadChannel !== sourceChannel) return;
        const action = String(payload.action || '').toLowerCase();
        animationRunId += 1;
        isAnimating = false;

        if (action === 'hide') {
            render(0, 'out', 0, 0);
            return;
        }

        if (action === 'show') {
            const nextState = payload.state || {
                name: typeof payload.name === 'string' ? payload.name : state.name,
                role: typeof payload.role === 'string' ? payload.role : state.role
            };
            applyState(nextState);
            waitForFonts().finally(() => startAnimationCycle());
        }
    };

    const init = () => {
        setCanvasSize(params.get('res') || defaultResolution);
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.display = 'block';

        brandLogoObj = null;

        applyState({
            name: params.get('name') || '',
            role: params.get('role') || '',
            profile: params.get('profile') || 'transmissao',
            font: params.get('font') || 'Inter',
            fontName: params.get('fontName') || params.get('font') || 'Arimo',
            fontRole: params.get('fontRole') || params.get('font') || 'Instrument Sans'
        });

        render(0, 'out', 0, 0);
        window.addEventListener('lowerThirdControl', handleLiveCommand);
        waitForFonts().then(() => render(0, 'out', 0, 0)).catch(() => {});
    };

    init();
})();
