# Instructions pour appliquer la mise à jour du module Suivi des Devis

## 📋 Résumé des modifications

Les modifications suivantes ont été apportées pour rendre le module **Suivi des Lignes de Devis** compatible avec le système de **devis groupés** :

### Backend (Django)

1. **Nouveau modèle** : `QuoteTrackingGroup`
   - Permet d'organiser les lignes de suivi en groupes
   - Table: `QUOTE_TRACKING_GROUPS`

2. **Modèle mis à jour** : `QuoteTrackingLine`
   - Ajout du champ `group` (ForeignKey optionnelle vers `QuoteTrackingGroup`)
   - Permet d'associer une ligne à un groupe

3. **Serializers mis à jour** :
   - `QuoteTrackingGroupSerializer` : Nouveau serializer pour les groupes
   - `QuoteTrackingSerializer` : Inclut maintenant les groupes et lignes non groupées
   - Logique de création mise à jour pour copier les groupes du devis source

4. **Nouvelles vues** :
   - `QuoteTrackingGroupViewSet` : CRUD pour les groupes de suivi
   - Endpoint : `/api/quotes/tracking-groups/`

5. **URLs mises à jour** :
   - Route ajoutée : `tracking-groups/`

### Frontend (React/TypeScript)

1. **TrackingLinesModal.tsx** : Complètement restructuré
   - Affichage hiérarchique (groupes → lignes)
   - Gestion CRUD des groupes
   - Gestion CRUD des lignes avec association aux groupes
   - Interface utilisateur cohérente avec le module Devis

## 🚀 Étapes d'installation

### 1. Créer et appliquer les migrations

Si vous utilisez Docker (recommandé) :

```bash
# Créer les migrations
docker-compose exec backend python manage.py makemigrations quotes

# Appliquer les migrations
docker-compose exec backend python manage.py migrate
```

Si vous utilisez un environnement virtuel local :

```bash
# Activer l'environnement virtuel
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate   # Windows

# Se placer dans le dossier backend
cd backend

# Créer les migrations
python manage.py makemigrations quotes

# Appliquer les migrations
python manage.py migrate
```

### 2. Redémarrer les services

Si vous utilisez Docker :

```bash
docker-compose restart backend
```

Si vous utilisez un serveur local :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis le relancer
python manage.py runserver
```

### 3. Vérifier l'installation

1. Accédez à l'interface d'administration Django : `http://localhost:8000/admin`
2. Vérifiez que les nouveaux modèles apparaissent :
   - Quote Tracking Groups
   - Quote Tracking Lines (avec le champ group)

3. Testez l'API :
   ```bash
   # Lister les groupes de tracking
   curl http://localhost:8000/api/quotes/tracking-groups/
   ```

### 4. Tester l'interface utilisateur

1. Connectez-vous à l'application frontend
2. Accédez à **Suivi des Lignes de Devis**
3. Créez un nouveau suivi à partir d'un devis existant
4. Vérifiez que :
   - Les groupes du devis sont copiés
   - Les lignes sont correctement associées à leurs groupes
   - Vous pouvez créer/modifier/supprimer des groupes
   - Vous pouvez créer/modifier/supprimer des lignes
   - L'affichage est cohérent avec le module Devis

## 🔍 Compatibilité

### Devis existants

✅ **Aucune régression** : Les devis existants sans groupes continuent de fonctionner normalement

✅ **Migration transparente** : Les suivis existants restent fonctionnels

### Nouvelles fonctionnalités

✅ **Organisées par groupes** : Affichage hiérarchique (groupes → lignes)

✅ **Lignes sans groupe** : Gérées séparément dans une section dédiée

✅ **CRUD complet** :
- Créer/modifier/supprimer un groupe
- Créer/modifier/supprimer une ligne
- Associer une ligne à un groupe
- Calculer les sous-totaux par groupe

## 📊 Structure de données

### QuoteTrackingGroup
```python
{
  "id": 1,
  "tracking": 5,
  "name": "Informatique",
  "order": 0
}
```

### QuoteTrackingLine
```python
{
  "id": 10,
  "tracking": 5,
  "group": 1,  # null si pas de groupe
  "designation": "Câble réseau",
  "quantite": 10,
  "prix_unitaire": 25.00,
  "montant_ht": 250.00
}
```

## ⚠️ Points d'attention

1. **Migrations** : Assurez-vous que les migrations sont appliquées avant de démarrer l'application

2. **Cache** : Si vous rencontrez des problèmes, videz le cache du navigateur

3. **API** : Vérifiez que tous les endpoints sont accessibles :
   - `/api/quotes/tracking-groups/`
   - `/api/quotes/tracking-lines/`

4. **Permissions** : Assurez-vous que les permissions sont correctement configurées pour les nouveaux endpoints

## 🐛 Dépannage

### Erreur de migration

```bash
# Réinitialiser les migrations (ATTENTION: perte de données)
docker-compose exec backend python manage.py migrate quotes zero
docker-compose exec backend python manage.py migrate quotes
```

### Erreur 404 sur les endpoints

- Vérifiez que `urls.py` est correct
- Redémarrez le serveur backend
- Vérifiez les logs : `docker-compose logs backend`

### Interface ne se met pas à jour

- Videz le cache du navigateur
- Rechargez l'application frontend
- Vérifiez la console du navigateur pour les erreurs

## 📞 Support

En cas de problème, vérifiez :

1. Les logs backend : `docker-compose logs backend`
2. La console frontend (F12 dans le navigateur)
3. L'état de la base de données : `docker-compose exec db psql -U multisarl -d multisarl`

---

✅ **Implémentation terminée et prête à l'emploi !**
