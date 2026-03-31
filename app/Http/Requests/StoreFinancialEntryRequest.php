<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreFinancialEntryRequest extends FormRequest
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
        $houseId = $this->user()?->getCurrentHouse()?->id;

        return [
            'account_id' => [
                'nullable',
                'integer',
                Rule::exists('accounts', 'id')->where('house_id', $houseId),
            ],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('house_id', $houseId),
            ],
            'direction' => ['required', Rule::in(['inflow', 'outflow'])],
            'amount' => ['required', 'numeric', 'gt:0'],
            'moved_at' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
