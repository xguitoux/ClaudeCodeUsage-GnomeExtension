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

    // Option d'affichage du logo
    const logoRow = new Adw.SwitchRow({
      title: _("Afficher le logo Claude"),
      subtitle: _("Afficher l'icône Claude au lieu du texte 'Claude:'"),
    });

    logoRow.set_active(settings.get_boolean("show-logo"));
    logoRow.connect("notify::active", (widget) => {
      settings.set_boolean("show-logo", widget.get_active());
    });

    group.add(logoRow);

    // Position dans le panneau
    const positionRow = new Adw.ComboRow({
      title: _("Position dans le panneau"),
      subtitle: _("Choisissez où afficher l'extension"),
      model: new Gtk.StringList({
        strings: [_("Gauche"), _("Centre"), _("Droite")],
      }),
    });

    positionRow.set_selected(settings.get_int("panel-position"));
    positionRow.connect("notify::selected", (widget) => {
      settings.set_int("panel-position", widget.get_selected());
    });

    group.add(positionRow);

    // Index dans la zone
    const indexRow = new Adw.SpinRow({
      title: _("Position dans la zone"),
      subtitle: _("Position relative dans la zone (-1 pour la fin)"),
      adjustment: new Gtk.Adjustment({
        lower: -1,
        upper: 20,
        step_increment: 1,
        value: settings.get_int("panel-box-index"),
      }),
    });

    indexRow.connect("output", () => {
      const value = indexRow.get_value();
      settings.set_int("panel-box-index", value);
      return true;
    });

    group.add(indexRow);

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
