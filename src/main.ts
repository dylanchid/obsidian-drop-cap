import { Editor, MarkdownPostProcessorContext, MarkdownView, Menu, Plugin } from 'obsidian';
import { applyDropCap, applyDropCapFromSyntax } from './dropcap';
import { createDropCapExtension } from './extension';
import { DEFAULT_SETTINGS, DropCapSettings } from './settings';
import { DropCapSettingTab } from './settingsTab';

export default class DropCapPlugin extends Plugin {
	settings: DropCapSettings;

	// Shared reference read by the CM6 extension on every update cycle.
	// Mutating .current is enough — no need to re-register the extension.
	private settingsRef!: { current: DropCapSettings };

	async onload() {
		await this.loadSettings();
		this.settingsRef = { current: this.settings };

		this.addSettingTab(new DropCapSettingTab(this.app, this));
		this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
		this.registerEditorExtension(createDropCapExtension(this.settingsRef));

		// ── Commands ──────────────────────────────────────────────────────────

		// Slash-command / command palette: wrap the character at the cursor with {}
		this.addCommand({
			id: 'wrap-character',
			name: 'Wrap character as drop cap',
			editorCallback: (editor: Editor) => {
				const cursor = editor.getCursor();
				const line = editor.getLine(cursor.line);
				const char = line[cursor.ch];
				if (!char || char.trim() === '') return;
				editor.replaceRange(
					`{${char}}`,
					{ line: cursor.line, ch: cursor.ch },
					{ line: cursor.line, ch: cursor.ch + 1 },
				);
			},
		});

		// Toggle drop_cap: false in the current note's frontmatter
		this.addCommand({
			id: 'toggle-note-drop-cap',
			name: 'Toggle drop cap for this note',
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return;
				this.app.fileManager.processFrontMatter(file, (fm) => {
					if (fm['drop_cap'] === false) {
						delete fm['drop_cap'];
					} else {
						fm['drop_cap'] = false;
					}
				});
			},
		});

		// ── Context menu ──────────────────────────────────────────────────────
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
				if (!this.settings.enabled) return;

				menu.addSeparator();

				// "Make drop cap" — wraps the character at the cursor with {}
				menu.addItem((item) => {
					item
						.setTitle('Make drop cap')
						.setIcon('type')
						.onClick(() => {
							const cursor = editor.getCursor();
							const line = editor.getLine(cursor.line);
							const char = line[cursor.ch];
							if (!char || char.trim() === '') return;
							editor.replaceRange(
								`{${char}}`,
								{ line: cursor.line, ch: cursor.ch },
								{ line: cursor.line, ch: cursor.ch + 1 },
							);
						});
				});

				// "Enable / Disable drop cap for note" — toggled label based on frontmatter state
				const file = view.file;
				if (file) {
					const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
					const isDisabled = fm?.['drop_cap'] === false;
					menu.addItem((item) => {
						item
							.setTitle(isDisabled ? 'Enable drop cap for note' : 'Disable drop cap for note')
							.setIcon(isDisabled ? 'eye' : 'eye-off')
							.onClick(() => {
								this.app.fileManager.processFrontMatter(file, (fm) => {
									if (fm['drop_cap'] === false) {
										delete fm['drop_cap'];
									} else {
										fm['drop_cap'] = false;
									}
								});
							});
					});
				}
			}),
		);
	}

	postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
		if (!this.settings.enabled) return;

		if (this.settings.frontmatterControl) {
			const cache = this.app.metadataCache.getCache(ctx.sourcePath);
			const fm = (ctx.frontmatter ?? cache?.frontmatter) as Record<string, unknown> | undefined;
			if (fm?.['drop_cap'] === false) return;
		}

		// {A} syntax always works regardless of triggerMode
		applyDropCapFromSyntax(el, this.settings);

		// Auto mode: also apply to the first paragraph of the note
		// (skipped if {A} syntax already placed a drop cap anywhere in the view)
		if (this.settings.triggerMode === 'auto') {
			const previewRoot = el.closest<HTMLElement>(
				'.markdown-preview-view, .markdown-embed, .markdown-rendered',
			);
			if (previewRoot?.querySelector('.drop-cap-letter')) return;
			applyDropCap(el, this.settings);
		}
	}

	refreshAllViews(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				(leaf.view as MarkdownView & { previewMode?: { rerender(force: boolean): void } })
					.previewMode?.rerender(true);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.settingsRef.current = this.settings;
	}
}
