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
        'folder' => '<i class="bi bi-folder class_39"></i>',
        'application/octet-stream' => [
            'heic' => '<i class="bi bi-filetype-heic class_39"></i>'
        ]
    ];

    if (!array_key_exists($type, $icons))
        return $icons['undefined'];

    if ($type == 'application/octet-stream')
        return $icons[$type][$ext];

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
    $query = "SELECT SUM(file_size) AS sum FROM mydrive WHERE user_id = '$userId'";
    $row = query($query);
    if ($row) {
        return $row[0]['sum'];
    }

    return 0;
}
