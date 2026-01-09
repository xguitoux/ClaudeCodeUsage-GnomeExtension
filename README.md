# Claude Code Usage - Extension GNOME Shell

Extension GNOME Shell qui affiche les métriques d'utilisation de Claude Code via l'API OAuth d'Anthropic.

## Fonctionnalités

- Affichage du taux d'utilisation sur 5 heures et 7 jours
- Suivi de l'utilisation extra (extra usage) avec limite mensuelle
- Rafraîchissement automatique toutes les 5 minutes
- Interface simple dans la barre de statut GNOME
- Compatible avec GNOME Shell 46 et 47

## Prérequis

- GNOME Shell 46 ou supérieur
- Claude Code installé et configuré avec OAuth
- Fichier de credentials OAuth disponible à `~/.claude/.credentials.json`

## Installation

### Méthode 1: Installation manuelle

1. Clonez ou téléchargez ce dépôt

2. Copiez le dossier dans le répertoire des extensions GNOME:
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/claudecode-usage@guitou.homedev
cp -r * ~/.local/share/gnome-shell/extensions/claudecode-usage@guitou.homedev/
```

3. Compilez le schéma GSettings:
```bash
cd ~/.local/share/gnome-shell/extensions/claudecode-usage@guitou.homedev
glib-compile-schemas schemas/
```

4. Redémarrez GNOME Shell:
   - Sur X11: `Alt+F2`, tapez `r`, puis `Entrée`
   - Sur Wayland: Déconnectez-vous et reconnectez-vous

5. Activez l'extension:
```bash
gnome-extensions enable claudecode-usage@guitou.homedev
```

### Méthode 2: Script d'installation

```bash
#!/bin/bash
EXTENSION_DIR=~/.local/share/gnome-shell/extensions/claudecode-usage@guitou.homedev
mkdir -p "$EXTENSION_DIR"
cp -r * "$EXTENSION_DIR/"
cd "$EXTENSION_DIR"
glib-compile-schemas schemas/
gnome-extensions enable claudecode-usage@guitou.homedev
echo "Extension installée. Redémarrez GNOME Shell."
```

## Configuration

L'extension utilise automatiquement les credentials OAuth de Claude Code. Assurez-vous que:
1. Claude Code est installé et connecté à votre compte Anthropic
2. Le fichier `~/.claude/.credentials.json` existe et contient un token OAuth valide

Aucune configuration supplémentaire n'est nécessaire. L'extension se rafraîchit automatiquement toutes les 5 minutes.

## Utilisation

Une fois installée, l'extension affiche dans la barre de statut:
- `Claude: XX%` - Taux d'utilisation sur la période de 5 heures

Cliquez sur l'indicateur pour voir les détails:
- **5h Usage**: Utilisation sur 5 heures avec date/heure de réinitialisation
- **7d Usage**: Utilisation sur 7 jours avec date/heure de réinitialisation
- **Extra Usage**: Utilisation supplémentaire avec limite mensuelle (si activé)

## Structure du projet

```
ClaudeCodeUsage-GnomeExtension/
├── metadata.json              # Métadonnées de l'extension
├── extension.js              # Code principal de l'extension
├── prefs.js                  # Interface de préférences
├── schemas/
│   └── org.gnome.shell.extensions.claudecode-usage.gschema.xml
└── README.md
```

## API utilisée

Cette extension utilise l'API OAuth d'Anthropic:

- **Endpoint**: `https://api.anthropic.com/api/oauth/usage`
- **Authentification**: Token OAuth récupéré depuis `~/.claude/.credentials.json`
- **Header requis**: `anthropic-beta: oauth-2025-04-20`

L'API retourne les métriques d'utilisation sur trois périodes:
- `five_hour`: Utilisation sur 5 heures glissantes
- `seven_day`: Utilisation sur 7 jours glissants
- `extra_usage`: Utilisation supplémentaire mensuelle (si activée)

## Dépannage

### L'extension n'apparaît pas
- Vérifiez que le schéma GSettings a été compilé
- Redémarrez GNOME Shell
- Vérifiez les logs: `journalctl -f -o cat /usr/bin/gnome-shell`

### "No Token" affiché
- Vérifiez que Claude Code est installé et connecté
- Assurez-vous que le fichier `~/.claude/.credentials.json` existe
- Vérifiez que le token OAuth est valide dans ce fichier

### "Error" affiché
- Vérifiez que votre token OAuth est valide
- Vérifiez votre connexion internet
- Consultez les logs: `journalctl -f -o cat /usr/bin/gnome-shell`

### Les données ne se rafraîchissent pas
- L'extension se rafraîchit automatiquement toutes les 5 minutes
- Vous pouvez forcer un rafraîchissement en cliquant sur "Refresh" dans le menu
- Les données peuvent prendre quelques minutes pour être mises à jour par l'API

## Limites

- Rafraîchissement automatique toutes les 5 minutes (configurable dans le code)
- Les données reflètent l'utilisation sur des périodes glissantes
- L'utilisation extra (extra usage) peut ne pas être activée sur tous les comptes

## Licence

MIT

## Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## Auteur

Créé pour afficher les métriques d'utilisation de Claude Code sur GNOME Shell.
