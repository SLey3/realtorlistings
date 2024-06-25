<?php
    use Valitron\Validator as Validator;

    require 'vendor/autoload.php';

    // custom validator(s)
    Validator::addRule('specialChars', function($field, $value, array $params, array $fields) {
        return preg_match_all('/[^a-zA-Z0-9]/', $value) >= 3;
    }, 'must contain at least 3 special characters');

    /** 
    * Class that contains all form validators
    */
    class FormValidators {
        private $form;
        private $data;

        public function __construct(string $form, array $data){
            $this->form = $form;
            $this->data = $data;
        }

        /**
         * validates the form thru choosing the validation form based on the provided form name
         */
        public function validate() {
            if ($this->form == "register") {
                $result = $this->validate_registration($this->data);
            } else if ($this->form == "new_listing") {
                $result = $this->validate_newlisting($this->data);
            } else if ($this->form == "edit_listing") {
                $result = $this->validate_editlisting($this->data);
            } else if ($this->form == "del_acc") {
                $result = $this->validate_delacc($this->data);
            }
            
            if (isvalid($result)) {
                return true;
            } else {
                return $result;
            }

        }

        public static function validate_name(string $name) {
            $validator = new Validator(["name" => $name]);
            $validator->rule("ascii", "name")->message("Name must be in ASCII characters");

                $validation_res = $validator->validate();
                return $validation_res ? true : $validator->errors();
        }

        public static function validate_username(string $username) {
            $validator = new Validator(["username" => $username]);
            $validator->rules([
                'email' => [
                    ['username']
                ],
                'emailDNS' => [
                    ['username']
                ]
            ]);

            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }

        public static function validate_password(string $pwd) {
            $validator = new Validator(["pwd" => $pwd]);
            $validator->rules([
                'specialChars' => [
                    ['pwd']
                ],
                'lengthBetween' => [
                    ['pwd', 8, 31]
                ]
            ]);

            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }

        private function validate_registration(array $data) {
            $validator = new Validator($data);
            $validator->rules([
                'email' => [
                    ['username']
                ],
                'emailDNS' => [
                    ['username']
                ],
                'ascii' => [
                    ['name']
                ],
                'specialChars' => [
                    ['password']
                ],
                'lengthBetween' => [
                    ['password', 8, 31] # length between a minimum of 8 character to a maximum of 31 characters
                ],
                'equals' => [
                    ['password', 'confirm_password']
                ],
                'required' => [
                    ['username'],
                    ['name'],
                    ['password'],
                    ['confirm_password']
                ]
            ]);
    
            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }

        private function validate_newlisting(array $data) {
            $validator = new Validator($data);
            $validator->rules([
                'ascii' => [
                    ['name'],
                    ['address'],
                    ['address2'],
                    ['town'],
                    ['price'],
                    ['url'],
                    ['desc']
                ],
                'integer' => [
                    ['zip']
                ],
                'notIn' => [
                    ['country', ['Choose Country..']],
                    ['state', ['Choose State/Territory/Province...']],
                    ['type', ['Choose Type...']]
                ],
                'url' => [
                    ['url']
                ],
                'urlActive' => [
                    ['url']
                ]
            ]);

            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }

        private function validate_editlisting(array $data) {
            $validator = new Validator($data);

            if (isset($data['property_name'])) {
                $validator->rule('ascii', 'property_name');
            }

            if (isset($data['address'])) {
                $validator->rule('ascii', 'address');
            }

            if (isset($data['address2'])) {
                $validator->rule('ascii', 'address2');
            }

            if (isset($data['town'])) {
                $validator->rule('ascii', 'town');
            }

            if (isset($data['zip'])) {
                $validator->rule('integer', 'zip');
            }

            if (isset($data['price'])) {
                $validator->rule('ascii', 'price');
            }

            if (isset($data['url'])) {
                $validator->rule('url', 'url');
            }

            if (isset($data['description'])) {
                $validator->rule('ascii', 'description');
            }

            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }

        private function validate_delacc(array $data) {
            $validator = new Validator($data);
            $validator->rule("equals", "confirmation", "answer")->message("Response did not match the confirmation message");
            $validator->setPrependLabels(false);

            $validation_res = $validator->validate();
            return $validation_res ? true : $validator->errors();
        }
    }

    /**
     * function to check if validation returned a bool or returned an error
     */
    function isvalid($result) {
        if(gettype($result) == 'boolean') {
            return true;
        } else {
            return false;
        }
    }
?>