# 🚀 Instructions de Déploiement Google Cloud

## ⚠️ IMPORTANT - Configuration Requise

L'erreur "400 - Bad Request" que vous rencontrez est due à une configuration manquante pour le cloud.
Suivez ces étapes pour corriger le problème :

## 📝 Étape 1 : Créer le fichier .env.prod

1. **Copiez le fichier d'exemple** :
   ```bash
   cp .env.prod.example .env.prod
   ```

2. **Éditez le fichier .env.prod** et remplacez les valeurs suivantes :

   ### 🌐 Configuration des Domaines
   
   **Trouvez votre IP Google Cloud** :
   - Allez dans Google Cloud Console
   - Compute Engine > VM Instances
   - Copiez l'adresse IP externe de votre instance
   
   **Modifiez ces lignes dans .env.prod** :
   ```bash
   # Remplacez XX.XX.XX.XX par votre vraie IP
   ALLOWED_HOSTS=VOTRE_IP_GCloud localhost 127.0.0.1
   
   # Utilisez http:// pour l'instant (ou https:// si vous avez un certificat SSL)
   CSRF_TRUSTED_ORIGINS=http://VOTRE_IP_GCloud http://localhost
   ```

   ### 🔐 Configuration de Sécurité
   
   **Générez une nouvelle SECRET_KEY** :
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```
   
   Copiez le résultat dans .env.prod :
   ```bash
   SECRET_KEY=la-clé-générée-ici
   ```

   ### 🗄️ Configuration Base de Données
   
   **Choisissez un mot de passe fort** et remplacez dans .env.prod :
   ```bash
   POSTGRES_PASSWORD=VotreMotDePasseFort123!
   DATABASE_URL=postgresql://multisarl_user:VotreMotDePasseFort123!@db:5432/multisarl_db
   ```

## 🔄 Étape 2 : Uploader le fichier sur Google Cloud

**Uploadez le fichier .env.prod sur votre serveur** :
```bash
# Depuis votre machine locale
scp .env.prod USERNAME@VOTRE_IP_GCloud:/path/to/SystemMULTISARL/
```

Ou utilisez la console Google Cloud pour uploader le fichier.

## 🐳 Étape 3 : Redémarrer les conteneurs

**Connectez-vous à votre instance Google Cloud** et exécutez :

```bash
# Arrêtez les conteneurs actuels
docker-compose -f docker-compose.prod.yml down

# Supprimez les conteneurs et volumes (optionnel, uniquement si problème)
docker-compose -f docker-compose.prod.yml down -v

# Reconstruire les images avec les nouvelles configurations
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## ✅ Étape 4 : Vérifier le Déploiement

1. **Attendez environ 30 secondes** pour que tous les services démarrent

2. **Testez l'application** :
   - Ouvrez votre navigateur : `http://VOTRE_IP_GCloud`
   - Vous devriez voir la page de connexion sans erreur 400

3. **Vérifier les logs** si problème :
   ```bash
   # Logs du backend
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Logs de nginx
   docker-compose -f docker-compose.prod.yml logs nginx
   
   # Logs de la base de données
   docker-compose -f docker-compose.prod.yml logs db
   ```

## 🔍 Dépannage

### ❌ Erreur 400 persiste ?

1. **Vérifier que .env.prod est bien chargé** :
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend env | grep ALLOWED_HOSTS
   docker-compose -f docker-compose.prod.yml exec backend env | grep CSRF_TRUSTED_ORIGINS
   ```
   
   Vous devriez voir votre IP Google Cloud dans ces variables.

2. **Vérifier les migrations** :
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py showmigrations
   ```

3. **Recréer un super utilisateur** si nécessaire :
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

### ❌ Erreur 500 ?

Consultez les logs détaillés du backend :
```bash
docker-compose -f docker-compose.prod.yml logs backend --tail=100
```

### ❌ Page ne charge pas ?

1. Vérifiez que nginx fonctionne :
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. Vérifiez les règles de pare-feu Google Cloud :
   - Port 80 doit être ouvert
   - Compute Engine > VM instances > votre instance > Détails
   - Section "Firewall" : "Allow HTTP traffic" doit être coché

## 🔒 Passage en HTTPS (Recommandé pour Production)

Pour activer HTTPS avec Let's Encrypt :

1. **Obtenir un nom de domaine** (ex: example.com)

2. **Installer Certbot** dans docker-compose.prod.yml

3. **Modifier .env.prod** :
   ```bash
   CSRF_TRUSTED_ORIGINS=https://votre-domaine.com https://www.votre-domaine.com
   ```

4. **Mettre à jour nginx.prod.conf** pour écouter sur le port 443 avec SSL

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :
1. Vérifiez les logs complets
2. Assurez-vous que .env.prod contient votre vraie IP
3. Vérifiez que le fichier .env.prod est dans le même dossier que docker-compose.prod.yml
