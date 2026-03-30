# Hermes B2B

## Como instalar e rodar o projeto

### 1. Clone o repositório

git clone https://github.com/SEU_USUARIO/produto-site.git
cd produto-site

### 2. Configure o backend

cd backend
npm install

Crie um arquivo .env dentro da pasta backend com o seguinte conteúdo:

DATABASE_URL=sua_url_de_conexao_postgresql

Depois rode o servidor:

npm start

O servidor vai rodar em http://localhost:3001

### 3. Configure o frontend

Abra um novo terminal e rode:

cd frontend
npm install
npm run dev

O site vai rodar em http://localhost:5173

## Como usar

Na página Estoque é possível visualizar todos os produtos cadastrados.

Na página Gerenciar é possível adicionar um novo produto informando nome, quantidade, data de validade, data de entrada e localização. Também é possível remover um produto pelo seu ID.