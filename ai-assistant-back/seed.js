const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3001/api';
const ADMIN_SECRET = 'dev_admin_secret';

const DOCUMENTS = [
    {
        name: 'reglement_examen.txt',
        content: `Règlement Général des Examens 2024
----------------------------------
1. Inscriptions
L'inscription aux examens est automatique pour tout étudiant inscrit administrativement.
Toutefois, l'étudiant doit vérifier son calendrier d'examen sur son ENT 15 jours avant la première épreuve.

2. Absences
Une absence à une épreuve terminale (ET) entraîne la note de 0/20 (ABI - Absence Injustifiée).
Pour justifier une absence, un certificat médical doit être déposé au service de scolarité dans les 48 heures suivant l'épreuve.

3. Session de Rattrapage
La session de rattrapage (seconde chance) a lieu en juin. 
La meilleure des deux notes (initiale et rattrapage) est conservée pour le calcul de la moyenne.

4. Fraude
Toute tentative de fraude (téléphone allumé, antisèches, etc.) est passible d'une exclusion définitive de tout établissement d'enseignement supérieur pour une durée de 5 ans.`
    },
    {
        name: 'guide_bourses.txt',
        content: `Guide des Bourses Universitaires 2024-2025
-------------------------------------------
1. Critères d'Attribution
Les bourses sur critères sociaux sont basées sur le revenu des parents, le nombre d'enfants à charge et la distance entre le domicile et l'université.

2. Calendrier
La saisie du Dossier Social Étudiant (DSE) doit être faite entre le 1er mars et le 31 mai.
Un dossier hors délai sera traité mais pourra entraîner un retard de paiement pour les mois de septembre et octobre.

3. Montants Mensuels (Exemples)
Échelon 0 bis : 108 €
Échelon 1 : 178 €
Échelon 4 : 415 €
Échelon 7 : 596 € (Montant maximal)

4. Assiduité
Le versement de la bourse est suspendu si l'étudiant ne respecte pas l'obligation d'assiduité aux cours et aux examens.`
    },
    {
        name: 'calendrier_universitaire.txt',
        content: `Calendrier Universitaire UniHelp 2024-2025
-------------------------------------------
Premier Semestre (S1) :
- Rentrée : 16 Septembre 2024
- Vacances de la Toussaint : du 26 Octobre au 3 Novembre 2024
- Examens S1 : du 6 Janvier au 17 Janvier 2025

Second Semestre (S2) :
- Début des cours : 27 Janvier 2025
- Vacances d'Hiver : du 15 Février au 23 Février 2025
- Vacances de Printemps : du 12 Avril au 21 Avril 2025
- Examens S2 : du 12 Mai au 23 Mai 2025

Rattrapages : du 16 Juin au 27 Juin 2025`
    }
];

async function seed() {
    console.log('🚀 Démarrage du Seeding pour le Hackathon...');

    // 1. Créer les fichiers sur le disque temporairement
    for (const doc of DOCUMENTS) {
        console.log(`\n📦 Préparation de: ${doc.name}`);
        const filePath = path.join(__dirname, doc.name);
        fs.writeFileSync(filePath, doc.content);

        // 2. Envoyer au backend
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        try {
            console.log(`📤 Envoi à l'API...`);
            const res = await axios.post(`${API_BASE}/docs/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    'X-Admin-Secret': ADMIN_SECRET
                }
            });
            console.log('✅ Succès:', res.data.summary);
        } catch (err) {
            console.error('❌ Erreur lors de l\'upload:', err.response?.data || err.message);
        } finally {
            // Nettoyage
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }

    console.log('\n✨ Seeding terminé ! UniHelp est prêt pour la démo.');
}

seed();
