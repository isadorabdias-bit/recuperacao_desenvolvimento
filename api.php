<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$dbName = 'controle_manutencao';
$dbUser = 'app_user';
$dbPass = '123456';

function responseJson($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function normalizeStatus($status)
{
    $aliases = [
        'aberta' => 'aberto',
        'emAndamento' => 'emManutencao',
        'concluida' => 'concluido',
        'Aberto' => 'aberto',
        'Em manutenção' => 'emManutencao',
        'Concluído' => 'concluido'
    ];

    return $aliases[$status] ?? $status ?? 'aberto';
}

function readInput()
{
    $raw = file_get_contents('php://input');

    if (empty($raw)) {
        return [];
    }

    $decoded = json_decode($raw, true);

    return is_array($decoded) ? $decoded : [];
}

function validatePayload($data)
{
    $requiredFields = ['equipment', 'sector', 'description', 'responsible'];

    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            return 'Preencha todos os campos obrigatórios antes de salvar.';
        }
    }

    if (strlen(trim((string)$data['description'])) < 10) {
        return 'A descrição do problema deve ter pelo menos 10 caracteres.';
    }

    return null;
}

function mysqlCommand($sql)
{
    global $dbUser, $dbPass, $dbName;

    $command = '"C:\\Users\\sesi2b\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysql.exe" -u ' . escapeshellarg($dbUser) . ' -p' . escapeshellarg($dbPass) . ' -D ' . escapeshellarg($dbName) . ' --default-character-set=utf8mb4 --batch --skip-column-names -e ' . escapeshellarg($sql) . ' 2>&1';

    exec($command, $output, $exitCode);

    return [
        'exitCode' => $exitCode,
        'output' => implode("\n", $output)
    ];
}

function mysqlFetchAll($sql)
{
    $result = mysqlCommand($sql);

    if ($result['exitCode'] !== 0) {
        throw new RuntimeException($result['output']);
    }

    $lines = preg_split('/\R/', trim($result['output']));
    $rows = [];

    foreach ($lines as $line) {
        $trimmedLine = trim($line);

        if ($trimmedLine === '' || stripos($trimmedLine, 'mysql:') === 0 || stripos($trimmedLine, 'ERROR ') === 0) {
            continue;
        }

        $values = array_pad(explode("\t", $trimmedLine), 8, '');
        $rows[] = [
            'id' => $values[0],
            'equipment' => $values[1],
            'sector' => $values[2],
            'description' => $values[3],
            'priority' => $values[4],
            'status' => $values[5],
            'responsible' => $values[6],
            'date' => $values[7],
            'registered_at' => $values[7]
        ];
    }

    foreach ($rows as &$row) {
        $row['status'] = normalizeStatus($row['status']);
    }

    return $rows;
}

function escapeSqlValue($value)
{
    if ($value === null) {
        return 'NULL';
    }

    return "'" . str_replace("'", "\\'", (string) $value) . "'";
}

$method = $_SERVER['REQUEST_METHOD'];
$input = readInput();

if ($method === 'GET') {
    try {
        $items = mysqlFetchAll('SELECT id, equipment, sector, description, priority, status, responsible, date FROM solicitacoes ORDER BY id DESC');
        responseJson($items);
    } catch (Throwable $exception) {
        responseJson(
            [
                'success' => false,
                'message' => 'Não foi possível carregar as ocorrências do banco do Laragon.',
                'error' => $exception->getMessage()
            ],
            500
        );
    }
}

if ($method === 'POST') {
    $validationError = validatePayload($input);

    if ($validationError) {
        responseJson(
            ['success' => false, 'message' => $validationError],
            400
        );
    }

    $equipment = trim((string) $input['equipment']);
    $sector = trim((string) $input['sector']);
    $description = trim((string) $input['description']);
    $priority = trim((string) ($input['priority'] ?? 'Alta'));
    $status = normalizeStatus($input['status'] ?? 'aberto');
    $responsible = trim((string) $input['responsible']);

    $sql = sprintf(
        "INSERT INTO solicitacoes (equipment, sector, description, priority, status, responsible, date) VALUES (%s, %s, %s, %s, %s, %s, NOW())",
        escapeSqlValue($equipment),
        escapeSqlValue($sector),
        escapeSqlValue($description),
        escapeSqlValue($priority),
        escapeSqlValue($status),
        escapeSqlValue($responsible)
    );

    $result = mysqlCommand($sql);

    if ($result['exitCode'] !== 0) {
        responseJson(
            [
                'success' => false,
                'message' => 'Não foi possível cadastrar a ocorrência no banco do Laragon.',
                'error' => $result['output']
            ],
            500
        );
    }

    responseJson(
        [
            'success' => true,
            'message' => 'Ocorrência cadastrada com sucesso!'
        ],
        201
    );
}

if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        responseJson(
            ['success' => false, 'message' => 'ID da ocorrência não informado.'],
            400
        );
    }

    $current = mysqlFetchAll("SELECT id, equipment, sector, description, priority, status, responsible, date FROM solicitacoes WHERE id = {$id}");

    if (count($current) === 0) {
        responseJson(
            ['success' => false, 'message' => 'Ocorrência não encontrada.'],
            404
        );
    }

    $record = $current[0];

    $merged = [
        'equipment' => $input['equipment'] ?? $record['equipment'],
        'sector' => $input['sector'] ?? $record['sector'],
        'description' => $input['description'] ?? $record['description'],
        'priority' => $input['priority'] ?? $record['priority'],
        'status' => normalizeStatus($input['status'] ?? $record['status']),
        'responsible' => $input['responsible'] ?? $record['responsible']
    ];

    $validationError = validatePayload($merged);

    if ($validationError) {
        responseJson(
            ['success' => false, 'message' => $validationError],
            400
        );
    }

    $sql = sprintf(
        "UPDATE solicitacoes SET equipment = %s, sector = %s, description = %s, priority = %s, status = %s, responsible = %s WHERE id = %d",
        escapeSqlValue(trim((string) $merged['equipment'])),
        escapeSqlValue(trim((string) $merged['sector'])),
        escapeSqlValue(trim((string) $merged['description'])),
        escapeSqlValue(trim((string) $merged['priority'])),
        escapeSqlValue($merged['status']),
        escapeSqlValue(trim((string) $merged['responsible'])),
        $id
    );

    $result = mysqlCommand($sql);

    if ($result['exitCode'] !== 0) {
        responseJson(
            [
                'success' => false,
                'message' => 'Não foi possível atualizar a ocorrência no banco do Laragon.',
                'error' => $result['output']
            ],
            500
        );
    }

    responseJson(
        [
            'success' => true,
            'message' => 'Ocorrência atualizada com sucesso!'
        ]
    );
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        responseJson(
            ['success' => false, 'message' => 'ID da ocorrência não informado.'],
            400
        );
    }

    $existing = mysqlFetchAll("SELECT id FROM solicitacoes WHERE id = {$id}");

    if (count($existing) === 0) {
        responseJson(
            ['success' => false, 'message' => 'Ocorrência não encontrada.'],
            404
        );
    }

    $result = mysqlCommand("DELETE FROM solicitacoes WHERE id = {$id}");

    if ($result['exitCode'] !== 0) {
        responseJson(
            [
                'success' => false,
                'message' => 'Não foi possível excluir a ocorrência do banco do Laragon.',
                'error' => $result['output']
            ],
            500
        );
    }

    responseJson(
        [
            'success' => true,
            'message' => 'Ocorrência excluída com sucesso!'
        ]
    );
}

responseJson(
    ['success' => false, 'message' => 'Método não permitido.'],
    405
);
