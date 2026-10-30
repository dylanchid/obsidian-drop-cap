export type ColorMode = 'inherit' | 'accent' | 'custom';

/** auto = first paragraph of every note; manual = only explicit {A} syntax */
export type TriggerMode = 'auto' | 'manual';

export interface DropCapSettings {
	enabled: boolean;
	triggerMode: TriggerMode;
	fontFamily: string;
	lineSpan: 2 | 3 | 4;
	fontWeight: number;
	colorMode: ColorMode;
	customColor: string;
	frontmatterControl: boolean;
}

export const DEFAULT_SETTINGS: DropCapSettings = {
	enabled: true,
	triggerMode: 'auto',
	fontFamily: 'Georgia, serif',
	lineSpan: 3,
	fontWeight: 700,
	colorMode: 'inherit',
	customColor: '#000000',
	frontmatterControl: true,
};

// Maps lineSpan to a computed font-size (em) tuned for Obsidian's default 1.5 line-height
export const LINE_SPAN_SIZES: Record<2 | 3 | 4, string> = {
	2: '2.8em',
	3: '4em',
	4: '5.5em',
};
