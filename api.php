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

$info['username'] = $_SESSION['USER']['username'] ?? 'User';
$info['drive_occupied'] = getDriveSpace($_SESSION['USER']['id']) ?? "User";
$info['drive_total'] = 10;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && !empty($_POST['data_type'])) {

    switch ($_POST['data_type']) {
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
                $user_id = $_SESSION['USER']['id'] ?? 0;
                $fileSize = $file['size'];
                $folder_id = $_POST['folder_id'] ?? 0;

                $query = "INSERT INTO mydrive (file_name, file_size, file_path, user_id, file_type, date_created, date_updated, folder_id) 
            values ('$fileName', '$fileSize', '$filePath', '$user_id', '$type', '$dateCreated', '$dateUpdated', '$folder_id')";
                query($query);
                $info['succes'] = true;
            }
            break;
        case ('new_folder'):

            //save to database
            $name = addslashes($_POST['name']);
            $dateCreated = date('Y-m-d H:i:s');
            $user_id = $_SESSION['USER']['id'] ?? 0;
            $parent_id = $_POST['folder_id'] ?? 0;

            $query = "INSERT INTO folders (name, user_id, date_created, parent) values ('$name', '$user_id', '$dateCreated', '$parent_id')";
            query($query);
            $info['succes'] = true;

            break;

        case ('get_files'):

            $user_id = $_SESSION['USER']['id'] ?? null;
            $mode = $_POST['mode'];
            $folder_id = $_POST['folder_id'] ?? 0;

            switch ($mode) {
                case 'MY DRIVE':
                    $queryFolder = "SELECT * FROM folders WHERE user_id = '$user_id' && parent = '$folder_id' ORDER BY id DESC LIMIT 30";
                    $query = "SELECT * FROM mydrive WHERE user_id = '$user_id' && folder_id = '$folder_id' ORDER BY id DESC LIMIT 30";
                    break;

                case 'FAVORITES':
                    $query = "SELECT * FROM mydrive WHERE favorite = 1 && user_id = '$user_id' ORDER BY id DESC LIMIT 30";
                    break;

                case 'RECENT':
                    $query = "SELECT * FROM mydrive WHERE user_id = '$user_id' ORDER BY date_updated DESC LIMIT 30";
                    break;

                case 'TRASH':
                    $query = "SELECT * FROM mydrive WHERE trash = 1 && user_id = '$user_id' ORDER BY id DESC LIMIT 30";
                    break;

                default:
                    $queryFolder = "SELECT * FROM folders WHERE user_id = '$user_id' && parent = '$folder_id' ORDER BY id DESC LIMIT 30";
                    $query = "SELECT * FROM mydrive WHERE user_id = '$user_id' && folder_id = '$folder_id' ORDER BY id DESC LIMIT 30";
                    break;
            }

            $rowsFolder = query($queryFolder);

            if (empty($rowsFolder))
                $rowsFolder = [];

            $rows = query($query);

            if (empty($rows))
                $rows = [];

            $rows = array_merge($rowsFolder, $rows);

            if (!empty($rows)) {

                foreach ($rows as $key => $row) {

                    if (empty($row['file_type'])) {
                        $rows[$key]['file_type'] = 'folder';
                        $row['file_type'] = 'folder';

                        $rows[$key]['date_updated'] = $row['date_created'];
                        $row['date_updated'] = $row['date_created'];

                        $rows[$key]['file_size'] = 0;
                        $row['file_size'] = 0;

                        $rows[$key]['file_name'] = $row['name'];
                        $row['file_name'] = $row['name'];

                        $info['van'] = true;
                    }
                    $parts = explode(".", $row['file_name']);
                    $ext = strtolower(end($parts));
                    $rows[$key]['icon'] = getIcon($row['file_type'], $ext);
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

        case ('user_signup'):

            //save to database
            $email = addslashes($_POST['email']);
            $username = addslashes($_POST['username']);
            $password = addslashes($_POST['password']);
            $dateCreated = date('Y-m-d H:i:s');
            $dateUpdated = date('Y-m-d H:i:s');
            $retype_password = addslashes($_POST['retype-password']);


            //validate
            $errors = [];

            if (!preg_match("/^[a-zA-z]+$/", $username))
                $errors['username'] = "Invalid username. No symbols allowed.";

            if (!filter_var($email, FILTER_VALIDATE_EMAIL))
                $errors['email'] = "Invalid email address";

            if (query("SELECT id FROM users WHERE email = '$email' LIMIT 1"))
                $errors['email'] = "That email adress already exists";

            if (empty($password))
                $errors['password'] = "A password is required";

            if (strlen($password) < 8)
                $errors['password'] = "Password must be 8 charachters long";

            if ($password != $retype_password)
                $errors['password'] = "Passwords do not match";

            if (empty($errors)) {
                $password = password_hash($password, PASSWORD_DEFAULT);
                $query = "INSERT INTO users (username, email, password, date_created, date_updated) 
            values ('$username', '$email', '$password', '$dateCreated', '$dateUpdated')";
                query($query);
                $info['succes'] = true;
            }

            $info['errors'] = $errors;

            break;

        case ('user_login'):

            //save to database
            $email = addslashes($_POST['email']);
            $password = addslashes($_POST['password']);

            //validate
            $errors = [];
            $row = query("SELECT * FROM users WHERE email = '$email' LIMIT 1");

            if (!empty($row)) {

                $row = $row[0];
                if (password_verify($password, $row['password'])) {
                    //all good
                    $info['succes'] = true;
                    $_SESSION['USER'] = $row;
                }
            }

            $info['errors']['email'] = "Wrong email or password";

            break;

        case ('user_logout'):

            if (isset($_SESSION['USER']))
                unset($_SESSION['USER']);

            $info['succes'] = true;

            break;
    }
}

echo json_encode($info);
