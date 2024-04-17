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
            }
            return $result;

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
                ]
            ]);
    
            return $validator->validate();
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

            return $validator->validate();
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

            return $validator->validate();
        }
    }

?>