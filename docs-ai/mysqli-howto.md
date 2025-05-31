# MySQLi2 Bruksanvisning for AI

## Grunnleggende syntaks

### INSERT (bruk alltid prepared_insert)
```php
$sql = [
    'INSERT INTO `table_name` (`col1`, `col2`, `col3`) VALUES (?,?,?)',
    'iss',  // i=integer, s=string, d=double
    [$var1, $var2, $var3]
];
$insertID = $mysqli->prepared_insert($sql);
```

### SELECT (bruk prepared_query)
```php
$sql = [
    'SELECT * FROM `table_name` WHERE `id`=? AND `status`=?',
    'is',
    [$id, 'active']
];
$results = $mysqli->prepared_query($sql);
// Returnerer: array av associative arrays
```

### UPDATE (bruk prepared_insert - ja, det er riktig!)
```php
$sql = [
    'UPDATE `table_name` SET `name`=?, `email`=? WHERE `id`=?',
    'ssi',
    [$name, $email, $id]
];
$affectedRows = $mysqli->prepared_insert($sql);
```

### DELETE (bruk prepared_query)
```php
$sql = [
    'DELETE FROM `table_name` WHERE `id`=?',
    'i',
    [$id]
];
$affectedRows = $mysqli->prepared_query($sql);
```

## Type-definering
- `i` = integer
- `s` = string
- `d` = double/decimal

## Viktige regler
1. ALLTID bruk prepared statements med array-syntaksen
2. ALLTID wrap tabellnavn i backticks: `table_name`
3. ALDRI konkatenér variabler direkte i SQL
4. prepared_insert() brukes for både INSERT og UPDATE