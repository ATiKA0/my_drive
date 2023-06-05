<?php

$con = mysqli_connect('localhost', 'root', '', 'mydrive_db');

function getIcon($type, $ext = null)
{


    $icons = [
        'undefined' => '<i class="bi bi-question-square-fill class_39"></i>',
        'image/jpeg' => '<i class="bi bi-card-image class_39"></i>',
        'image/png' => '<i class="bi bi-card-image class_39"></i>',
        'text/plain' => '<i class="bi bi-filetype-txt class_31"></i>',
        'application/pdf' => '<i class="bi bi-filetype-pdf class_31"></i>',
        'application/vnd.openxmlformats-officedocument.word' => '<i class="bi bi-file-earmark-word class_31"></i>',
        'application/x-zip-compressed' => '<i class="bi bi-file-zip class_40"></i>',
        'video/x-matroska' => '<i class="bi bi-film class_39"></i>',
        'video/mp4' => '<i class="bi bi-film class_39"></i>',
        'audio/mpeg' => '<i class="bi bi-soundwave class_39"></i>',
        'folder' => '<i class="bi bi-folder class_39"></i>',
        'application/octet-stream' => [
            'heic' => '<i class="bi bi-filetype-heic class_39"></i>'
        ]
    ];

    if (!array_key_exists($type, $icons))
        return $icons['undefined'];

    if ($type == 'application/octet-stream') {
        if (!array_key_exists($ext, $icons))
            return $icons['undefined'];
        else
            return $icons[$type][$ext];
    }

    return $icons[$type];
};
function query($query)
{

    global $con;

    $result = mysqli_query($con, $query);
    if ($result) {
        if (!is_bool($result) && mysqli_num_rows($result) > 0) {
            $res = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $res[] = $row;
            }
            return $res;
        }
    }

    return false;
}
function query_row($query)
{

    global $con;

    $result = mysqli_query($con, $query);
    if ($result) {
        if (!is_bool($result) && mysqli_num_rows($result) > 0) {
            return mysqli_fetch_assoc($result);
        }
    }

    return false;
}

function get_date($date)
{
    return date("jS M Y", strtotime($date));
}

function isLoggedIn()
{

    if (!empty($_SESSION['USER']) && is_array($_SESSION['USER']))
        return true;

    return false;
}

function getDriveSpace($userId)
{

    if ($userId == 'User') {
        return 0;
    }

    $query = "SELECT SUM(file_size) AS sum FROM mydrive WHERE user_id = '$userId'";
    $row = query($query);
    if ($row) {
        return $row[0]['sum'];
    }

    return 0;
}

function generateSlug()
{
    $str = "";

    $a = range(0, 9);
    $b = range('a', 'z');
    $c = range('A', 'Z');

    $array = array_merge($a, $b, $c);
    $array[] = '_';
    $array[] = '-';

    $lenght = count($array) - 1;

    for ($i = 0; $i < rand(5, 50); $i++) {
        $key = rand(0, $lenght);
        $str .= $array[$key];
    }

    return $str;
}

$formated_file_type = [
    'image/png' => 'Image',
    'image/jpeg' => 'Image',
    'image/svg' => 'Image',
    'text/plain' => 'Plain Text',
    'application/vnd.openxmlformats-officedocument.word' => 'Word document',
    'video/mp4' => 'MP4 Video',
    'video/x-matroska' => 'MKV Video',
    'audio/mpeg' => 'MP3 Audio',
    'application/pdf' => 'PDF Document',
];
