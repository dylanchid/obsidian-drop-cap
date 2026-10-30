import { App, PluginSettingTab, Setting } from 'obsidian';
import DropCapPlugin from './main';
import { ColorMode, TriggerMode } from './settings';

const FONT_WEIGHTS: Record<number, string> = {
	400: 'Regular',
	500: 'Medium',
	600: 'Semibold',
	700: 'Bold',
	800: 'Extrabold',
	900: 'Black',
};

export class DropCapSettingTab extends PluginSettingTab {
	plugin: DropCapPlugin;

	constructor(app: App, plugin: DropCapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.buildGeneralSection(containerEl);
		this.buildAppearanceSection(containerEl);
		this.buildBehaviorSection(containerEl);
		this.buildActionsSection(containerEl);
	}

	private buildGeneralSection(el: HTMLElement): void {
		new Setting(el)
			.setName('Enable drop caps')
			.setDesc('Apply a stylized first letter to the opening paragraph of each note.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
						this.plugin.refreshAllViews();
					})
			);

		new Setting(el)
			.setName('Trigger mode')
			.setDesc(
				'Auto: first paragraph of every note gets a drop cap automatically. ' +
				'Manual: only paragraphs you explicitly mark with {A} syntax get one.'
			)
			.addDropdown(drop => {
				drop.addOption('auto', 'Auto (first paragraph)');
				drop.addOption('manual', 'Manual ({A} syntax only)');
				drop.setValue(this.plugin.settings.triggerMode);
				drop.onChange(async (value) => {
					this.plugin.settings.triggerMode = value as TriggerMode;
					await this.plugin.saveSettings();
					this.plugin.refreshAllViews();
				});
			});
	}

	private buildAppearanceSection(el: HTMLElement): void {
		new Setting(el).setName('Appearance').setHeading();

		new Setting(el)
			.setName('Font family')
			.setDesc('Font used for the drop cap letter. Leave blank to inherit the body font.')
			.addText(text =>
				text
					.setPlaceholder('Georgia, serif')
					.setValue(this.plugin.settings.fontFamily)
					.onChange(async (value) => {
						this.plugin.settings.fontFamily = value;
						await this.plugin.saveSettings();
						this.plugin.refreshAllViews();
					})
			);

		new Setting(el)
			.setName('Line span')
			.setDesc('How many lines of body text the drop cap should span.')
			.addDropdown(drop => {
				drop.addOption('2', '2 lines');
				drop.addOption('3', '3 lines');
				drop.addOption('4', '4 lines');
				drop.setValue(String(this.plugin.settings.lineSpan));
				drop.onChange(async (value) => {
					this.plugin.settings.lineSpan = parseInt(value) as 2 | 3 | 4;
					await this.plugin.saveSettings();
					this.plugin.refreshAllViews();
				});
			});

		new Setting(el)
			.setName('Font weight')
			.addDropdown(drop => {
				for (const [weight, label] of Object.entries(FONT_WEIGHTS)) {
					drop.addOption(weight, label);
				}
				drop.setValue(String(this.plugin.settings.fontWeight));
				drop.onChange(async (value) => {
					this.plugin.settings.fontWeight = parseInt(value);
					await this.plugin.saveSettings();
					this.plugin.refreshAllViews();
				});
			});

		// Color mode selector
		let colorPickerSetting: Setting | null = null;

		const colorModeSetting = new Setting(el)
			.setName('Letter color')
			.setDesc('Choose how the drop cap letter is colored.')
			.addDropdown(drop => {
				drop.addOption('inherit', 'Inherit (match body text)');
				drop.addOption('accent', 'Accent color');
				drop.addOption('custom', 'Custom color');
				drop.setValue(this.plugin.settings.colorMode);
				drop.onChange(async (value) => {
					this.plugin.settings.colorMode = value as ColorMode;
					await this.plugin.saveSettings();
					this.plugin.refreshAllViews();
					// Show/hide the custom color picker
					colorPickerSetting?.settingEl.toggle(value === 'custom');
				});
			});
		colorModeSetting; // suppress unused warning

		colorPickerSetting = new Setting(el)
			.setName('Custom color')
			.addColorPicker(picker =>
				picker
					.setValue(this.plugin.settings.customColor)
					.onChange(async (value) => {
						this.plugin.settings.customColor = value;
						await this.plugin.saveSettings();
						this.plugin.refreshAllViews();
					})
			);

		// Only show the color picker when colorMode is 'custom'
		colorPickerSetting.settingEl.toggle(this.plugin.settings.colorMode === 'custom');
	}

	private buildBehaviorSection(el: HTMLElement): void {
		new Setting(el).setName('Behavior').setHeading();

		new Setting(el)
			.setName('Respect frontmatter')
			.setDesc('When enabled, add `drop_cap: false` to a note\'s frontmatter to suppress the drop cap for that note.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.frontmatterControl)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterControl = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private buildActionsSection(el: HTMLElement): void {
		new Setting(el).setName('Actions').setHeading();

		new Setting(el)
			.setName('Refresh open notes')
			.setDesc('Re-apply drop caps after changing settings if they did not update automatically.')
			.addButton(btn =>
				btn
					.setButtonText('Refresh')
					.setCta()
					.onClick(() => {
						this.plugin.refreshAllViews();
					})
			);
	}
}
