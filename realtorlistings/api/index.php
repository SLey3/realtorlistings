<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    use \Slim\Factory\AppFactory;
    use Slim\Exception\HttpNotFoundException;
    use \Psr\Http\Message\ResponseInterface as Response;
    use \Psr\Http\Message\ServerRequestInterface as Request;
    use Defuse\Crypto\Crypto;
    use Defuse\Crypto\Key as defuseKey;
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key as JWTKey;

    require __DIR__.'/vendor/autoload.php';

    include './databaseconnect.php';
    include './form_validations.php';
    include './mailer.php';

    $db_connector = new MySQLConnect;
    $conn = $db_connector->connect(); # make the connection to the database

    $db_503_or_success = function() use ($conn) {
        if (gettype($conn) == "integer") {
            return false;
        }
        return true;
    };

    $mailer = new MailerHandler();

    # Backend API for React routes
    $app = AppFactory::create();
    $app->addBodyParsingMiddleware();

    $app->options('/{routes:.+}', function (Request $request, Response $response, array $args) {
        return $response;
    });

    $app->add(function ($request, $handler) {
        $response = $handler->handle($request);
        return $response
                ->withHeader('Access-Control-Allow-Origin', 'https://www.realtor-listings.com, https://realtorlistings-frontend-git-main-sergio-leys-projects.vercel.app')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    });

    $app->get("/", function(Request $request, Response $response, array $args) {
        $response->getBody()->write("<b>Access Denied</b> Forbidden Access. Please go the correct route: <a href='https://www.realtor-listings.com'>Realtor Listings</a>");
        return $response;
    });

    $app->post("/login", function(Request $request, Response $response, array $args) use ($db_503_or_success, $conn) {
        /* The purpose of this api route is to get and authenticate the user info from the mysql database and arrange it so that it will be used as
        the user cookie for the session */
        if (!$db_503_or_success()) { # verify database connection is successful else return HTTP code 503
            return $response->withStatus(503);
        }

        $data = $request->getParsedBody();
        $username = strtolower($data['username']);
        $pwd = $data['password'];

        $res = mysqli_query($conn, "SELECT * FROM users WHERE username = '$username';");

        if (mysqli_num_rows($res) > 0) {
            while ($row = mysqli_fetch_assoc($res)) {
                if((bool)$row["verified"]){
                    if (password_verify($pwd, $row["password"])) {
                        $response->getBody()->write(json_encode($row));
                        $status = 201;
                        break;
                    } else {
                        $response_payload = ["error" => "Password is incorrect."];
                        $response->getBody()->write(json_encode($response_payload));
                        $status = 422;
                    }
                } else {
                    $response_payload = ["error" => "Your account is not verified. Please check your email for a verification link."];
                    $response->getBody()->write(json_encode($response_payload));
                    $status = 422;
                }
            }
        } else {
            $response_payload = ["error" => "No account found under that username. Check again."];
            $response->getBody()->write(json_encode($response_payload));
            $status = 404;
        }

        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    });

    $app->post("/register", function(Request $request, Response $response, array $args) use ($db_503_or_success, $conn, $mailer) {
        /* The purpose of this api route is to register the new account. It will first authenticate
        and validate all information to assure it meets website standards (e.g. password strength/length, etc).
        Normal Status Code Returns:
        201: success
        422: validation error */
        if (!$db_503_or_success()) { # verify database connection is successful else return HTTP code 503
            return $response->withStatus(503);
        }

        // get all data first and prepare data and query
        $data = $request->getParsedBody();
        $username = strtolower($data['username']); // email MUST always be lowercase so we expect that someone may accidentally add an uppercase value
        $data['username'] = $username;
        $name = $data['name']; // used for later in mail creation

        // check if username isnt already registered in the database
        $res = mysqli_query($conn, "SELECT * FROM users WHERE username = '$username';");

        if(mysqli_num_rows($res) > 0) {
            $response_payload = ["account_error" => "This username is already registered with an account"];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409, "existing account uses that username");
        }

        $query = "INSERT INTO users (`username`, `name`, `password`, `role`, `agency`) VALUES (?, ?, ?, ?, ?)";
        $stmt = mysqli_prepare($conn, $query);
        # validation of data and binding into query or sending error messages
        $validator = new FormValidators("register", $data);
        $validation_res = $validator->validate();

        if(gettype($validation_res) == "boolean") { // only returns a boolean if all validation checks returned a success
            $pwd = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt->bind_param('sssss', $data['username'], $data['name'], $pwd, $data['role'], $data['agency']);
        } else {
            $stmt->close();
            $response_payload = ["validation_error" => $validation_res];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
        }
 
        # after validation we will execute the sql query to insert to the users table
        $stmt->execute();

        if($stmt->errno !== 0) {
            $response_payload = ["server_error" => $stmt->error];
            $stmt->close();
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503, "sql statement error");
        }

        $stmt->close();

        // create temporary link and send it to the client/realtor
        $_key = defuseKey::createNewRandomKey();
        $key = $_key->saveToAsciiSafeString();

        $encoded_parameter = urlencode($data['username']);
        $ciphered_parameter = Crypto::encrypt($encoded_parameter, $_key);

        $jwt_payload = json_encode([
            "cipher" => $ciphered_parameter,
            "key" => $key
        ]);

        $expiration = time() + (60*60); // 1 hour


        $token = JWT::encode(["data" => $jwt_payload, "expiration_time" => $expiration], "decidelater", 'HS256');


        $temp_url = "https://www.realtor-listings.com/confirmacc/$token";

        $name = $data["name"];
        $mail_body = "
        Hi $name,
        <br />
        <br />
        Thank you for signing up for <b>Realtor Listings</b>! We appreciate your business. <br />
        To complete your registration, please click the link below before 1 hour else your account
        will be deleted for security reasons: <br />
        <a href='$temp_url'>Confirm Account</a> <br />
        <br />
        Once the link expires, you will need to register again.
        <br />
        If you did not request this, you may ignore this or email us at:
        <br /> <a href='mailto:realtorlistings3@gmail.com'>realtorlistings3@gmail.com</a> <br />
        <br />
        Thank you for your cooperation,
        <br />
        The Realtor Listings Team
        ";

        $res = $mailer->send_to($data['username'], $data['name'], "Account Registration", $mail_body);

        if(!$res) {
            $response_payload = ["server_error" => "Failed to send email. Try again later."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
        } else {
            $response_payload = ["success" => "Registration Succesful. Check your email."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
    });
    
    $app->post("/confirmacc", function(Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $params = $request->getParsedBody();
        $jwt = $params['jwt'];

        try {
            $decoded_jwt = JWT::decode($jwt, new JWTKey('decidelater', 'HS256'));
        } catch (Exception $e) {
            $response_payload = ["error" => $e->getMessage()];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        $jwt_data = json_decode($decoded_jwt->data, true);
        $expiration_time = $decoded_jwt->expiration_time;

        $encryption_key = defuseKey::loadFromAsciiSafeString($jwt_data["key"]);

        $encoded_parameter = Crypto::decrypt($jwt_data["cipher"], $encryption_key);
        $username = urldecode($encoded_parameter);

        if ($expiration_time < time()){
            $query = "DELETE FROM users WHERE username = `$username`";
            mysqli_query($conn, $query);
            $response_payload = ["expired" => "Token has expired and your account has been deleted. Please register again to get a new link."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403, "expired token");
        } else {
            $query = "UPDATE `users` SET `verified` = true WHERE `username` = '$username'";
            mysqli_query($conn, $query);
            $response_payload = ["success" => "Thank you for confirming your account. Welcome to Realtor Listings! You may close this tab now:"];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
    });

    $app->get("/listings", function(Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        // initial query to get all listings or when reset filter or search bar is cleared
        $query = "SELECT * FROM `listings` INNER JOIN `users` ON listings.realtor_id = users.id GROUP BY listings.address";
        $result = mysqli_query($conn, $query);
        if ($result) {
            $listings = [];
            while ($row = mysqli_fetch_assoc($result)) {          
                $listings[] = $row;
            }
        }

        $response_payload = ["listings" => $listings];
        $response->getBody()->write(json_encode($response_payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    });

    $app->get("/listings/tags", function(Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $tags = [];
        $data = $request->getQueryParams();
        if (!isset($data['address'])) {
            $response->getBody()->write("Address parameter is missing");
            return $response->withStatus(400);
        }
        $address = $data['address'];
        $id_res = mysqli_query($conn, "SELECT `id` FROM `listings` WHERE `address` = '$address'");
        $id = intval(mysqli_fetch_assoc($id_res)['id']);

        $tag_id_res = mysqli_query($conn, "SELECT tag_id FROM `tagslist` WHERE `listing_id` = $id");

        while ($row = mysqli_fetch_assoc($tag_id_res)) {
            $tag_id = intval($row['tag_id']);
            $tag_query = "SELECT name FROM `tags` WHERE id = $tag_id";
            $tag_result = mysqli_query($conn, $tag_query);
            $tag = mysqli_fetch_assoc($tag_result)['name'];
            $tags[] = $tag;
        }

        $response_payload = ["tags" => $tags];
        $response->getBody()->write(json_encode($response_payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    });

    $app->get("/listings/getimg", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }
    
        $data = $request->getQueryParams();

        $address = intval($data['address']);
    
        $query = "SELECT `image_path` FROM `listings` WHERE `address` = $address";
        $query_res = mysqli_query($conn, $query);
        $result = mysqli_fetch_assoc($query_res);
    
        $fp = $result["image_path"];
    
        if (file_exists($fp)) {
            // Output the image data directly to the response body
            $imageData = base64_encode(file_get_contents($fp));
            $response->getBody()->write(json_encode(["image" => $imageData]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } else {
            // Image file not found
            $response->getBody()->write('Image not found');
            return $response->withStatus(404);
        }
    });
    

    $app->post("/listings/filter", function(Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $filters = $request->getParsedBody()['filters'];
        $saved_res = null;

        for ($i=0; $i < count($filters); $i++) {
            $filter = $filters[$i];
            $field = array_keys($filter)[0];
            $val = $filter[$field];

            if($field == "tags") {
                $query = "SELECT DISTINCT * FROM `listings` INNER JOIN `tagslist` ON listings.id = tagslist.listing_id INNER JOIN `users` ON listings.realtor_id = users.id WHERE `tagslist`.`tag_id` IN (SELECT `id` FROM `tags` WHERE `name` IN ('" . implode("','", $val) . "')) GROUP BY listings.address";
                $result = mysqli_query($conn, $query);
                $saved_res = $result;
            } else {
                $query = "SELECT DISTINCT * FROM `listings` INNER JOIN `tagslist` ON listings.id = tagslist.listing_id INNER JOIN `users` ON listings.realtor_id = users.id WHERE `$field` = '$val' GROUP BY listings.address";
                $result = mysqli_query($conn, $query);
                $saved_res = $result;
            }
        }

        if ($saved_res) {
            $listings = [];
            foreach ($saved_res as $row) {
                $listings[] = $row;
            }
            $response_payload = ["listings" => $listings];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } else {
            $response_payload = ["error" => "SQL query failed. Try again later."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
        }


    });

    $app->post("/listings/new", function(Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $data = json_decode($request->getParsedBody()['payload'], true);

        // before we can make the query to get the id of all the tags from the list in $data['tags'] so we can insert them into the listings table
        // once validation checks are finished
        $tags = $data['tags'];
        $tag_ids = [];
        $tag_query = "SELECT `id` FROM `tags` WHERE `name` IN ('" . implode("','", $tags) . "')";
        $result = mysqli_query($conn, $tag_query);
        foreach ($result as $row) {
            $tag_ids[] = $row['id'];
        }

        $query = "INSERT INTO `listings` (`property_name`, `address`, `realtor`, `realtor_id`, `agency`, `description`, `price`, `town`, `zip`, `country`, `state`,  `url`, `image_path`, `status`, `type`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = mysqli_prepare($conn, $query);

        $validator = new FormValidators("new_listing", $data);
        $validation_res = $validator->validate();

        if(gettype($validation_res) == "boolean") {
            $uploadedFiles = $request->getUploadedFiles();
            if (isset($uploadedFiles['file']) ){
                if ($uploadedFiles['file']->getError() === UPLOAD_ERR_OK){
                    $image = $uploadedFiles['file']->getStream()->getContents();
                    $fileExtension = "png";
                    $image_name = uniqid('image_') . '.' . $fileExtension;
        
                    $fp = __DIR__ . "/cdn/" . $image_name;
        
                    if (file_put_contents($fp, $image) === false) {
                        $response_payload = ["server_error" => "Failed to save image. Try again later."];
                        $response->getBody()->write(json_encode($response_payload));
                        return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
                    }
                } else {
                    $stmt->close();
                    $err = $uploadedFiles['file']->getError();
                    $response_payload = ["server_error" => "No image uploaded or something went wrong with the image upload. Status code: $err"];
                    $response->getBody()->write(json_encode($response_payload));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
                }
            } else {
                $response_payload = ["server_error" => "No image uploaded or something went wrong with the image upload"];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
            }

            // data prepartion before bidning
            if($data['address2']) {
                $address = $data['address'] . " " . $data['address2'];
            } else {
                $address = $data['address'];
            }

            // binding data
            $stmt->bind_param('sssisssssssssss', $data['name'], $address, $data['realtor'], $data['realtor_id'], $data['agency'], $data['desc'], $data['price'], $data['town'], $data['zip'], $data['country'], $data['state'], $data['url'], $fp, $data['status'], $data['type']);
        } else {
            $stmt->close();
            $response_payload = ["validation_error" => $validation_res];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
        }

        $stmt->execute();

        if($stmt->errno !== 0) {
            $response_payload = ["server_error" => $stmt->error];
            $stmt->close();
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503, "sql statement error");
        }

        $stmt->close();

        // add tags to the tagslist table
        $listings_res = mysqli_query($conn, "SELECT `id` FROM `listings` WHERE `property_name` = '{$data['name']}'");
        if ($listings_res) {
            $listing_id = mysqli_fetch_assoc($listings_res)['id'];
        } else {
            $response_payload = ["server_error" => "Internal error. Try again later. Error: " . mysqli_error($conn)];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
        }

        foreach ($tag_ids as $id) {
            $query = "INSERT INTO `tagslist` (`listing_id`, `tag_id`) VALUES ($listing_id, $id)";
            mysqli_query($conn, $query);
        }

        return $response->withStatus(201);
    });

    $app->get("/listings/get", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $data = $request->getQueryParams();

        $realtor_id = intval($data['realtor_id']);

        $query = "SELECT * FROM `listings` WHERE `realtor_id` = $realtor_id";
        $result = mysqli_query($conn, $query);
        $listings = [];

        while ($row = mysqli_fetch_assoc($result)) {
            $listings[] = $row;
        }

        $response_payload = ["listings" => $listings];
        $response->getBody()->write(json_encode($response_payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    });
    
    $app->get("/listings/get/one", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $data = $request->getQueryParams();
        $listing_id = intval($data['listing_id']);

        $query = "SELECT * FROM `listings` WHERE `id` = $listing_id";
        $result = mysqli_query($conn, $query);
        
        if ($result) {
            $listing = mysqli_fetch_assoc($result);
            $response_payload = ["listing" => $listing];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } else {
            $response_payload = ["error" => "SQL query failed. Try again later."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
        }
    });

    $app->post("/listings/edit", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $data = $request->getParsedBody();
        $files = $request->getUploadedFiles();
        $listing_id = intval($data['listing_id']);

        $validator = new FormValidators("edit_listing", $data);
        $validation_res = $validator->validate();

        if (gettype($validation_res) == 'boolean') {
            if (isset($data['property_name'])) {
                $property_name = $data['property_name'];
                
                $query = "UPDATE `listings` SET `property_name` = '$property_name' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['address'])) {
                $address = $data['address'];
    
                if (isset($data['address2'])) {
                    $address .= " " . $data['address2'];
                }
    
                $query = "UPDATE `listings` SET `address` = '$address' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['town'])) {
                $town = $data['town'];
    
                $query = "UPDATE `listings` SET `town` = '$town' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['zip'])) {
                $zip = $data['zip'];
    
                $query = "UPDATE `listings` SET `zip` = '$zip' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['type'])) {
                $type = $data['type'];
    
                $query = "UPDATE `listings` SET `type` = '$type' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['price'])) {
                $_price = $data['price'];

                $price = preg_replace('/(\d)(?=(?:\d{3})+(?!\d))/', '$1,', $_price);
    
                $query = "UPDATE `listings` SET `price` = '$price' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['url'])) {
                $url = $data['url'];
    
                $query = "UPDATE `listings` SET `url` = '$url' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['description'])) {
                $description = $data['description'];
    
                $query = "UPDATE `listings` SET `description` = '$description' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }

            if (isset($data['tags'])) {
                $tags = explode(',', $data['tags']);
                $tag_ids = [];
                $tag_name = [];

                foreach ($tags as $tag) {
                    $tag_name[] = trim($tag, '"');
                }

                $tag_query = "SELECT `id` FROM `tags` WHERE `name` IN ('" . implode("','", $tag_name) . "')";
                $result = mysqli_query($conn, $tag_query);

                while ($row = mysqli_fetch_assoc($result)) {
                    $tag_ids[] = intval($row['id']);
                }

                $query = "DELETE FROM `tagslist` WHERE `listing_id` = $listing_id";
                mysqli_query($conn, $query);

                foreach ($tag_ids as $id) {
                    $query = "INSERT INTO `tagslist` (`listing_id`, `tag_id`) VALUES ($listing_id, $id)";
                    mysqli_query($conn, $query);
                }
            }

            if (isset($files['file'])) {
                $old_image = mysqli_fetch_assoc(mysqli_query($conn, "SELECT `image_path` FROM `listings` WHERE `id` = $listing_id"))['image_path'];
                $file = $files['file'];

                if ($file->getError() === UPLOAD_ERR_OK) {
                    $image = $file->getStream()->getContents();
                    $fileExtension = "png";
                    $image_name = uniqid('image_') . '.' . $fileExtension;

                    $fp = __DIR__ . "/cdn/" . $image_name;

                    if (file_put_contents($fp, $image) === false) {
                        $response_payload = ["server_error" => "Failed to save image. Try again later."];
                        $response->getBody()->write(json_encode($response_payload));
                        return $response->withHeader('Content-Type', 'application/json')->withStatus(503);
                    } else {
                        $query = "UPDATE `listings` SET `image_path` = '$fp' WHERE `id` = $listing_id";
                        mysqli_query($conn, $query);
                        unlink($old_image);
                    }
                } else {
                    $response_payload = ["server_error" => "No image uploaded or something went wrong with the image upload"];
                    $response->getBody()->write(json_encode($response_payload));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
                
                }
            }

            if (isset($data['description'])) {
                $description = $data['description'];
                $query = "UPDATE `listings` SET `description` = '$description' WHERE `id` = $listing_id";
                mysqli_query($conn, $query);
            }
        } else {
            $response_payload = ["validation_error" => $validation_res];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
        }

        return $response->withStatus(200);
    });

    $app->delete("/listings/delete", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
        if (!$db_503_or_success()) {
            return $response->withStatus(503);
        }

        $data = $request->getParsedBody();
        $listing_id = intval($data['listing_id']);

        $query = "SELECT `image_path` FROM `listings` WHERE `id` = $listing_id";
        $result = mysqli_query($conn, $query);
        $image_path = mysqli_fetch_assoc($result)['image_path'];

        $query = "DELETE FROM `listings` WHERE `id` = $listing_id";
        mysqli_query($conn, $query);

        unlink($image_path);

        // delete tags from tagslist table
        $query = "DELETE FROM `tagslist` WHERE `listing_id` = $listing_id";
        mysqli_query($conn, $query);

        return $response->withStatus(200);
    });

    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        throw new HttpNotFoundException($request);
    });

    $app->run();
?>