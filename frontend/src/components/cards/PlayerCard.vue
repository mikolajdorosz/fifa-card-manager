<template>
    <div
        ref="cardRef"
        class="player-card"
        :class="[
            `card-${card.template?.cssClass || 'gold'}`,
            `size-${size}`,
            { selected },
            { 'has-image': card.template?.backgroundImageUrl },
        ]"
        :style="cardStyle"
        @click="$emit('click', card)"
    >
        <div class="card-top">
            <div class="card-overall">{{ card.overall }}</div>
            <div class="card-position">{{ card.position }}</div>
        </div>

        <div class="card-image-wrapper">
            <img
                v-if="card.imageUrl"
                :src="resolveImageUrl(card.imageUrl)"
                :alt="card.playerName"
                class="card-image"
                @error="onImageError"
            />
            <div v-else class="card-image-placeholder">
                <span>{{ card.playerName?.charAt(0) }}</span>
            </div>
        </div>

        <div class="card-name">{{ shortName }}</div>

        <div v-if="size !== 'sm'" class="card-stats">
            <div
                v-for="(val, key) in displayStats"
                :key="key"
                class="stat-item"
            >
                <span class="stat-val">{{ val }}</span>
                <span class="stat-key">{{ statLabels[key] }}</span>
            </div>
        </div>

        <div v-if="size === 'lg'" class="card-footer">
            <span class="card-team">{{ card.team }}</span>
        </div>

        <div v-if="selected" class="card-selected-overlay">✓</div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
    card: { type: Object, required: true },
    size: { type: String, default: "md" },
    selected: { type: Boolean, default: false },
});

defineEmits(["click"]);
const cardRef = ref(null);

const cardStyle = computed(() => {
    const t = props.card.template;
    if (!t) return {};

    const overlayGradient = `linear-gradient(
        145deg,
        color-mix(in srgb, ${t.accentColor || "#8b6914"} 75%, transparent),
        rgba(0,0,0,0.65)
    )`;

    return {
        "--card-bg": t.bgColor || "#c8a84b",
        "--card-border": t.borderColor || "#f0d060",
        "--card-text": t.textColor || "#ffffff",
        "--card-accent": t.accentColor || "#8b6914",
        "--card-image": t.backgroundImageUrl
            ? `url(${t.backgroundImageUrl})`
            : "none",
        "--card-overlay": overlayGradient,
        borderColor: t.borderColor || "#f0d060",
        color: t.textColor || "#ffffff",
    };
});

const shortName = computed(() => {
    const name = props.card.playerName || "";
    if (name.length <= 12) return name.toUpperCase();
    const parts = name.split(" ");
    if (parts.length > 1)
        return `${parts[0][0]}. ${parts[parts.length - 1]}`.toUpperCase();
    return name.slice(0, 12).toUpperCase();
});

const statLabels = {
    pace: "PAC",
    shooting: "SHO",
    passing: "PAS",
    dribbling: "DRI",
    defending: "DEF",
    physical: "PHY",
};

const displayStats = computed(() => {
    const s = props.card.stats;
    if (!s) return {};
    return {
        pace: s.pace,
        shooting: s.shooting,
        passing: s.passing,
        dribbling: s.dribbling,
        defending: s.defending,
        physical: s.physical,
    };
});

const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return url;
};

