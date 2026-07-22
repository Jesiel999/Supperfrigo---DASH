# 📊 BI Dashboard PWA

Aplicação **Progressive Web App (PWA)** desenvolvida em **Angular**, com arquitetura baseada em **Programação Orientada a Objetos (OO)**, destinada à visualização de indicadores estratégicos, análises financeiras e dashboards corporativos.

---

# 📌 Objetivo

Disponibilizar uma plataforma moderna para acompanhamento de indicadores dos negócios do grupo em tempo real, oferecendo uma experiência semelhante a aplicativos nativos através das tecnologias PWA.

---

# 🚀 Tecnologias Utilizadas

### Front-end

* Angular
* TypeScript
* HTML5
* CSS3

### Arquitetura

* Programação Orientada a Objetos (OO)
* Standalone Components
* Signals
* Computed Signals
* Services
* Dependency Injection
* Lazy Loading
* Componentização

### PWA

* Angular Service Worker
* Manifest
* Offline Cache
* Instalação como aplicativo

### Visualização de Dados

* Gráficos
* KPIs
* Cards
* Tabelas Responsivas

---

# 🏛 Arquitetura

A aplicação segue uma arquitetura em camadas visando facilitar manutenção, escalabilidade e reutilização de código.

```

```

---

# 📁 Estrutura do Projeto

```
src/
│
├── app/
│   ├── auth/
│   ├── pages/
│   ├── layout/
│   ├── services/
│   └── shared/
│
├── assets/
│   └── icons/
|
└── environments/
```

---

# 🎯 Funcionalidades

* Dashboard Executivo
* Indicadores Financeiros
* KPIs em Tempo Real
* Ranking
* Gráficos Interativos
* Filtros Dinâmicos
* Responsividade
* Instalação como Aplicativo (PWA)
* Funcionamento Offline
* Atualização Automática dos Dados

---

# 📊 Indicadores

A aplicação suporta dashboards para diversos indicadores, como:

* Inadimplência
* PMR
* PMP
* Fluxo de Caixa
* DRE
* Maiores Devedores
* Faturamento
* Contas a Receber
* Contas a Pagar

---

# 🔄 Fluxo da Aplicação

```
Usuário
    │
    ▼
Componentes Angular
    │
    ▼
Services
    │
    ▼
API REST
    │
    ▼
Banco de Dados
```

---

# 🧩 Padrões Utilizados

* Programação Orientada a Objetos (OO)
* SOLID
* Componentização
* Injeção de Dependência
* Single Responsibility Principle
* Reutilização de Componentes
* Encapsulamento
* Separação de Responsabilidades

---

# 📱 Progressive Web App

Recursos implementados:

* Instalação como aplicativo
* Atualização automática

---

# ⚙️ Instalação

## Clonar o projeto

```bash
git clone https://github.com/seu-repositorio.git
```

## Instalação pwa

```bash
ng add @angular/pwa --project=nome do projeto
```

## Acessar a pasta

```bash
cd projeto
```

## Instalar dependências

```bash
npm install
```

## Executar

```bash
ng serve
```

A aplicação estará disponível em:

```
http://localhost:4200
```

---

# 🏗 Build para Produção

```bash
ng build --configuration production
```

---

# 🧪 Executar Testes

```bash
ng test
```

---

# 📦 Gerar PWA

```bash
npx pwa-asset-generator public/favicon-592x592.png src\assets\icons --icon-only --favicon --background "#0b0f1a"
```

```bash
ng build --configuration production
```

Os arquivos serão gerados na pasta:

```
dist/
```

---

# 🌐 Integração

A aplicação consome dados através de APIs REST responsáveis por fornecer informações utilizadas na construção dos dashboards.

---

# 🔒 Segurança

* Interceptors HTTP
* Tratamento Global de Erros
* Controle de Sessão
* Autenticação baseada em Token
* Proteção de Rotas

---

# 📈 Performance

* Standalone Components
* Signals
* Computed Signals
* Change Detection otimizada
* Build otimizado para produção
