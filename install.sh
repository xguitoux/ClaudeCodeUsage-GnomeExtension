#!/bin/bash

# Script d'installation pour l'extension Claude Code Usage

EXTENSION_UUID="claudecode-usage@guitou.homedev"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installation de l'extension Claude Code Usage..."

# Créer le répertoire de l'extension
mkdir -p "$EXTENSION_DIR"

# Copier les fichiers
echo "Copie des fichiers..."
cp metadata.json "$EXTENSION_DIR/"
cp extension.js "$EXTENSION_DIR/"
cp prefs.js "$EXTENSION_DIR/"
cp -r schemas "$EXTENSION_DIR/"

# Compiler le schéma GSettings
echo "Compilation du schéma GSettings..."
glib-compile-schemas "$EXTENSION_DIR/schemas/"

# Désactiver l'extension si elle est déjà active
echo "Redémarrage de l'extension..."
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true

# Activer l'extension
gnome-extensions enable "$EXTENSION_UUID"

echo ""
echo "Installation terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Assurez-vous d'être connecté à Claude Code avec votre compte Anthropic"
echo "   L'extension lit automatiquement le token OAuth depuis ~/.claude/.credentials.json"
echo ""
echo "2. Redémarrez l'extension:"
echo "   gnome-extensions disable $EXTENSION_UUID && gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "3. Si l'extension est marquée comme incompatible, désactivez la validation de version:"
echo "   gsettings set org.gnome.shell disable-extension-version-validation true"
echo ""
echo "L'extension affichera vos métriques d'utilisation dans la barre de statut GNOME."
