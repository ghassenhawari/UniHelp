# 🎓 UniHelp AI - L'Assistant Administratif Universitaire Intelligent

> **Hackathon Edition 2024**
> 
> UniHelp est une plateforme RAG (Retrieval-Augmented Generation) conçue pour aider les étudiants à naviguer dans la complexité administrative des universités.

![UniHelp Landing](https://raw.githubusercontent.com/nestjs/nest/master/sample/01-cats-app/screenshot.png) <!-- Replace with real screenshot if possible -->

## 🌟 Points Forts
- **Chatbot RAG Intelligent** : Répond uniquement sur la base de documents officiels (PDF, TXT, MD).
- **Zéro Hallucination** : Si l'info n'est pas dans le règlement, l'IA l'admet.
- **Générateur d'Email** : Transforme une réponse administrative en un email formel prêt à envoyer.
- **Dashboard Admin** : Interface simple pour uploader et indexer de nouveaux règlements.
- **Propulsé par Llama 3.2** : Utilise Ollama pour un traitement local et sécurisé.

## 🚀 Lancement Rapide (Mode Démo)

### Pré-requis
- Docker (pour Ollama et ChromaDB)
- Node.js v18+

### Démarrage en 1 clic
Double-cliquez sur le fichier :
`📂 DEMARRER_PROJET.bat`

### Accès
- **Interface Utilisateur** : [http://localhost:5173](http://localhost:5173)
- **Compte de Démo** :
  - **Email** : `hawarighassen4@gmail.com`
  - **Password** : `password123`

## 🛠️ Stack Technique
- **Frontend** : React, Vite, Framer Motion (Animations), Tailwind CSS, Lucide Icons.
- **Backend** : NestJS, TypeORM, Multer.
- **IA/RAG** : 
  - **LLM** : Llama 3.2 (via Ollama)
  - **Embeddings** : Xenova/all-MiniLM-L6-v2
  - **Vector DB** : ChromaDB
- **Database** : PostgreSQL (ou SQLite pour la démo)

## 📁 Structure du Projet
- `/ai-assistant-front` : Interface utilisateur moderne et réactive.
- `/ai-assistant-back` : API NestJS gérant l'authentification et le pipeline RAG.
- `/DEMARRER_PROJET.bat` : Script de lancement automatique.

---
*Hackathon project 2024 - Révolutionner l'expérience étudiante.*
