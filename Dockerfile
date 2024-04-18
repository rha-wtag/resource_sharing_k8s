FROM node:14

WORKDIR /usr/src/app
# Install netcat (nc)
RUN apt-get update && apt-get install -y netcat

# RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*
# RUN apt-get update && apt-get install -y default-mysql-client netcat && rm -rf /var/lib/apt/lists/*
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
COPY wait-for-it.sh .
RUN chmod +x wait-for-it.sh
# RUN npm install -g nodemon

CMD [ "npm", "start" ]