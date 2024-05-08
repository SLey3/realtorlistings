<?php
    /**
     * Class for Database connection
     */
    // only for development
    use Dotenv\Dotenv;

    require __DIR__.'/vendor/autoload.php';

    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();

    class MySQLConnect {
        private $server;
        private $user;
        private $pass;
        private $port;

        public function __construct()
        {
            $this->server = $_ENV['AWS_DATABASE_URL'];
            $this->user = $_ENV['AWS_DATABASE_USER'];
            $this->pass = $_ENV['AWS_DATABASE_PWD'];
            $this->port = $_ENV['AWS_DATABASE_PORT'];
        }

        public function connect() {
            $conn = mysqli_connect($this->server, $this->user, $this->pass, $_ENV["AWS_DATABASE_NAME"], $this->port);

            if (mysqli_connect_errno()) {
                return 503; // HTTP code for Service unavailable
            }
            return $conn;
        }
    }
?>