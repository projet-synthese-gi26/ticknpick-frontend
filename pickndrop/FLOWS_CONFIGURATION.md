# 🎯 CONFIGURATION PRINCIPALE DES FLOWS - PICK'N DROP

## Vue d'ensemble du système

Pick'n Drop est une application de livraison de colis avec plusieurs acteurs et flows interconnectés. Cette configuration définit tous les flows implémentés dans l'application.

## 📋 Liste des Flows Implémentés

### 1. Flow d'Authentification et Enregistrement
- **Fichier**: `flow_authentication.yaml`
- **Description**: Gestion complète de l'authentification et de l'enregistrement des utilisateurs
- **Acteurs**: Tous les types d'utilisateurs
- **États principaux**: 
  - Page d'accueil → Connexion → Tableau de bord
  - Page d'accueil → Inscription → Choix du type → Finalisation
- **Points d'entrée**: `/login`, `/register`
- **Contrôleurs impliqués**: `AuthController`
- **Services impliqués**: `AuthService`

### 2. Flow de Gestion des Colis (Expéditeur)
- **Fichier**: `flow_package_sender.yaml`
- **Description**: Création, gestion et suivi des colis par les expéditeurs
- **Acteurs**: CLIENT, EMPLOYEE, FREELANCE
- **États principaux**:
  - Tableau de bord → Création → Révision → Pré-enregistrement → Dépôt → Prêt
- **Points d'entrée**: `/packages/create`, `/packages/my-packages`
- **Contrôleurs impliqués**: `PackageController`
- **Services impliqués**: `PackageService`, `PackageHistoryService`

### 3. Flow de Livraison (Livreur)
- **Fichier**: `flow_delivery_deliverer.yaml`
- **Description**: Processus complet de livraison pour les livreurs
- **Acteurs**: DELIVERER
- **États principaux**:
  - Tableau de bord → Colis disponibles → Assignation → Récupération → Transit → Livraison
- **Points d'entrée**: `/deliverer/packages/available`, `/deliverer/my-deliveries`
- **Contrôleurs impliqués**: `DelivererController`
- **Services impliqués**: `PackageService`, `DelivererService`

### 4. Flow de Gestion des Points Relais
- **Fichier**: `flow_relay_point_management.yaml`
- **Description**: Création et gestion des points relais
- **Acteurs**: FREELANCE, AGENCY_OWNER, EMPLOYEE
- **États principaux**:
  - Tableau de bord → Création → Révision → Activation → Gestion
- **Points d'entrée**: `/relay-points/create`, `/relay-points/my-relay-points`
- **Contrôleurs impliqués**: `RelayPointManagementController`, `RelayPointController`
- **Services impliqués**: `RelayPointManagementService`, `RelayPointService`

### 5. Flow de Suivi et Réception (Destinataire)
- **Fichier**: `flow_package_recipient.yaml`
- **Description**: Suivi et récupération des colis par les destinataires
- **Acteurs**: Tous (public), EMPLOYEE, FREELANCE
- **États principaux**:
  - Recherche → Suivi → Arrivée → Notification → Récupération
- **Points d'entrée**: `/tracking`, `/tracking/{trackingNumber}`
- **Contrôleurs impliqués**: `PackageController`, `PackageReceptionController`
- **Services impliqués**: `PackageService`, `NotificationService`

## 🔄 Interconnexions entre les Flows

### Flow Principal: Cycle de Vie d'un Colis
```
Expéditeur (Flow 2) → Livreur (Flow 3) → Destinataire (Flow 5)
                ↓
        Point Relais (Flow 4)
```

### Authentification Transversale
Le Flow 1 (Authentification) est requis pour accéder à tous les autres flows, sauf le suivi public.

## 📊 Statuts des Colis et Transitions

### Statuts Principaux (PackageStatusEnum)
- `PRE_REGISTERED` → `FOR_PICKUP` → `ASSIGNED_TO_DELIVERER` → `IN_TRANSIT` → `AT_ARRIVAL_RELAY_POINT` → `DELIVERED`

### Acteurs par Statut
- **PRE_REGISTERED**: Créé par CLIENT/EMPLOYEE/FREELANCE
- **FOR_PICKUP**: Déposé au point relais
- **ASSIGNED_TO_DELIVERER**: Assigné par DELIVERER
- **IN_TRANSIT**: Récupéré par DELIVERER
- **AT_ARRIVAL_RELAY_POINT**: Livré au point relais de destination
- **DELIVERED**: Livré au destinataire final

## 🛠️ Structure Technique

### Contrôleurs Principaux
- `AuthController`: Authentification et enregistrement
- `PackageController`: Gestion des colis
- `DelivererController`: Interface livreur
- `RelayPointManagementController`: Gestion des points relais
- `PackageReceptionController`: Réception des colis

### Services Métier
- `AuthService`: Logique d'authentification
- `PackageService`: Logique des colis
- `PackageHistoryService`: Historique des colis
- `RelayPointManagementService`: Gestion des points relais
- `NotificationService`: Notifications

### Entités Principales
- `User`: Utilisateurs du système
- `Package`: Colis
- `PackageHistory`: Historique des colis
- `RelayPoint`: Points relais
- `Deliverer`: Livreurs

## 🔐 Sécurité et Permissions

### Rôles Principaux
- `CLIENT`: Peut créer et suivre des colis
- `DELIVERER`: Peut livrer des colis
- `FREELANCE`: Peut gérer un point relais et créer des colis
- `EMPLOYEE`: Peut gérer des colis et points relais
- `AGENCY_OWNER`: Peut gérer une agence et ses points relais
- `SUPER_ADMIN`: Accès complet au système

### Authentification
- JWT Token requis pour la plupart des endpoints
- Suivi public sans authentification
- Vérification des permissions par rôle et propriété

## 📱 Interface Utilisateur

### Composants Frontend Principaux
- `LoginForm`, `RegistrationForm`: Authentification
- `PackageCreationForm`, `PackageTracking`: Gestion des colis
- `AvailablePackagesList`, `DeliveryNavigation`: Interface livreur
- `RelayPointCreationForm`, `PackageInventory`: Gestion des points relais
- `TrackingSearch`, `PackageHistory`: Suivi public

### Gestion d'État
- `authStore`: État d'authentification
- `packageStore`: État des colis
- `delivererStore`: État du livreur
- `relayPointStore`: État des points relais
- `trackingStore`: État du suivi

## 🚀 Utilisation pour l'IA

### Règles pour Amazon Q
1. **TOUJOURS** consulter ces fichiers de flows avant toute modification
2. **JAMAIS** modifier les transitions de statuts sans vérifier la cohérence
3. **TOUJOURS** respecter les permissions définies
4. **JAMAIS** créer de nouvelles routes sans les documenter dans les flows
5. **TOUJOURS** maintenir la cohérence entre les flows interconnectés

### Commandes de Validation
```bash
# Valider la cohérence des flows
./validate-flows.sh

# Vérifier les routes existantes
grep -r "@PostMapping\|@GetMapping\|@PutMapping\|@DeleteMapping" src/main/java/com/pickndrop/controller/

# Vérifier les statuts utilisés
grep -r "PackageStatusEnum\|currentStatus" src/main/java/com/pickndrop/
```

### Mise à Jour des Flows
Quand vous modifiez le code, mettez à jour les fichiers de flows correspondants :
1. Identifiez le flow affecté
2. Mettez à jour les transitions concernées
3. Vérifiez les interconnexions avec les autres flows
4. Testez la cohérence globale

---

**Version**: 1.0.0  
**Dernière mise à jour**: $(date)  
**Mainteneur**: Équipe de développement Pick'n Drop