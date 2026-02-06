# Guide : Fonctionnalité de Groupement des Lignes de Devis

## ✅ Fonctionnalité Implémentée

La fonctionnalité de regroupement des lignes de devis a été **entièrement implémentée** avec succès.

## 📋 Modifications Apportées

### Backend (Django)

#### 1. Modèles (`backend/quotes/models.py`)
- ✅ **Nouveau modèle `QuoteGroup`** créé avec les champs :
  - `quote` : Référence au devis parent
  - `name` : Nom du groupe (ex: "Informatique", "Électrique")
  - `order` : Ordre d'affichage des groupes
  - Méthode `get_total()` pour calculer le total HT du groupe

- ✅ **Modèle `QuoteLine` modifié** :
  - Champ `group` ajouté (ForeignKey vers QuoteGroup, nullable)
  - Les lignes peuvent être attachées à un groupe ou rester sans groupe

#### 2. Serializers (`backend/quotes/serializers.py`)
- ✅ **`QuoteGroupSerializer`** créé avec :
  - Lignes imbriquées (nested)
  - Calcul automatique du total HT du groupe
  
- ✅ **`QuoteSerializer`** enrichi avec :
  - Liste des groupes (`groups`)
  - Liste des lignes sans groupe (`ungrouped_lines`)

#### 3. Views et API (`backend/quotes/views.py`)
- ✅ **`QuoteGroupViewSet`** : Endpoint CRUD complet pour les groupes
  - Route : `/api/quotes/groups/`
  - Filtrage par devis : `/api/quotes/groups/?quote=<id>`

- ✅ **Export PDF adapté** :
  - Affichage des groupes avec en-têtes
  - Sous-totaux par groupe
  - Compatible avec les devis sans groupe (rétrocompatibilité)

#### 4. Migrations
- ✅ Migration `0011_quotegroup_quoteline_group.py` : Création de la table et ajout du champ
- ✅ Migration `0012_alter_quotegroup_options_quotegroup_order_and_more.py` : Ajout du champ order

### Frontend (React + TypeScript)

#### Composant `QuoteLinesModal.tsx`
- ✅ **Interface complète de gestion** :
  - Formulaire d'ajout de ligne avec sélection du groupe (optionnel)
  - Bouton "Créer un groupe" pour ajouter des sections
  - Affichage organisé par sections avec sous-totaux
  - Édition et suppression des lignes
  - Suppression des groupes (les lignes deviennent sans groupe)

- ✅ **Organisation visuelle** :
  - Section "Lignes sans groupe" affichée en premier
  - Chaque groupe affiché avec :
    - Nom du groupe
    - Nombre de lignes
    - Sous-total HT
    - Bouton de suppression
  - Design moderne avec Tailwind CSS

## 🎯 Fonctionnalités Disponibles

### Pour l'Utilisateur

1. **Créer un devis classique (sans groupe)**
   - Ajouter des lignes normalement
   - Laisser le champ "Groupe" vide
   - Comportement identique à l'ancien système

2. **Créer un devis avec groupes**
   - Cliquer sur "Créer un groupe"
   - Nommer le groupe (ex: "Informatique", "Électrique")
   - Ajouter des lignes en sélectionnant le groupe dans le formulaire
   - Les lignes sont automatiquement organisées par groupe

3. **Déplacer une ligne vers un groupe**
   - Éditer la ligne
   - Modifier le champ groupe dans le formulaire d'édition

4. **Supprimer un groupe**
   - Cliquer sur l'icône de suppression à côté du nom du groupe
   - Les lignes du groupe deviennent des "lignes sans groupe"
   - Aucune perte de données

### Calculs Automatiques

- **Total par groupe** : Calculé et affiché automatiquement
- **Total HT du devis** : Somme de tous les groupes + lignes sans groupe
- **TVA et Total TTC** : Calculés sur le total HT global

## 📊 Structure de Données

