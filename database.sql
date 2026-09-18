CREATE DATABASE IF NOT EXISTS controle_manutencao;
USE controle_manutencao;

CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON controle_manutencao.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS solicitacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment VARCHAR(255) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  responsible VARCHAR(255) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO solicitacoes (equipment, sector, description, priority, status, responsible, date)
VALUES
  ('Fresa Vertical 01', 'Produção', 'A máquina está emitindo ruído excessivo no eixo principal.', 'Alta', 'aberto', 'Maria Souza', NOW()),
  ('Esteira Transportadora', 'Logística', 'A correia está desalinada e precisa de ajuste.', 'Média', 'emManutencao', 'Carlos Lima', NOW());
