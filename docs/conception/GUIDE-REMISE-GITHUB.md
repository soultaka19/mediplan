# Guide de remise — Pousser sur GitHub et donner les accès

Ce guide finalise la remise du 4 juin 2026. Le dépôt Git local est déjà initialisé et le premier
commit est prêt ; il reste à le publier sur GitHub et à donner les accès à la professeure.

## 1. Créer le dépôt distant et pousser

### Option A — avec GitHub CLI (`gh`), le plus simple
```powershell
# Depuis le dossier du projet
gh auth login            # une seule fois, si pas déjà connecté
gh repo create mediplan --private --source . --remote origin --push
```

### Option B — manuellement
1. Sur https://github.com/new, créer un dépôt nommé **mediplan** (privé), sans README.
2. Puis, dans le dossier du projet :
```powershell
git remote add origin https://github.com/soultaka19/mediplan.git
git branch -M main
git push -u origin main
```

> Si l'authentification échoue par mot de passe, utilisez un **Personal Access Token** GitHub
> (Settings → Developer settings → Tokens) comme mot de passe, ou la commande `gh auth login`.

## 2. Donner accès à la professeure sur GitHub

1. Dépôt GitHub → **Settings** → **Collaborators** (ou **Collaborators and teams**).
2. **Add people** → saisir `StephanieKa-2022` → rôle **Read** (lecture suffit) → **Add**.
3. La professeure recevra une invitation à accepter.

## 3. Donner accès à la professeure sur Jira

1. Ouvrir le projet **MediPlan** : https://diallosouleymanetaka.atlassian.net/jira/software/projects/MEDIPLAN
2. **Project settings** → **Access** (ou **People**) → **Add people**.
3. Inviter la professeure par son courriel → rôle **Administrateur** ou **Membre** (lecture du tableau).

> Si vous avez le courriel professionnel de la professeure, utilisez-le pour l'invitation Jira.

## 4. Soumettre sur eCité

Copier-coller le contenu de [`SOUMISSION-eCITE.md`](SOUMISSION-eCITE.md) (liens GitHub + dossier
`docs/conception/` + lien Jira) dans la zone de remise eCité, et joindre les fichiers si demandé.

## 5. Checklist finale

- [ ] `git push` effectué, dépôt visible sur GitHub
- [ ] `docs/conception/` visible et les diagrammes s'affichent (Mermaid rendu par GitHub)
- [ ] `StephanieKa-2022` ajoutée comme collaboratrice GitHub
- [ ] Professeure invitée sur le projet Jira MediPlan
- [ ] Liens soumis sur eCité