// URL przepuszczony przez backendowy proxy — eliminuje problem CORS na canvasie.
// Bez proxy: canvas.toDataURL() rzuca SecurityError bo obraz z zewnętrznej domeny
// jest "tainted". Backend pobiera obraz po stronie serwera i oddaje z nagłówkiem
// Access-Control-Allow-Origin: * — canvas widzi to jako same-origin.
const resolveImageUrlForCanvas = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) {
        return `/api/cards/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url; // lokalne /uploads/ — same-origin, proxy niepotrzebny
};

const onImageError = (e) => {
    e.target.style.display = "none";
};

// ── PDF — Canvas 2D API → jsPDF ───────────────────────────────────────────────
//
// WAŻNE — dlaczego czytamy dane z props.card.template, a NIE z
// window.getComputedStyle(el):
// Tło karty (kolor LUB obrazek) jest renderowane w UI przez pseudo-elementy
// ::before / ::after sterowane CSS custom properties (--card-bg, --card-image,
// --card-overlay) — patrz <style> niżej. getComputedStyle(el).backgroundImage
// odczytuje tło SAMEGO elementu .player-card, które jest puste/"none", bo
// faktyczne warstwy tła żyją na ::before/::after, niedostępnych przez
// standardowe API computed style elementu nadrzędnego. To sprawiało, że
// bgImageUrl zawsze wychodziło puste, a gradient nigdy się nie pojawiał ani
// obrazek nigdy nie był rysowany w PDF.
// Czytamy więc bezpośrednio z props.card.template — to jedyne miarodajne
// źródło prawdy o tym, czy szablon ma obrazek tła czy tylko kolor, i jest
// idealnie zgodne z tym, co naprawdę widać w UI (bo UI też z tego korzysta
// poprzez :class="{ 'has-image': card.template?.backgroundImageUrl }").
const downloadPdf = async () => {
    const { jsPDF } =
        await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm");

    const card = props.card;
    const t = card.template || {};
    const s = card.stats || {};

    const SCALE = 4,
        W = 180,
        H = 255;
    const CW = W * SCALE,
        CH = H * SCALE;
    const R = 8 * SCALE,
        PAD = 10 * SCALE,
        PTOP = 12 * SCALE;

    // ── Źródło prawdy: dane szablonu, nie getComputedStyle ────────────────────
    // has-image w UI === !!t.backgroundImageUrl (patrz :class w <template> i
    // .player-card.has-image::after / ::before w <style>). Lustrzane odbicie
    // tej samej reguły gwarantuje, że PDF wygląda identycznie jak karta na
    // ekranie: gradient TYLKO gdy jest obrazek, sam kolor gdy go nie ma.
    const hasBgImage = !!t.backgroundImageUrl;
    const bgImageUrl = t.backgroundImageUrl || null;
    const bgColor = t.bgColor || "#c8a84b";
    const accentColor = t.accentColor || "#8b6914";

    // Kolor obramowania i tekstu — te NIE zależą od tego czy jest obrazek,
    // więc bezpiecznie pobieramy je z computed style (style inline borderColor
    // / color, ustawiane bezpośrednio na elemencie, są tam zawsze dostępne) —
    // z fallbackiem na dane szablonu, gdyby element nie był jeszcze w DOM.
    const el = cardRef.value;
    let borderClr = t.borderColor || "#f0d060";
    let textClr = t.textColor || "#ffffff";
    if (el) {
        const cs = window.getComputedStyle(el);
        if (cs.borderTopColor) borderClr = cs.borderTopColor;
        if (cs.color) textClr = cs.color;
    }

    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d");

    // Clip do zaokrąglonego prostokąta
    roundRect(ctx, 0, 0, CW, CH, R);
    ctx.clip();

    // ── Tło karty ────────────────────────────────────────────────────────────
    let drewImage = false;

    if (hasBgImage) {
        // TŁO = OBRAZEK: rysujemy zdjęcie (cover, wycentrowane), bez żadnego
        // koloru pod spodem — identycznie jak .player-card.has-image::after
        // w CSS (background-image: var(--card-image); background-size: cover).
        try {
            const proxyUrl = bgImageUrl.startsWith("http")
                ? `/api/cards/image-proxy?url=${encodeURIComponent(bgImageUrl)}`
                : bgImageUrl;
            const bgImg = await loadImage(proxyUrl);

            const scale = Math.max(CW / bgImg.width, CH / bgImg.height);
            const dw = bgImg.width * scale;
            const dh = bgImg.height * scale;
            ctx.drawImage(bgImg, (CW - dw) / 2, (CH - dh) / 2, dw, dh);
            drewImage = true;
        } catch {
            // Obrazek nie załadował się (np. błąd sieci) — fallback na kolor,
            // żeby PDF nie wyszedł z pustym/czarnym tłem.
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, CW, CH);
        }
    } else {
        // TŁO = KOLOR: zwykłe jednolite wypełnienie, BEZ gradientu na wierzchu
        // — identycznie jak .player-card::before bez klasy has-image
        // (background: var(--card-bg), bez --card-overlay).
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, CW, CH);
    }

    // ── Gradient overlay — TYLKO gdy tłem jest obrazek ─────────────────────────
    // Lustrzane odbicie .player-card.has-image::before, które w CSS PODMIENIA
    // zwykłe tło kolorem na --card-overlay właśnie wtedy, gdy karta ma obrazek.
    // Gdy tła nie ma (sam kolor), ten blok się NIE wykonuje — czysty kolor bez
    // żadnego przyciemnienia, dokładnie jak w UI.
    if (drewImage) {
        const overlay = ctx.createLinearGradient(0, 0, CW, CH); // ~145deg
        overlay.addColorStop(0, hexToRgba(accentColor, 0.75));
        overlay.addColorStop(1, "rgba(0,0,0,0.65)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, CW, CH);
    }

    // ── Obramowanie ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = borderClr;
    ctx.lineWidth = 2 * SCALE;
    roundRect(
        ctx,
        ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        CW - ctx.lineWidth,
        CH - ctx.lineWidth,
        R - 1,
    );
    ctx.stroke();
    ctx.restore();

    // ── Overall ──────────────────────────────────────────────────────────────
    ctx.fillStyle = textClr;
    ctx.font = `700 ${28 * SCALE}px 'Rajdhani',Arial,sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(card.overall ?? ""), PAD, PTOP);

    // ── Pozycja ──────────────────────────────────────────────────────────────
    ctx.font = `600 ${11 * SCALE}px 'Rajdhani',Arial,sans-serif`;
    ctx.globalAlpha = 0.9;
    ctx.fillText(card.position ?? "", PAD, PTOP + 30 * SCALE);
    ctx.globalAlpha = 1;

    // ── Zdjęcie piłkarza (przez proxy) ───────────────────────────────────────
    const IMG_TOP = PTOP + 46 * SCALE;
    const IMG_W = CW - PAD * 2;
    const IMG_H = 100 * SCALE;

    if (card.imageUrl) {
        try {
            const proxyUrl = resolveImageUrlForCanvas(card.imageUrl);
            const imgEl = await loadImage(proxyUrl);
            const ratio = Math.min(IMG_W / imgEl.width, IMG_H / imgEl.height);
            const dw = imgEl.width * ratio,
                dh = imgEl.height * ratio;
            ctx.drawImage(
                imgEl,
                PAD + (IMG_W - dw) / 2,
                IMG_TOP + (IMG_H - dh) / 2,
                dw,
                dh,
            );
        } catch {
            drawInitial(
                ctx,
                card,
                textClr,
                PAD,
                IMG_TOP,
                IMG_W,
                IMG_H,
                SCALE,
                CW,
            );
        }
    } else {
        drawInitial(ctx, card, textClr, PAD, IMG_TOP, IMG_W, IMG_H, SCALE, CW);
    }

    // ── Imię ─────────────────────────────────────────────────────────────────
    const NAME_Y = IMG_TOP + IMG_H + 6 * SCALE;
    ctx.fillStyle = textClr;
    ctx.font = `700 ${13 * SCALE}px 'Rajdhani',Arial,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(shortName.value, CW / 2, NAME_Y, CW - PAD * 2);

    // ── Separator ─────────────────────────────────────────────────────────────
    const SEP_Y = NAME_Y + 16 * SCALE + 4 * SCALE;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1 * SCALE;
    ctx.beginPath();
    ctx.moveTo(PAD, SEP_Y);
    ctx.lineTo(CW - PAD, SEP_Y);
    ctx.stroke();

    // ── Statystyki ────────────────────────────────────────────────────────────
    const STATS = [
        ["PAC", s.pace],
        ["SHO", s.shooting],
        ["PAS", s.passing],
        ["DRI", s.dribbling],
        ["DEF", s.defending],
        ["PHY", s.physical],
    ];
    const STATS_TOP = SEP_Y + 5 * SCALE;
    const SLOT_W = (CW - PAD * 2) / 6;
    ctx.textBaseline = "top";

    STATS.forEach(([label, val], i) => {
        const cx = PAD + SLOT_W * i + SLOT_W / 2;
        ctx.fillStyle = textClr;
        ctx.globalAlpha = 1;
        ctx.font = `700 ${13 * SCALE}px 'Rajdhani',Arial,sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(val ?? "—"), cx, STATS_TOP);
        ctx.globalAlpha = 0.65;
        ctx.font = `400 ${8 * SCALE}px 'Rajdhani',Arial,sans-serif`;
        ctx.fillText(label, cx, STATS_TOP + 14 * SCALE);
        ctx.globalAlpha = 1;
    });

    // ── Drużyna ───────────────────────────────────────────────────────────────
    if (card.team) {
        ctx.fillStyle = textClr;
        ctx.globalAlpha = 0.55;
        ctx.font = `400 ${8 * SCALE}px 'Rajdhani',Arial,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(card.team, CW / 2, CH - 6 * SCALE, CW - PAD * 2);
        ctx.globalAlpha = 1;
    }

    // ── Canvas → PDF ──────────────────────────────────────────────────────────
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
        unit: "mm",
        format: [63, 88],
        orientation: "portrait",
    });
    pdf.addImage(imgData, "PNG", 0, 0, 63, 88);
    pdf.save(`${(card.playerName ?? "card").replace(/\s+/g, "-")}-card.pdf`);
};

// ── Helpery ───────────────────────────────────────────────────────────────────

function drawInitial(
    ctx,
    card,
    textClr,
    PAD,
    IMG_TOP,
    IMG_W,
    IMG_H,
    SCALE,
    CW,
) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(PAD, IMG_TOP, IMG_W, IMG_H);
    ctx.fillStyle = textClr;
    ctx.globalAlpha = 0.35;
    ctx.font = `700 ${52 * SCALE}px Arial,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        card.playerName?.charAt(0) ?? "?",
        CW / 2,
        IMG_TOP + IMG_H / 2,
    );
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
}

