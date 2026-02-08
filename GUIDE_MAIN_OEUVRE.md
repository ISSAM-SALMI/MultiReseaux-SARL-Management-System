# Guide : Gestion des Coûts de Main-d'œuvre Mensuels

## Vue d'ensemble

Cette fonctionnalité permet de saisir manuellement les coûts de main-d'œuvre pour chaque mois, avec un suivi indépendant des autres catégories de dépenses. **Le calcul est totalement manuel et indépendant des projets.**

## Fonctionnalités

### 1. Saisie Manuelle des Coûts

- **Accès** : Page "Gestion des Dépenses" → Carte "Main d'oeuvre" → Bouton d'édition (icône crayon)
- **Saisie** : Montant total et note descriptive optionnelle
- **Période** : Un coût par mois (année/mois)
- **Contrainte** : Une seule entrée par mois (unique)

### 2. Consultation et Modification

- **Visualisation** : Le montant s'affiche dans la carte "Main d'oeuvre"
- **Indicateur** : Badge vert "✓ Saisi manuellement" ou jaune "Non défini"
- **Modification** : Cliquer sur l'icône d'édition pour modifier le montant ou la note
- **Suppression** : Bouton de suppression dans le modal → montant remis à zéro

### 3. Fonctionnement Manuel

#### Coût Défini
- Le montant saisi est affiché dans le dashboard
- Badge "✓ Saisi manuellement" en vert
- Pris en compte dans le total général

#### Aucun Coût Défini
- Le montant est à 0 MAD
- Badge "Non défini" en jaune
- Total général calculé sans main-d'œuvre

## Séparation des Dépenses

Les coûts de main-d'œuvre sont **totalement séparés** des autres catégories :

- ❌ **Non inclus dans** : Achats fournisseurs, Dépenses générales (transport, carburant, etc.)
- ✅ **Calcul indépendant** : Ligne distincte dans le dashboard
- ✅ **Total général** : `Fournisseurs + Main-d'œuvre + Autres Dépenses`

## Structure Technique

### Backend

#### Modèle : `MonthlyLabourCost`
```python
- id_labour (AutoField) : Identifiant unique
- year (IntegerField) : Année
- month (IntegerField) : Mois (1-12)
- amount (DecimalField) : Montant en MAD
- description (TextField) : Note optionnelle
- created_at (DateTimeField) : Date de création
- updated_at (DateTimeField) : Date de modification
```

**Contrainte** : `unique_together = [['year', 'month']]`

#### API Endpoints

- `GET /budget/labour-costs/` : Liste des coûts
  - Filtres : `?year=2026&month=2`
- `POST /budget/labour-costs/` : Créer un coût
- `PUT /budget/labour-costs/{id}/` : Modifier un coût
- `DELETE /budget/labour-costs/{id}/` : Supprimer un coût

#### Dashboard API

- `GET /budget/general-expenses/monthly-dashboard/?year=2026&month=2`
  - Retourne :
    ```json
    {
      "summary": {
        "labor_total": 50000,
        "labor_source": "manual",  // ou "calculated"
        "labor_description": "Ajustement pour congés"
      }
    }
    ```

### Frontend

- **Page** : `Expenses.tsx`
- **Composants ajoutés** :
  - Bouton d'édition dans la carte Main-d'œuvre
  - Modal de saisie avec montant et description
  - Badge indicateur source (manuel/calculé)
  - Bouton de suppression

## Utilisation

### Scénario 1 : Saisir un coût manuel

1. Accéder à "Gestion des Dépenses"
2. Sélectionner le mois et l'année
3. Cliquer sur l'icône d'édition dans la carte "Main d'oeuvre"
4. Saisir le montant total (ex: 50000 MAD)
5. Ajouter une note optionnelle (ex: "Ajustement pour formation")
6. Cliquer sur "Enregistrer"

### Scénario 2 : Modifier un coût existant

1. Cliquer sur l'icône d'édition
2. Modifier le montant ou la description
3. Cliquer sur "Mettre à jour"

### Scénario 3 : Supprimer un coût manuel

1. Cliquer sur l'icône d'édition
2. Cliquer sur l'icône de suppression (poubelle)
3. Confirmer la suppression
4. Le montant de main-d'œuvre est remis à 0 MAD

## Historisation

- **Création** : `created_at` enregistre la date de création
- **Modification** : `updated_at` enregistre la dernière modification
- **Traçabilité** : Chaque modification met à jour le timestamp
- **Consultation** : Possibilité de consulter l'historique via l'API

## Rapports et Exports

### Dashboard Mensuel
- Affiche le coût de main-d'œuvre saisi manuellement
- Indique si un coût est défini ou non
- Inclut dans le total général

### Futurs Exports (à implémenter)
- Rapport PDF mensuel avec détail main-d'œuvre
- Export Excel des coûts annuels
- Graphiques d'évolution mensuelle

## Base de données

### Table : `MONTHLY_LABOUR_COSTS`

| Colonne | Type | Description |
|---------|------|-------------|
| id_labour | INT (PK) | Identifiant unique |
| year | INT | Année (ex: 2026) |
| month | INT | Mois (1-12) |
| amount | DECIMAL(12,2) | Montant en MAD |
| description | TEXT | Note optionnelle |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Dernière modification |

**Index** : Unique sur (year, month)

## Migration

Fichier : `backend/budget/migrations/0006_monthlylabourcost.py`

### Appliquer la migration
```bash
docker-compose exec backend python manage.py migrate budget
```

### Vérifier la migration
```bash
docker-compose exec backend python manage.py showmigrations budget
```

## Bonnes Pratiques

1. **Cohérence** : Saisir les coûts de tous les mois pour une meilleure comparaison
2. **Documentation** : Toujours ajouter une note explicative pour justifier le montant
3. **Validation** : Vérifier que le montant saisi correspond aux justificatifs réels
4. **Historique** : Conserver les notes pour la traçabilité comptable
5. **Révision** : Réviser régulièrement les montants saisis

## Dépannage

### Le montant ne s'affiche pas
- Vérifier que le mois et l'année sont correctement sélectionnés
- Actualiser la page (F5)
- Vérifier que la migration a été appliquée

### Erreur "Unique constraint violation"
- Un coût existe déjà pour ce mois
- Utiliser le bouton de modification au lieu de créer un nouveau coût

### Le badge affiche "Non défini" au lieu de "Saisi manuellement"
- Vérifier que le coût a bien été enregistré
- Actualiser le dashboard
- Vérifier la réponse API dans la console du navigateur (F12)

## Support

Pour toute question ou problème, contacter l'équipe de développement.
