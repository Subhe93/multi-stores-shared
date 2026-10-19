export declare const RENDERER_VERSION = "1.1.0";
/** Locale map, e.g. { sv: 'Namn', en: 'Name' }. */
export type I18n = Record<string, string>;
/** Reference to a stored asset; width/height are pixels of the ORIGINAL file. */
export interface AssetRef {
    asset_id: string;
    width: number;
    height: number;
}
export type FontStyle = 'normal' | 'italic';
export interface FontRef {
    family: string;
    weight: number;
    style: FontStyle;
    asset_id: string;
}
export interface Background {
    color: string;
    web?: AssetRef;
    print?: AssetRef;
    fit: 'stretch' | 'cover';
}
export interface ElementBase {
    /** ^[a-z0-9_-]{1,32}$ */
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Degrees, clockwise, around the box centre. */
    rot: number;
    z: number;
    locked: boolean;
}
export interface TextFit {
    mode: 'shrink';
    /** NPP: 0.5 */
    step: number;
    /** NPP: 6 */
    min: number;
    /** NPP: 8 px, NOT scaled (evaluated at fit_ref_px_per_mm). */
    pad_ref_px: number;
}
export interface TextElement extends ElementBase {
    type: 'text';
    label: I18n;
    placeholder: I18n;
    default_text: string;
    font: {
        family: string;
        weight: number;
        style: FontStyle;
    };
    /** NPP fontSize, in px at 1 px/mm (= mm units). */
    size: number;
    color: string;
    align: 'left' | 'center' | 'right';
    transform: 'none' | 'uppercase';
    fit: TextFit;
    /** Horizontal inset for left/right alignment, mm (NPP: 4). */
    inset: number;
    editable: boolean;
    required: boolean;
    /** Code points (NFC, U+FE0E/U+FE0F not counted). */
    max_length: number;
    /** Character-class body parsed as data by compileDesignAllowedChars (`^[…]*$`, `u` flag). */
    allowed_chars?: string;
    direction: 'auto' | 'ltr' | 'rtl';
    source_label?: string;
}
export interface PhotoAdj {
    zoom: number;
    rot: number;
    panX: number;
    panY: number;
}
export interface ImageSlotElement extends ElementBase {
    type: 'image_slot';
    label: I18n;
    placeholder: I18n;
    shape: 'rect' | 'ellipse';
    /** Corner radius in mm (rect only). */
    radius: number;
    /** Edit mode only. */
    border_color: string;
    required: boolean;
    adj_limits: {
        zoom: [number, number];
        rot: [number, number];
    };
    default_adj: PhotoAdj;
}
/** Decoration / overlay image (NPP deco-image, overlay), drawn stretched. */
export interface ImageElement extends ElementBase {
    type: 'image';
    asset: AssetRef;
}
export type DesignElement = TextElement | ImageSlotElement | ImageElement;
export interface Surface {
    key: 'front';
    background: Background;
    elements: DesignElement[];
}
export interface TemplateSpecV1 {
    schema: 'designer.template/1';
    unit: 'mm';
    /** Trim size in mm. */
    width: number;
    height: number;
    bleed_mm: number;
    render: {
        preview_px_per_mm: number;
        print_px_per_mm: number;
        fit_ref_px_per_mm: number;
    };
    fonts: FontRef[];
    surfaces: Surface[];
    flags?: Record<string, boolean>;
}
export interface DesignPhoto {
    asset_id: string;
    /** Pixels of the ORIGINAL (EXIF-oriented) file — geometry never uses the decoded preview size. */
    width: number;
    height: number;
    adj: PhotoAdj;
}
export interface DesignStateV1 {
    v: 1;
    texts: Record<string, string>;
    photos: Record<string, DesignPhoto>;
    /** Reserved (choice_image). */
    choices?: Record<string, string>;
}
/**
 * Structural subset of CanvasRenderingContext2D / OffscreenCanvasRenderingContext2D.
 * Kept free of DOM types so the file compiles without lib.dom.
 */
export interface Ctx2D {
    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    beginPath(): void;
    rect(x: number, y: number, w: number, h: number): void;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    closePath(): void;
    clip(): void;
    fill(): void;
    stroke(): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    setLineDash(segments: number[]): void;
    drawImage(image: unknown, dx: number, dy: number, dw: number, dh: number): void;
    fillText(text: string, x: number, y: number): void;
    measureText(text: string): {
        width: number;
    };
    font: string;
    fillStyle: unknown;
    strokeStyle: unknown;
    lineWidth: number;
    textAlign: string;
    textBaseline: string;
    direction: string;
}
export type Mode = 'edit' | 'proof' | 'print';
/** Image lookup keyed by asset_id. Values are whatever the host's drawImage accepts. */
export interface ImageLookup {
    get(assetId: string): unknown;
}
/** Optional font availability check (host knows which FontFaces loaded). */
export interface FontLookup {
    has(family: string, weight: number, style: FontStyle): boolean;
}
export interface RenderInput {
    spec: TemplateSpecV1;
    surface?: 'front';
    state: DesignStateV1;
    mode: Mode;
    /** Output px per mm (2 = preview/proof, 6 = print). */
    scale: number;
    images: ImageLookup;
    fonts?: FontLookup;
    /** Locale used for placeholders (falls back to the first available value). */
    locale?: string;
    ui?: {
        activeSlotId?: string;
        emptySlotText?: (el: ImageSlotElement) => string;
        /** Family for the empty-slot placeholder text (NPP: Montserrat). */
        uiFontFamily?: string;
        accentColor?: string;
    };
}
export interface RenderReport {
    /** Chosen font size (mm units) per text element id. */
    fitted: Record<string, number>;
    /** Element ids (or 'background') whose image/font was unavailable; such elements are skipped. */
    missing: string[];
    /** Number of elements actually drawn (background excluded). */
    elements: number;
}
export interface CoverLayout {
    /** Destination rect of the image, px, before the photo rotation. */
    dx: number;
    dy: number;
    dw: number;
    dh: number;
    /** Photo rotation in degrees (around cx, cy). */
    rot: number;
    /** Image centre, px. */
    cx: number;
    cy: number;
}
export declare const DEFAULT_ADJ: PhotoAdj;
/** Picks a locale value; falls back to the first non-empty value. */
export declare function pickI18n(map: I18n | undefined, locale?: string): string;
/** CSS font shorthand, NPP format: `600 438px "Montserrat"` (italic prefixed when needed). */
export declare function fontString(font: {
    family: string;
    weight: number;
    style: FontStyle;
}, sizeMm: number, scale: number): string;
/** Canvas pixel size for a scale. */
export declare function canvasSize(spec: TemplateSpecV1, scale: number, withBleed?: boolean): {
    width: number;
    height: number;
};
/** Stable sort by (z, original index). Ties keep array order (V8 stable sort in NPP). */
export declare function sortElements<T extends {
    z: number;
}>(els: T[]): T[];
/**
 * Text to draw (NPP product.js:149-150):
 *   text0 = customer value unless empty, else default text;
 *   uppercase ? text0.toUpperCase() : (text0 || placeholder).
 * Non-editable elements ignore the state.
 */
