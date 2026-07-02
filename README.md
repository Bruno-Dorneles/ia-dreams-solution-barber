# Solution Barber

MVP SaaS da IA Dreams para substituir o controle manual de barbearias em cadernos.

O foco desta primeira versao e simples:

- registrar atendimentos rapidamente;
- calcular comissoes automaticamente;
- gerar fechamento diario;
- gerar fechamento mensal;
- separar faturamento por forma de pagamento.

Fora do MVP: agenda online, marketplace, chat, CRM avancado, fidelidade, IA e integracoes complexas.

## Estrutura

- `frontend`: PWA em React.
- `backend`: API REST em Node.js com NestJS usando JavaScript.
- `backend/database/schema.sql`: modelo inicial para PostgreSQL.

## Como rodar

Se estiver no Windows sem Node.js instalado, use:

```powershell
.\rodar-projeto.bat
```

Ou:

```powershell
.\rodar-projeto.ps1
```

Instale as dependencias:

```bash
pnpm install
```

Rode tudo:

```bash
pnpm run dev
```

Ou rode separado:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3000`

## Login de demonstracao

Dono:

- email: `braga@gmail.com`
- senha: `Acesso@123`

Admin IA Dreams:

- email: `admin@iadreams.com`
- senha: `Admin@123`

## Proximos passos para producao

Antes de vender para varios clientes, migrar os dados em memoria para PostgreSQL usando `backend/database/schema.sql`, criptografar senhas, validar JWT nas rotas e separar todos os dados por `barbershop_id`.

## Endpoints principais

- `POST /auth/login`
- `GET /barbershop`
- `GET /professionals`
- `POST /professionals`
- `GET /services`
- `POST /services`
- `POST /appointments`
- `GET /reports/daily`
- `GET /reports/monthly`

## Regra do produto

Toda nova funcionalidade deve responder sim para:

> Isso ajuda o barbeiro a abandonar o caderno?

Se a resposta for nao, fica para depois do MVP.
