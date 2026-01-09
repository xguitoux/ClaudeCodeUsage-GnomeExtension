import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class ClaudeCodeUsagePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    // Page de configuration
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({
      title: _("Configuration"),
      description: _("Configurez votre extension Claude Code Usage"),
    });
    page.add(group);

    // // Champ pour la clé API
    // const apiKeyRow = new Adw.EntryRow({
    //     title: _('API Key'),
    //     text: settings.get_string('api-key'),
    //     show_apply_button: true,
    // });

    apiKeyRow.connect("apply", (widget) => {
      settings.set_string("api-key", widget.get_text());
    });

    group.add(apiKeyRow);

    // Intervalle de rafraîchissement
    const refreshRow = new Adw.SpinRow({
      title: _("Refresh Interval (seconds)"),
      subtitle: _("Intervalle de rafraîchissement des données"),
      adjustment: new Gtk.Adjustment({
        lower: 60,
        upper: 3600,
        step_increment: 60,
        value: settings.get_int("refresh-interval"),
      }),
    });

    refreshRow.connect("output", () => {
      const value = refreshRow.get_value();
      settings.set_int("refresh-interval", value);
      return true;
    });

    group.add(refreshRow);

    // Informations
    const infoGroup = new Adw.PreferencesGroup({
      title: _("Information"),
    });
    page.add(infoGroup);

    const infoRow = new Adw.ActionRow({
      title: _("À propos"),
      subtitle: _(
        "Cette extension affiche les métriques d'utilisation de Claude Code via l'API Usage Cost d'Anthropic. Vous devez avoir une clé API Admin pour utiliser cette extension.",
      ),
    });

    infoGroup.add(infoRow);

    const apiLinkRow = new Adw.ActionRow({
      title: _("Documentation API"),
      subtitle: _(
        "https://platform.claude.com/docs/fr/build-with-claude/usage-cost-api",
      ),
    });

    infoGroup.add(apiLinkRow);

    window.add(page);
  }
}
