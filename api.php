<?php
session_start();
require 'functions.php';

$info = [];
$info['data_type'] = $_POST['data_type'] ?? '';
$info['succes'] = false;
$info['LOGGED_IN'] = isLoggedIn();

if (!$info['LOGGED_IN'] && ($info['data_type'] != 'user_signup' && $info['data_type'] != 'user_login')) {
    echo json_encode($info);
    die;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && !empty($_POST['data_type'])) {

    switch($_POST['data_type']){
    case ('upload_files'):
        $folder = 'uploads/';
        if (!file_exists($folder)) {
            mkdir($folder, 0777, true);
            file_put_contents($folder . ".htacces", "Options -Indexes");
        }
        foreach ($_FILES as $key => $file) {
            $destination = $folder . time() . $file['name'];
            if (file_exists($destination))
                $destination = $folder . time() . rand(0, 9999) . $file['name'];
            move_uploaded_file($file['tmp_name'], $destination);

            //save to database
            $type = $file['type'];
            $dateCreated = date('Y-m-d H:i:s');
            $dateUpdated = date('Y-m-d H:i:s');
            $fileName = $file['name'];
            $filePath = $destination;
            $user_id = 0;
            $fileSize = filesize($destination);

            $query = "INSERT INTO mydrive (file_name, file_size, file_path, user_id, file_type, date_created, date_updated) 
            values ('$fileName', '$fileSize', '$filePath', '$user_id', '$type', '$dateCreated', '$dateUpdated')";
            query($query);
            $info['succes'] = true;
        }
        break;

    case ('get_files'):

        $mode = $_POST['mode'];

        switch ($mode) {
            case 'MY DRIVE':
                $query = "SELECT * FROM mydrive ORDER BY id DESC LIMIT 30";
                break;

            case 'FAVORITES':
                $query = "SELECT * FROM mydrive WHERE favorite = 1 ORDER BY id DESC LIMIT 30";
                break;

            case 'RECENT':
                $query = "SELECT * FROM mydrive ORDER BY date_updated DESC LIMIT 30";
                break;

            case 'TRASH':
                $query = "SELECT * FROM mydrive WHERE trash = 1 ORDER BY id DESC LIMIT 30";
                break;

            default:
                $query = "SELECT * FROM mydrive ORDER BY id DESC LIMIT 30";
                break;
        }

        $rows = query($query);

        if ($rows) {

            foreach ($rows as $key => $row) {
                $rows[$key]['icon'] = $icons[$row['file_type']] ?? '<i class="bi bi-question-square-fill class_39"></i>';
                $rows[$key]['date_created'] = get_date($row['date_created']);
                $rows[$key]['date_updated'] = get_date($row['date_updated']);
                $rows[$key]['file_size'] = round($row['file_size'] / (1024 * 1024)) . " Mb";

                if ($rows[$key]['file_size'] == '0 Mb') {
                    $rows[$key]['file_size'] = round($row['file_size'] / 1024) . " Kb";
                }
            }
            $info['rows'] = $rows;
            $info['succes'] = true;
        }
        break;

    case('user_signup'):

        //save to database
        $email = addslashes($_POST['email']);
        $username = addslashes($_POST['username']);
        $password = addslashes($_POST['password']);
        $dateCreated = date('Y-m-d H:i:s');
        $dateUpdated = date('Y-m-d H:i:s');
        $retype_password = addslashes($_POST['retype-password']);


        //validate
        $errors = [];

        if(!preg_match("/^[a-zA-z]+$/",$username))
            $errors['username'] = "Invalid username. No symbols allowed.";

        if(!filter_var($email, FILTER_VALIDATE_EMAIL))
            $errors['email'] = "Invalid email address";

        if(query("SELECT id FROM users WHERE email = '$email' LIMIT 1"))
            $errors['email'] = "That email adress already exists";

        if(empty($password))
            $errors['password'] = "A password is required";

        if(strlen($password) < 8)
            $errors['password'] = "Password must be 8 charachters long";

        if($password != $retype_password)
            $errors['password'] = "Passwords do not match";

        if(empty($errors)){
            $password = password_hash($password, PASSWORD_DEFAULT);
            $query = "INSERT INTO users (username, email, password, date_created, date_updated) 
            values ('$username', '$email', '$password', '$dateCreated', '$dateUpdated')";
            query($query);
            $info['succes'] = true;
        }

        $info['errors'] = $errors;

        break;
}

}

echo json_encode($info);
