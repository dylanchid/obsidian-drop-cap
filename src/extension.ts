import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { DropCapSettings, LINE_SPAN_SIZES } from './settings';

// Must use /g so exec() advances lastIndex on each call
const SYNTAX_PATTERN = /\{(.)\}/g;

class DropCapWidget extends WidgetType {
	constructor(
		private readonly char: string,
		private readonly settings: DropCapSettings,
	) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement('span');
		span.className = 'drop-cap-letter';
		span.textContent = this.char;
		span.style.fontSize = LINE_SPAN_SIZES[this.settings.lineSpan];
		if (this.settings.fontFamily.trim()) {
			span.style.fontFamily = this.settings.fontFamily;
		}
		span.style.fontWeight = String(this.settings.fontWeight);
		if (this.settings.colorMode === 'accent') {
			span.style.color = 'var(--interactive-accent)';
		} else if (this.settings.colorMode === 'custom' && this.settings.customColor) {
			span.style.color = this.settings.customColor;
		}
		return span;
	}

	eq(other: DropCapWidget): boolean {
		return (
			other.char === this.char &&
			other.settings.lineSpan === this.settings.lineSpan &&
			other.settings.fontFamily === this.settings.fontFamily &&
			other.settings.fontWeight === this.settings.fontWeight &&
			other.settings.colorMode === this.settings.colorMode &&
			other.settings.customColor === this.settings.customColor
		);
	}

	// Let click events fall through so the cursor lands inside the token
	ignoreEvent(): boolean {
		return false;
	}
}

function buildDecorations(view: EditorView, settings: DropCapSettings): DecorationSet {
	if (!settings.enabled) return Decoration.none;

	const builder = new RangeSetBuilder<Decoration>();
	const selection = view.state.selection;

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		SYNTAX_PATTERN.lastIndex = 0;

		let match: RegExpExecArray | null;
		while ((match = SYNTAX_PATTERN.exec(text)) !== null) {
			const char = match[1];
			if (!char) continue;

			const matchFrom = from + match.index;
			const matchTo = matchFrom + match[0].length;

			// Reveal raw {X} when the cursor is inside so the user can edit/delete it
			const cursorInside = selection.ranges.some(
				(r) => r.from <= matchTo && r.to >= matchFrom,
			);
			if (cursorInside) continue;

			builder.add(
				matchFrom,
				matchTo,
				Decoration.replace({ widget: new DropCapWidget(char, settings) }),
			);
		}
	}

	return builder.finish();
}

/**
 * CM6 ViewPlugin that renders {X} tokens as drop cap widgets in Live Preview.
 * Reads settings from a shared ref so it stays up-to-date without re-registration.
 */
export function createDropCapExtension(settingsRef: { current: DropCapSettings }) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, settingsRef.current);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.decorations = buildDecorations(update.view, settingsRef.current);
				}
			}
		},
		{ decorations: (v) => v.decorations },
	);
}