// Ładuje obraz przez crossOrigin — działa bo proxy zwraca CORS header
function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (!url) return reject(new Error("brak url"));
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Konwertuje hex (#rrggbb / #rgb) na rgba(r,g,b,a)
function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
    const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
    const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

defineExpose({ downloadPdf, cardRef });
</script>

<style scoped>
.player-card {
    position: relative;
    overflow: hidden;
}

/* ── Warstwa 0: kolor tła (zawsze rysowana) ─────────────────────────────── */
.player-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--card-bg);
    z-index: 0;
}

/* ── Warstwa 1: obrazek tła szablonu (gdy has-image) ────────────────────── */
.player-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--card-image, none);
    background-size: cover;
    background-position: center;
    opacity: 0;
    z-index: 1;
    transition: opacity 0.2s;
}
.player-card.has-image::after {
    opacity: 1;
}

/* ── Warstwa 2: gradient overlay na obrazku ──────────────────────────────── */
/* Nadpisuje ::before gdy jest obrazek — daje ciemnienie dla czytelności tekstu */
.player-card.has-image::before {
    background: var(--card-overlay);
    z-index: 2;
}

/* Wszystkie dzieci karty powyżej warstw pseudo ───────────────────────────── */
.card-top,
.card-image-wrapper,
.card-name,
.card-stats,
.card-footer,
.card-selected-overlay {
    position: relative;
    z-index: 3;
}

