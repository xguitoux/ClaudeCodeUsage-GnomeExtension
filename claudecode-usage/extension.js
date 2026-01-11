import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Soup from "gi://Soup";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

const ClaudeCodeUsageIndicator = GObject.registerClass(
  class ClaudeCodeUsageIndicator extends PanelMenu.Button {
    _init(settings, extensionPath) {
      super._init(0.0, _("Claude Code Usage"));

      this._settings = settings;
      this._extensionPath = extensionPath;
      this._httpSession = new Soup.Session();

      // Créer un conteneur pour l'icône et/ou le label
      this._box = new St.BoxLayout({
        style_class: "panel-status-menu-box",
      });
      this.add_child(this._box);

      // Créer l'icône
      this._icon = new St.Icon({
        style_class: "system-status-icon",
        y_align: Clutter.ActorAlign.CENTER,
      });

      // Créer le label "Claude:" (en blanc)
      this._claudeLabel = new St.Label({
        text: "Claude: ",
        y_align: Clutter.ActorAlign.CENTER,
        style: "color: #FFFFFF;",
      });

      // Créer le label pour le pourcentage (avec couleur variable)
      this._percentLabel = new St.Label({
        text: "--",
        y_align: Clutter.ActorAlign.CENTER,
      });

      // Mettre à jour l'affichage selon les paramètres
      this._updateDisplay();

      // Écouter les changements de paramètres
      this._settingsChangedId = this._settings.connect("changed", () => {
        this._updateDisplay();
      });

      // Créer le menu déroulant
      this._createMenu();

      // Charger l'icône depuis le fichier
      this._loadIcon();

      // Charger les données initiales
      this._updateUsage();

      // Rafraîchir toutes les 5 minutes
      this._timeoutId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        300,
        () => {
          this._updateUsage();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    _loadIcon() {
      try {
        const iconPath = GLib.build_filenamev([
          this._extensionPath,
          "icons",
          "claude-logo.svg",
        ]);

        const file = Gio.File.new_for_path(iconPath);
        const icon = new Gio.FileIcon({ file: file });
        this._icon.set_gicon(icon);
      } catch (e) {
        console.error("Error loading icon: " + e);
        // Utiliser une icône de fallback
        this._icon.set_icon_name("claude-logo");
      }
    }

    _updateDisplay() {
      const showLogo = this._settings.get_boolean("show-logo");

      // Retirer tous les enfants
      this._box.remove_all_children();

      // Ajouter l'icône + pourcentage ou "Claude:" + pourcentage selon les paramètres
      if (showLogo) {
        this._box.add_child(this._icon);
        this._box.add_child(this._percentLabel);
      } else {
        this._box.add_child(this._claudeLabel);
        this._box.add_child(this._percentLabel);
      }

      // Stocker l'état pour les mises à jour futures
      this._showLogo = showLogo;
    }

    _createMenu() {
      // Section d'utilisation des tokens
      this._inputTokensItem = new PopupMenu.PopupMenuItem(
        _("Input Tokens: --"),
        {
          reactive: false,
        },
      );
      this.menu.addMenuItem(this._inputTokensItem);

      this._cachedTokensItem = new PopupMenu.PopupMenuItem(
        _("Cached Tokens: --"),
        {
          reactive: false,
        },
      );
      this.menu.addMenuItem(this._cachedTokensItem);

      this._outputTokensItem = new PopupMenu.PopupMenuItem(
        _("Output Tokens: --"),
        {
          reactive: false,
        },
      );
      this.menu.addMenuItem(this._outputTokensItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Bouton de rafraîchissement
      const refreshItem = new PopupMenu.PopupMenuItem(_("Refresh"));
      refreshItem.connect("activate", () => this._updateUsage());
      this.menu.addMenuItem(refreshItem);

      // Bouton de configuration
      const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
      settingsItem.connect("activate", () => this._openSettings());
      this.menu.addMenuItem(settingsItem);
    }

    _updateUsage() {
      // Lire le token OAuth depuis le fichier credentials
      const homeDir = GLib.get_home_dir();
      const credentialsPath = GLib.build_filenamev([
        homeDir,
        ".claude",
        ".credentials.json",
      ]);

      let token = null;
      try {
        const file = Gio.File.new_for_path(credentialsPath);
        const [success, contents] = file.load_contents(null);

        if (success) {
          const decoder = new TextDecoder("utf-8");
          const credentialsData = JSON.parse(decoder.decode(contents));
          if (credentialsData && credentialsData.claudeAiOauth) {
            token = credentialsData.claudeAiOauth.accessToken;
          }
        }
      } catch (e) {
        console.error("Error reading credentials: " + e);
        this._percentLabel.set_text("No Token");
        return;
      }

      if (!token) {
        this._percentLabel.set_text("No Token");
        return;
      }

      // Appel à l'API OAuth d'utilisation
      const usageUrl = "https://api.anthropic.com/api/oauth/usage";

      this._makeOAuthApiCall(usageUrl, token, (data) => {
        this._processOAuthUsageData(data);
      });
    }

    _makeOAuthApiCall(url, token, callback) {
      const message = Soup.Message.new("GET", url);
      message.request_headers.append("Accept", "application/json");
      message.request_headers.append("Authorization", "Bearer " + token);
      message.request_headers.append("anthropic-beta", "oauth-2025-04-20");

      this._httpSession.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (session, result) => {
          try {
            const bytes = session.send_and_read_finish(result);
            const decoder = new TextDecoder("utf-8");
            const response = decoder.decode(bytes.get_data());

            if (message.status_code === 200) {
              const data = JSON.parse(response);
              callback(data);
            } else {
              console.error(
                "API Error: " + message.status_code + " - " + response,
              );
              this._percentLabel.set_text("Error");
            }
          } catch (e) {
            console.error("Error processing API response: " + e);
            this._percentLabel.set_text("Error");
          }
        },
      );
    }

    _processOAuthUsageData(data) {
      if (!data) {
        this._percentLabel.set_text("No Data");
        return;
      }

      // Extraire les données des périodes five_hour et seven_day
      const fiveHour = data.five_hour || {};
      const sevenDay = data.seven_day || {};

      const fiveHourUtil = fiveHour.utilization || 0;
      const sevenDayUtil = sevenDay.utilization || 0;

      // Formater les dates de réinitialisation
      const formatResetTime = (isoString) => {
        if (!isoString) return "N/A";
        const date = new Date(isoString);
        return date.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const fiveHourReset = formatResetTime(fiveHour.resets_at);
      const sevenDayReset = formatResetTime(sevenDay.resets_at);

      // Si l'usage est à 100%, afficher un compte à rebours
      if (fiveHourUtil >= 100 && fiveHour.resets_at) {
        const resetDate = new Date(fiveHour.resets_at);
        this._startCountdown(resetDate);
      } else {
        // Arrêter le compte à rebours s'il était actif
        this._stopCountdown();

        // Mettre à jour l'affichage principal avec l'utilisation sur 5 heures
        this._percentLabel.set_text(fiveHourUtil.toFixed(0) + "%");
      }

      // Appliquer une coloration selon le niveau d'utilisation
      // Blanc (< 25%), Vert (25-50%), Orange (50-75%), Rouge (>= 75%)
      let color = "#FFFFFF"; // Blanc par défaut
      if (fiveHourUtil >= 100) {
        color = "#FF0000"; // Rouge vif pour 100%
      } else if (fiveHourUtil >= 75) {
        color = "#FF4444"; // Rouge
      } else if (fiveHourUtil >= 50) {
        color = "#FF9933"; // Orange
      } else if (fiveHourUtil >= 25) {
        color = "#44FF44"; // Vert
      }

      // Appliquer la couleur uniquement au pourcentage
      this._percentLabel.set_style("color: " + color + ";");

      // Mettre à jour les éléments du menu
      this._inputTokensItem.label.set_text(
        "5h Usage: " +
          fiveHourUtil.toFixed(1) +
          "% (reset: " +
          fiveHourReset +
          ")",
      );
      this._cachedTokensItem.label.set_text(
        "7d Usage: " +
          sevenDayUtil.toFixed(1) +
          "% (reset: " +
          sevenDayReset +
          ")",
      );

      // Afficher l'état de l'usage supplémentaire
      const extraUsage = data.extra_usage || {};
      if (extraUsage.is_enabled) {
        const extraUtil = extraUsage.utilization || 0;
        const monthlyLimit = extraUsage.monthly_limit || 0;
        this._outputTokensItem.label.set_text(
          "Extra Usage: " + extraUtil.toFixed(1) + "% of $" + monthlyLimit,
        );
      } else {
        this._outputTokensItem.label.set_text("Extra Usage: Disabled");
      }
    }

    _startCountdown(resetDate) {
      // Arrêter le compte à rebours existant s'il y en a un
      this._stopCountdown();

      // Stocker la date de reset
      this._resetDate = resetDate;

      // Mettre à jour immédiatement
      this._updateCountdown();

      // Mettre à jour toutes les secondes
      this._countdownTimeoutId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        1,
        () => {
          this._updateCountdown();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    _stopCountdown() {
      if (this._countdownTimeoutId) {
        GLib.source_remove(this._countdownTimeoutId);
        this._countdownTimeoutId = null;
      }
      this._resetDate = null;
    }

    _updateCountdown() {
      if (!this._resetDate) {
        return;
      }

      const now = new Date();
      const diff = this._resetDate - now;

      if (diff <= 0) {
        this._percentLabel.set_text("Resetting...");
        this._stopCountdown();
        // Re-vérifier l'usage après le reset
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
          this._updateUsage();
          return GLib.SOURCE_REMOVE;
        });
        return;
      }

      // Calculer les heures, minutes et secondes restantes
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Formater l'affichage
      const timeStr = `${hours}h ${minutes}m ${seconds}s`;
      this._percentLabel.set_text(timeStr);
    }

    _openSettings() {
      try {
        Gio.Subprocess.new(
          ["gnome-extensions", "prefs", "claudecode-usage@guitou.homedev"],
          Gio.SubprocessFlags.NONE,
        );
      } catch (e) {
        console.error("Error opening settings: " + e);
      }
    }

    destroy() {
      if (this._timeoutId) {
        GLib.source_remove(this._timeoutId);
        this._timeoutId = null;
      }

      this._stopCountdown();

      if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
      }

      super.destroy();
    }
  },
);

export default class ClaudeCodeUsageExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._indicator = new ClaudeCodeUsageIndicator(this._settings, this.path);

    // Obtenir la position depuis les paramètres
    const position = this._settings.get_int("panel-position");
    const boxIndex = this._settings.get_int("panel-box-index");

    // Déterminer dans quelle boîte ajouter l'indicateur
    let box;
    switch (position) {
      case 0: // Gauche
        box = Main.panel._leftBox;
        break;
      case 1: // Centre
        box = Main.panel._centerBox;
        break;
      case 2: // Droite
        box = Main.panel._rightBox;
        break;
      default:
        box = Main.panel._rightBox;
    }

    // Ajouter l'indicateur
    Main.panel.addToStatusArea(this.uuid, this._indicator, boxIndex, box);

    // Écouter les changements de position
    this._positionChangedId = this._settings.connect(
      "changed::panel-position",
      () => this._repositionIndicator(),
    );
    this._indexChangedId = this._settings.connect(
      "changed::panel-box-index",
      () => this._repositionIndicator(),
    );
  }

  _repositionIndicator() {
    // Retirer l'indicateur actuel
    if (this._indicator) {
      this._indicator.destroy();
    }

    // Recréer l'indicateur à la nouvelle position
    this._indicator = new ClaudeCodeUsageIndicator(this._settings, this.path);

    const position = this._settings.get_int("panel-position");
    const boxIndex = this._settings.get_int("panel-box-index");

    let box;
    switch (position) {
      case 0:
        box = Main.panel._leftBox;
        break;
      case 1:
        box = Main.panel._centerBox;
        break;
      case 2:
        box = Main.panel._rightBox;
        break;
      default:
        box = Main.panel._rightBox;
    }

    Main.panel.addToStatusArea(this.uuid, this._indicator, boxIndex, box);
  }

  disable() {
    if (this._positionChangedId) {
      this._settings.disconnect(this._positionChangedId);
      this._positionChangedId = null;
    }

    if (this._indexChangedId) {
      this._settings.disconnect(this._indexChangedId);
      this._indexChangedId = null;
    }

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    this._settings = null;
  }
}
