import { DropCapSettings, LINE_SPAN_SIZES } from './settings';

const DROP_CAP_CLASS = 'drop-cap-letter';

// Matches {X} at the very start of a paragraph's text content
const SYNTAX_RE = /^\{(.)\}/;

/**
 * Finds the first <p> in `container`, extracts its first grapheme cluster,
 * wraps it in a styled span, and re-inserts it as the paragraph's first child.
 * Safe to call repeatedly — exits early if a drop cap already exists.
 */
export function applyDropCap(container: HTMLElement, settings: DropCapSettings): void {
	const p = container.querySelector('p');
	if (!p || p.querySelector(`.${DROP_CAP_CLASS}`)) return;

	const firstNode = p.firstChild;
	if (!firstNode || firstNode.nodeType !== Node.TEXT_NODE) return;

	const text = firstNode.textContent ?? '';
	const trimmed = text.trimStart();

	// Require at least two printable characters so single-char paragraphs are skipped
	if (trimmed.length < 2) return;

	// Only apply when the paragraph starts with a Unicode letter
	const firstChar = getFirstGrapheme(trimmed);
	if (!firstChar || !/^\p{L}/u.test(firstChar)) return;

	// Preserve any leading whitespace before the letter
	const leadingWS = text.slice(0, text.length - trimmed.length);
	const rest = leadingWS + trimmed.slice(firstChar.length);

	const span = buildSpan(firstChar, settings);

	firstNode.textContent = rest;
	p.insertBefore(span, firstNode);
}

/**
 * Scans every <p> in `container` for the {X} syntax at the start of its text,
 * strips the markers, and wraps the character in a drop cap span.
 * Used for explicit manual placement anywhere in a note.
 */
export function applyDropCapFromSyntax(container: HTMLElement, settings: DropCapSettings): void {
	for (const p of Array.from(container.querySelectorAll('p'))) {
		if (p.querySelector(`.${DROP_CAP_CLASS}`)) continue;

		const firstNode = p.firstChild;
		if (!firstNode || firstNode.nodeType !== Node.TEXT_NODE) continue;

		const text = firstNode.textContent ?? '';
		const match = SYNTAX_RE.exec(text);
		if (!match || !match[1]) continue;

		const char = match[1];
		if (!/^\p{L}/u.test(char)) continue;

		firstNode.textContent = text.slice(match[0].length);
		p.insertBefore(buildSpan(char, settings), firstNode);
	}
}

/**
 * Removes any existing drop cap span inside `container`, restoring the
 * original text node so re-renders are idempotent.
 */
export function removeDropCap(container: HTMLElement): void {
	const span = container.querySelector<HTMLElement>(`.${DROP_CAP_CLASS}`);
	if (!span || !span.parentElement) return;

	const letter = span.textContent ?? '';
	const p = span.parentElement;
	const nextText = span.nextSibling;

	if (nextText && nextText.nodeType === Node.TEXT_NODE) {
		nextText.textContent = letter + (nextText.textContent ?? '');
	} else {
		p.insertBefore(document.createTextNode(letter), span.nextSibling);
	}

	span.remove();
}

function buildSpan(char: string, settings: DropCapSettings): HTMLSpanElement {
	const span = document.createElement('span');
	span.className = DROP_CAP_CLASS;
	span.textContent = char;

	span.style.fontSize = LINE_SPAN_SIZES[settings.lineSpan];

	if (settings.fontFamily.trim()) {
		span.style.fontFamily = settings.fontFamily;
	}

	span.style.fontWeight = String(settings.fontWeight);

	if (settings.colorMode === 'accent') {
		span.style.color = 'var(--interactive-accent)';
	} else if (settings.colorMode === 'custom' && settings.customColor) {
		span.style.color = settings.customColor;
	}
	// colorMode === 'inherit' → no inline color, CSS cascade handles it

	return span;
}

/**
 * Returns the first grapheme cluster of `text`.
 * Uses Intl.Segmenter when available (handles emoji, combining chars, etc.).
 */
function getFirstGrapheme(text: string): string {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const segmenter = new (Intl as any).Segmenter();
		const iter: Iterator<{ segment: string }> = segmenter.segment(text)[Symbol.iterator]();
		return iter.next().value?.segment ?? text[0] ?? '';
	}
	return text[0] ?? '';
}