.card-top {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    line-height: 1;
}
.card-overall {
    font-size: 1.7em;
    font-weight: 700;
    line-height: 1;
}
.card-position {
    font-size: 0.7em;
    font-weight: 600;
    opacity: 0.9;
}
.size-sm .card-overall {
    font-size: 1.2em;
}
.size-lg .card-overall {
    font-size: 2.4em;
}

.card-image-wrapper {
    width: 80%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px 0;
    overflow: hidden;
}
.card-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.card-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    font-weight: 700;
    opacity: 0.4;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.card-name {
    font-size: 0.6em;
    font-weight: 700;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
    margin: 2px 0;
}
.size-lg .card-name {
    font-size: 0.75em;
}

.card-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    width: 100%;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 3px;
}
.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.5em;
    line-height: 1.1;
}
.stat-val {
    font-weight: 700;
    font-size: 1.2em;
}
.stat-key {
    opacity: 0.7;
    font-size: 0.85em;
}
.size-lg .stat-item {
    font-size: 0.65em;
}

.card-footer {
    font-size: 0.5em;
    opacity: 0.7;
    text-align: center;
    margin-top: 2px;
}

.card-selected-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 200, 83, 0.3);
    border: 3px solid #00c853;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    color: #00c853;
    font-weight: 900;
    z-index: 10;
}
</style>
