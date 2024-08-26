# Utilisez l'image officielle Node.js comme image de base
FROM node:20

# Créez un répertoire pour l'application
WORKDIR /usr/src/app

# Copiez les fichiers package.json et package-lock.json
COPY package*.json ./

# Installez les dépendances de l'application
RUN npm install

# Copiez le reste de l'application dans le conteneur
COPY . .

# Exposez le port sur lequel l'application écoute
EXPOSE 500

# Commande pour démarrer l'application
CMD ["node", "index.js"]
