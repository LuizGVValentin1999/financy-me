<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('accounts')
                    ->ignore($this->route('account')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'initial_balance' => ['required', 'numeric', 'min:0'],
            'initial_balance_date' => ['required', 'date'],
        ];
    }
}
