<?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;
    //use Dotenv\Dotenv;


    require __DIR__.'/vendor/autoload.php';
    // only for development
    // $dotenv = Dotenv::createImmutable(__DIR__);
    // $dotenv->load();

    class MailerHandler {
        private $mailer;

        public function __construct(){
            $this->mailer = new PHPMailer(true);
            $this->mailer->SMTPDebug = SMTP::DEBUG_SERVER;
            $this->mailer->isSMTP();
            $this->mailer->Host = $_ENV['MAIL_HOST'];
            $this->mailer->Username = $_ENV['MAIL_USERNAME'];
            $this->mailer->Password = $_ENV['MAIL_PWD'];
            $this->mailer->Port = $_ENV['MAIL_PORT'];
            $this->mailer->SMTPAuth = true;
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        }

        public function send_to(string $recipient_email, string $recipient_name, string $subject, string $body_msg) {
            try {
                $this->mailer->setFrom($this->mailer->Username, 'No Reply');
                $this->mailer->addAddress($recipient_email, $recipient_name);

                $this->mailer->isHTML(true);
                $this->mailer->Subject = $subject;
                $this->mailer->Body = $body_msg;
                
                $this->mailer->send();
            } catch (Exception $e) {
                return false;
            }
            return true;

        }
    }

?>