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
        "Cette extension affiche les métriques d'utilisation de Claude Code via l'API interne d'Anthropic. Vous devez avoir Claude Code installé sur votre machine pour que celà fonctionne.",
      ),
    });

    infoGroup.add(infoRow);

    window.add(page);
  }
}