```
Quote (Devis)
├── QuoteGroup (Groupe 1) - "Informatique"
│   ├── QuoteLine 1 - "Câble réseau"
│   ├── QuoteLine 2 - "PC"
│   └── Sous-total : 22.00 DH
│
├── QuoteGroup (Groupe 2) - "Électrique"
│   ├── QuoteLine 3 - "Circuit M40"
│   ├── QuoteLine 4 - "Adaptateur"
│   └── Sous-total : 22.00 DH
│
└── Lignes sans groupe
    ├── QuoteLine 5 - "Frais de déplacement"
    └── Sous-total : 50.00 DH

Total HT : 94.00 DH
TVA 20% : 18.80 DH
Total TTC : 112.80 DH
```

## 🔄 Rétrocompatibilité

✅ **Les anciens devis continuent de fonctionner** :
- Les lignes existantes ont `group = NULL`
- Elles s'affichent dans la section "Lignes sans groupe"
- Le calcul des totaux reste identique
- L'export PDF fonctionne normalement

## 📝 Exemple d'Utilisation

### Scénario : Devis d'installation électrique et informatique

1. **Créer le devis** (Nouveau devis)
2. **Ouvrir "Gérer les lignes du devis"**
3. **Créer un groupe "Électricité"**
4. **Ajouter des lignes** :
   - Sélectionner "Électricité" dans le champ Groupe
   - Ajouter : Circuit M40, Interrupteurs, etc.
5. **Créer un groupe "Informatique"**
6. **Ajouter des lignes** :
   - Sélectionner "Informatique"
   - Ajouter : Câbles réseau, Switches, etc.
7. **Ajouter des frais généraux** :
   - Laisser le champ Groupe vide
   - Ajouter : Déplacement, Main d'œuvre

### Résultat PDF

```
DEVIS N° 2026-001

Électricité
  Circuit M40                    1    150.00 DH    150.00 DH
  Interrupteur 4x63A             2     45.00 DH     90.00 DH
                                        S/Total :   240.00 DH

Informatique
  Câble réseau CAT6             10     12.00 DH    120.00 DH
  Switch 24 ports                1    350.00 DH    350.00 DH
                                        S/Total :   470.00 DH

Divers / Général
  Déplacement                    1     50.00 DH     50.00 DH

                                    Total HT :     760.00 DH
                                    TVA 20% :      152.00 DH
                                    Total TTC :    912.00 DH
```

## 🚀 Comment Tester

1. **Accéder à l'application** : http://localhost
2. **Se connecter** avec un compte administrateur
3. **Aller dans "Devis"**
4. **Créer un nouveau devis** ou ouvrir un devis existant
5. **Cliquer sur "Gérer les lignes"**
6. **Tester les fonctionnalités** :
   - Créer des groupes
   - Ajouter des lignes avec et sans groupe
   - Éditer les lignes
   - Supprimer des groupes
   - Visualiser les sous-totaux
7. **Générer le PDF** pour voir le rendu final

## ✅ Statut de l'Implémentation

- ✅ **Backend** : 100% fonctionnel
- ✅ **Frontend** : 100% fonctionnel
- ✅ **Base de données** : Migrations appliquées
- ✅ **API** : Endpoints testés et opérationnels
- ✅ **Export PDF** : Adapté pour les groupes
- ✅ **Rétrocompatibilité** : Garantie

## 📌 Notes Techniques

- **ORM** : Relations Django bien configurées (SET_NULL sur suppression de groupe)
- **Validation** : Les champs obligatoires sont vérifiés côté backend et frontend
- **Performance** : Pas de requête N+1, utilisation de `prefetch_related` si nécessaire
- **UX** : Interface intuitive avec feedback visuel
- **Accessibilité** : Boutons avec icônes et labels clairs

---

**Date de mise en œuvre** : 6 février 2026
**Version** : 1.0.0
**Développé par** : GitHub Copilot + équipe de développement
