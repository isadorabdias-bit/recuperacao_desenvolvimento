# Controle de Manutenção

## Descrição do projeto

Este projeto consiste em um aplicativo web mobile-first para registrar, consultar, atualizar e excluir ocorrências de manutenção em uma empresa. A aplicação foi desenvolvida com HTML, CSS e JavaScript, com a programação organizada em arquivos separados para facilitar manutenção e leitura do código.

## Objetivo

Permitir o controle e o acompanhamento de solicitações de manutenção com as seguintes funcionalidades:

- Cadastro de novas ocorrências
- Consulta de ocorrências cadastradas
- Edição de registros
- Alteração de status
- Exclusão de registros
- Validação de campos obrigatórios
- Persistência dos dados no MySQL pelo endpoint da API
- Integração com API REST local para gerenciar solicitações

## Requisitos atendidos

### 1. Cadastro e consulta
- O usuário pode registrar ocorrências com os campos:
  - equipamento ou máquina
  - setor
  - problema
  - prioridade
  - status
  - responsável

### 2. Atualização e exclusão
- Cada ocorrência possui ações de edição e exclusão.
- O status pode ser alterado diretamente pela interface.

### 3. Validação de campos
- Os campos obrigatórios são validados antes do cadastro/atualização.
- A descrição do problema exige pelo menos 10 caracteres.

### 4. Status suportados
- Aberto
- Em manutenção
- Concluído

### 5. Persistência
- As solicitações são salvas na tabela `solicitacoes` do MySQL.
- O campo `date` é preenchido pela API com `NOW()` no momento do cadastro.
- A API retorna esse horário nos campos `date` e `registered_at`.
- O horário original de cadastro não é alterado quando a solicitação é editada.

### 6. Integração com API REST
- A aplicação utiliza a API REST local em `api.php` para listar e gerenciar solicitações.
- Os registros incluem o horário de cadastro em `registered_at`.

## Estrutura do aplicativo

O projeto foi organizado em arquivos separados:

- `index.html` — estrutura da interface e carregamento dos arquivos externos
- `styles.css` — estilos e layout da aplicação
- `script.js` — lógica do aplicativo, incluindo CRUD, validação, persistência e integração com API
- `README.md` — documentação do projeto

A organização atual permite manter a interface, os estilos e a programação separadamente, tornando o código mais limpo e fácil de evoluir.

## Funcionalidades implementadas

### Cadastro de ocorrências
- Formulário com todos os campos necessários
- Habilita salvar novas solicitações
- Atualiza a lista em tempo real

### Consulta de ocorrências
- Campo de busca por equipamento, setor, descrição ou responsável
- Total de ocorrências exibido na interface
- Estado vazio quando não há registros

### Edição de ocorrências
- Botão para carregar os dados no formulário
- Possibilidade de atualizar os dados e o status

### Alteração de status
- A lista permite mudar o status diretamente no card
- O status é convertido e persistido no formato interno

### Exclusão
- Cada registro pode ser removido
- Solicita confirmação antes da exclusão

### Tratamento de erros
- Mensagens visuais de sucesso e erro
- Tratamento para falhas na API

## Persistência, normalização e Laragon

A aplicação utiliza normalização de status para garantir compatibilidade com dados já salvos em formatos anteriores, como:

### Banco de dados no Laragon

O projeto foi desenvolvido inicialmente com persistência em `localStorage`, que atende ao requisito de manter os dados após recarregar ou executar a aplicação no navegador. 

Se o objetivo for implementar o armazenamento em banco de dados no Laragon, a estrutura recomendada é:

- ambiente Laragon com MySQL ativo
- banco de dados: `controle_manutencao`
- tabela principal: `solicitacoes`
- campos sugeridos:
  - `id`
  - `equipment`
  - `sector`
  - `description`
  - `priority`
  - `status`
  - `responsible`
  - `date`

 A camada backend já está disponível em `api.php` e realiza as operações CRUD diretamente no banco.

### Horário de cadastro pela API

O endpoint local é:

`http://localhost/recuperacao_desenvolvimento/api.php`

- `GET` lista as solicitações, incluindo `registered_at`.
- `POST` cria uma solicitação e registra automaticamente data e hora no banco.
- `PUT` atualiza os dados sem alterar o horário original de cadastro.


- `aberta`
- `emAndamento`
- `concluida`
- `Aberto`
- `Em manutenção`
- `Concluído`

Esses valores são convertidos para o padrão interno do sistema:

- `aberto`
- `emManutencao`
- `concluido`

## Testes realizados

Os testes abaixo foram executados e validados na aplicação em execução no navegador.

### 1. Cadastro com campos preenchidos corretamente
- Resultado: aprovado
- Evidência: após o cadastro, o número de ocorrências aumentou de 2 para 3 e depois para 4

### 2. Validação de campos obrigatórios vazios
- Resultado: aprovado
- Evidência: a aplicação manteve a quantidade de ocorrências sem inserir registros vazios

### 3. Cadastro de múltiplas ocorrências
- Resultado: aprovado
- Evidência: múltiplos registros foram inseridos com sucesso

### 4. Alteração dos dados
- Resultado: aprovado
- Evidência: a ocorrência foi editada e exibiu os novos valores na interface

### 5. Alteração do status
- Resultado: aprovado
- Evidência: o status foi atualizado para `emManutencao`

### 6. Exclusão de registros
- Resultado: aprovado
- Evidência: a quantidade de ocorrências reduziu após a exclusão

### 7. Persistência das informações
- Resultado: aprovado
- Evidência: após recarga da página, os registros permaneceram armazenados

## Como executar

1. Certifique-se de que os arquivos `index.html`, `styles.css` e `script.js` estejam na mesma pasta do projeto.
2. Abra o arquivo `index.html` em um navegador.
3. A aplicação será carregada diretamente, incluindo os estilos e a lógica externa.
4. Utilize o formulário para cadastrar ocorrências.
5. Consulte, edite, altere status ou exclua registros.
6. Consulte as solicitações cadastradas diretamente pela interface.

## Observações finais

Este projeto atende aos requisitos de um aplicativo de controle de manutenção em ambiente web com foco em mobile, incluindo CRUD, persistência local, validação de dados, integração com API REST e uma estrutura de arquivos organizada para facilitar manutenção e evolução futura.