export declare function resolveText(el: TextElement, state: DesignStateV1 | undefined, locale?: string): string;
/**
 * NPP fitTextSize: from `size` down to `fit.min` in `fit.step` decrements, the first
 * size whose width fits `el.w * refScale - fit.pad_ref_px`; `fit.min` otherwise.
 * Always called with refScale = spec.render.fit_ref_px_per_mm (D5) so every output
 * scale picks the same size. Sizes are computed as size - i*step (no float drift).
 */
export declare function fitTextSize(ctx: Pick<Ctx2D, 'font' | 'measureText'>, text: string, el: TextElement, fontStr: (sizeMm: number, scale: number) => string, refScale: number): number;
/**
 * NPP cover math (product.js:168-175) in px for `scale`, using the ORIGINAL image
 * dimensions (D6). Pan 0..1 moves across the overflow; rotation is around the image centre.
 */
export declare function coverLayout(slot: Pick<ElementBase, 'x' | 'y' | 'w' | 'h'>, imgW: number, imgH: number, adj: PhotoAdj, scale: number): CoverLayout;
/** Effective print resolution of a photo in a slot (original pixels per inch). */
export declare function effectiveDpi(slot: Pick<ElementBase, 'x' | 'y' | 'w' | 'h'>, imgW: number, imgH: number, adj: PhotoAdj): number;
/** Renders one surface. The caller sizes the canvas with canvasSize(spec, scale). */
export declare function renderDesign(ctx: Ctx2D, input: RenderInput): RenderReport;
export type StateRule = 'required' | 'max_length' | 'chars' | 'photo_required' | 'adj_range' | 'asset';
export interface StateValidation {
    ok: boolean;
    errors: {
        element_id: string;
        rule: StateRule;
    }[];
    normalized: DesignStateV1;
}
/** NFC + control/bidi-override removal (the stored form of customer text). */
export declare function normalizeText(v: string): string;
/**
 * Code points after NFC and removal of U+FE0E/U+FE0F. Same semantics as `charCount`
 * in @multi-stores/core/personalization/rules (M4-INTEGRATION C14); duplicated
 * under a renderer-specific name because this file must stay import-free (the api
 * serves its compiled form as a classic script to the render page).
 */
export declare function designTextLength(v: string): number;
/** Longest accepted `allowed_chars` body (same cap as PERSONALIZATION_LIMITS.maxAllowedCharsLength). */
export declare const ALLOWED_CHARS_MAX_LENGTH = 200;
/**
 * Raw UTF-16 cap on a customer text before any normalization or regex. Texts are
 * at most 1000 code points (validateSpec), so anything this long already fails
 * max_length; refusing it early bounds the work done per request.
 */
export declare const DESIGN_TEXT_RAW_MAX = 8000;
/**
 * Compiles an `allowed_chars` body as data, never as regex source: the body is
 * parsed into literal code points, `a-z` ranges and allowlisted escapes
 * (`\d \w \s`, `\p{…}`, `\uXXXX`, `\u{…}`, `\xHH`, escaped syntax characters),
 * and the class is rebuilt from those tokens with every literal written as
 * `\u{…}`. Bare `[ ] | ( ) * + ? { }`, backreferences and unknown escapes are
 * refused, so a body can never leave the class (e.g. `b]|^(a+)+$|[b`).
 * A leading bare `^` keeps its negation meaning. Accepted bodies match the
 * M4.0 `compileAllowedChars` (rules.ts) semantics: `^[<body>]*$` with `u`.
 * Returns null when the body is refused. Duplicated (not imported) because this
 * file must stay import-free (see designTextLength).
 */
export declare function compileDesignAllowedChars(body: string): RegExp | null;
/**
 * Validates and normalizes a design state against a template.
 * Unknown ids and non-string texts are dropped; empty texts are dropped (the default applies).
 * requireComplete adds the `required` / `photo_required` rules (cart/order time).
 */
export declare function validateState(spec: TemplateSpecV1, state: unknown, opts?: {
    requireComplete?: boolean;
}): StateValidation;
export interface SpecIssue {
    path: string;
    rule: string;
}
/**
 * Structural validation of a template spec (pure part of the server's validateSpec;
 * asset ownership is checked by the server).
 */
export declare function validateSpec(spec: unknown): {
    ok: boolean;
    errors: SpecIssue[];
};
