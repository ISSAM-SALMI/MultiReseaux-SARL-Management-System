### 🚀 COMMANDES DE DÉPLOIEMENT - IP: 35.239.254.10

## 📤 ÉTAPE 1: Uploader .env.prod sur Google Cloud

### Option A: Depuis Windows PowerShell (sur votre PC local)

```powershell
# Naviguez vers le dossier du projet (si pas déjà dedans)
cd C:\Users\abdel\OneDrive\Bureau\SystemMULTISARL

# Uploadez le fichier .env.prod (remplacez USERNAME par votre nom d'utilisateur SSH Google Cloud)
scp .env.prod USERNAME@35.239.254.10:/home/USERNAME/SystemMULTISARL/
```

**Note:** Si vous ne connaissez pas votre USERNAME, c'est généralement celui que vous utilisez pour vous connecter à Google Cloud via SSH.

### Option B: Via Google Cloud Console

1. Ouvrez Google Cloud Console
2. Allez dans Compute Engine > VM Instances
3. Cliquez sur "SSH" à côté de votre instance
4. Dans le terminal qui s'ouvre, créez le fichier:
   ```bash
   cd ~/SystemMULTISARL
   nano .env.prod
   ```
5. Copiez-collez le contenu de votre fichier .env.prod local
6. Appuyez sur Ctrl+X, puis Y, puis Entrée pour sauvegarder

---

## 🐳 ÉTAPE 2: Déployer l'application sur Google Cloud

### Connectez-vous à votre instance Google Cloud:

```bash
# Via SSH depuis PowerShell
ssh USERNAME@35.239.254.10

# OU utilisez le bouton SSH dans Google Cloud Console
```

### Une fois connecté sur le serveur, exécutez:

```bash
# 1. Naviguez vers le dossier du projet
cd ~/SystemMULTISARL

# 2. Récupérez les dernières modifications depuis Git
git pull origin main

# 3. Vérifiez que .env.prod existe
ls -la .env.prod

# 4. Arrêtez les conteneurs actuels
sudo docker-compose -f docker-compose.prod.yml down

# 5. Supprimez les anciennes images (optionnel mais recommandé)
sudo docker-compose -f docker-compose.prod.yml down -v

# 6. Reconstruisez les images avec les nouvelles configurations
sudo docker-compose -f docker-compose.prod.yml build --no-cache

# 7. Démarrez tous les services
sudo docker-compose -f docker-compose.prod.yml up -d

# 8. Vérifiez que tout fonctionne
sudo docker-compose -f docker-compose.prod.yml ps

# 9. Attendez 30 secondes puis vérifiez les logs
sleep 30
sudo docker-compose -f docker-compose.prod.yml logs backend --tail=50
```

---

## ✅ ÉTAPE 3: Tester l'application

Ouvrez votre navigateur et allez sur:
```
http://35.239.254.10
```

Vous devriez voir la page de connexion **SANS l'erreur 400** !

---

## 🔍 Dépannage rapide

### Si vous voyez encore une erreur:

```bash
# Vérifiez les logs du backend
sudo docker-compose -f docker-compose.prod.yml logs backend

# Vérifiez les logs de nginx
sudo docker-compose -f docker-compose.prod.yml logs nginx

# Vérifiez que .env.prod est bien chargé
sudo docker-compose -f docker-compose.prod.yml exec backend env | grep ALLOWED_HOSTS
```

### Créer un super utilisateur (si nécessaire):

```bash
sudo docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## 🔥 Commandes utiles

```bash
# Voir tous les conteneurs
sudo docker-compose -f docker-compose.prod.yml ps

# Redémarrer un service spécifique
sudo docker-compose -f docker-compose.prod.yml restart backend

# Voir les logs en temps réel
sudo docker-compose -f docker-compose.prod.yml logs -f

# Arrêter tout
sudo docker-compose -f docker-compose.prod.yml down

# Nettoyer complètement (ATTENTION: supprime les données)
sudo docker-compose -f docker-compose.prod.yml down -v
sudo docker system prune -a
```
