<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    use \Slim\Factory\AppFactory;
    use \Slim\Routing\RouteCollectorProxy;

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

    $db_connector = new MySQLConnect();
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
    $app->addRoutingMiddleware();

    $app->options('/{routes:.+}', function (Request $request, Response $response, array $args) {
        return $response;
    });

    $app->add(function ($request, $handler) {
        $response = $handler->handle($request);
        return $response
                ->withHeader('Access-Control-Allow-Origin', '*')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    });

    $app->group("/", function (RouteCollectorProxy $group) {
        $denied_msg = "<b>Access Denied</b> Please go the correct route: <a href='https://www.realtor-listings.com'>Realtor Listings</a>";

        $group->get("", function (Request $request, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->get("login", function (Request $reqeust, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->get("register", function (Request $reqeust, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->get("confirmacc", function (Request $reqeust, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });
    });

    $app->post("/login", function (Request $request, Response $response, array $args) use ($db_503_or_success, $conn) {
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

    $app->post("/register", function (Request $request, Response $response, array $args) use ($db_503_or_success, $conn, $mailer) {
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

        if (mysqli_num_rows($res) > 0) {
            $response_payload = ["account_error" => "This username is already registered with an account"];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409, "existing account uses that username");
        }

        $query = "INSERT INTO users (`username`, `name`, `password`, `role`, `agency`) VALUES (?, ?, ?, ?, ?)";
        $stmt = mysqli_prepare($conn, $query);
        # validation of data and binding into query or sending error messages
        $validator = new FormValidators("register", $data);
        $validation_res = $validator->validate();

        if (isvalid($validation_res)) {
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

        if ($stmt->errno !== 0) {
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


        $temp_url = "http://localhost:3000/confirmacc/$token";

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

        if (!$res) {
            $response_payload = ["server_error" => "Failed to send email. Try again later."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(418);
        } else {
            $response_payload = ["success" => "Registration Succesful. Check your email."];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
    });

    $app->post("/confirmacc", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
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

    $app->group("/account", function (RouteCollectorProxy $group) use ($conn, $db_503_or_success, $mailer) {
        $group->post("/update", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
            if (!$db_503_or_success()) {
                return $response->withStatus(503);
            }

            $data = $request->getParsedBody();
            $user_id = intval($data['id']);

            if(isset($data['name'])) {
                $name = $data['name'];

                $validation_res = FormValidators::validate_name($name);

                if(isvalid($validation_res)) {
                    $query = "UPDATE `users` SET name = '$name' WHERE id = $user_id";
                    mysqli_query($conn, $query);
                } else {
                    $response_array = ["validation_err" => $validation_res];
                    $response->getBody()->write(json_encode($response_array));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
                }

            }

            if(isset($data['pwd'])) {
                $pwd = $data['pwd'];

                $validation_res = FormValidators::validate_password($pwd);

                if(isvalid($validation_res)) {
                    $pwd_hash = password_hash($pwd, PASSWORD_DEFAULT);

                    $query = "UPDATE `users` SET password = '$pwd_hash'";
                    mysqli_query($conn, $query);
                } else {
                    $response_array = ["validation_err" => $validation_res];
                    $response->getBody()->write(json_encode($response_array));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
                }
            }

            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $group->post("/del", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
            if (!$db_503_or_success()) {
                return $response->withStatus(503);
            }

            $data = $request->getParsedBody();

            $validator = new FormValidators("del_acc", ["confirmation" => $data['confirmation'], "answer" => "I confirm to delete this account"]);
            $validation_res = $validator->validate();

            if(isvalid($validation_res)) {
                $email = $data['username'];
                $query = "DELETE FROM `users` WHERE username = $email";
                mysqli_query($conn, $query);
            } else {
                $response_payload = ["validation_err" => $validation_res];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
            }
            return $response->withStatus(200);
        });

        $group->post("/req/role", function (Request $request, Response $response, array $args) use ($mailer) {
            $data = $request->getParsedBody();
            $req_email = $data['acc_email'];
            $req_name = $data['acc_name'];
            $req_role = $data['req_role'];
            $support_email = $mailer::$acc_email;

            $mail_body = "
            <b><u>Change Role Request</u></b>
            <br />
            - Requestor: $req_name
            <br />
            - Contact Email: <a href='mailto:$req_email' target='_blank'>$req_email</a>
            <br />
            - Requested Role: $req_role
            ";

            $res = $mailer->send_to($support_email, "Realtor-listings Admin", "Role Change Request", $mail_body);

            if (!$res) {
                return $response->withStatus(418);
            }

            return $response->withStatus(200);
        });

        $group->post("/req/email", function (Request $request, Response $response, array $args) use ($mailer) {
            $data = $request->getParsedBody();
            $req_email = $data['acc_email'];
            $req_id = $data['acc_id'];
            $req_new_email = $data['new_email'];
            $support_email = $mailer::$acc_email;

            $validation_res = FormValidators::validate_username($req_new_email);

            if(!isvalid($validation_res)) {
                $response_payload = ["validation_err" => $validation_res];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
            }

            $mail_body = "
            <b><u>Change Email Request</u></b>
            <br />
            - Requestor ID: $req_id
            <br />
            - Contact Email: <a href='mailto:$req_email' target='_blank'>$req_email</a>
            <br />
            - Requested Email Change: $req_new_email
            ";

            $res = $mailer->send_to($support_email, "Realtor-listings Admin", "Email Change Request", $mail_body);

            if (!$res) {
                return $response->withStatus(418);
            }

            return $response->withStatus(200);
        });

        $group->post("/req/agency", function (Request $request, Response $response, array $args) use ($mailer) {
            $data = $request->getParsedBody();
            $requestor_email = $data["acc_email"];
            $req_agency = $data["new_agency"];
            $current_agency = $data["current_agency"];
            $support_email = $mailer::$acc_email;

            $mail_body = "
            <b><u>Change Agency Request</u></b>
            <br />
            - Requestors Contact Email: <a href='mailto:$requestor_email' target='_blank'>$requestor_email</a>
            <br />
            - Requested Agency Change: $req_agency
            <br />
            - Current Agency of requestor: $current_agency
            ";

            $res = $mailer->send_to($support_email, "Realtor-listings Admin", "Realtor Agency Change Request", $mail_body);

            if (!$res) {
                return $response->withStatus(418);
            }

            return $response->withStatus(200);
        });
    });

    $app->group("/listings", function (RouteCollectorProxy $group) use ($conn, $db_503_or_success) {
        $denied_msg = "<b>Access Denied</b> Please go the correct route: <a href='https://www.realtor-listings.com'>Realtor Listings</a>";

        $group->get("", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
            if (!$db_503_or_success()) {
                return $response->withStatus(503);
            }

            // initial query to get all listings or when reset filter or search bar is cleared
            $query = "SELECT listings.id AS listing_id, listings.*, users.* FROM `listings` INNER JOIN `users` ON listings.realtor_id = users.id";
            $result = mysqli_query($conn, $query);
            if (mysqli_num_rows($result) > 0) {
                $listings = [];
                while ($row = mysqli_fetch_assoc($result)) {
                    $listings[] = $row;
                }
            } else {
                $listings = [];
            }

            $response_payload = ["listings" => $listings];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $group->get("/tags", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
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

        $group->get("/getimg", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
            if (!$db_503_or_success()) {
                return $response->withStatus(503);
            }

            $data = $request->getQueryParams();

            $address = intval($data['address']);

            $query = "SELECT `image_path` FROM `listings` WHERE address = $address";
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
                return $response->withStatus(404, "Image not found or error in fetching image");
            }
        });

        $group->get("/livesearch", function (Request $request, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->post("/livesearch", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
            if (!$db_503_or_success()) {
                return $response->withStatus(503, "Database connection failed");
            }

            $query = $request->getParsedBody()["query"];

            $query = "SELECT * FROM `listings` INNER JOIN `users` ON listings.realtor_id = users.id WHERE address LIKE '%$query%' GROUP BY listings.address";

            $res = mysqli_query($conn, $query);

            $listings = [];

            if (mysqli_num_rows($res) > 0) {
                while ($row = mysqli_fetch_assoc($res)) {
                    $listings[] = $row;
                }
            }

            $response_payload = ["live_listings" => $listings];
            $response->getBody()->write(json_encode($response_payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $group->post("/filter", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
            if (!$db_503_or_success()) {
                return $response->withStatus(503, "Database connection failed");
            }

            function get_result_or_null($query_result) {
                if (mysqli_num_rows($query_result) > 0) {
                    return $query_result;
                } else {
                    return null;
                }
            }

            function select_stmt(int $index, array $countable_obj, string $stmt1, string $stmt2) {
                return $index < count($countable_obj) - 1 ? $stmt1 : $stmt2;
            }

            $parsed_body = $request->getParsedBody();

            if (empty($parsed_body)) {
                // no filters were passed meaning a reset command was sent
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
            }

            $filters = $parsed_body['filters'];
            $query = "SELECT * FROM `listings` INNER JOIN `users` ON listings.realtor_id = users.id INNER JOIN `tagslist` ON listings.id = tagslist.listing_id WHERE";
            $saved_res = null;

            for ($i = 0; $i < count($filters); $i++) {
                $filter = $filters[$i];
                $filter_key = array_keys($filter)[0];
                $val = $filter[$filter_key];

                if ($filter_key == "tags") {
                    $id_arr = [];
                    $id_query = "SELECT id FROM `tags` WHERE name IN ('" . implode("','", $val) . "')";

                    $id_res = mysqli_query($conn, $id_query);

                    while ($row = mysqli_fetch_assoc($id_res)) {
                        foreach ($row as $id) {
                            $id_arr[] = $id;
                        }
                    }

                    $tag_count = count($id_arr);
                    $id_list = implode(",", $id_arr);
                    $query = select_stmt($i, $filters, $query." listings.id IN (
                        SELECT listing_id FROM `tagslist`
                        WHERE tag_id IN ($id_list)
                        GROUP BY listing_id
                        HAVING COUNT(DISTINCT tag_id) = $tag_count
                    ) AND", $query." listings.id IN (
                        SELECT listing_id FROM `tagslist`
                        WHERE tag_id IN ($id_list)
                        GROUP BY listing_id
                        HAVING COUNT(DISTINCT tag_id) = $tag_count
                    )");
                } else if ($filter_key == "minprice") {
                    $query = select_stmt($i, $filters, $query." price >= $val AND", $query." price >= $val");
                } else if ($filter_key == "maxprice") {
                    $query = select_stmt($i, $filters, $query." price <= $val AND", $query." price <= $val");
                } else if ($filter_key == "agency") {
                    $query = select_stmt($i, $filters, $query." listings.$filter_key = '$val' AND", $query." listings.$filter_key = '$val'");
                } else {
                    $query = select_stmt($i, $filters, $query." $filter_key = '$val' AND", $query." $filter_key = '$val'");
                }
            }

            $final_query = $query." GROUP BY listings.address";

            $result = mysqli_query($conn, $final_query);
            $saved_res = get_result_or_null($result);

            if ($saved_res) {
                $listings = [];
                foreach ($saved_res as $row) {
                    $listings[] = $row;
                }
                $response_payload = ["listings" => $listings];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response_payload = ["listings" => []];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            }
        });

        $group->get("/new", function (Request $request, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->post("/new", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
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

            if (isvalid($validation_res)) {
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
                if ($data['address2']) {
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

            if ($stmt->errno !== 0) {
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

        $group->get("/get", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success){
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

        $group->get("/get/one", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
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

        $group->get("/edit", function (Request $request, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->post("/edit", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
            if (!$db_503_or_success()) {
                return $response->withStatus(503);
            }

            $data = $request->getParsedBody();
            $files = $request->getUploadedFiles();
            $listing_id = intval($data['listing_id']);

            $validator = new FormValidators("edit_listing", $data);
            $validation_res = $validator->validate();

            if (isvalid($validation_res)) {
                if (isset($data['property_name'])) {
                    $property_name = $data['property_name'];

                    $query = "UPDATE `listings` SET property_name = '$property_name' WHERE id = $listing_id";
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

                if (isset($data['address2']) && !isset($data['address'])) {
                    $address2 = $data['address2'];

                    $address_query = "SELECT `address` FROM `listings` WHERE id = $listing_id";
                    $address1 = mysqli_fetch_assoc(mysqli_query($conn, $address_query))['address'];

                    $address = $address1 . " " . $address2;

                    $query = "UPDATE `listings` SET address = '$address' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['town'])) {
                    $town = $data['town'];

                    $query = "UPDATE `listings` SET town = '$town' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['zip'])) {
                    $zip = $data['zip'];

                    $query = "UPDATE `listings` SET zip = '$zip' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['type'])) {
                    $type = $data['type'];

                    $query = "UPDATE `listings` SET type = '$type' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['price'])) {
                    $price = intval($data['price']);

                    $query = "UPDATE `listings` SET price = '$price' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['url'])) {
                    $url = $data['url'];

                    $query = "UPDATE `listings` SET url = '$url' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['description'])) {
                    $description = mysqli_real_escape_string($conn, $data['description']);

                    $query = "UPDATE `listings` SET description = '$description' WHERE id = $listing_id";
                    mysqli_query($conn, $query);
                }

                if (isset($data['tags'])) {
                    $tags = explode(',', $data['tags']);
                    $tag_ids = [];
                    $tag_name = [];

                    foreach ($tags as $tag) {
                        $tag_name[] = trim($tag, '"');
                    }

                    $tag_query = "SELECT `id` FROM `tags` WHERE name IN ('" . implode("','", $tag_name) . "')";
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
                            $query = "UPDATE `listings` SET image_path = '$fp' WHERE id = $listing_id";
                            mysqli_query($conn, $query);
                            unlink($old_image);
                        }
                    } else {
                        $response_payload = ["server_error" => "No image uploaded or something went wrong with the image upload"];
                        $response->getBody()->write(json_encode($response_payload));
                        return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");

                    }
                }
            } else {
                $response_payload = ["validation_error" => $validation_res];
                $response->getBody()->write(json_encode($response_payload));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(422, "validation failed for a parameter");
            }

            return $response->withStatus(200);
        });

        $group->get("/delete", function (Request $request, Response $response, array $args) use ($denied_msg) {
            $response->getBody()->write($denied_msg);
            return $response->withStatus(200);
        });

        $group->delete("/delete", function (Request $request, Response $response, array $args) use ($conn, $db_503_or_success) {
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
    });

    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        throw new HttpNotFoundException($request);
    });

    $app->run();
?>